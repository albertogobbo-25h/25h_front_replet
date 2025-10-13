export type AssinaturaStatus = 'ATIVA' | 'AGUARDANDO_PAGAMENTO' | 'SUSPENSA' | 'CANCELADA';
export type AssinaturaPeriodicidade = 'MENSAL' | 'ANUAL';
export type TipoPessoa = 'FISICA' | 'JURIDICA';
export type MeioPagamento = 'OPF_PIX_IMEDIATO' | 'OPF_PIX_AUTOMATICO';
export type CobrancaStatus = 'EM_ABERTO' | 'PAGO' | 'CANCELADO' | 'VENCIDO' | 'FALHOU';

export interface Plano {
  id: number;
  titulo: string;
  descricao: string;
  ind_gratuito: boolean;
  valor_mensal: number;
  valor_anual: number;
  valor_mensal_com_desconto: number | null;
  valor_anual_com_desconto: number | null;
  limite_clientes_ativos: number;
  dias_degustacao: number;
  features: string[];
}

export interface CobrancaEmAberto {
  id: string;
  valor: number;
  data_vencimento: string;
  status: CobrancaStatus;
  link_pagamento: string | null;
}

export interface Assinatura {
  assinatura_id: string;
  status: AssinaturaStatus;
  periodicidade: AssinaturaPeriodicidade;
  data_inicio: string;
  data_validade: string;
  plano: {
    id: number;
    titulo: string;
    ind_gratuito: boolean;
  };
  cobranca_em_aberto: CobrancaEmAberto | null;
}

export interface DadosAssinante {
  id: string;
  nome: string;
  nome_fantasia: string | null;
  cpf_cnpj: string;
  tipo_pessoa: TipoPessoa;
  email: string;
  whatsapp: string;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
}

export interface ListarAssinaturasResponse {
  status: 'OK' | 'ERROR';
  code?: string;
  message?: string;
  data: Assinatura[];
}

export interface CriarAssinaturaResponse {
  status: 'OK' | 'ERROR';
  code?: string;
  message: string;
  data?: {
    assinatura: {
      id: string;
      status: AssinaturaStatus;
      data_inicio: string;
      data_validade: string;
      periodicidade: AssinaturaPeriodicidade;
    };
    plano: {
      id: number;
      titulo: string;
      descricao: string;
    };
    cobranca: {
      id: string;
      valor: number;
      data_vencimento: string;
      status: CobrancaStatus;
    };
    assinatura_atual?: {
      id: string;
      plano_titulo: string;
      data_validade: string;
      status: AssinaturaStatus;
    };
  };
}

export interface IniciarPagamentoResponse {
  status: 'OK' | 'ERROR' | 'WARNING';
  message: string;
  data?: {
    pluggy: {
      id: string;
      paymentUrl: string;
      status: string;
      description: string;
    };
    database: {
      initialization: any;
      cobranca_id: string;
      assinatura_id: string;
      request_id: string;
      atomic_transaction: boolean;
    };
  };
  warnings?: string[];
}

export interface DadosAssinanteResponse {
  status: 'OK' | 'ERROR';
  message?: string;
  data?: DadosAssinante;
}

export interface AtualizarDadosAssinanteResponse {
  status: 'OK' | 'ERROR';
  message: string;
  data?: DadosAssinante;
}
