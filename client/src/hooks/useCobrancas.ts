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

  const query = useQuery<Cobranca[]>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('listar_cobrancas_cliente', {
        p_cliente_id: params?.p_cliente_id || null,
        p_cliente_assinatura_id: params?.p_cliente_assinatura_id || null,
        p_status_pagamento: params?.p_status_pagamento || null,
        p_data_vencimento_inicio: params?.p_data_vencimento_inicio || null,
        p_data_vencimento_fim: params?.p_data_vencimento_fim || null,
        p_limit: params?.p_limit || 100,
        p_offset: params?.p_offset || 0,
      });

      if (error) throw error;
      
      // RPC pode retornar array direto ou objeto com cobrancas
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.cobrancas && Array.isArray(data.cobrancas)) {
        return data.cobrancas;
      }
      return [];
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return {
    cobrancas: query.data || [],
    total: query.data?.length || 0,
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
        await supabase.rpc('criar_cobranca_extra', {
          p_cliente_id: params.p_cliente_id,
          p_cliente_assinatura_id: params.p_cliente_assinatura_id || null,
          p_descricao: params.p_descricao,
          p_valor_total: params.p_valor_total,
          p_data_vencimento: params.p_data_vencimento,
          p_observacao: params.p_observacao || null,
        })
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          Array.isArray(query.queryKey) && query.queryKey[0] === '/api/cobrancas',
      });
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
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          Array.isArray(query.queryKey) && query.queryKey[0] === '/api/cobrancas',
      });
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
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          Array.isArray(query.queryKey) && query.queryKey[0] === '/api/cobrancas',
      });
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
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          Array.isArray(query.queryKey) && query.queryKey[0] === '/api/cobrancas',
      });
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
