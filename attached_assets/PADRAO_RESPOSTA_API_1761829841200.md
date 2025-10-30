# Padrão de Resposta API - Frontend

Como tratar respostas de **RPC Functions** e **Edge Functions** de forma unificada.

## 🎯 Padrão Unificado

Todas as APIs do backend (RPC e Edge Functions) seguem o **mesmo padrão de resposta**:

### ✅ Sucesso

```json
{
  "status": "OK",
  "message": "Descrição da operação",
  "data": {
    // Todos os dados aqui
  }
}
```

### ❌ Erro

```json
{
  "status": "ERROR",
  "code": "ERROR_CODE",
  "message": "Descrição do erro",
  // Campos adicionais (opcionais)
  "campo_extra": "valor"
}
```

## 🔧 Helper Unificado (React/Next.js)

### `lib/api-helper.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

export class ApiError extends Error {
  code: string
  details: Record<string, any>
  
  constructor(message: string, code: string, details: Record<string, any> = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

/**
 * Helper unificado para chamar RPC Functions e Edge Functions
 * Trata o padrão de resposta {status, message, data}
 * 
 * @param fn Função que retorna Promise do Supabase
 * @returns Dados da resposta (.data)
 * @throws ApiError se houver erro
 */
export async function callSupabase<T>(
  fn: () => Promise<{ data: any; error: any }>
): Promise<T> {
  const { data, error } = await fn()
  
  // Erro de rede/Supabase (não chegou no backend)
  if (error) {
    throw new ApiError(
      error.message || 'Erro ao comunicar com o servidor',
      'NETWORK_ERROR',
      { originalError: error }
    )
  }
  
  // Erro da aplicação (backend retornou erro)
  if (data?.status === 'ERROR') {
    const { code, message, ...details } = data
    throw new ApiError(message, code, details)
  }
  
  // Sucesso - retorna apenas os dados
  return data?.data || data
}
```

## 📝 Exemplos de Uso

### RPC Function

```typescript
import { callSupabase } from '@/lib/api-helper'
import { supabase } from '@/lib/supabase'

// Listar clientes
try {
  const clientes = await callSupabase<Cliente[]>(() =>
    supabase.rpc('listar_clientes', {
      p_nome: 'João'
    })
  )
  
  console.log('Clientes encontrados:', clientes)
  
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Código:', error.code)
    console.error('Mensagem:', error.message)
    console.error('Detalhes:', error.details)
  } else {
    console.error('Erro inesperado:', error)
  }
}
```

### Edge Function

```typescript
import { callSupabase } from '@/lib/api-helper'
import { supabase } from '@/lib/supabase'

// Enviar mensagem WhatsApp
try {
  const resultado = await callSupabase<{
    template_usado: string
    destinatario: string
    tempo_processamento_ms: number
  }>(() =>
    supabase.functions.invoke('enviar-mensagem-whatsapp', {
      body: {
        contexto: 'saas',
        tipo: 'boas_vindas',
        whats: '5551999887766',
        data: {
          nome: 'João Silva'
        }
      }
    })
  )
  
  console.log('Mensagem enviada!')
  console.log('Template usado:', resultado.template_usado)
  console.log('Tempo:', resultado.tempo_processamento_ms, 'ms')
  
} catch (error) {
  if (error instanceof ApiError) {
    // Tratamento específico por código
    switch (error.code) {
      case 'TEMPLATE_NAO_ENCONTRADO':
        alert('Template não configurado. Configure primeiro.')
        break
      case 'PLACEHOLDER_ERROR':
        alert('Dados incompletos: ' + error.message)
        break
      default:
        alert('Erro: ' + error.message)
    }
  }
}
```

## 🎨 Componente React com Loading e Erro

```typescript
'use client'

import { useState } from 'react'
import { callSupabase, ApiError } from '@/lib/api-helper'
import { supabase } from '@/lib/supabase'

export function EnviarMensagemButton({ cliente }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleEnviar = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await callSupabase(() =>
        supabase.functions.invoke('enviar-mensagem-whatsapp', {
          body: {
            contexto: 'assinante',
            assinante_id: cliente.assinante_id,
            tipo: 'cobranca_vencendo',
            whats: cliente.whatsapp,
            data: {
              cliente_nome: cliente.nome,
              valor: '150,00',
              vencimento: '25/10/2025'
            }
          }
        })
      )

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Erro ao enviar mensagem')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button 
        onClick={handleEnviar}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Enviando...' : 'Enviar WhatsApp'}
      </button>
      
      {error && (
        <div className="alert alert-error mt-2">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success mt-2">
          Mensagem enviada com sucesso!
        </div>
      )}
    </div>
  )
}
```

## 🔍 Tratamento de Erros por Código

```typescript
try {
  const result = await callSupabase(...)
  
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.code) {
      // Autenticação
      case 'UNAUTHORIZED':
        router.push('/login')
        break
      
      case 'FORBIDDEN':
        alert('Você não tem permissão para esta ação')
        break
      
      // Validação
      case 'INVALID_PAYLOAD':
      case 'MISSING_FIELD':
        alert('Dados inválidos: ' + error.message)
        break
      
      // Recursos
      case 'NOT_FOUND':
      case 'TEMPLATE_NAO_ENCONTRADO':
        alert('Recurso não encontrado: ' + error.message)
        break
      
      // Integrações
      case 'N8N_ERROR':
        alert('Erro ao enviar mensagem. Tente novamente.')
        console.error('Detalhes N8N:', error.details)
        break
      
      // Genérico
      default:
        alert('Erro: ' + error.message)
        console.error('Erro completo:', error)
    }
  }
}
```

## 🧪 Mock para Testes

```typescript
// Mock de resposta de sucesso
const mockSuccess = {
  data: {
    status: 'OK',
    message: 'Operação realizada',
    data: { id: '123', nome: 'João' }
  },
  error: null
}

// Mock de resposta de erro
const mockError = {
  data: {
    status: 'ERROR',
    code: 'NOT_FOUND',
    message: 'Cliente não encontrado'
  },
  error: null
}

// Teste
const result = await callSupabase(() => Promise.resolve(mockSuccess))
expect(result).toEqual({ id: '123', nome: 'João' })

await expect(
  callSupabase(() => Promise.resolve(mockError))
).rejects.toThrow('Cliente não encontrado')
```

## ✅ Benefícios

1. **Um único código** para RPC e Edge Functions
2. **Type safety** com TypeScript
3. **Tratamento consistente** de erros
4. **Melhor UX** com mensagens claras
5. **Fácil debugging** com código de erro
6. **Testável** com mocks simples

## 🚀 Migração de Código Existente

### Antes (inconsistente)

```typescript
// RPC
const { data: clientes } = await supabase.rpc('listar_clientes')
if (clientes.status === 'ERROR') {
  // tratar erro
}
const lista = clientes.data

// Edge Function
const { data: result, error } = await supabase.functions.invoke(...)
if (error) {
  // tratar erro diferente
}
```

### Depois (unificado)

```typescript
// AMBOS usam o mesmo código!
const clientes = await callSupabase(() => 
  supabase.rpc('listar_clientes')
)

const result = await callSupabase(() =>
  supabase.functions.invoke(...)
)
```

## 📊 Checklist de Implementação

- [ ] Criar `lib/api-helper.ts` com `callSupabase()` e `ApiError`
- [ ] Substituir chamadas diretas por `callSupabase()`
- [ ] Adicionar tratamento de erro com `instanceof ApiError`
- [ ] Testar com RPC functions
- [ ] Testar com Edge functions
- [ ] Adicionar testes unitários
- [ ] Documentar códigos de erro da aplicação

