import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { callSupabase, ApiError } from '@/lib/api-helper';
import { useToast } from '@/hooks/use-toast';
import type {
  Cobranca,
  ListarCobrancasParams,
  ListarCobrancasResponse,
  CriarCobrancaExtraParams,
  CriarCobrancaExtraResponse,
  CancelarCobrancaResponse,
  MarcarPagoParams,
  MarcarPagoResponse,
  GerarLinkPagamentoResponse,
  MeioPagamento,
} from '@/types/cobranca';

export function useCobrancas(params?: ListarCobrancasParams) {
  const queryKey = ['/api/cobrancas', params];

  const query = useQuery<ListarCobrancasResponse>({
    queryKey,
    queryFn: async () => {
      return await callSupabase<ListarCobrancasResponse>(async () =>
        await supabase.rpc('listar_cobrancas_cliente', {
          p_cliente_id: params?.p_cliente_id || null,
          p_cliente_assinatura_id: params?.p_cliente_assinatura_id || null,
          p_status_pagamento: params?.p_status_pagamento || null,
          p_data_vencimento_inicio: params?.p_data_vencimento_inicio || null,
          p_data_vencimento_fim: params?.p_data_vencimento_fim || null,
          p_limit: params?.p_limit || 100,
          p_offset: params?.p_offset || 0,
        })
      );
    },
  });

  return {
    cobrancas: query.data?.cobrancas || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useObterCobranca(cobrancaId: string | null) {
  return useQuery<Cobranca | null>({
    queryKey: ['/api/cobrancas', cobrancaId],
    queryFn: async () => {
      if (!cobrancaId) return null;
      return await callSupabase<Cobranca>(async () =>
        await supabase.rpc('obter_cobranca', {
          p_cobranca_id: cobrancaId,
        })
      );
    },
    enabled: !!cobrancaId,
  });
}

export function useCriarCobrancaExtra() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<CriarCobrancaExtraResponse, ApiError, CriarCobrancaExtraParams>({
    mutationFn: async (params) => {
      return await callSupabase<CriarCobrancaExtraResponse>(async () =>
        await supabase.rpc('criar_cobranca_extra', params)
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cobrancas'] });
      toast({
        title: 'Cobrança criada',
        description: 'A cobrança foi criada com sucesso',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar cobrança',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCancelarCobranca() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<CancelarCobrancaResponse, ApiError, { cobrancaId: string; observacao?: string }>({
    mutationFn: async ({ cobrancaId, observacao }) => {
      return await callSupabase<CancelarCobrancaResponse>(async () =>
        await supabase.rpc('cancelar_cobranca', {
          p_cobranca_id: cobrancaId,
          p_observacao: observacao || null,
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cobrancas'] });
      toast({
        title: 'Cobrança cancelada',
        description: 'A cobrança foi cancelada com sucesso',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao cancelar cobrança',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useMarcarCobrancaPago() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<MarcarPagoResponse, ApiError, MarcarPagoParams>({
    mutationFn: async (params) => {
      return await callSupabase<MarcarPagoResponse>(async () =>
        await supabase.rpc('marcar_cobranca_pago', params)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cobrancas'] });
      toast({
        title: 'Cobrança marcada como paga',
        description: 'A cobrança foi atualizada com sucesso',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao marcar como pago',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useGerarLinkPagamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<GerarLinkPagamentoResponse, ApiError, string>({
    mutationFn: async (cobrancaId) => {
      return await callSupabase<GerarLinkPagamentoResponse>(async () =>
        await supabase.rpc('gerar_link_pagamento', {
          p_cobranca_id: cobrancaId,
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cobrancas'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao gerar link',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
