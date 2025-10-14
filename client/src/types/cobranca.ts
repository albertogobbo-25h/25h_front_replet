export type StatusCobranca = 'EM_ABERTO' | 'PAGO' | 'CANCELADO' | 'FALHOU' | 'VENCIDO';

export interface Cobranca {
  id: string;
  assinante_id: string;
  cliente_id: string;
  referencia_mes: string | null;
  descricao: string;
  valor_total: number;
  status_pagamento: StatusCobranca;
  url_pagamento: string | null;
  meio_pagamento: string | null;
  data_emissao: string;
  data_vencimento: string;
  dthr_pagamento: string | null;
  id_cobranca_gateway: string | null;
  cliente_assinatura_id: string | null;
  cliente_plano_id: string | null;
  criado_por: string | null;
  criado_em: string;
  modificado_em: string;
  // Dados relacionados (joins)
  cliente?: {
    id: string;
    nome: string;
    nome_visualizacao: string | null;
  };
}

export interface CobrancaComCliente extends Cobranca {
  cliente: {
    id: string;
    nome: string;
    nome_visualizacao: string | null;
  };
}

export interface CriarCobrancaParams {
  cliente_id: string;
  descricao: string;
  valor_total: number;
  data_vencimento: string;
  referencia_mes?: string;
  cliente_plano_id?: string;
}

export interface AtualizarCobrancaParams {
  id: string;
  descricao?: string;
  valor_total?: number;
  data_vencimento?: string;
  status_pagamento?: StatusCobranca;
}

export interface FiltrosCobranca {
  cliente_id?: string;
  status?: StatusCobranca[];
  data_inicio?: string;
  data_fim?: string;
}

export interface TotalizadoresCobranca {
  total_em_aberto: number;
  total_pago: number;
  total_vencido: number;
  total_cancelado: number;
  total_geral: number;
  quantidade_em_aberto: number;
  quantidade_pago: number;
  quantidade_vencido: number;
  quantidade_cancelado: number;
  quantidade_total: number;
}
