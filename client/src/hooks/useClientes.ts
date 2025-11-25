import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { 
  Cliente, 
  CriarClienteInput, 
  AtualizarClienteInput, 
  ListarClientesInput,
  ClienteRpcResponse 
} from '@/types/cliente';

const CLIENTES_QUERY_KEY = '/api/clientes';

export function useListarClientes(filtros?: ListarClientesInput) {
  return useQuery<Cliente[]>({
    queryKey: [CLIENTES_QUERY_KEY, filtros],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('listar_clientes', {
        p_nome: filtros?.nome || null,
        p_cpf_cnpj: filtros?.cpf_cnpj || null,
        p_email: filtros?.email || null,
        p_whatsapp: filtros?.whatsapp || null,
        p_ind_ativo: filtros?.ind_ativo ?? null,
        p_limit: filtros?.limit ?? 100,
        p_offset: filtros?.offset ?? 0,
      });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCriarCliente() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CriarClienteInput) => {
      const { data, error } = await supabase.rpc('criar_cliente', {
        p_nome: input.nome,
        p_nome_visualizacao: input.nome_visualizacao || null,
        p_whatsapp: input.whatsapp || null,
        p_cpf_cnpj: input.cpf_cnpj || null,
        p_tipo_pessoa: input.tipo_pessoa || null,
        p_email: input.email || null,
        p_rua: input.rua || null,
        p_numero: input.numero || null,
        p_complemento: input.complemento || null,
        p_bairro: input.bairro || null,
        p_cidade: input.cidade || null,
        p_uf: input.uf || null,
        p_cep: input.cep || null,
        p_observacao: input.observacao || null,
      });

      if (error) throw error;

      const response = data as ClienteRpcResponse;
      if (response.status === 'ERROR') {
        throw { 
          code: response.code, 
          message: response.message,
          clienteExistenteId: response.data?.cliente_existente_id 
        };
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
      toast({
        title: 'Cliente criado',
        description: 'O cliente foi cadastrado com sucesso',
      });
    },
    onError: (error: any) => {
      const mensagem = getMensagemErro(error.code, error.message);
      toast({
        title: 'Erro ao criar cliente',
        description: mensagem,
        variant: 'destructive',
      });
    },
  });
}

export function useAtualizarCliente() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: AtualizarClienteInput) => {
      const { data, error } = await supabase.rpc('atualizar_cliente', {
        p_cliente_id: input.cliente_id,
        p_nome: input.nome ?? null,
        p_nome_visualizacao: input.nome_visualizacao ?? null,
        p_whatsapp: input.whatsapp ?? null,
        p_cpf_cnpj: input.cpf_cnpj ?? null,
        p_tipo_pessoa: input.tipo_pessoa ?? null,
        p_email: input.email ?? null,
        p_rua: input.rua ?? null,
        p_numero: input.numero ?? null,
        p_complemento: input.complemento ?? null,
        p_bairro: input.bairro ?? null,
        p_cidade: input.cidade ?? null,
        p_uf: input.uf ?? null,
        p_cep: input.cep ?? null,
        p_observacao: input.observacao ?? null,
      });

      if (error) throw error;

      const response = data as ClienteRpcResponse;
      if (response.status === 'ERROR') {
        throw { code: response.code, message: response.message };
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
      toast({
        title: 'Cliente atualizado',
        description: 'Os dados do cliente foram atualizados com sucesso',
      });
    },
    onError: (error: any) => {
      const mensagem = getMensagemErro(error.code, error.message);
      toast({
        title: 'Erro ao atualizar cliente',
        description: mensagem,
        variant: 'destructive',
      });
    },
  });
}

export function useAtivarCliente() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clienteId: string) => {
      const { data, error } = await supabase.rpc('ativar_cliente', {
        p_cliente_id: clienteId,
      });

      if (error) throw error;

      const response = data as ClienteRpcResponse;
      if (response.status === 'ERROR') {
        throw { code: response.code, message: response.message };
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
      toast({
        title: 'Cliente ativado',
        description: 'O cliente foi ativado com sucesso',
      });
    },
    onError: (error: any) => {
      const mensagem = getMensagemErro(error.code, error.message);
      toast({
        title: 'Erro ao ativar cliente',
        description: mensagem,
        variant: 'destructive',
      });
    },
  });
}

export function useDesativarCliente() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clienteId: string) => {
      const { data, error } = await supabase.rpc('desativar_cliente', {
        p_cliente_id: clienteId,
      });

      if (error) throw error;

      const response = data as ClienteRpcResponse;
      if (response.status === 'ERROR') {
        throw { code: response.code, message: response.message };
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
      toast({
        title: 'Cliente desativado',
        description: 'O cliente foi desativado com sucesso',
      });
    },
    onError: (error: any) => {
      const mensagem = getMensagemErro(error.code, error.message);
      toast({
        title: 'Erro ao desativar cliente',
        description: mensagem,
        variant: 'destructive',
      });
    },
  });
}

export function useBuscarClientePorCpfCnpj() {
  return useMutation({
    mutationFn: async (cpfCnpj: string) => {
      const { data, error } = await supabase.rpc('buscar_cliente_por_cpf_cnpj', {
        p_cpf_cnpj: cpfCnpj.replace(/\D/g, ''),
      });

      if (error) throw error;

      const response = data as ClienteRpcResponse;
      if (response.status === 'ERROR') {
        return { encontrado: false, cliente: null };
      }

      return {
        encontrado: true,
        cliente: response.data?.data || null,
      };
    },
  });
}

function getMensagemErro(code: string | undefined, fallback: string): string {
  const mensagens: Record<string, string> = {
    'NOME_OBRIGATORIO': 'O nome do cliente é obrigatório.',
    'CPF_CNPJ_JA_CADASTRADO': 'Já existe um cliente cadastrado com este CPF/CNPJ.',
    'EMAIL_INVALIDO': 'O formato do email é inválido.',
    'WHATSAPP_INVALIDO': 'O WhatsApp deve conter apenas números.',
    'CEP_INVALIDO': 'O CEP deve ter 8 dígitos.',
    'CLIENTE_NAO_ENCONTRADO': 'Cliente não encontrado.',
    'CLIENTE_NAO_PERTENCE_ASSINANTE': 'Você não tem permissão para acessar este cliente.',
    'CLIENTE_JA_ATIVO': 'Este cliente já está ativo.',
    'CLIENTE_JA_INATIVO': 'Este cliente já está inativo.',
  };

  return mensagens[code || ''] || fallback;
}

export function invalidarCacheClientes() {
  queryClient.invalidateQueries({ queryKey: [CLIENTES_QUERY_KEY] });
}
