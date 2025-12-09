export interface DadosCobrancaPublica {
  cobranca: {
    id: string;
    descricao?: string;
    valor?: number;
    valor_total?: number;
    data_emissao: string;
    data_vencimento: string;
    dthr_pagamento: string | null;
    status_pagamento: string;
    meio_pagamento: string | null;
    status_gateway?: string | null;
    link_pagamento?: string | null;
    observacao: string | null;
    vencida?: boolean;
  };
  cliente?: {
    nome: string;
    nome_visualizacao?: string;
    cpf_cnpj?: string;
  };
  assinante: {
    nome: string;
    email?: string;
    whatsapp?: string;
    cpf_cnpj?: string;
    is_pj?: boolean;
  };
  assinatura?: {
    id: string;
    status: string;
    periodicidade?: string;
    data_inicio?: string;
    data_validade?: string;
    meio_pagamento?: string;
  } | null;
  plano?: {
    nome: string;
    descricao?: string;
    ind_gratuito?: boolean;
    valor_mensal?: number;
    valor_anual?: number;
    periodicidade?: string;
  } | null;
}

export interface IniciarPagamentoRequest {
  cobranca_id: string;
  meio_pagamento: 'OPF_PIX_IMEDIATO' | 'OPF_PIX_AUTOMATICO';
}

export interface IniciarPagamentoResponse {
  payment_url: string;
  cobranca_id: string;
  valor: number;
  descricao: string;
  meio_pagamento: string;
  is_pix_automatico: boolean;
  is_cobranca_avulsa: boolean;
}

export type IniciarPagamentoErrorCode =
  | 'BILLING_NOT_FOUND'
  | 'BILLING_NOT_OPEN'
  | 'PAYMENT_IN_PROGRESS'
  | 'RECEIVER_NOT_CONFIGURED'
  | 'PIX_AUTO_REQUIRES_SUBSCRIPTION'
  | 'PIX_AUTO_REQUIRES_PJ_RECEIVER'
  | 'DADOS_INCOMPLETOS';

export interface ApiResponsePublica<T> {
  status: 'OK' | 'ERROR';
  message: string;
  data: T | null;
  code?: string;
}
