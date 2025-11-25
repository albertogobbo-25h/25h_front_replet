export type TipoPessoa = 'FISICA' | 'JURIDICA';

export interface Cliente {
  id: string;
  nome: string;
  nome_visualizacao: string | null;
  whatsapp: string | null;
  cpf_cnpj: string | null;
  tipo_pessoa: TipoPessoa | null;
  email: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  observacao: string | null;
  ind_ativo: boolean;
  criado_em: string;
  modificado_em: string;
}

export interface CriarClienteInput {
  nome: string;
  nome_visualizacao?: string;
  whatsapp?: string;
  cpf_cnpj?: string;
  tipo_pessoa?: TipoPessoa;
  email?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  observacao?: string;
}

export interface AtualizarClienteInput extends Partial<CriarClienteInput> {
  cliente_id: string;
}

export interface ListarClientesInput {
  nome?: string;
  cpf_cnpj?: string;
  email?: string;
  whatsapp?: string;
  ind_ativo?: boolean | null;
  limit?: number;
  offset?: number;
}

export interface ClienteRpcResponse {
  status: 'OK' | 'ERROR';
  message: string;
  code?: string;
  data?: {
    cliente_id?: string;
    cliente_existente_id?: string;
    data?: Cliente;
  };
}

export interface ClientePlano {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: 'VALOR_FIXO' | 'PACOTE' | 'VALOR_VARIAVEL';
  valor_mensal: number | null;
  valor_atendimento: number | null;
  qtd_atendimentos: number | null;
  periodicidade: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | null;
  ativo: boolean;
  criado_em: string;
  modificado_em: string;
}

export interface CriarClientePlanoParams {
  p_nome: string;
  p_tipo: 'VALOR_FIXO' | 'PACOTE' | 'VALOR_VARIAVEL';
  p_descricao?: string;
  p_valor_mensal?: number;
  p_valor_atendimento?: number;
  p_qtd_atendimentos?: number;
  p_periodicidade?: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
}

export interface AtualizarClientePlanoParams {
  p_plano_id: string;
  p_nome?: string;
  p_descricao?: string;
  p_tipo?: 'VALOR_FIXO' | 'PACOTE' | 'VALOR_VARIAVEL';
  p_valor_mensal?: number;
  p_valor_atendimento?: number;
  p_qtd_atendimentos?: number;
  p_periodicidade?: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
}

export interface ListarClientePlanosParams {
  p_nome?: string;
  p_tipo?: 'VALOR_FIXO' | 'PACOTE' | 'VALOR_VARIAVEL';
  p_ativo?: boolean;
  p_limit?: number;
  p_offset?: number;
}

export interface ClientePlanoResponse {
  status: 'OK' | 'ERROR';
  message: string;
  plano_id?: string;
  code?: string;
  data?: ClientePlano;
}
