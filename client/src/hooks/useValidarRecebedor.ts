import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRecebedor } from './useRecebedor';
import { supabase } from '@/lib/supabase';
import { callSupabase } from '@/lib/api-helper';
import type { DadosAssinante } from '@/types/assinatura';

type FlowStep = 'idle' | 'dados' | 'banco' | 'complete';

export function useValidarRecebedor() {
  const { temRecebedorAtivo, loadingRecebedor, recebedorAtivo, refetchRecebedor, invalidarRecebedor } = useRecebedor();
  const [flowStep, setFlowStep] = useState<FlowStep>('idle');
  const [flowCanceled, setFlowCanceled] = useState(false);
  const [pendingBancoCheck, setPendingBancoCheck] = useState(false);
  const acaoPendenteRef = useRef<(() => void) | null>(null);

  const { data: dadosAssinante, isLoading: loadingDados, refetch: refetchDados } = useQuery<DadosAssinante | null>({
    queryKey: ['/api/assinante/dados-validacao'],
    queryFn: async () => {
      try {
        return await callSupabase<DadosAssinante>(async () => 
          await supabase.rpc('obter_dados_assinante')
        );
      } catch (error) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const dadosCadastraisCompletos = useCallback(() => {
    if (!dadosAssinante) return false;
    return !!(dadosAssinante.cpf_cnpj && dadosAssinante.nome_fantasia);
  }, [dadosAssinante]);

  useEffect(() => {
    if (flowStep === 'complete' && acaoPendenteRef.current) {
      const acao = acaoPendenteRef.current;
      acaoPendenteRef.current = null;
      setFlowStep('idle');
      acao();
    }
  }, [flowStep]);

  useEffect(() => {
    if (flowCanceled) {
      acaoPendenteRef.current = null;
      setFlowStep('idle');
      setFlowCanceled(false);
    }
  }, [flowCanceled]);

  useEffect(() => {
    if (pendingBancoCheck && !loadingRecebedor && !loadingDados) {
      setPendingBancoCheck(false);
      
      if (!dadosCadastraisCompletos()) {
        setFlowStep('dados');
        return;
      }
      
      if (!temRecebedorAtivo) {
        setFlowStep('banco');
      } else {
        setFlowStep('complete');
      }
    }
  }, [pendingBancoCheck, loadingRecebedor, loadingDados, temRecebedorAtivo, dadosCadastraisCompletos]);

  const validarEExecutar = useCallback((acao: () => void) => {
    if (loadingRecebedor || loadingDados) {
      return;
    }

    if (!dadosCadastraisCompletos()) {
      acaoPendenteRef.current = acao;
      setFlowStep('dados');
      return;
    }

    if (!temRecebedorAtivo) {
      acaoPendenteRef.current = acao;
      setFlowStep('banco');
      return;
    }

    acao();
  }, [temRecebedorAtivo, loadingRecebedor, loadingDados, dadosCadastraisCompletos]);

  const handleModalDadosSuccess = useCallback(async () => {
    await refetchDados();
    setPendingBancoCheck(true);
  }, [refetchDados]);

  const handleModalDadosClose = useCallback(() => {
    if (flowStep === 'dados') {
      setFlowCanceled(true);
    }
  }, [flowStep]);

  const handleModalContaSuccess = useCallback(async () => {
    invalidarRecebedor();
    await refetchRecebedor();
    setFlowStep('complete');
  }, [invalidarRecebedor, refetchRecebedor]);

  const handleModalContaClose = useCallback(() => {
    if (flowStep === 'banco') {
      setFlowCanceled(true);
    }
  }, [flowStep]);

  const modalDadosAberto = flowStep === 'dados';
  const modalContaAberto = flowStep === 'banco';

  return {
    temRecebedorAtivo,
    loadingRecebedor,
    recebedorAtivo,
    dadosAssinante,
    loadingDados,
    dadosCadastraisCompletos: dadosCadastraisCompletos(),
    modalContaAberto,
    modalDadosAberto,
    validarEExecutar,
    handleModalContaSuccess,
    handleModalContaClose,
    handleModalDadosSuccess,
    handleModalDadosClose,
  };
}
