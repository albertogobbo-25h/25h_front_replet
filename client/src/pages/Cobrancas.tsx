import { useState, useMemo } from "react";
import CobrancaTable from "@/components/CobrancaTable";
import ModalCobranca from "@/components/ModalCobranca";
import ModalEnviarWhatsApp from "@/components/ModalEnviarWhatsApp";
import ModalConfigContaBancaria from "@/components/ModalConfigContaBancaria";
import ModalDadosCadastrais from "@/components/ModalDadosCadastrais";
import { PeriodNavigator, calcularIntervalo, type Granularidade } from "@/components/PeriodNavigator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Loader2, TrendingUp, TrendingDown, AlertTriangle, Building2, FileText, Link2, Copy } from "lucide-react";
import { useCobrancas, useCancelarCobranca, useMarcarCobrancaPago, useGerarLinkPagamento } from "@/hooks/useCobrancas";
import { useToast } from "@/hooks/use-toast";
import { useValidarRecebedor } from "@/hooks/useValidarRecebedor";
import { formatCurrency, formatDate } from "@/lib/masks";
import { getStatusEfetivo } from "@/lib/cobrancaUtils";
import type { Cobranca, StatusCobranca } from "@/types/cobranca";

export default function Cobrancas() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [granularidade, setGranularidade] = useState<Granularidade>("mes");
  const [periodoOffset, setPeriodoOffset] = useState<number>(0);
  const [modalNovaCobrancaOpen, setModalNovaCobrancaOpen] = useState(false);
  const [cobrancaSelecionada, setCobrancaSelecionada] = useState<Cobranca | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [modalWhatsAppOpen, setModalWhatsAppOpen] = useState(false);
  const [cobrancaParaWhatsApp, setCobrancaParaWhatsApp] = useState<Cobranca | null>(null);

  const {
    temRecebedorAtivo,
    loadingRecebedor,
    loadingDados,
    dadosAssinante,
    dadosCadastraisCompletos,
    modalContaAberto,
    modalDadosAberto,
    validarEExecutar,
    handleModalContaSuccess,
    handleModalContaClose,
    handleModalDadosSuccess,
    handleModalDadosClose,
  } = useValidarRecebedor();

  const loadingValidacao = loadingRecebedor || loadingDados;

  const { dataInicio, dataFim } = calcularIntervalo(granularidade, periodoOffset);

  const { cobrancas, isLoading, refetch } = useCobrancas({
    p_data_vencimento_inicio: dataInicio,
    p_data_vencimento_fim: dataFim,
    p_limit: 500,
  });

  const cancelarMutation = useCancelarCobranca();
  const marcarPagoMutation = useMarcarCobrancaPago();
  const gerarLinkMutation = useGerarLinkPagamento();

  const cobrancasFiltradas = useMemo(() => {
    return cobrancas.filter((cobranca) => {
      const statusEfetivo = getStatusEfetivo(
        cobranca.status_pagamento,
        cobranca.data_vencimento
      );

      if (statusFilter === 'todos') return true;
      if (statusFilter === 'EM_ABERTO') {
        return statusEfetivo === 'EM_ABERTO' || statusEfetivo === 'VENCIDO';
      }
      return statusEfetivo === statusFilter;
    });
  }, [cobrancas, statusFilter]);

  const totalizadores = useMemo(() => {
    return cobrancasFiltradas.reduce(
      (acc, cobranca) => {
        const valor = Number(cobranca.valor_total);
        const statusEfetivo = getStatusEfetivo(
          cobranca.status_pagamento,
          cobranca.data_vencimento
        );

        acc.totalGeral += valor;
        acc.quantidadeTotal += 1;

        if (statusEfetivo === 'EM_ABERTO') {
          acc.totalEmAberto += valor;
          acc.quantidadeEmAberto += 1;
        } else if (statusEfetivo === 'VENCIDO') {
          acc.totalVencido += valor;
          acc.quantidadeVencido += 1;
        } else if (statusEfetivo === 'PAGO') {
          acc.totalPago += valor;
          acc.quantidadePago += 1;
        } else if (statusEfetivo === 'CANCELADO') {
          acc.totalCancelado += valor;
          acc.quantidadeCancelado += 1;
        }

        return acc;
      },
      {
        totalEmAberto: 0,
        totalPago: 0,
        totalVencido: 0,
        totalCancelado: 0,
        totalGeral: 0,
        quantidadeEmAberto: 0,
        quantidadePago: 0,
        quantidadeVencido: 0,
        quantidadeCancelado: 0,
        quantidadeTotal: 0,
      }
    );
  }, [cobrancasFiltradas]);

  const handleNovaCobranca = () => {
    validarEExecutar(() => {
      setModalNovaCobrancaOpen(true);
    });
  };

  const handleVerDetalhes = (cobranca: Cobranca) => {
    setCobrancaSelecionada(cobranca);
    setDetalhesOpen(true);
  };

  const handleEnviarWhatsApp = async (cobranca: Cobranca) => {
    // Se não tem link de pagamento, gerar antes de abrir o modal
    if (!cobranca.link_pagamento) {
      try {
        const result = await gerarLinkMutation.mutateAsync(cobranca.id);
        // Atualizar a cobrança com o link gerado
        setCobrancaParaWhatsApp({
          ...cobranca,
          link_pagamento: result.link_pagamento,
        });
      } catch (error) {
        toast({
          title: 'Erro ao gerar link',
          description: 'Não foi possível gerar o link de pagamento.',
          variant: 'destructive',
        });
        return;
      }
    } else {
      setCobrancaParaWhatsApp(cobranca);
    }
    setModalWhatsAppOpen(true);
  };

  const handleMarcarPago = (cobranca: Cobranca) => {
    marcarPagoMutation.mutate({
      p_cobranca_id: cobranca.id,
      p_meio_pagamento: 'MANUAL',
    });
  };

  const handleCancelar = (cobranca: Cobranca) => {
    cancelarMutation.mutate({
      cobrancaId: cobranca.id,
    });
  };

  const handleCopiarLink = async (cobranca: Cobranca) => {
    if (cobranca.link_pagamento) {
      await navigator.clipboard.writeText(cobranca.link_pagamento);
      toast({
        title: 'Link copiado',
        description: 'O link de pagamento foi copiado para a área de transferência',
      });
    } else {
      gerarLinkMutation.mutate(cobranca.id, {
        onSuccess: async (data) => {
          if (data.link_pagamento) {
            await navigator.clipboard.writeText(data.link_pagamento);
            toast({
              title: 'Link gerado e copiado',
              description: 'O link de pagamento foi gerado e copiado para a área de transferência',
            });
          }
        },
      });
    }
  };

  const handleModalSuccess = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cobranças</h1>
          <p className="text-muted-foreground">Gerencie suas cobranças</p>
        </div>
        <Button
          data-testid="button-add-cobranca"
          onClick={handleNovaCobranca}
          disabled={loadingValidacao}
        >
          {loadingValidacao ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Nova Cobrança
        </Button>
      </div>

      {!loadingValidacao && !dadosCadastraisCompletos && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Complete seus dados cadastrais (CNPJ e Nome Fantasia) antes de criar cobranças.
            </span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => validarEExecutar(() => {})}
              data-testid="button-completar-dados-alert"
            >
              <FileText className="h-4 w-4 mr-2" />
              Completar Dados
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!loadingValidacao && dadosCadastraisCompletos && !temRecebedorAtivo && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Você precisa configurar sua conta bancária antes de criar cobranças.
            </span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => validarEExecutar(() => {})}
              data-testid="button-configurar-conta-alert"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between gap-1">
              Total em Aberto
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-warning">
              {formatCurrency(totalizadores.totalEmAberto)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalizadores.quantidadeEmAberto} {totalizadores.quantidadeEmAberto === 1 ? 'cobrança' : 'cobranças'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between gap-1">
              Total Vencido
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">
              {formatCurrency(totalizadores.totalVencido)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalizadores.quantidadeVencido} {totalizadores.quantidadeVencido === 1 ? 'cobrança' : 'cobranças'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-success">
              {formatCurrency(totalizadores.totalPago)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalizadores.quantidadePago} {totalizadores.quantidadePago === 1 ? 'cobrança' : 'cobranças'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(totalizadores.totalGeral)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalizadores.quantidadeTotal} {totalizadores.quantidadeTotal === 1 ? 'cobrança' : 'cobranças'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <PeriodNavigator
          granularidade={granularidade}
          onGranularidadeChange={setGranularidade}
          periodoOffset={periodoOffset}
          onPeriodoOffsetChange={setPeriodoOffset}
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="EM_ABERTO">Em Aberto</SelectItem>
            <SelectItem value="PAGO">Pago</SelectItem>
            <SelectItem value="CANCELADO">Cancelado</SelectItem>
            <SelectItem value="FALHOU">Falhou</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando cobranças...
              </div>
            ) : (
              <>
                {cobrancasFiltradas.length}{' '}
                {cobrancasFiltradas.length === 1 ? 'cobrança' : 'cobranças'}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <CobrancaTable
              cobrancas={cobrancasFiltradas}
              onView={handleVerDetalhes}
              onEnviarWhatsApp={handleEnviarWhatsApp}
              onMarcarPago={handleMarcarPago}
              onCancelar={handleCancelar}
              onCopiarLink={handleCopiarLink}
            />
          )}
        </CardContent>
      </Card>

      <ModalCobranca
        open={modalNovaCobrancaOpen}
        onClose={() => setModalNovaCobrancaOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <Dialog open={detalhesOpen} onOpenChange={setDetalhesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Cobrança</DialogTitle>
            <DialogDescription>Informações completas da cobrança</DialogDescription>
          </DialogHeader>

          {cobrancaSelecionada && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                <p className="text-base font-semibold">
                  {cobrancaSelecionada.cliente?.nome_visualizacao ||
                    cobrancaSelecionada.cliente?.nome}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                <p className="text-base">{cobrancaSelecionada.descricao}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor</p>
                  <p className="text-base font-mono font-semibold">
                    {formatCurrency(Number(cobrancaSelecionada.valor_total))}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-base font-medium">
                    {getStatusEfetivo(
                      cobrancaSelecionada.status_pagamento,
                      cobrancaSelecionada.data_vencimento
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Emissão</p>
                  <p className="text-base font-mono text-sm">
                    {formatDate(cobrancaSelecionada.data_emissao)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vencimento</p>
                  <p className="text-base font-mono text-sm">
                    {formatDate(cobrancaSelecionada.data_vencimento)}
                  </p>
                </div>
              </div>

              {cobrancaSelecionada.dthr_pagamento && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data do Pagamento</p>
                  <p className="text-base font-mono text-sm">
                    {formatDate(cobrancaSelecionada.dthr_pagamento)}
                  </p>
                </div>
              )}

              {cobrancaSelecionada.meio_pagamento && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Meio de Pagamento</p>
                  <p className="text-base">
                    {cobrancaSelecionada.meio_pagamento === 'MANUAL' && 'Pagamento Manual'}
                    {cobrancaSelecionada.meio_pagamento === 'OPF_PIX_IMEDIATO' && 'PIX Imediato'}
                    {cobrancaSelecionada.meio_pagamento === 'OPF_PIX_AUTOMATICO' && 'PIX Automático'}
                  </p>
                </div>
              )}

              {cobrancaSelecionada.link_pagamento && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Link de Pagamento</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                      {cobrancaSelecionada.link_pagamento}
                    </code>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(cobrancaSelecionada.link_pagamento!);
                        toast({
                          title: 'Link copiado',
                          description: 'O link foi copiado para a área de transferência',
                        });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {cobrancaSelecionada.observacao && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Observação</p>
                  <p className="text-base">{cobrancaSelecionada.observacao}</p>
                </div>
              )}

              {cobrancaSelecionada.assinatura && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assinatura</p>
                  <p className="text-base">
                    {cobrancaSelecionada.plano?.nome || 'Assinatura'} - {cobrancaSelecionada.assinatura.status}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {cobrancaParaWhatsApp && (
        <ModalEnviarWhatsApp
          open={modalWhatsAppOpen}
          onClose={() => {
            setModalWhatsAppOpen(false);
            setCobrancaParaWhatsApp(null);
          }}
          destinatario={{
            nome: cobrancaParaWhatsApp.cliente?.nome || 'Cliente',
            whatsapp: cobrancaParaWhatsApp.cliente?.whatsapp || '',
          }}
          contexto="assinante"
          dadosCobranca={{
            cliente_nome: cobrancaParaWhatsApp.cliente?.nome || 'Cliente',
            descricao: cobrancaParaWhatsApp.descricao,
            valor: formatCurrency(Number(cobrancaParaWhatsApp.valor_total)),
            vencimento: formatDate(cobrancaParaWhatsApp.data_vencimento),
            link_pagamento: cobrancaParaWhatsApp.link_pagamento || undefined,
            nome_fantasia: dadosAssinante?.nome_fantasia || '',
          }}
          templatePadrao="Envio de Cobrança"
        />
      )}

      <ModalDadosCadastrais
        open={modalDadosAberto}
        onClose={handleModalDadosClose}
        onConfirm={handleModalDadosSuccess}
        dadosAtuais={dadosAssinante}
      />

      <ModalConfigContaBancaria
        open={modalContaAberto}
        onClose={handleModalContaClose}
        onSuccess={handleModalContaSuccess}
        titulo="Configure sua Conta Bancária"
        descricao="Para criar cobranças, você precisa primeiro configurar sua conta bancária para recebimento."
      />
    </div>
  );
}
