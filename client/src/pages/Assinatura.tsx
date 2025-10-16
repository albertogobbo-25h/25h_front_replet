import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/StatusBadge";
import ModalEscolhaPlanos from "@/components/ModalEscolhaPlanos";
import ModalDadosCadastrais from "@/components/ModalDadosCadastrais";
import ModalPagamento from "@/components/ModalPagamento";
import ModalCancelamento from "@/components/ModalCancelamento";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/masks";
import { Loader2, CreditCard, AlertCircle, CheckCircle, TrendingUp, History } from "lucide-react";
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
  const [abaAtual, setAbaAtual] = useState("plano-atual");
  const [planoSelecionado, setPlanoSelecionado] = useState<{
    id: number;
    periodicidade: AssinaturaPeriodicidade;
  } | null>(null);
  const [assinaturaParaCancelar, setAssinaturaParaCancelar] = useState<Assinatura | null>(null);
  const [cobrancaParaPagar, setCobrancaParaPagar] = useState<{
    id: string;
    valor: number;
  } | null>(null);

  // Query: Listar assinaturas (sempre inclui histórico)
  const { data: assinaturasData, isLoading: loadingAssinaturas } = useQuery({
    queryKey: ['/api/assinaturas'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('listar_assinaturas', {
        p_incluir_historico: true,
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

  // Mutation: Cancelar assinatura via Edge Function
  const cancelarAssinaturaMutation = useMutation({
    mutationFn: async ({ assinaturaId, motivo }: { assinaturaId: string; motivo?: string }) => {
      const { data, error } = await supabase.functions.invoke('cancelar_assinatura', {
        body: {
          assinatura_id: assinaturaId,
          motivo: motivo || 'solicitacao_usuario',
        },
      });

      if (error) throw error;
      if (data?.status === 'ERROR') throw new Error(data.message || 'Erro ao processar cancelamento');

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assinaturas'] });

      toast({
        title: 'Assinatura cancelada',
        description: data?.message || 'Sua assinatura foi cancelada com sucesso.',
      });

      setModalCancelamento(false);
      setAssinaturaParaCancelar(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cancelar assinatura',
        description: error.message || 'Não foi possível cancelar a assinatura. Tente novamente.',
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

  // Função para cancelar assinatura
  const handleCancelarAssinatura = async (motivo?: string) => {
    if (!assinaturaParaCancelar) return;

    await cancelarAssinaturaMutation.mutateAsync({
      assinaturaId: assinaturaParaCancelar.assinatura_id,
      motivo,
    });
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minha Assinatura</h1>
        <p className="text-muted-foreground">Gerencie seu plano e assinatura</p>
      </div>

      <Tabs value={abaAtual} onValueChange={setAbaAtual} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="plano-atual" data-testid="tab-plano-atual">
            Plano Atual
          </TabsTrigger>
          <TabsTrigger value="historico" data-testid="tab-historico">
            <History className="mr-2 h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Aba: Plano Atual */}
        <TabsContent value="plano-atual" className="space-y-6 mt-6">
          {/* Assinatura Ativa */}
          {assinaturaAtiva && (
            <Card className="border-primary/20">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Plano Atual</CardTitle>
                    <CardDescription>Sua assinatura ativa</CardDescription>
                  </div>
                  <StatusBadge status={assinaturaAtiva.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-3xl font-bold mb-2">{assinaturaAtiva.plano.titulo}</h3>
                  <p className="text-muted-foreground">
                    Periodicidade: {assinaturaAtiva.periodicidade}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Data de Início</p>
                    <p className="font-mono font-medium text-lg">{formatDate(assinaturaAtiva.data_inicio)}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Válido até</p>
                    <p className="font-mono font-medium text-lg">{formatDate(assinaturaAtiva.data_validade)}</p>
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
                    onClick={() => {
                      setAssinaturaParaCancelar(assinaturaAtiva);
                      setModalCancelamento(true);
                    }}
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
            <Card className="border-2 border-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-500/20 rounded-full">
                      <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-yellow-800 dark:text-yellow-400 mb-2">
                        Assinatura Aguardando Pagamento
                      </CardTitle>
                      {assinaturaPendente.cobranca_em_aberto && (
                        <CardDescription className="text-base text-yellow-700 dark:text-yellow-300">
                          Plano <span className="font-semibold">{assinaturaPendente.plano.titulo}</span> -{' '}
                          <span className="font-mono font-bold">{formatCurrency(assinaturaPendente.cobranca_em_aberto.valor)}</span>
                          {' '}· Vence em{' '}
                          <span className="font-medium">{formatDate(assinaturaPendente.cobranca_em_aberto.data_vencimento)}</span>
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={assinaturaPendente.status} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-3">
                  {assinaturaPendente.cobranca_em_aberto && (
                    <Button
                      onClick={() => {
                        setCobrancaParaPagar({
                          id: assinaturaPendente.cobranca_em_aberto!.id,
                          valor: assinaturaPendente.cobranca_em_aberto!.valor,
                        });
                        setModalPagamento(true);
                      }}
                      size="lg"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      data-testid="button-pagar-pendente"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pagar Agora
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setAssinaturaParaCancelar(assinaturaPendente);
                      setModalCancelamento(true);
                    }}
                    variant="outline"
                    size="lg"
                    className="border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-500 dark:text-yellow-400 dark:hover:bg-yellow-950/30"
                    data-testid="button-cancelar-pendente"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assinatura Suspensa */}
          {assinaturaSuspensa && (
            <Card className="border-2 border-red-500 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-500/20 rounded-full">
                      <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-red-800 dark:text-red-400 mb-2">
                        Assinatura Suspensa
                      </CardTitle>
                      <CardDescription className="text-base text-red-700 dark:text-red-300">
                        Sua assinatura foi suspensa. Renove para continuar usando o 25h.
                      </CardDescription>
                    </div>
                  </div>
                  <StatusBadge status={assinaturaSuspensa.status} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  onClick={() => setModalPlanos(true)}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  data-testid="button-renovar"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Renovar Agora
                </Button>
              </CardContent>
            </Card>
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
        </TabsContent>

        {/* Aba: Histórico */}
        <TabsContent value="historico" className="space-y-4 mt-6">
          {assinaturas.length > 0 ? (
            <div className="grid gap-4">
              {assinaturas.map((assinatura: Assinatura) => (
                <Card key={assinatura.assinatura_id} data-testid={`historico-assinatura-${assinatura.assinatura_id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{assinatura.plano.titulo}</h3>
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
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nenhuma assinatura encontrada no histórico
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
          isLoading={cancelarAssinaturaMutation.isPending}
        />
      )}
    </div>
  );
}
