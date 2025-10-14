export interface Cliente {
  id: string;
  nome: string;
  nome_visualizacao: string | null;
  whatsapp: string | null;
  observacao: string | null;
  ind_ativo: boolean;
  criado_em?: string;
  modificado_em?: string;
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
