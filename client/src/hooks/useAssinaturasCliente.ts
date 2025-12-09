import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { callSupabase } from "@/lib/api-helper";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  AssinaturaCliente,
  ListarAssinaturasClienteParams,
  ListarAssinaturasClienteResponse,
  CriarAssinaturaClienteParams,
  CriarAssinaturaClienteResponse,
  CriarAssinaturaClienteWarningResponse,
  ApiResponseEnvelope,
  CancelarAssinaturaClienteParams,
  SuspenderAssinaturaClienteParams,
  ReativarAssinaturaClienteParams,
} from "@/types/assinatura-cliente";

export const ASSINATURAS_CLIENTE_QUERY_KEY = "assinaturas-cliente";

export function useAssinaturasCliente(params: ListarAssinaturasClienteParams = {}) {
  return useQuery({
    queryKey: [ASSINATURAS_CLIENTE_QUERY_KEY, params],
    queryFn: async () => {
      const result = await callSupabase<ListarAssinaturasClienteResponse>(
        async () =>
          await supabase.rpc("listar_assinaturas_cliente", {
            p_cliente_id: params.p_cliente_id || null,
            p_status: params.p_status || null,
            p_limit: params.p_limit || 50,
            p_offset: params.p_offset || 0,
          })
      );
      return {
        assinaturas: result?.assinaturas || [],
        total: result?.total || 0,
        limit: result?.limit || 50,
        offset: result?.offset || 0,
      };
    },
  });
}

export function useAssinaturasClientePorCliente(clienteId: string | null) {
  return useQuery({
    queryKey: [ASSINATURAS_CLIENTE_QUERY_KEY, "por-cliente", clienteId],
    queryFn: async () => {
      if (!clienteId) return { assinaturas: [], total: 0, limit: 50, offset: 0 };
      
      const result = await callSupabase<ListarAssinaturasClienteResponse>(
        async () =>
          await supabase.rpc("listar_assinaturas_cliente", {
            p_cliente_id: clienteId,
            p_status: "ATIVA",
            p_limit: 50,
            p_offset: 0,
          })
      );
      return {
        assinaturas: result?.assinaturas || [],
        total: result?.total || 0,
        limit: result?.limit || 50,
        offset: result?.offset || 0,
      };
    },
    enabled: !!clienteId,
  });
}

export function useCriarAssinaturaCliente() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CriarAssinaturaClienteParams): Promise<ApiResponseEnvelope<CriarAssinaturaClienteResponse | CriarAssinaturaClienteWarningResponse>> => {
      const { data, error } = await supabase.rpc("criar_assinatura_cliente", params);
      
      if (error) {
        console.error("Erro de rede/Supabase ao criar assinatura:", error);
        throw new Error(error.message || "Erro de conexão ao criar assinatura");
      }
      
      const envelope = data as ApiResponseEnvelope<CriarAssinaturaClienteResponse | CriarAssinaturaClienteWarningResponse>;
      
      if (envelope?.status === 'ERROR') {
        throw new Error(envelope.message || "Erro ao criar assinatura");
      }
      
      return envelope;
    },
    onSuccess: (result) => {
      if (result?.status === 'OK') {
        queryClient.invalidateQueries({ queryKey: [ASSINATURAS_CLIENTE_QUERY_KEY] });
        toast({
          title: "Assinatura criada",
          description: result.message || "A assinatura foi criada com sucesso.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar assinatura",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCancelarAssinaturaCliente() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CancelarAssinaturaClienteParams) => {
      const result = await callSupabase<{ assinatura_id: string; status: string }>(
        async () =>
          await supabase.rpc("cancelar_assinatura_cliente", params)
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSINATURAS_CLIENTE_QUERY_KEY] });
      toast({
        title: "Assinatura cancelada",
        description: "A assinatura foi cancelada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar assinatura",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSuspenderAssinaturaCliente() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: SuspenderAssinaturaClienteParams) => {
      const result = await callSupabase<{ assinatura_id: string; status: string }>(
        async () =>
          await supabase.rpc("suspender_assinatura_cliente", params)
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSINATURAS_CLIENTE_QUERY_KEY] });
      toast({
        title: "Assinatura suspensa",
        description: "A assinatura foi suspensa com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao suspender assinatura",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useReativarAssinaturaCliente() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: ReativarAssinaturaClienteParams) => {
      const result = await callSupabase<{ assinatura_id: string; status: string }>(
        async () =>
          await supabase.rpc("reativar_assinatura_cliente", params)
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSINATURAS_CLIENTE_QUERY_KEY] });
      toast({
        title: "Assinatura reativada",
        description: "A assinatura foi reativada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao reativar assinatura",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
