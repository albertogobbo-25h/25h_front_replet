import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import CobrancaTable from "@/components/CobrancaTable";
import ModalCobranca from "@/components/ModalCobranca";
import ModalEnviarWhatsApp from "@/components/ModalEnviarWhatsApp";
import ModalConfigContaBancaria from "@/components/ModalConfigContaBancaria";
import ModalDadosCadastrais from "@/components/ModalDadosCadastrais";
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
import { Plus, Filter, Loader2, TrendingUp, TrendingDown, AlertTriangle, Building2, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useValidarRecebedor } from "@/hooks/useValidarRecebedor";
import { formatCurrency, formatDate } from "@/lib/masks";
import { getStatusEfetivo } from "@/lib/cobrancaUtils";
import type { CobrancaComCliente, StatusCobranca } from "@/types/cobranca";

export default function Cobrancas() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [periodoFilter, setPeriodoFilter] = useState<string>("mes_atual");
  const [modalNovaCobrancaOpen, setModalNovaCobrancaOpen] = useState(false);
  const [cobrancaSelecionada, setCobrancaSelecionada] = useState<CobrancaComCliente | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [modalWhatsAppOpen, setModalWhatsAppOpen] = useState(false);
  const [cobrancaParaWhatsApp, setCobrancaParaWhatsApp] = useState<CobrancaComCliente | null>(null);

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

  const getDateRange = () => {
    const hoje = new Date();
    let dataInicio = new Date();

    switch (periodoFilter) {
      case 'mes_atual':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        break;
      case '3_meses':
        dataInicio.setMonth(hoje.getMonth() - 3);
        break;
      case '6_meses':
        dataInicio.setMonth(hoje.getMonth() - 6);
        break;
      case '12_meses':
        dataInicio.setMonth(hoje.getMonth() - 12);
        break;
      default:
        dataInicio.setMonth(hoje.getMonth() - 1);
    }

    return {
      dataInicio: dataInicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0],
    };
  };

  const { data: cobrancas = [], isLoading } = useQuery<CobrancaComCliente[]>({
    queryKey: ['/api/cobrancas', periodoFilter],
    queryFn: async () => {
      const { dataInicio } = getDateRange();

      const { data, error } = await supabase
        .schema('app_data')
        .from('cliente_cobranca')
        .select(`
          *,
          cliente:cliente_id (
            id,
            nome,
            nome_visualizacao,
            whatsapp
          )
        `)
        .gte('data_vencimento', dataInicio)
        .order('data_vencimento', { ascending: false });

      if (error) throw error;
      return (data || []) as CobrancaComCliente[];
    },
  });

  const marcarPagoMutation = useMutation({
    mutationFn: async (cobranca: CobrancaComCliente) => {
      const { error } = await supabase
        .schema('app_data')
        .from('cliente_cobranca')
        .update({
          status_pagamento: 'PAGO',
          dthr_pagamento: new Date().toISOString(),
          meio_pagamento: 'MANUAL',
          modificado_em: new Date().toISOString(),
        })
        .eq('id', cobranca.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cobrancas'] });
      toast({
        title: 'Cobrança marcada como paga',
        description: 'A cobrança foi atualizada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao marcar como pago',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: async (cobranca: CobrancaComCliente) => {
      const { error } = await supabase
        .schema('app_data')
        .from('cliente_cobranca')
        .update({
          status_pagamento: 'CANCELADO',
          modificado_em: new Date().toISOString(),
        })
        .eq('id', cobranca.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cobrancas'] });
      toast({
        title: 'Cobrança cancelada',
        description: 'A cobrança foi cancelada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cancelar cobrança',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

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

  const handleVerDetalhes = (cobranca: CobrancaComCliente) => {
    setCobrancaSelecionada(cobranca);
    setDetalhesOpen(true);
  };

  const handleEnviarWhatsApp = (cobranca: CobrancaComCliente) => {
    setCobrancaParaWhatsApp(cobranca);
    setModalWhatsAppOpen(true);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/cobrancas'] });
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle>Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="EM_ABERTO">Em Aberto</SelectItem>
                <SelectItem value="PAGO">Pago</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
                <SelectItem value="FALHOU">Falhou</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-periodo-filter">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes_atual">Mês Atual</SelectItem>
                <SelectItem value="3_meses">Últimos 3 Meses</SelectItem>
                <SelectItem value="6_meses">Últimos 6 Meses</SelectItem>
                <SelectItem value="12_meses">Últimos 12 Meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
              onMarcarPago={(cobranca) => marcarPagoMutation.mutate(cobranca)}
              onCancelar={(cobranca) => cancelarMutation.mutate(cobranca)}
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

              {cobrancaSelecionada.referencia_mes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mês de Referência</p>
                  <p className="text-base">
                    {new Date(cobrancaSelecionada.referencia_mes).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })}
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
            referencia_mes: cobrancaParaWhatsApp.referencia_mes
              ? new Date(cobrancaParaWhatsApp.referencia_mes).toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                })
              : undefined,
          }}
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
