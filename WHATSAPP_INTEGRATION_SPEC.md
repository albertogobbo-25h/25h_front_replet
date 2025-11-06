# Especificação da Integração WhatsApp

## Visão Geral
Integração completa com Edge Function `enviar-mensagem-whatsapp` do Supabase para envio de mensagens WhatsApp via N8N.

## Edge Function: enviar-mensagem-whatsapp

### Endpoint
```
POST /functions/v1/enviar-mensagem-whatsapp
```

### Autenticação
- Requer token JWT do usuário no header `Authorization: Bearer {jwt_token}`
- O Supabase Client injeta automaticamente via `supabase.functions.invoke()`

### Payload

#### Template SAAS (institucional)
```json
{
  "contexto": "saas",
  "tipo": "boas_vindas",
  "whats": "5551991263303",
  "data": {
    "nome": "João Silva",
    "link_video": "https://youtube.com/..."
  }
}
```

#### Template Assinante (personalizado)
```json
{
  "contexto": "assinante",
  "assinante_id": "uuid-do-assinante",
  "tipo": "cobranca_vencendo",
  "whats": "5551999887766",
  "data": {
    "cliente_nome": "Maria",
    "valor": "150,00",
    "vencimento": "25/10/2025"
  }
}
```

### Campos Obrigatórios
- `contexto`: `"saas"` ou `"assinante"`
- `tipo`: string identificando o template (tipo do template cadastrado)
- `whats`: número do WhatsApp (10-15 dígitos, apenas números)
- `data`: objeto com os valores para substituir os placeholders `{{campo}}` do template
- `assinante_id`: **OBRIGATÓRIO** apenas se `contexto = "assinante"`

### Resposta

#### Sucesso
```json
{
  "status": "OK",
  "message": "Mensagem enviada com sucesso",
  "data": {
    "template_usado": "Boas Vindas",
    "tipo": "boas_vindas",
    "destinatario": "5551991263303",
    "instancia": "Kate_25h",
    "tempo_processamento_ms": 1234
  }
}
```

#### Erro
```json
{
  "status": "ERROR",
  "code": "TEMPLATE_NAO_ENCONTRADO",
  "message": "Template SAAS \"boas_vindas\" não encontrado"
}
```

### Códigos de Erro
| Código | Descrição |
|--------|-----------|
| `UNAUTHORIZED` | Token não fornecido ou inválido |
| `INVALID_PAYLOAD` | Payload inválido ou campos obrigatórios faltando |
| `TEMPLATE_NAO_ENCONTRADO` | Template não existe no banco |
| `PLACEHOLDER_ERROR` | Campo do template faltando no `data` |
| `N8N_ERROR` | Erro ao enviar para N8N |
| `INTERNAL_ERROR` | Erro interno do servidor |

## Implementação Frontend

### Componente: ModalEnviarWhatsApp

**Localização**: `client/src/components/ModalEnviarWhatsApp.tsx`

#### Props
```typescript
interface ModalEnviarWhatsAppProps {
  open: boolean;
  onClose: () => void;
  destinatario: {
    nome: string;
    whatsapp: string;
  };
  dadosCobranca?: Record<string, any>;
  contexto?: string; // 'saas' ou 'assinante', default: 'saas'
}
```

#### Funcionalidades Implementadas

1. **Seleção de Template**
   - Lista templates disponíveis via RPC `listar_templates_whatsapp`
   - Suporta múltiplos formatos de resposta (array, objeto com status, objeto aninhado)

2. **Preview em Tempo Real**
   - Substitui placeholders `{{campo}}` com dados reais
   - Renderiza markdown usando `react-markdown` + `remark-gfm`
   - Mostra badges com os placeholders disponíveis

3. **Normalização de Dados**
   - **WhatsApp**: Remove formatação, deixa apenas dígitos
   - **Placeholders**: Formato `{{campo}}` (double braces)
   - **Contexto**: Injeta automaticamente `assinante_id` quando `contexto = "assinante"`

4. **Envio da Mensagem**
   ```typescript
   const payload = {
     contexto: 'assinante',
     assinante_id: assinanteId, // Do AuthContext
     tipo: templateSelecionado,
     whats: whatsNormalizado, // Apenas números
     data: {
       nome: destinatario.nome,
       ...dadosCobranca
     }
   };
   
   await supabase.functions.invoke('enviar-mensagem-whatsapp', {
     body: payload
   });
   ```

