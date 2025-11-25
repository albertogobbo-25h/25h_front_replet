import { useState, useCallback, useRef } from 'react';
import { useRecebedor } from './useRecebedor';

export function useValidarRecebedor() {
  const { temRecebedorAtivo, loadingRecebedor, recebedorAtivo, refetchRecebedor, invalidarRecebedor } = useRecebedor();
  const [modalContaAberto, setModalContaAberto] = useState(false);
  const acaoPendenteRef = useRef<(() => void) | null>(null);

  const validarEExecutar = useCallback((acao: () => void) => {
    if (loadingRecebedor) {
      return;
    }

    if (temRecebedorAtivo) {
      acao();
    } else {
      acaoPendenteRef.current = acao;
      setModalContaAberto(true);
    }
  }, [temRecebedorAtivo, loadingRecebedor]);

  const handleModalContaSuccess = useCallback(async () => {
    setModalContaAberto(false);
    
    invalidarRecebedor();
    await refetchRecebedor();
    
    if (acaoPendenteRef.current) {
      const acao = acaoPendenteRef.current;
      acaoPendenteRef.current = null;
      setTimeout(() => {
        acao();
      }, 100);
    }
  }, [invalidarRecebedor, refetchRecebedor]);

  const handleModalContaClose = useCallback(() => {
    setModalContaAberto(false);
    acaoPendenteRef.current = null;
  }, []);

  return {
    temRecebedorAtivo,
    loadingRecebedor,
    recebedorAtivo,
    modalContaAberto,
    validarEExecutar,
    handleModalContaSuccess,
    handleModalContaClose,
  };
}
