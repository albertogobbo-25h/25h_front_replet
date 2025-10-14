import type { StatusCobranca } from "@/types/cobranca";

/**
 * Calcula o status efetivo da cobrança considerando vencimento
 */
export function getStatusEfetivo(
  statusPagamento: StatusCobranca,
  dataVencimento: string
): StatusCobranca {
  // Se já está pago, cancelado ou falhou, retorna o status original
  if (statusPagamento !== 'EM_ABERTO') {
    return statusPagamento;
  }

  // Se está em aberto, verifica se está vencido
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const vencimento = new Date(dataVencimento);
  vencimento.setHours(0, 0, 0, 0);

  if (vencimento < hoje) {
    return 'VENCIDO';
  }

  return 'EM_ABERTO';
}

/**
 * Retorna o label em português para o status
 */
export function getStatusLabel(status: StatusCobranca): string {
  const labels: Record<StatusCobranca, string> = {
    EM_ABERTO: 'Em Aberto',
    PAGO: 'Pago',
    CANCELADO: 'Cancelado',
    FALHOU: 'Falhou',
    VENCIDO: 'Vencido',
  };
  return labels[status] || status;
}

/**
 * Retorna a variante de cor para o badge do status
 */
export function getStatusVariant(status: StatusCobranca): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<StatusCobranca, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    EM_ABERTO: 'default',
    PAGO: 'secondary',
    CANCELADO: 'outline',
    FALHOU: 'destructive',
    VENCIDO: 'destructive',
  };
  return variants[status] || 'default';
}

/**
 * Calcula os dias até o vencimento (negativo se já venceu)
 */
export function getDiasAteVencimento(dataVencimento: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const vencimento = new Date(dataVencimento);
  vencimento.setHours(0, 0, 0, 0);

  const diffTime = vencimento.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
