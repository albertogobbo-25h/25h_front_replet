export interface PlanoPublico {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: 'VALOR_FIXO' | 'PACOTE' | 'VALOR_VARIAVEL';
  valor_mensal: number;
  periodicidade: string;
}

export interface AssinantePublico {
  id: string;
  nome: string;
  nome_fantasia?: string;
  whatsapp: string;
  email: string;
}

export interface ObterPlanoResponse {
  plano: PlanoPublico;
  assinante: AssinantePublico;
}

export interface ClienteEncontrado {
  id: string;
  nome: string;
  whatsapp: string | null;
  email: string | null;
  cpf_cnpj: string;
  tipo_pessoa: 'FISICA' | 'JURIDICA';
  rua: string | null;
  numero: string | null;
  complemento?: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  ind_ativo: boolean;
}

export interface BuscarClienteResponse {
  encontrado: boolean;
  cliente: ClienteEncontrado | null;
}

export interface DadosClienteAssinatura {
  nome: string;
  whatsapp: string;
  cpf_cnpj?: string;
  tipo_pessoa?: 'FISICA' | 'JURIDICA';
  email?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}

export interface CriarAssinaturaResponse {
  cliente_id: string;
  assinatura_id: string;
  cobranca_id: string;
  link_pagamento: string;
  valor_primeira_cobranca: number;
  data_vencimento: string;
  plano: {
    id: string;
    nome: string;
    valor_mensal: number;
  };
  assinante: {
    id: string;
    nome: string;
  };
}

export interface CriarAssinaturaWarningResponse {
  assinatura_existente_id: string;
  cliente_id: string;
  requer_confirmacao: boolean;
}

export interface ApiResponsePublicaSemAuth<T> {
  status: 'OK' | 'ERROR' | 'WARNING';
  message: string;
  code?: string;
  data?: T;
}

export type CriarAssinaturaErrorCode =
  | 'NOME_OBRIGATORIO'
  | 'WHATSAPP_OBRIGATORIO'
  | 'INVALID_WHATSAPP'
  | 'INVALID_EMAIL'
  | 'PLANO_NAO_ENCONTRADO'
  | 'PLANO_INATIVO'
  | 'PLANO_SEM_VALOR';

export type ObterPlanoErrorCode =
  | 'PLANO_NAO_ENCONTRADO'
  | 'PLANO_INATIVO'
  | 'ASSINANTE_NAO_ENCONTRADO';
