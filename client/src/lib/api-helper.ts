/**
 * Classe de erro customizada para APIs do Supabase
 * Contém código de erro, mensagem e detalhes adicionais
 */
export class ApiError extends Error {
  code: string;
  details: Record<string, any>;
  
  constructor(message: string, code: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Mapeamento centralizado de códigos de erro para mensagens amigáveis em português
 * Use para exibir mensagens consistentes ao usuário
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Erros de autenticação/autorização
  'UNAUTHORIZED': 'Sessão expirada. Faça login novamente.',
  'FORBIDDEN': 'Você não tem permissão para realizar esta ação.',
  'AUTH_ERROR': 'Erro de autenticação. Faça login novamente.',
  'SESSION_EXPIRED': 'Sua sessão expirou. Faça login novamente.',
  
  // Erros de validação
  'INVALID_PAYLOAD': 'Dados inválidos. Verifique as informações e tente novamente.',
  'VALIDATION_ERROR': 'Dados inválidos. Verifique as informações e tente novamente.',
  'MISSING_REQUIRED_FIELD': 'Preencha todos os campos obrigatórios.',
  'INVALID_FORMAT': 'Formato de dados inválido. Verifique as informações.',
  
  // Erros de recursos não encontrados
  'NOT_FOUND': 'Registro não encontrado.',
  'TEMPLATE_NAO_ENCONTRADO': 'Template não encontrado. Selecione outro template.',
  'CLIENTE_NAO_ENCONTRADO': 'Cliente não encontrado.',
  'COBRANCA_NAO_ENCONTRADA': 'Cobrança não encontrada.',
  'RECEBEDOR_NAO_ENCONTRADO': 'Conta bancária não encontrada.',
  'ASSINATURA_NAO_ENCONTRADA': 'Assinatura não encontrada.',
  
  // Erros de duplicidade
  'DUPLICATE': 'Este registro já existe.',
  'CPF_CNPJ_JA_CADASTRADO': 'CPF/CNPJ já cadastrado para outro cliente.',
  'CONTA_JA_CADASTRADA': 'Esta conta bancária já está cadastrada.',
  
  // Erros de integração externa
  'N8N_ERROR': 'Erro ao processar a solicitação. Tente novamente em alguns instantes.',
  'PLUGGY_ERROR': 'Erro ao comunicar com o gateway de pagamento. Tente novamente.',
  'GATEWAY_ERROR': 'Erro ao comunicar com o serviço de pagamento. Tente novamente.',
  'WEBHOOK_ERROR': 'Erro ao processar notificação de pagamento.',
  
  // Erros específicos de Recebedor/Conta Bancária
  'ALREADY_HAS_RECEBEDOR_ATIVO': 'Você já possui uma conta bancária ativa cadastrada.',
  'RECEBEDOR_INATIVO': 'A conta bancária está inativa. Configure uma nova conta.',
  'INSTITUICAO_NAO_ENCONTRADA': 'Banco não encontrado. Selecione outro banco.',
  'CONTA_INVALIDA': 'Dados da conta bancária inválidos. Verifique as informações.',
  'AGENCIA_INVALIDA': 'Número da agência inválido. Verifique e tente novamente.',
  'TIPO_CONTA_INVALIDO': 'Tipo de conta inválido. Selecione Corrente ou Poupança.',
  
  // Erros de WhatsApp
  'PLACEHOLDER_ERROR': 'Faltam dados obrigatórios no template. Verifique os placeholders.',
  'WHATSAPP_ERROR': 'Erro ao enviar mensagem WhatsApp. Verifique o número.',
  
  // Erros de rede/servidor
  'NETWORK_ERROR': 'Falha na conexão. Verifique sua internet e tente novamente.',
  'TIMEOUT': 'A operação demorou muito. Tente novamente.',
  'INTERNAL_ERROR': 'Erro interno do servidor. Tente novamente mais tarde.',
  'SERVICE_UNAVAILABLE': 'Serviço temporariamente indisponível. Tente novamente.',
  
  // Erros de Edge Function
  'EDGE_FUNCTION_ERROR': 'Erro ao processar a solicitação. Tente novamente.',
  'FUNCTION_NOT_FOUND': 'Serviço não disponível. Entre em contato com o suporte.',
  
  // Erros de negócio
  'BUSINESS_RULE_ERROR': 'Operação não permitida pelas regras do sistema.',
  'LIMITE_EXCEDIDO': 'Você atingiu o limite permitido para esta operação.',
  'OPERACAO_NAO_PERMITIDA': 'Esta operação não é permitida no momento.',
  
  // Erro genérico
  'UNKNOWN_ERROR': 'Ocorreu um erro inesperado. Tente novamente.',
};

/**
 * Obtém uma mensagem de erro amigável a partir de um código ou mensagem técnica
 * @param errorCode Código do erro (ex: 'UNAUTHORIZED')
 * @param fallbackMessage Mensagem de fallback se não encontrar mapeamento
 * @returns Mensagem amigável em português
 */
export function getErrorMessage(errorCode: string | undefined, fallbackMessage?: string): string {
  if (!errorCode) {
    return fallbackMessage || ERROR_MESSAGES['UNKNOWN_ERROR'];
  }
  
  // Tenta encontrar pelo código exato
  if (ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }
  
  // Tenta encontrar por código parcial (ex: 'AUTH' em 'AUTH_FAILED')
  const partialMatch = Object.keys(ERROR_MESSAGES).find(key => 
    errorCode.toUpperCase().includes(key) || key.includes(errorCode.toUpperCase())
  );
  
  if (partialMatch) {
    return ERROR_MESSAGES[partialMatch];
  }
  
  return fallbackMessage || ERROR_MESSAGES['UNKNOWN_ERROR'];
}

/**
 * Extrai mensagem de erro amigável de qualquer objeto de erro
 * Verifica múltiplas propriedades comuns em diferentes formatos de erro
 */
export function extractFriendlyErrorMessage(error: any, defaultMessage?: string): string {
  // Se for um ApiError, já tem código e mensagem
  if (error instanceof ApiError) {
    return getErrorMessage(error.code, error.message);
  }
  
  // Tenta extrair do objeto de erro
  const errorCode = error?.code || error?.error_code || error?.errorCode;
  const errorMessage = error?.message || error?.error_message || error?.errorMessage;
  
  // Se tem código, usa o mapeamento
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }
  
