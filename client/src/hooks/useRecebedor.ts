import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { 
  Recebedor, 
  RecebedorResponse, 
  ListarRecebedoresResponse,
  ListarInstituicoesResponse,
  InstituicaoFinanceira
} from '@/types/recebedor';

export function useRecebedor() {
  const queryClient = useQueryClient();

  const { 
    data: recebedorAtivo, 
    isLoading: loadingRecebedor,
    refetch: refetchRecebedor
  } = useQuery<Recebedor | null>({
    queryKey: ['/api/recebedor-ativo'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('obter_recebedor_ativo');
      
      if (error) {
        console.error('Erro ao obter recebedor ativo:', error);
        return null;
      }

      const response = data as RecebedorResponse;
      
      if (response.status === 'OK' && response.data?.recebedor) {
        return response.data.recebedor;
      }
      
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const temRecebedorAtivo = !!recebedorAtivo && !!recebedorAtivo.id_recebedor_gateway;

  const invalidarRecebedor = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/recebedor-ativo'] });
    queryClient.invalidateQueries({ queryKey: ['/api/recebedores'] });
  }, [queryClient]);

  return {
    recebedorAtivo,
    temRecebedorAtivo,
    loadingRecebedor,
    refetchRecebedor,
    invalidarRecebedor,
  };
}

export function useListarRecebedores(somenteAtivos = false) {
  return useQuery<Recebedor[]>({
    queryKey: ['/api/recebedores', somenteAtivos],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('listar_recebedores', {
        p_somente_ativos: somenteAtivos
      });
      
      if (error) {
        console.error('Erro ao listar recebedores:', error);
        return [];
      }

      const response = data as ListarRecebedoresResponse;
      
      if (response.status === 'OK' && response.data?.recebedores) {
        return response.data.recebedores;
      }
      
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInstituicoesFinanceiras() {
  return useQuery<InstituicaoFinanceira[]>({
    queryKey: ['/api/instituicoes-financeiras'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('listar_instituicoes_pluggy');
      
      if (error) {
        console.error('Erro ao listar instituições:', error);
        return [];
      }

      const response = data as ListarInstituicoesResponse;
      
      if (response.status === 'OK' && response.data?.instituicoes) {
        return response.data.instituicoes;
      }
      
      return [];
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useValidarContaDuplicada() {
  const { data: recebedores = [], isLoading } = useListarRecebedores(false);

  const validar = useCallback((
    instituicaoId: string,
    agencia: string,
    conta: string,
    tipoConta: string
  ): { 
    valido: boolean; 
    erro?: string; 
    recebedorId?: string; 
    podeReativar?: boolean 
  } => {
    const agenciaNorm = agencia.replace(/[^0-9]/g, '');
    const contaNorm = conta.replace(/[^0-9]/g, '');

    const recebedorExistente = recebedores.find(
      r => r.instituicao_id === instituicaoId &&
           r.agencia === agenciaNorm &&
           r.conta === contaNorm &&
           r.tipo_conta === tipoConta
    );

    if (!recebedorExistente) {
      return { valido: true };
    }

    if (recebedorExistente.ind_ativo) {
      return {
        valido: false,
        erro: 'Esta conta já está ativa.',
        recebedorId: recebedorExistente.id
      };
    }

    return {
      valido: false,
      erro: 'Esta conta já foi cadastrada. Use "Reativar Conta".',
      recebedorId: recebedorExistente.id,
      podeReativar: true
    };
  }, [recebedores]);

  return { validar, carregando: isLoading, recebedores };
}
