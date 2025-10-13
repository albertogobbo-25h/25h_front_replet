import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StatusBadge from "@/components/StatusBadge";
import ModalEscolhaPlanos from "@/components/ModalEscolhaPlanos";
import ModalDadosCadastrais from "@/components/ModalDadosCadastrais";
import ModalPagamento from "@/components/ModalPagamento";
import ModalCancelamento from "@/components/ModalCancelamento";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/masks";
import { Loader2, CreditCard, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import type {
  Plano,
  Assinatura,
  AssinaturaPeriodicidade,
  MeioPagamento,
  DadosAssinante,
} from "@/types/assinatura";

export default function AssinaturaPage() {
  const { toast } = useToast();
  const [modalPlanos, setModalPlanos] = useState(false);
  const [modalDados, setModalDados] = useState(false);
  const [modalPagamento, setModalPagamento] = useState(false);
  const [modalCancelamento, setModalCancelamento] = useState(false);
  const [incluirHistorico, setIncluirHistorico] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState<{
    id: number;
    periodicidade: AssinaturaPeriodicidade;
  } | null>(null);
  const [assinaturaParaCancelar, setAssinaturaParaCancelar] = useState<Assinatura | null>(null);
  const [cobrancaParaPagar, setCobrancaParaPagar] = useState<{
    id: string;
    valor: number;
  } | null>(null);

  // Query: Listar assinaturas
  const { data: assinaturasData, isLoading: loadingAssinaturas } = useQuery({
    queryKey: ['/api/assinaturas', incluirHistorico],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('listar_assinaturas', {
        p_incluir_historico: incluirHistorico,
      });

      if (error) throw error;
      if (data?.status === 'ERROR') throw new Error(data.message);

      return data;
    },
    refetchInterval: 30000, // Polling a cada 30s
  });

  // Query: Listar planos pagos
  const { data: planosData } = useQuery<Plano[]>({
    queryKey: ['/api/planos', false],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('listar_planos_assinatura', {
        p_incluir_gratuito: false,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: modalPlanos,
  });

  // Query: Dados do assinante
  const { data: dadosAssinante, refetch: refetchDados } = useQuery<DadosAssinante | null>({
    queryKey: ['/api/assinante/dados'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('obter_dados_assinante');

      if (error) throw error;
      if (data?.status === 'ERROR') return null;

      return data?.data || null;
    },
    enabled: modalDados,
  });

  // Mutation: Criar nova assinatura
  const criarAssinaturaMutation = useMutation({
    mutationFn: async ({
      planoId,
      periodicidade,
    }: {
      planoId: number;
      periodicidade: AssinaturaPeriodicidade;
    }) => {
      const { data, error } = await supabase.rpc('criar_nova_assinatura', {
        p_plano_id: planoId,
        p_periodicidade: periodicidade,
      });

      if (error) throw error;
      if (data?.status === 'ERROR') throw new Error(data.message);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assinaturas'] });

      if (data?.data?.cobranca) {
        setCobrancaParaPagar({
          id: data.data.cobranca.id,
          valor: data.data.cobranca.valor,
        });
        setModalPagamento(true);
      }

      toast({
        title: 'Assinatura criada',
        description: 'Sua nova assinatura foi criada com sucesso. Efetue o pagamento para ativá-la.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar assinatura',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Iniciar pagamento
  const iniciarPagamentoMutation = useMutation({
    mutationFn: async ({
      cobrancaId,
      meioPagamento,
    }: {
      cobrancaId: string;
      meioPagamento: MeioPagamento;
    }) => {
      const { data, error } = await supabase.functions.invoke('iniciar_pagto_assinante', {
        body: {
          cobranca_id: cobrancaId,
          meio_pagamento: meioPagamento,
        },
      });

      if (error) throw error;
      if (data?.status === 'ERROR') throw new Error(data.message);

      return data;
    },
    onSuccess: (data) => {
      const paymentUrl = data?.data?.pluggy?.paymentUrl;

      if (paymentUrl) {
        window.open(paymentUrl, '_blank');
        toast({
          title: 'Pagamento iniciado',
          description:
            'Você será redirecionado para a Pluggy. Após o pagamento, sua assinatura será ativada automaticamente.',
        });
      }

      setModalPagamento(false);
      queryClient.invalidateQueries({ queryKey: ['/api/assinaturas'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao iniciar pagamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Função para validar dados antes de criar assinatura
  const handleSelectPlano = async (planoId: number, periodicidade: AssinaturaPeriodicidade) => {
    setModalPlanos(false);
    setPlanoSelecionado({ id: planoId, periodicidade });

    // Verificar dados cadastrais
    const { data } = await supabase.rpc('obter_dados_assinante');
    const dados = data?.data;

    const dadosIncompletos =
      !dados?.nome || !dados?.cpf_cnpj || !dados?.tipo_pessoa || !dados?.email;

    if (dadosIncompletos) {
      setModalDados(true);
    } else {
      criarAssinaturaMutation.mutate({ planoId, periodicidade });
    }
  };

  // Função chamada após salvar dados cadastrais
  const handleDadosSalvos = () => {
    setModalDados(false);

    if (planoSelecionado) {
      criarAssinaturaMutation.mutate({
        planoId: planoSelecionado.id,
        periodicidade: planoSelecionado.periodicidade,
      });
      setPlanoSelecionado(null);
    }
  };

  // Função para pagar cobrança
  const handlePagar = async (meioPagamento: MeioPagamento) => {
    if (!cobrancaParaPagar) return;

    await iniciarPagamentoMutation.mutateAsync({
      cobrancaId: cobrancaParaPagar.id,
      meioPagamento,
    });
  };

  // Função para cancelar assinatura (simulada - backend não implementado)
  const handleCancelarAssinatura = async () => {
    if (!assinaturaParaCancelar) return;

    toast({
      title: 'Funcionalidade em desenvolvimento',
      description:
        'A função de cancelamento ainda não está disponível no backend. Em breve você poderá cancelar sua assinatura.',
      variant: 'destructive',
    });

    setModalCancelamento(false);
    setAssinaturaParaCancelar(null);
  };

  const assinaturas = assinaturasData?.data || [];
  const assinaturaAtiva = assinaturas.find((a: Assinatura) => a.status === 'ATIVA');
  const assinaturaPendente = assinaturas.find((a: Assinatura) => a.status === 'AGUARDANDO_PAGAMENTO');
  const assinaturaSuspensa = assinaturas.find((a: Assinatura) => a.status === 'SUSPENSA');

  if (loadingAssinaturas) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Minha Assinatura</h1>
        <p className="text-muted-foreground">Gerencie seu plano e assinatura</p>
      </div>

      {/* Assinatura Ativa */}
      {assinaturaAtiva && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Plano Atual</CardTitle>
                <CardDescription>Sua assinatura ativa</CardDescription>
              </div>
              <StatusBadge status={assinaturaAtiva.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-1">{assinaturaAtiva.plano.titulo}</h3>
              <p className="text-sm text-muted-foreground">
                Periodicidade: {assinaturaAtiva.periodicidade}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Data de Início</p>
                <p className="font-mono font-medium">{formatDate(assinaturaAtiva.data_inicio)}</p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Válido até</p>
                <p className="font-mono font-medium">{formatDate(assinaturaAtiva.data_validade)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setModalPlanos(true)}
                variant="outline"
                data-testid="button-mudar-plano"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Mudar Plano
              </Button>
              <Button
                onClick={() => setAssinaturaParaCancelar(assinaturaAtiva)}
                variant="destructive"
                data-testid="button-cancelar-ativa"
              >
                Cancelar Assinatura
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assinatura Pendente */}
      {assinaturaPendente && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium mb-1">Assinatura Aguardando Pagamento</p>
              {assinaturaPendente.cobranca_em_aberto && (
                <p className="text-sm text-muted-foreground">
                  Plano {assinaturaPendente.plano.titulo} -{' '}
                  {formatCurrency(assinaturaPendente.cobranca_em_aberto.valor)} - Vence em{' '}
                  {formatDate(assinaturaPendente.cobranca_em_aberto.data_vencimento)}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {assinaturaPendente.cobranca_em_aberto && (
                <Button
                  onClick={() => {
                    setCobrancaParaPagar({
                      id: assinaturaPendente.cobranca_em_aberto!.id,
                      valor: assinaturaPendente.cobranca_em_aberto!.valor,
                    });
                    setModalPagamento(true);
                  }}
                  size="sm"
                  data-testid="button-pagar-pendente"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pagar Agora
                </Button>
              )}
              <Button
                onClick={() => setAssinaturaParaCancelar(assinaturaPendente)}
                variant="outline"
                size="sm"
                data-testid="button-cancelar-pendente"
              >
                Cancelar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Assinatura Suspensa */}
      {assinaturaSuspensa && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium mb-1">Assinatura Suspensa</p>
              <p className="text-sm">Sua assinatura foi suspensa. Renove para continuar usando.</p>
            </div>
            <Button
              onClick={() => setModalPlanos(true)}
              variant="default"
              size="sm"
              data-testid="button-renovar"
            >
              Renovar Agora
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Sem Assinatura Ativa */}
      {!assinaturaAtiva && !assinaturaPendente && !assinaturaSuspensa && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma Assinatura Ativa</CardTitle>
            <CardDescription>Escolha um plano para começar a usar o 25h</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setModalPlanos(true)}
              size="lg"
              data-testid="button-escolher-plano"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Escolher Plano
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      {assinaturas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              {incluirHistorico ? 'Todas as Assinaturas' : 'Assinaturas Ativas'}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIncluirHistorico(!incluirHistorico)}
              data-testid="button-toggle-historico"
            >
              {incluirHistorico ? 'Ocultar Histórico' : 'Ver Histórico'}
            </Button>
          </div>

          <div className="grid gap-4">
            {assinaturas.map((assinatura: Assinatura) => (
              <Card key={assinatura.assinatura_id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{assinatura.plano.titulo}</h3>
                        <StatusBadge status={assinatura.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {assinatura.periodicidade} • {formatDate(assinatura.data_inicio)} até{' '}
                        {formatDate(assinatura.data_validade)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ModalEscolhaPlanos
        open={modalPlanos}
        onClose={() => setModalPlanos(false)}
        planos={planosData || []}
        onSelectPlano={handleSelectPlano}
        loading={criarAssinaturaMutation.isPending}
      />

      <ModalDadosCadastrais
        open={modalDados}
        onClose={() => setModalDados(false)}
        onConfirm={handleDadosSalvos}
        dadosAtuais={dadosAssinante}
      />

      {cobrancaParaPagar && (
        <ModalPagamento
          open={modalPagamento}
          onClose={() => {
            setModalPagamento(false);
            setCobrancaParaPagar(null);
          }}
          cobrancaId={cobrancaParaPagar.id}
          valor={cobrancaParaPagar.valor}
          onPagar={handlePagar}
        />
      )}

      {assinaturaParaCancelar && (
        <ModalCancelamento
          open={modalCancelamento}
          onClose={() => {
            setModalCancelamento(false);
            setAssinaturaParaCancelar(null);
          }}
          assinatura={assinaturaParaCancelar}
          onConfirmar={handleCancelarAssinatura}
        />
      )}
    </div>
  );
}
