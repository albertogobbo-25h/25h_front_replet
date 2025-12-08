import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type {
  Cobranca,
  ListarCobrancasParams,
  CriarCobrancaExtraParams,
  MarcarPagoParams,
  MeioPagamento,
} from '@/types/cobranca';

const COBRANCAS_QUERY_KEY = '/api/cobrancas';

export function useCobrancas(params?: ListarCobrancasParams) {
  const queryKey = [COBRANCAS_QUERY_KEY, params];

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
      
      console.log('[useCobrancas] Raw RPC response:', JSON.stringify(data));
      
      // RPC retorna {status, message, data: {cobrancas: [...], total, limit, offset}}
      if (data?.data?.cobrancas && Array.isArray(data.data.cobrancas)) {
        console.log('[useCobrancas] Found cobrancas in data.data.cobrancas:', data.data.cobrancas.length);
        return data.data.cobrancas as Cobranca[];
      }
      // Fallback: resposta direta como array
      if (Array.isArray(data)) {
        console.log('[useCobrancas] Data is direct array:', data.length);
        return data as Cobranca[];
      }
      // Fallback: objeto com cobrancas na raiz
      if (data?.cobrancas && Array.isArray(data.cobrancas)) {
        console.log('[useCobrancas] Found cobrancas in data.cobrancas:', data.cobrancas.length);
        return data.cobrancas as Cobranca[];
      }
      console.log('[useCobrancas] No cobrancas found, returning empty array');
      return [] as Cobranca[];
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
    queryKey: [COBRANCAS_QUERY_KEY, cobrancaId],
    queryFn: async () => {
      if (!cobrancaId) return null;
      
      const { data, error } = await supabase.rpc('obter_cobranca', {
        p_cobranca_id: cobrancaId,
      });

      if (error) throw error;
      
      // RPC retorna {status, message, data: {...}}
      if (data?.data) {
        return data.data as Cobranca;
      }
      return data as Cobranca;
    },
    enabled: !!cobrancaId,
  });
}

interface RpcResponse {
  status: string;
  message: string;
  code?: string;
  data?: any;
}

export function useCriarCobrancaExtra() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CriarCobrancaExtraParams) => {
      const { data, error } = await supabase.rpc('criar_cobranca_extra', {
        p_cliente_id: params.p_cliente_id,
        p_cliente_assinatura_id: params.p_cliente_assinatura_id || null,
        p_descricao: params.p_descricao,
        p_valor_total: params.p_valor_total,
        p_data_vencimento: params.p_data_vencimento,
        p_observacao: params.p_observacao || null,
      });

      if (error) throw error;

      const response = data as RpcResponse;
      if (response.status === 'ERROR') {
        throw { code: response.code, message: response.message };
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COBRANCAS_QUERY_KEY] });
      toast({
        title: 'Cobrança criada',
        description: 'A cobrança foi criada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar cobrança',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });
}

export function useCancelarCobranca() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ cobrancaId, observacao }: { cobrancaId: string; observacao?: string }) => {
      const { data, error } = await supabase.rpc('cancelar_cobranca', {
        p_cobranca_id: cobrancaId,
        p_observacao: observacao || null,
      });

      if (error) throw error;

      const response = data as RpcResponse;
      if (response.status === 'ERROR') {
        throw { code: response.code, message: response.message };
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COBRANCAS_QUERY_KEY] });
      toast({
        title: 'Cobrança cancelada',
        description: 'A cobrança foi cancelada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cancelar cobrança',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });
}

export function useMarcarCobrancaPago() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: MarcarPagoParams) => {
      const { data, error } = await supabase.rpc('marcar_cobranca_pago', params);

      if (error) throw error;

      const response = data as RpcResponse;
      if (response.status === 'ERROR') {
        throw { code: response.code, message: response.message };
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COBRANCAS_QUERY_KEY] });
      toast({
        title: 'Cobrança marcada como paga',
        description: 'A cobrança foi atualizada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao marcar como pago',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });
}

interface GerarLinkResponse {
  link_pagamento: string;
}

export function useGerarLinkPagamento() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (cobrancaId: string): Promise<GerarLinkResponse> => {
      const { data, error } = await supabase.rpc('gerar_link_pagamento', {
        p_cobranca_id: cobrancaId,
      });

      if (error) throw error;

      const response = data as RpcResponse;
      if (response.status === 'ERROR') {
        throw { code: response.code, message: response.message };
      }

      // Retorna o link do campo data
      return {
        link_pagamento: response.data?.link_pagamento || response.data?.link || '',
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COBRANCAS_QUERY_KEY] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao gerar link',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });
}

export function invalidarCacheCobrancas() {
  queryClient.invalidateQueries({ queryKey: [COBRANCAS_QUERY_KEY] });
}
