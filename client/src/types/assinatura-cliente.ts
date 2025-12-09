export type AssinaturaClienteStatus = 'ATIVA' | 'SUSPENSA' | 'CANCELADA' | 'AGUARDANDO_PAGAMENTO';
export type Periodicidade = 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'AVULSO';

export interface PlanoCliente {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: 'VALOR_FIXO' | 'PACOTE' | 'VALOR_VARIAVEL';
  valor_mensal: number;
  periodicidade: Periodicidade;
}

export interface ClienteResumoAssinatura {
  id: string;
  nome: string;
  nome_visualizacao: string | null;
  cpf_cnpj: string | null;
  whatsapp: string | null;
}

export interface AssinaturaCliente {
  id: string;
  assinante_id: string;
  cliente_id: string;
  cliente_plano_id: string;
  status: AssinaturaClienteStatus;
  data_inicio: string;
  data_proximo_vencimento: string | null;
  data_cancelamento: string | null;
  observacao: string | null;
  criado_em: string;
  modificado_em: string | null;
  cliente?: ClienteResumoAssinatura;
  plano?: PlanoCliente;
}

export interface ListarAssinaturasClienteParams {
  p_cliente_id?: string;
  p_status?: AssinaturaClienteStatus;
  p_limit?: number;
  p_offset?: number;
}

export interface ListarAssinaturasClienteResponse {
  assinaturas: AssinaturaCliente[];
  total: number;
  limit: number;
  offset: number;
}

export interface CriarAssinaturaClienteParams {
  p_cliente_id: string;
  p_cliente_plano_id: string;
  p_data_inicio: string;
  p_observacao?: string;
}

export interface CriarAssinaturaClienteResponse {
  assinatura_id: string;
  cliente_id: string;
  plano_id: string;
  status: AssinaturaClienteStatus;
  data_inicio: string;
}

export interface CancelarAssinaturaClienteParams {
  p_assinatura_id: string;
  p_observacao?: string;
}

export interface SuspenderAssinaturaClienteParams {
  p_assinatura_id: string;
  p_observacao?: string;
}

export interface ReativarAssinaturaClienteParams {
  p_assinatura_id: string;
  p_observacao?: string;
}
