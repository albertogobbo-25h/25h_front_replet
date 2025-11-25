export type TipoConta = 'CHECKING_ACCOUNT' | 'SAVINGS_ACCOUNT';

export interface InstituicaoFinanceira {
  id: string;
  nome: string;
  nome_fantasia: string;
}

export interface Recebedor {
  id: string;
  gateway_id: string;
  id_recebedor_gateway: string | null;
  instituicao_id: string;
  instituicao_nome: string;
  agencia: string;
  conta: string;
  tipo_conta: TipoConta;
  ind_ativo: boolean;
  criado_em: string;
  modificado_em: string;
  data_inativacao?: string | null;
}

export interface RecebedorResponse {
  status: 'OK' | 'ERROR';
  message: string;
  data: {
    recebedor: Recebedor | null;
  } | null;
  code?: string;
}

export interface ListarRecebedoresResponse {
  status: 'OK' | 'ERROR';
  message: string;
  data: {
    recebedores: Recebedor[];
    total: number;
  } | null;
  code?: string;
}

export interface CadastrarRecebedorInput {
  instituicao_id: string;
  agencia: string;
  conta: string;
  tipo_conta: TipoConta;
}

export interface CadastrarRecebedorResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    recebedor_id: string;
    id_recebedor_gateway?: string;
    ativo?: boolean;
    pode_retry?: boolean;
    http_status?: number;
    details?: string;
  };
  code?: string;
}

export interface AtivarRecebedorResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    recebedor_id: string;
    id_recebedor_gateway: string;
    ativo: boolean;
    chamou_n8n: boolean;
  };
  code?: string;
}

export interface ListarInstituicoesResponse {
  status: 'OK' | 'ERROR';
  message: string;
  data: {
    instituicoes: InstituicaoFinanceira[];
  } | null;
  code?: string;
}

export function formatTipoConta(tipo: TipoConta): string {
  switch (tipo) {
    case 'CHECKING_ACCOUNT':
      return 'Conta Corrente';
    case 'SAVINGS_ACCOUNT':
      return 'Conta Poupança';
    default:
      return tipo;
  }
}