5. **Tratamento de Erros**
   - Mapeamento de códigos de erro para mensagens amigáveis
   - Toast com feedback visual
   - Validação de campos obrigatórios

### Uso no Módulo de Cobranças

**Localização**: `client/src/pages/Cobrancas.tsx`

```tsx
<ModalEnviarWhatsApp
  open={modalWhatsAppOpen}
  onClose={() => {
    setModalWhatsAppOpen(false);
    setCobrancaParaWhatsApp(null);
  }}
  destinatario={{
    nome: cobrancaParaWhatsApp.cliente?.nome || 'Cliente',
    whatsapp: cobrancaParaWhatsApp.cliente?.whatsapp || '',
  }}
  contexto="assinante"
  dadosCobranca={{
    cliente_nome: cobrancaParaWhatsApp.cliente?.nome || 'Cliente',
    descricao: cobrancaParaWhatsApp.descricao,
    valor: formatCurrency(Number(cobrancaParaWhatsApp.valor_total)),
    vencimento: formatDate(cobrancaParaWhatsApp.data_vencimento),
    referencia_mes: cobrancaParaWhatsApp.referencia_mes
      ? new Date(cobrancaParaWhatsApp.referencia_mes).toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric',
        })
      : undefined,
  }}
/>
```

## Placeholders Comuns

### Para Cobranças
- `{{cliente_nome}}`: Nome do cliente
- `{{descricao}}`: Descrição da cobrança
- `{{valor}}`: Valor formatado (ex: R$ 150,00)
- `{{vencimento}}`: Data de vencimento formatada (ex: 25/10/2025)
- `{{referencia_mes}}`: Mês de referência (ex: outubro de 2025)

### Para Templates SAAS
- `{{nome}}`: Nome do usuário/destinatário
- `{{link_video}}`: Link para vídeo de boas-vindas
- Outros conforme necessidade institucional

## Observações Importantes

1. **Normalização Automática**: 
   - WhatsApp aceita apenas números (10-15 dígitos)
   - Edge Function adiciona código do país `55` se necessário
   - Frontend remove formatação antes de enviar

2. **Contexto Assinante**:
   - Sempre requer `assinante_id`
   - `assinante_id` é obtido do `AuthContext`
   - Usado para templates personalizados do assinante

3. **Contexto SAAS**:
   - Não requer `assinante_id`
   - Usado para templates institucionais do sistema
   - Ex: boas-vindas, comunicados gerais

4. **Formato de Placeholders**:
   - Backend espera `{{campo}}` (double braces)
   - Regex de substituição: `\\{\\{${key}\\}\\}`
   - Case-sensitive

5. **Segurança**:
   - Autenticação JWT obrigatória
   - Edge Function valida permissões
   - RLS policies do Supabase aplicadas

## Exemplos de Templates

### Template de Cobrança Vencendo
```markdown
Olá {{cliente_nome}}! 👋

Sua cobrança está vencendo:

**Descrição:** {{descricao}}
**Valor:** {{valor}}
**Vencimento:** {{vencimento}}

Por favor, efetue o pagamento para manter seu serviço ativo.

Obrigado!
```

### Template de Boas-Vindas (SAAS)
```markdown
Bem-vindo(a) ao 25h.com.br, {{nome}}! 🎉

Assista nosso vídeo de introdução:
{{link_video}}

Estamos aqui para ajudar você a otimizar sua gestão financeira!
```

## Testes Recomendados

1. ✅ Enviar mensagem com template SAAS
2. ✅ Enviar mensagem com template Assinante
3. ✅ Validar normalização de WhatsApp (com/sem formatação)
4. ✅ Validar substituição de placeholders
5. ✅ Validar tratamento de erros (template não encontrado, placeholder faltando)
6. ✅ Validar autenticação (usuário não logado)
7. ✅ Validar contexto assinante sem assinante_id

## Status da Implementação

✅ **COMPLETO** - Integração frontend totalmente funcional e alinhada com a especificação da Edge Function.
