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
  
  // Erro de rede/Supabase (não chegou no backend)
  if (error) {
    const functionInfo = functionName ? ` (${functionName})` : '';
    console.error(`❌ callSupabase${functionInfo} - Erro de rede/Supabase:`, {
      functionName,
      message: error.message,
      context: error.context,
      details: error.details,
      hint: error.hint,
      code: error.code,
      fullError: error
    });
    
    // Mensagem de erro mais específica
    let errorMessage = error.message || 'Erro ao comunicar com o servidor';
    
    // Se é um erro de Edge Function, adicionar orientações
    if (error.message?.includes('Edge Function')) {
      errorMessage = `Edge Function "${functionName || 'desconhecida'}" não está acessível. Verifique se a função está deployada no Supabase.`;
    }
    
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
  
  // Erro da aplicação (backend retornou erro)
  if (data?.status === 'ERROR') {
    console.error('❌ callSupabase - Erro da aplicação:', data);
    const { code, message, ...details } = data;
    throw new ApiError(message, code || 'UNKNOWN_ERROR', details);
  }
  
  // Sucesso - retorna apenas os dados
  return data?.data || data;
}
