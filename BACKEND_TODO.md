# Tarefas Pendentes no Backend Supabase

## 1. Criar RPC `obter_funcoes_usuario`

A função RPC `obter_funcoes_usuario` deve ser criada no backend Supabase para buscar as roles do usuário da tabela `app_data.usuario_funcao`.

### Implementação SQL Necessária:

```sql
CREATE OR REPLACE FUNCTION public.obter_funcoes_usuario(p_usuario_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_roles TEXT[];
BEGIN
  -- Buscar roles do usuário da tabela app_data.usuario_funcao
  SELECT ARRAY_AGG(funcao)
  INTO v_roles
  FROM app_data.usuario_funcao
  WHERE usuario_id = p_usuario_id;
  
  -- Retornar array vazio se não encontrar roles
  RETURN COALESCE(v_roles, ARRAY[]::TEXT[]);
END;
$$;

-- Garantir que a função seja acessível via PostgREST
GRANT EXECUTE ON FUNCTION public.obter_funcoes_usuario(UUID) TO authenticated;
```

### Descrição:
- **Parâmetros**: `p_usuario_id` (UUID) - ID do usuário autenticado
- **Retorno**: Array de strings com as roles do usuário (ex: `['ADMIN', 'PROFISSIONAL']`)
- **Segurança**: SECURITY DEFINER para permitir acesso ao schema `app_data`

### Impacto Atual:
Enquanto esta RPC não estiver implementada, o sistema usa uma implementação temporária que:
1. Verifica metadados do usuário (`user_metadata.roles` ou `user_metadata.is_admin`)
2. Por padrão, atribui role `PROFISSIONAL` a todos os usuários
3. Atribui role `ADMIN` se `user_metadata.is_admin = true`

### Chamada Frontend:
```typescript
const { data, error } = await supabase.rpc('obter_funcoes_usuario', {
  p_usuario_id: userId
});
```

### Localização no Código Frontend:
- `client/src/contexts/AuthContext.tsx` - função `fetchUserRoles()`

---

## Status: ⚠️ PENDENTE - ALTA PRIORIDADE

Esta RPC é essencial para o sistema de controle de acesso baseado em roles funcionar corretamente.
