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
import { callSupabase, ApiError } from "@/lib/api-helper";
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
  const { data: assinaturasData, isLoading: loadingAssinaturas } = useQuery<Assinatura[]>({
    queryKey: ['/api/assinaturas'],
    queryFn: async () => {
      const data = await callSupabase<Assinatura[]>(async () => 
        await supabase.rpc('listar_assinaturas', {
          p_incluir_historico: true,
        })
      );
      return data || [];
    },
    refetchInterval: 30000, // Polling a cada 30s
  });

  // Query: Listar planos pagos
  const { data: planosData } = useQuery<Plano[]>({
    queryKey: ['/api/planos', false],
    queryFn: async () => {
      const data = await callSupabase<Plano[]>(async () => 
        await supabase.rpc('listar_planos_assinatura', {
          p_incluir_gratuito: false,
        })
      );
      return data || [];
    },
    enabled: modalPlanos,
  });

  // Query: Dados do assinante
  const { data: dadosAssinante, refetch: refetchDados } = useQuery<DadosAssinante | null>({
    queryKey: ['/api/assinante/dados'],
    queryFn: async () => {
      try {
        return await callSupabase<DadosAssinante>(async () => 
          await supabase.rpc('obter_dados_assinante')
        );
      } catch (error) {
        return null;
      }
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
      return await callSupabase(
        async () => 
          await supabase.rpc('criar_nova_assinatura', {
            p_plano_id: planoId,
            p_periodicidade: periodicidade,
          }),
        'criar_nova_assinatura'
      );
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assinaturas'] });

      if (data?.cobranca) {
        setCobrancaParaPagar({
          id: data.cobranca.id,
          valor: data.cobranca.valor,
        });
        setModalPagamento(true);
      }

      toast({
        title: 'Assinatura criada',
        description: 'Sua nova assinatura foi criada com sucesso. Efetue o pagamento para ativá-la.',
      });
    },
    onError: (error: any) => {
      // Tratamento de erros específicos conforme guia
      if (error instanceof ApiError) {
        if (error.code === 'INCOMPLETE_DATA') {
          // Dados incompletos - redirecionar para perfil
          toast({
            title: 'Dados cadastrais incompletos',
            description: 'Por favor, complete seus dados cadastrais antes de assinar um plano pago.',
            variant: 'destructive',
          });
          setModalPlanos(false);
          setModalDados(true);
        } else if (error.code === 'PENDING_SUBSCRIPTION_EXISTS') {
          // Já existe assinatura pendente
          toast({
            title: 'Assinatura pendente',
            description: 'Você já possui uma assinatura aguardando pagamento. Complete o pagamento pendente ou aguarde sua expiração.',
            variant: 'destructive',
          });
        } else if (error.code === 'PLAN_NOT_FOUND' || error.code === 'PLAN_INACTIVE') {
          // Plano não encontrado ou inativo
          toast({
            title: 'Plano indisponível',
            description: 'O plano selecionado não está disponível. Por favor, escolha outro plano.',
            variant: 'destructive',
          });
          setModalPlanos(true);
        } else {
          // Erro genérico
          toast({
            title: 'Erro ao criar assinatura',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Erro ao criar assinatura',
          description: error.message || 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      }
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
      return await callSupabase(
        async () => 
          await supabase.functions.invoke('iniciar_pagto_assinante', {
            body: {
              cobranca_id: cobrancaId,
              meio_pagamento: meioPagamento,
            },
          }),
        'iniciar_pagto_assinante'
      );
    },
    onSuccess: (data: any) => {
      // Debug logs (apenas em desenvolvimento)
      if (import.meta.env.DEV) {
        console.log('🔍 Resposta Edge Function iniciar_pagto_assinante:', JSON.stringify(data, null, 2));
      }
      
      // Tentar diferentes campos possíveis para a URL de pagamento (conforme guia)
      const paymentUrl = data?.pluggy?.paymentUrl;

      if (import.meta.env.DEV) {
        console.log('💳 Payment URL encontrada:', paymentUrl ? 'Sim' : 'Não');
      }

      if (paymentUrl) {
        window.open(paymentUrl, '_blank');
        toast({
          title: 'Pagamento iniciado',
          description:
            'Você será redirecionado para realizar a autorização do PIX. Após o pagamento, sua assinatura será ativada automaticamente.',
        });
        
        // Iniciar polling para verificar ativação da assinatura (conforme guia)
        const intervalId = setInterval(async () => {
          const { data: assinaturas } = await supabase.rpc('listar_assinaturas', {
            p_incluir_historico: false
          });
          
          if (assinaturas?.data) {
            const assinaturaAtiva = assinaturas.data.find((a: any) => a.status === 'ATIVA');
            
            if (assinaturaAtiva) {
              clearInterval(intervalId);
              queryClient.invalidateQueries({ queryKey: ['/api/assinaturas'] });
              toast({
                title: 'Pagamento confirmado!',
                description: 'Sua assinatura foi ativada com sucesso.',
              });
            }
          }
        }, 5000); // Verificar a cada 5 segundos
        
        // Limpar polling após 5 minutos (timeout de segurança)
        setTimeout(() => clearInterval(intervalId), 5 * 60 * 1000);
      } else {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Nenhuma URL de pagamento encontrada na resposta');
        }
        toast({
          title: 'Atenção',
          description: 'Pagamento processado, mas não foi possível abrir a página de pagamento.',
          variant: 'default',
        });
      }

      setModalPagamento(false);
      queryClient.invalidateQueries({ queryKey: ['/api/assinaturas'] });
    },
    onError: (error: any) => {
      // Tratamento de erros específicos conforme guia
      if (error instanceof ApiError) {
        if (error.code === 'DADOS_INCOMPLETOS') {
          // Dados incompletos
          const camposFaltantes = error.details?.campos_faltantes || [];
          toast({
            title: 'Dados cadastrais incompletos',
            description: `Por favor, complete os seguintes dados: ${camposFaltantes.join(', ')}`,
            variant: 'destructive',
          });
          setModalPagamento(false);
          setModalDados(true);
        } else if (error.code === 'BILLING_NOT_FOUND') {
          toast({
            title: 'Cobrança não encontrada',
            description: 'A cobrança não foi encontrada. Por favor, tente criar uma nova assinatura.',
            variant: 'destructive',
          });
        } else if (error.code === 'PAYMENT_IN_PROGRESS') {
          toast({
            title: 'Pagamento em andamento',
            description: 'Já existe uma requisição de pagamento em andamento para esta cobrança.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro ao iniciar pagamento',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Erro ao iniciar pagamento',
          description: error.message || 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      }
    },
  });

  // Mutation: Cancelar assinatura via Edge Function
  const cancelarAssinaturaMutation = useMutation({
    mutationFn: async ({ assinaturaId, motivo }: { assinaturaId: string; motivo?: string }) => {
      return await callSupabase(
        async () => 
          await supabase.functions.invoke('cancelar_assinatura', {
            body: {
              assinatura_id: assinaturaId,
              motivo: motivo || 'solicitacao_usuario',
            },
          }),
        'cancelar_assinatura'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assinaturas'] });

      toast({
        title: 'Assinatura cancelada',
        description: 'Sua assinatura foi cancelada com sucesso.',
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
    try {
      const dados = await callSupabase<DadosAssinante>(async () => 
        await supabase.rpc('obter_dados_assinante')
      );

      const dadosIncompletos =
        !dados?.nome || !dados?.cpf_cnpj || !dados?.tipo_pessoa || !dados?.email;

      if (dadosIncompletos) {
        setModalDados(true);
      } else {
        criarAssinaturaMutation.mutate({ planoId, periodicidade });
      }
    } catch (error) {
      // Se não conseguir obter dados, assume que está incompleto
      setModalDados(true);
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

  const assinaturas = assinaturasData || [];
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
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Plano Atual</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="scale-150 origin-right">
                        <StatusBadge status={assinaturaAtiva.status} />
                      </div>
                    </div>
                  </div>
                  <CardDescription>Sua assinatura ativa</CardDescription>
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
            <Alert className="border-yellow-500/50 bg-yellow-500/5">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
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
                    onClick={() => {
                      setAssinaturaParaCancelar(assinaturaPendente);
                      setModalCancelamento(true);
                    }}
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