  // Se a mensagem é técnica (contém termos técnicos), usa mensagem genérica
  if (errorMessage && isTechnicalMessage(errorMessage)) {
    return defaultMessage || ERROR_MESSAGES['UNKNOWN_ERROR'];
  }
  
  // Se a mensagem parece amigável (em português, sem termos técnicos), usa ela
  if (errorMessage && !isTechnicalMessage(errorMessage)) {
    return errorMessage;
  }
  
  return defaultMessage || ERROR_MESSAGES['UNKNOWN_ERROR'];
}

/**
 * Verifica se uma mensagem é técnica (não deve ser exibida ao usuário)
 */
function isTechnicalMessage(message: string): boolean {
  const technicalPatterns = [
    /edge function/i,
    /non-2xx status/i,
    /status code/i,
    /network error/i,
    /fetch failed/i,
    /connection refused/i,
    /timeout exceeded/i,
    /internal server error/i,
    /unexpected token/i,
    /json parse/i,
    /syntax error/i,
    /undefined is not/i,
    /cannot read property/i,
    /null reference/i,
    /stack trace/i,
    /at line \d+/i,
    /postgres/i,
    /supabase/i,
    /database error/i,
    /sql error/i,
    /rpc error/i,
  ];
  
  return technicalPatterns.some(pattern => pattern.test(message));
}

/**
 * Helper unificado para chamar RPC Functions e Edge Functions
 * Trata o padrão de resposta {status, message, data}
 * 
 * @param fn Função que retorna Promise do Supabase
 * @param functionName Nome da função (para melhor logging de erros)
 * @returns Dados da resposta (.data)
 * @throws ApiError se houver erro
 * 
 * @example
 * // RPC Function
 * const clientes = await callSupabase<Cliente[]>(
 *   () => supabase.rpc('listar_clientes', { p_nome: 'João' }),
 *   'listar_clientes'
 * )
 * 
 * @example
 * // Edge Function
 * const result = await callSupabase(
 *   () => supabase.functions.invoke('enviar-mensagem', { body: {...} }),
 *   'enviar-mensagem'
 * )
 */
