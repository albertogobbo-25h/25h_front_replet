export type StatusCobranca = 'EM_ABERTO' | 'PAGO' | 'CANCELADO' | 'FALHOU' | 'VENCIDO';
export type MeioPagamento = 'MANUAL' | 'OPF_PIX_IMEDIATO' | 'OPF_PIX_AUTOMATICO';

export interface ClienteResumo {
  id?: string;
  nome: string;
  nome_visualizacao: string | null;
  whatsapp: string | null;
  cpf_cnpj?: string;
  email?: string;
}

export interface AssinaturaResumo {
  id?: string;
  status: string;
  inicio?: string;
  fim?: string | null;
}

export interface PlanoResumo {
  id?: string;
  nome: string;
  descricao?: string;
  tipo: string;
  valor_mensal: number;
  periodicidade?: string;
}

export interface Cobranca {
  id: string;
  assinante_id: string;
  cliente_id: string;
  cliente_assinatura_id: string | null;
  cliente_plano_id: string | null;
  descricao: string;
  valor_total: number;
  data_vencimento: string;
  status_pagamento: StatusCobranca;
  data_emissao: string;
  link_pagamento: string | null;
  meio_pagamento: MeioPagamento | null;
  dthr_pagamento: string | null;
  observacao: string | null;
  referencia_mes?: string | null;
  criado_em: string;
  modificado_em?: string;
  cliente?: ClienteResumo;
  assinatura?: AssinaturaResumo;
  plano?: PlanoResumo;
}

export interface CobrancaComCliente extends Cobranca {
  cliente: ClienteResumo;
}

export interface ListarCobrancasParams {
  p_cliente_id?: string;
  p_cliente_assinatura_id?: string;
  p_status_pagamento?: StatusCobranca;
  p_data_vencimento_inicio?: string;
  p_data_vencimento_fim?: string;
  p_limit?: number;
  p_offset?: number;
}

export interface ListarCobrancasResponse {
  cobrancas: Cobranca[];
  total: number;
  limit: number;
  offset: number;
}

export interface CriarCobrancaExtraParams {
  p_cliente_id: string;
  p_cliente_assinatura_id?: string;
  p_descricao: string;
  p_valor_total: number;
  p_data_vencimento: string;
  p_observacao?: string;
}

export interface CriarCobrancaExtraResponse {
  cobranca_id: string;
  valor_total: number;
  data_vencimento: string;
}

export interface CancelarCobrancaParams {
  p_cobranca_id: string;
  p_observacao?: string;
}

export interface CancelarCobrancaResponse {
  cobranca_id: string;
  status_pagamento: 'CANCELADO';
}

export interface MarcarPagoParams {
  p_cobranca_id: string;
  p_meio_pagamento: MeioPagamento;
  p_dthr_pagamento?: string;
  p_observacao?: string;
}

export interface MarcarPagoResponse {
  cobranca_id: string;
  status_pagamento: 'PAGO';
  meio_pagamento: MeioPagamento;
  dthr_pagamento: string;
}

export interface GerarLinkPagamentoResponse {
  cobranca_id: string;
  link_pagamento: string;
  valor_total: number;
  data_vencimento: string;
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
