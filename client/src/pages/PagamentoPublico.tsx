import { useEffect, useState, useMemo } from "react";
import { useSearch, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Zap, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/masks";
import type { DadosCobrancaPublica, ApiResponsePublica, IniciarPagamentoResponse, IniciarPagamentoErrorCode } from "@/types/pagamento-publico";
import type { MeioPagamento } from "@/types/assinatura";
import ThemeToggle from "@/components/ThemeToggle";

const ERROR_MESSAGES: Record<IniciarPagamentoErrorCode | string, string> = {
  'BILLING_NOT_FOUND': 'Cobrança não encontrada. Verifique se o link está correto.',
  'BILLING_NOT_OPEN': 'Esta cobrança não está mais em aberto para pagamento.',
  'PAYMENT_IN_PROGRESS': 'Já existe um pagamento em andamento para esta cobrança. Aguarde alguns instantes.',
  'RECEIVER_NOT_CONFIGURED': 'O beneficiário ainda não configurou os dados para recebimento. Entre em contato com ele.',
  'PIX_AUTO_REQUIRES_SUBSCRIPTION': 'PIX Automático só está disponível para cobranças de assinaturas.',
  'PIX_AUTO_REQUIRES_PJ_RECEIVER': 'PIX Automático só está disponível quando o beneficiário é Pessoa Jurídica.',
  'DADOS_INCOMPLETOS': 'Seus dados cadastrais estão incompletos. Entre em contato com o beneficiário.',
};

function extractCobrancaId(location: string, searchParams: string): string | null {
  const pathMatch = location.match(/\/(?:publico\/)?pagar\/([a-f0-9-]+)/i);
  if (pathMatch?.[1]) return pathMatch[1];
  
  const queryParams = new URLSearchParams(searchParams);
  return queryParams.get('c');
}

export default function PagamentoPublico() {
  const [location] = useLocation();
  const searchParams = useSearch();
  const cobrancaId = extractCobrancaId(location, searchParams);
  
  const [dados, setDados] = useState<DadosCobrancaPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [erroPagamento, setErroPagamento] = useState<string | null>(null);
  const [meioPagamento, setMeioPagamento] = useState<MeioPagamento>('OPF_PIX_IMEDIATO');
  const [processando, setProcessando] = useState(false);

  const pixAutoDisponivelInfo = useMemo(() => {
    if (!dados) return { disponivel: false, motivo: '' };
    
    const temAssinatura = dados.assinatura !== null;
    const recebedorPJ = dados.assinante.is_pj ?? 
      (dados.assinante.cpf_cnpj?.length === 14);
    const temPeriodicidade = !!(
      dados.assinatura?.periodicidade || 
      dados.plano?.periodicidade
    );
    
    if (!temAssinatura) {
      return { disponivel: false, motivo: 'Disponível apenas para cobranças de assinaturas' };
    }
    if (!temPeriodicidade) {
      return { disponivel: false, motivo: 'Disponível apenas para planos com periodicidade definida' };
    }
    if (!recebedorPJ) {
      return { disponivel: false, motivo: 'Disponível apenas quando o beneficiário é Pessoa Jurídica' };
    }
    
    return { disponivel: true, motivo: '' };
  }, [dados]);

  useEffect(() => {
    async function carregarCobranca() {
      if (!cobrancaId) {
        setErro('Link de pagamento inválido. ID da cobrança não encontrado.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('consultar_cobranca_sem_auth', {
          p_cobranca_id: cobrancaId
        });

        if (error) {
          console.error('Erro ao consultar cobrança:', error);
          setErro('Erro ao carregar informações da cobrança. Tente novamente.');
          setLoading(false);
          return;
        }

        const response = data as ApiResponsePublica<DadosCobrancaPublica>;

        if (response.status === 'ERROR') {
          setErro(response.message || 'Cobrança não encontrada.');
          setLoading(false);
          return;
        }

        if (!response.data) {
          setErro('Dados da cobrança não disponíveis.');
          setLoading(false);
          return;
        }

        setDados(response.data);
      } catch (err) {
        console.error('Erro ao carregar cobrança:', err);
        setErro('Erro ao carregar informações da cobrança. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }

    carregarCobranca();
  }, [cobrancaId]);

  const handleCancelar = () => {
    // Tentar fechar a janela/aba (funciona se foi aberta via window.open)
    window.close();
    
    // Fallback: se window.close() não funcionou (navegador bloqueou),
    // voltar para a página anterior ou para uma página neutra
    setTimeout(() => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // Se não há histórico, redirecionar para página inicial do sistema
        window.location.href = '/';
      }
    }, 100);
  };

  const handleConfirmarPagamento = async () => {
    if (!dados?.cobranca.id) return;
    
    setProcessando(true);
    setErroPagamento(null);
    
    try {
      const { data: response, error } = await supabase.functions.invoke<
        ApiResponsePublica<IniciarPagamentoResponse>
      >('iniciar_pagto_cliente', {
        body: {
          cobranca_id: dados.cobranca.id,
          meio_pagamento: meioPagamento
        }
      });

      if (error) {
        console.error('Erro ao iniciar pagamento:', error);
        setErroPagamento('Erro de conexão. Tente novamente em alguns instantes.');
        return;
      }

      if (!response) {
        setErroPagamento('Resposta inválida do servidor. Tente novamente.');
        return;
      }

      if (response.status === 'ERROR') {
        const mensagem = ERROR_MESSAGES[response.code || ''] || response.message || 'Erro ao processar pagamento.';
        setErroPagamento(mensagem);
        return;
      }

      if (response.status === 'OK' && response.data?.payment_url) {
        window.location.href = response.data.payment_url;
      } else {
        setErroPagamento('Link de pagamento não disponível. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao iniciar pagamento:', err);
      setErroPagamento('Erro inesperado ao processar pagamento. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAGO':
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white" data-testid="badge-status-pago">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Pago
          </Badge>
        );
      case 'CANCELADO':
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600 text-white" data-testid="badge-status-cancelado">
            <XCircle className="h-4 w-4 mr-1" />
            Cancelado
          </Badge>
        );
      case 'VENCIDO':
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white" data-testid="badge-status-vencido">
            <AlertCircle className="h-4 w-4 mr-1" />
            Vencido
          </Badge>
        );
      case 'EM_ABERTO':
      default:
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white" data-testid="badge-status-em-aberto">
            <Clock className="h-4 w-4 mr-1" />
            Aguardando Pagamento
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando informações da cobrança...</p>
        </div>
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{erro}</p>
            <Button onClick={handleCancelar} variant="outline" className="w-full" data-testid="button-fechar-erro">
              Fechar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPago = dados.cobranca.status_pagamento === 'PAGO';
  const isCancelado = dados.cobranca.status_pagamento === 'CANCELADO';
  const podeRealizar = dados.cobranca.status_pagamento === 'EM_ABERTO';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">25h.com.br</h1>
            <p className="text-sm text-muted-foreground">Gestão de Cobranças</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Detalhes da Cobrança</CardTitle>
                  <CardDescription>
                    Informações sobre o pagamento solicitado
                  </CardDescription>
                </div>
                {getStatusBadge(dados.cobranca.status_pagamento)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isPago && dados.cobranca.dthr_pagamento && (
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Esta cobrança já foi paga em {new Date(dados.cobranca.dthr_pagamento).toLocaleString('pt-BR')}.
                  </AlertDescription>
                </Alert>
              )}

              {isCancelado && (
                <Alert className="bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800">
                  <XCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <AlertDescription className="text-gray-800 dark:text-gray-200">
                    Esta cobrança foi cancelada e não requer mais pagamento.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Beneficiário</Label>
                  <p className="font-semibold" data-testid="text-assinante-nome">{dados.assinante.nome}</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-assinante-email">{dados.assinante.email}</p>
                </div>

                {dados.plano && (
                  <div>
                    <Label className="text-muted-foreground">Plano</Label>
                    <p className="font-semibold" data-testid="text-plano-nome">{dados.plano.nome}</p>
                    <p className="text-sm text-muted-foreground">{dados.plano.descricao}</p>
                  </div>
                )}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <Label className="text-muted-foreground">Valor a Pagar</Label>
                <p className="text-4xl font-bold font-mono text-primary mt-2" data-testid="text-valor">
                  {formatCurrency(dados.cobranca.valor_total ?? dados.cobranca.valor ?? 0)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Data de Emissão</Label>
                  <p className="font-mono" data-testid="text-data-emissao">{formatDate(dados.cobranca.data_emissao)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data de Vencimento</Label>
                  <p className="font-mono" data-testid="text-data-vencimento">{formatDate(dados.cobranca.data_vencimento)}</p>
                </div>
              </div>

              {dados.cobranca.observacao && (
                <div>
                  <Label className="text-muted-foreground">Observação</Label>
                  <p className="text-sm" data-testid="text-observacao">{dados.cobranca.observacao}</p>
                </div>
              )}

              {podeRealizar && (
                <>
                  <div className="border-t pt-6">
                    <Label htmlFor="meio-pagamento" className="text-base font-semibold mb-4 block">
                      Selecione o Meio de Pagamento
                    </Label>
                    <Select
                      value={meioPagamento}
                      onValueChange={(value) => {
                        setMeioPagamento(value as MeioPagamento);
                        setErroPagamento(null);
                      }}
                    >
                      <SelectTrigger id="meio-pagamento" data-testid="select-meio-pagamento">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pixAutoDisponivelInfo.disponivel && (
                          <SelectItem value="OPF_PIX_AUTOMATICO">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-primary" />
                              <div>
                                <p className="font-medium">PIX Automático</p>
                                <p className="text-xs text-muted-foreground">Renovação automática mensal</p>
                              </div>
                            </div>
                          </SelectItem>
                        )}
                        <SelectItem value="OPF_PIX_IMEDIATO">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <div>
                              <p className="font-medium">PIX Imediato</p>
                              <p className="text-xs text-muted-foreground">Pagamento único, mês a mês</p>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {!pixAutoDisponivelInfo.disponivel && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {pixAutoDisponivelInfo.motivo}
                      </p>
                    )}
                  </div>

                  {meioPagamento === 'OPF_PIX_AUTOMATICO' && (
                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>
                        Com PIX Automático, você autoriza PIX mensais automáticos de forma recorrente. Você pode cancelar a
                        qualquer momento.
                      </AlertDescription>
                    </Alert>
                  )}

                  {meioPagamento === 'OPF_PIX_IMEDIATO' && (
                    <Alert>
                      <CreditCard className="h-4 w-4" />
                      <AlertDescription>
                        Com PIX Imediato, você autoriza somente o PIX da cobrança atual sem recorrência, sendo necessário autorizar a cobrança todos os meses.
                      </AlertDescription>
                    </Alert>
                  )}

                  {erroPagamento && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{erroPagamento}</AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleCancelar}
              disabled={processando}
              data-testid="button-cancelar"
            >
              Cancelar
            </Button>
            {podeRealizar && (
              <Button
                onClick={handleConfirmarPagamento}
                disabled={processando}
                data-testid="button-confirmar-pagamento"
              >
                {processando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar Pagamento'
                )}
              </Button>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© 2025 25h.com.br - Gestão de Cobranças</p>
        </div>
      </footer>
    </div>
  );
}