export async function callSupabase<T>(
  fn: () => Promise<{ data: any; error: any }>,
  functionName?: string
): Promise<T> {
  const { data, error } = await fn();
  
  const functionInfo = functionName ? ` (${functionName})` : '';
  
  // Edge Function pode retornar erro HTTP (non-2xx) mas ainda ter dados no body
  // Neste caso, error existe mas data também pode conter a mensagem real
  if (error) {
    console.error(`❌ callSupabase${functionInfo} - Erro de rede/Supabase:`, {
      functionName,
      message: error.message,
      context: error.context,
      details: error.details,
      hint: error.hint,
      code: error.code,
      fullError: error,
      dataRecebido: data
    });
    
    // Se data contém uma resposta estruturada com message, usa ela (mais amigável)
    if (data?.message && !isTechnicalMessage(data.message)) {
      throw new ApiError(
        data.message,
        data.code || error.code || 'EDGE_FUNCTION_ERROR',
        { 
          functionName,
          originalError: error,
          responseData: data
        }
      );
    }
    
    // Se data contém status ERROR com message
    if (data?.status === 'ERROR' || data?.status === 'error') {
      const friendlyMessage = data.message && !isTechnicalMessage(data.message) 
        ? data.message 
        : getErrorMessage(data.code, 'Erro ao processar solicitação.');
      
      throw new ApiError(
        friendlyMessage,
        data.code || 'EDGE_FUNCTION_ERROR',
        { 
          functionName,
          originalError: error,
          responseData: data
        }
      );
    }
    
    // Se é erro genérico de Edge Function, usa mensagem amigável
    if (error.message?.includes('Edge Function') || error.message?.includes('non-2xx')) {
      throw new ApiError(
        getErrorMessage('EDGE_FUNCTION_ERROR'),
        'EDGE_FUNCTION_ERROR',
        { 
          functionName,
          originalError: error,
          responseData: data
        }
      );
    }
    
    // Outros erros de rede/Supabase
    const errorMessage = isTechnicalMessage(error.message) 
      ? getErrorMessage(error.code || 'NETWORK_ERROR')
      : error.message || getErrorMessage('NETWORK_ERROR');
    
    throw new ApiError(
      errorMessage,
      error.code || 'NETWORK_ERROR',
      { 
        functionName,
        originalError: error,
        context: error.context,
        hint: error.hint,
        details: error.details
      }
    );
  }
  
  // Erro da aplicação (backend retornou erro com status 2xx mas status=ERROR no body)
  if (data?.status === 'ERROR' || data?.status === 'error') {
    console.error('❌ callSupabase - Erro da aplicação:', data);
    
    const friendlyMessage = data.message && !isTechnicalMessage(data.message)
      ? data.message
      : getErrorMessage(data.code, 'Erro ao processar solicitação.');
    
    throw new ApiError(friendlyMessage, data.code || 'UNKNOWN_ERROR', {
      functionName,
      ...data
    });
  }
  
  // Sucesso - retorna apenas os dados
  return data?.data || data;
}

/**
 * Helper específico para Edge Functions com tratamento de erro amigável
 * Extrai automaticamente a mensagem do backend mesmo em erros HTTP
 * NOTA: Retorna o envelope completo {status, message, data, code} para que o chamador
 * possa verificar status e code. Diferente de callSupabase que retorna apenas data.
 * 
 * @param supabase Cliente Supabase
 * @param functionName Nome da Edge Function
 * @param body Payload da requisição
 * @param defaultErrorMessage Mensagem de erro padrão se não conseguir extrair
 * @returns Promise com a resposta completa (envelope)
 * @throws ApiError com mensagem amigável apenas para erros HTTP
 */
export async function callEdgeFunction<T>(
  supabase: { functions: { invoke: (name: string, options?: any) => Promise<{ data: any; error: any }> } },
  functionName: string,
  body?: Record<string, any>,
  defaultErrorMessage?: string
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  
  console.log(`📡 Edge Function (${functionName}):`, { 
    hasError: !!error, 
    hasData: !!data,
    errorMessage: error?.message,
    dataStatus: data?.status,
    dataMessage: data?.message
  });
  
  // Se tem erro HTTP, verifica se data contém mensagem amigável
  if (error) {
    console.error(`❌ Edge Function (${functionName}) - Erro:`, {
      error,
      data,
    });
    
    // Prioridade: 1) data.message amigável, 2) mapeamento por código, 3) mensagem padrão
    let friendlyMessage = defaultErrorMessage || getErrorMessage('EDGE_FUNCTION_ERROR');
    let errorCode = 'EDGE_FUNCTION_ERROR';
    
    // Se data tem resposta estruturada
    if (data) {
      errorCode = data.code || data.error_code || errorCode;
      
      // Se tem mensagem e não é técnica, usa ela
      if (data.message && !isTechnicalMessage(data.message)) {
        friendlyMessage = data.message;
      } else if (data.code) {
        // Tenta mapear pelo código
        friendlyMessage = getErrorMessage(data.code, friendlyMessage);
      }
    }
    
    throw new ApiError(friendlyMessage, errorCode, {
      functionName,
      originalError: error,
      responseData: data
    });
  }
  
  // Retorna o envelope completo para que o chamador possa verificar status/code
  // Isso permite que o componente trate success/error conforme necessário
  return data as T;
}
