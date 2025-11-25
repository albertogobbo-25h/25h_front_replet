import { useState, useCallback } from 'react';
import { useRecebedor } from './useRecebedor';

export function useValidarRecebedor() {
  const { temRecebedorAtivo, loadingRecebedor, recebedorAtivo } = useRecebedor();
  const [modalContaAberto, setModalContaAberto] = useState(false);
  const [acaoPendente, setAcaoPendente] = useState<(() => void) | null>(null);

  const validarEExecutar = useCallback((acao: () => void) => {
    if (loadingRecebedor) {
      return;
    }

    if (temRecebedorAtivo) {
      acao();
    } else {
      setAcaoPendente(() => acao);
      setModalContaAberto(true);
    }
  }, [temRecebedorAtivo, loadingRecebedor]);

  const handleModalContaSuccess = useCallback(() => {
    setModalContaAberto(false);
    if (acaoPendente) {
      setTimeout(() => {
        acaoPendente();
        setAcaoPendente(null);
      }, 100);
    }
  }, [acaoPendente]);

  const handleModalContaClose = useCallback(() => {
    setModalContaAberto(false);
    setAcaoPendente(null);
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
