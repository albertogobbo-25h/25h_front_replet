export interface DadosCobrancaPublica {
  cobranca: {
    id: string;
    valor: number;
    data_emissao: string;
    data_vencimento: string;
    dthr_pagamento: string | null;
    status_pagamento: string;
    meio_pagamento: string | null;
    status_gateway: string | null;
    link_pagamento: string | null;
    observacao: string | null;
  };
  assinante: {
    nome: string;
    email: string;
    whatsapp: string;
    cpf_cnpj: string;
  };
  assinatura: {
    id: string;
    status: string;
    periodicidade: string;
    data_inicio: string;
    data_validade: string;
    meio_pagamento: string;
  } | null;
  plano: {
    nome: string;
    descricao: string;
    ind_gratuito: boolean;
    valor_mensal: number;
    valor_anual: number;
  } | null;
}

export interface ApiResponsePublica<T> {
  status: 'OK' | 'ERROR';
  message: string;
  data: T | null;
  code?: string;
}
