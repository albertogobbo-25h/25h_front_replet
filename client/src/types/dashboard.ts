export type StatusCobranca = 'EM_ABERTO' | 'PAGO' | 'CANCELADO' | 'FALHOU';
export type MeioPagamento = 'OPF_PIX_IMEDIATO' | 'OPF_PIX_AUTOMATICO' | null;

export interface CobrancaCliente {
  nome: string;
  nome_visualizacao: string;
  whatsapp: string;
  cpf_cnpj: string;
}

export interface CobrancaAssinatura {
  status: string;
}

export interface CobrancaPlano {
  nome: string;
  tipo: string;
  valor_mensal: number;
}

export interface Cobranca {
  id: string;
  cliente_id: string;
  cliente_assinatura_id: string | null;
  descricao: string;
  valor_total: number;
  data_vencimento: string;
  status_pagamento: StatusCobranca;
  data_emissao: string;
  meio_pagamento: MeioPagamento;
  dthr_pagamento: string | null;
  link_pagamento: string;
  observacao: string | null;
  criado_em: string;
  cliente: CobrancaCliente;
  assinatura: CobrancaAssinatura | null;
  plano: CobrancaPlano | null;
}

export interface ListarCobrancasData {
  cobrancas: Cobranca[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListarCobrancasResponse {
  status: 'OK' | 'ERROR' | 'WARNING';
  message: string;
  data: ListarCobrancasData;
}

export interface Cliente {
  id: string;
  nome: string;
  nome_visualizacao: string;
  whatsapp: string;
  cpf_cnpj: string;
  tipo_pessoa: 'FISICA' | 'JURIDICA';
  email: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  ind_ativo: boolean;
  criado_em: string;
  modificado_em: string;
}

export interface DashboardKPIs {
  faturamentoMensal: number;
  faturamentoAnual: number;
  clientesAtivos: number;
  clientesInativos: number;
  cobrancasGeradasMes: number;
  tendenciaMensal: number | null;
  tendenciaAnual: number | null;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  cobrancasRecentes: Cobranca[];
  loading: boolean;
  error: string | null;
}
