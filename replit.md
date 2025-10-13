# Sistema 25h.com.br - Gestão de Cobranças

## Overview
Sistema SaaS de gestão de cobranças com PIX automático via Pluggy, desenvolvido para profissionais autônomos e pequenas empresas no Brasil. O projeto visa otimizar a gestão financeira dos usuários, economizando tempo e aumentando a rentabilidade. A plataforma oferece funcionalidades completas de autenticação, gestão de assinaturas, clientes e cobranças.

## User Preferences
I prefer simple language and clear, concise explanations. I want iterative development with frequent, small updates. Ask for my confirmation before making any major architectural changes or implementing new features. Ensure all new code adheres to the existing coding style and uses Brazilian Portuguese localization where applicable. Do not make changes to files or folders unless explicitly instructed.

## System Architecture

### UI/UX Decisions
- **Color Scheme**: Professional blue (`hsl(217, 91%, 60%)`) as primary, with distinct colors for success (green), warning (yellow), and destructive actions (red).
- **Typography**: Inter for general UI, Roboto Mono for financial values and dates.
- **Components**: Utilizes `shadcn/ui` for standardized components, including `DashboardKPICard`, `StatusBadge`, `ClienteTable`, `CobrancaTable`, `AppSidebar`, and `PlanCard`.
- **Localization**: Full Brazilian Portuguese (R$, WhatsApp masks, date formats).
- **Design Principles**: Mobile-first responsive design, Dark mode support, Accessibility (WCAG AA contrast, visible labels, focus indicators).

### Technical Implementations
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Wouter for routing, TanStack Query v5 for state management.
- **Authentication**: Supabase (email/password, Google OAuth, session management, user metadata for onboarding).
- **Subscription Management**: Complete flow including plan selection, cadastral data validation, Pluggy PIX payment integration, conditional statuses (ATIVA, AGUARDANDO_PAGAMENTO, SUSPENSA, CANCELADA), automatic polling for status updates, upgrade, and cancellation flows.
- **Data Management**: Supabase PostgreSQL for database, with planned backend services using Express.js.
- **Masks**: Brazilian masks implemented for WhatsApp, with CPF, CNPJ, and CEP planned.
- **Testing**: `data-testid` attributes are extensively used for E2E testing with Playwright.

### Feature Specifications
- **Authentication**: Login/Signup (email/password, Google OAuth), onboarding with name and WhatsApp, **automatic Free plan creation on signup**, session management, route protection.
- **Dashboard**: KPI cards (revenue, clients, charges), recent charges table, trend indicators.
- **Client Management**: List clients with filters, table with actions (edit, delete), WhatsApp formatting.
- **Charge Management**: List charges with filters (status, period), totals cards, status badges, view/send actions.
- **Subscription**: Display current plan, pending payment actions, plan selection modal (monthly/annual), cadastral data validation, PIX payment integration via Pluggy, automatic status polling, upgrade/renewal/cancellation flows.
- **Profile**: Personal data form, optional full address, Brazilian masks.

## External Dependencies
- **Supabase**: Used for authentication (email/password, Google OAuth) and as the PostgreSQL database.
- **Pluggy**: Integrated for automatic PIX payments and webhook-based status updates for subscriptions.
- **Vite**: Frontend build tool.
- **TanStack Query**: Data fetching and state management.
- **shadcn/ui**: UI component library.
- **Tailwind CSS**: Utility-first CSS framework.

## Onboarding e Criação Automática do Plano Free

### Fluxo de Onboarding (✅ CORRIGIDO)
Quando um novo usuário se cadastra no sistema, o seguinte fluxo acontece automaticamente:

1. **Signup via Supabase Auth**
   - Usuário fornece email e senha
   - Supabase Auth cria a conta

2. **Onboarding Form**
   - Formulário coleta: Nome Completo e WhatsApp
   - Frontend chama RPC: `processar_pos_login(p_nome, p_whatsapp)`

3. **Backend (RPC `processar_pos_login`)**
   - ✅ Cria registro na tabela `assinantes`
   - ✅ Cria registro na tabela `usuarios` vinculado ao assinante
   - ✅ Atribui funções ADMIN e PROFISSIONAL ao usuário
   - ✅ **Busca plano gratuito ativo** (ind_gratuito = true)
   - ✅ **Cria assinatura com status ATIVA**
   - ✅ Define validade = hoje + dias_degustacao do plano
   - ✅ Retorna dados completos (usuário, assinante, assinatura)

4. **Confirmação no Frontend**
   - Atualiza metadados do Supabase Auth (nome, whatsapp, onboarding_completed)
   - Exibe toast: "Bem-vindo ao 25h! Sua conta foi criada com o plano Free."
   - Redireciona para Dashboard

### Plano Free (Gratuito)
- **Título**: "Grátis" ou "Free"
- **ind_gratuito**: true
- **valor_mensal**: 0
- **limite_clientes_ativos**: 5 (conforme PRD)
- **Status inicial**: ATIVA
- **Periodicidade**: MENSAL
- **Degustação**: Geralmente 7 dias (configurável no plano)

### Componente: OnboardingForm.tsx
```typescript
// Chama RPC para criar assinatura gratuita
const { data, error } = await supabase.rpc('processar_pos_login', {
  p_nome: nome,
  p_whatsapp: whatsapp
});

if (data.status === 'ERROR') {
  throw new Error(data.message);
}

// Atualiza metadados do Auth
await supabase.auth.updateUser({
  data: { nome, whatsapp, onboarding_completed: true }
});
```

### Correção Aplicada (2025-10-13)
**Problema**: Ao criar conta, nenhuma assinatura era atribuída ao usuário (bug reportado).

**Causa**: OnboardingForm apenas salvava metadados no Supabase Auth, sem chamar `processar_pos_login`.

**Solução**: 
- ✅ Adicionado chamada à RPC `processar_pos_login` no OnboardingForm
- ✅ Mantido salvamento de metadados para compatibilidade
- ✅ Teste E2E validou criação automática do plano Free
- ✅ Verificado que assinatura aparece como ATIVA na página Assinatura

## Formatação de Dados Cadastrais

### Problema Corrigido (2025-10-13)
**Erro**: "value too long for type character varying(14)" ao salvar dados cadastrais.

**Causa Raiz**:
- CNPJ formatado: "23.054.120/0001-77" (18 caracteres) → Banco espera 14 caracteres
- WhatsApp formatado: "(51) 99126-3303" (15 caracteres) → Banco espera 11 caracteres
- ModalDadosCadastrais e OnboardingForm enviavam valores COM formatação

**Solução Implementada**:

1. **Funções de Unformat (masks.ts)**
   ```typescript
   // Remove formatação, deixa apenas números
   export function unformatCPFCNPJ(value: string): string {
     return value.replace(/\D/g, '');
   }
   
   export function unformatWhatsApp(value: string): string {
     return value.replace(/\D/g, '');
   }
   ```

2. **ModalDadosCadastrais.tsx**
   - **Submit**: Remove formatação antes de enviar ao backend
   - **useEffect**: Formata valores ao carregar do backend para exibição
   - Garante UX consistente: usuário vê valores formatados, backend recebe apenas números

3. **OnboardingForm.tsx**
   - Remove formatação do WhatsApp antes de enviar
   - Consistência com ModalDadosCadastrais

**Fluxo Completo**:
1. Usuário digita com formatação visual (máscaras aplicadas no input)
2. Ao salvar: remove formatação → envia apenas números ao backend
3. Backend armazena apenas números (CPF: 11 chars, CNPJ: 14 chars, WhatsApp: 11 chars)
4. Ao carregar: formata para exibição → usuário vê valores formatados
5. Ciclo se repete sem erros

**Teste E2E Validado**:
- ✅ CNPJ e WhatsApp salvos sem erro "value too long"
- ✅ Toast de sucesso exibido: "Dados atualizados"
- ✅ Modal de pagamento abre corretamente
- ✅ Valores exibidos formatados ao reabrir o modal

## Modal de Dados Cadastrais - Proteção Contra Reload

### Problema Corrigido (2025-10-13)
**Erro**: Modal de Dados Cadastrais recarregava no meio do preenchimento, perdendo todos os dados digitados.

**Causa Raiz**:
- `useEffect` executava sempre que `dadosAtuais` mudava
- Queries ou mudanças de estado causavam re-render e resetavam o formulário
- Usuário perdia todo o progresso de digitação

**Solução Implementada**:

1. **Estado `userHasEdited`** (ModalDadosCadastrais.tsx)
   ```typescript
   const [userHasEdited, setUserHasEdited] = useState(false);
   
   // Resetar quando modal abre
   useEffect(() => {
     if (open) setUserHasEdited(false);
   }, [open]);
   
   // Carregar dados APENAS se usuário não editou
   useEffect(() => {
     if (open && dadosAtuais && !userHasEdited) {
       setFormData({ ... }); // Carregar do backend
     }
   }, [open, dadosAtuais, userHasEdited]);
   ```

2. **Handlers marcam edição**
   ```typescript
   const handleFieldChange = (field: string, value: string) => {
     setUserHasEdited(true);  // Protege contra reset
     setFormData({ ...formData, [field]: value });
   };
   ```

3. **Proteção em TODOS os inputs**
   - Nome / Razão Social
   - Nome Fantasia
   - Email
   - CPF/CNPJ (com formatação)
   - WhatsApp (com formatação)
   - Select Tipo de Pessoa

**Fluxo de Proteção**:
1. Modal abre → `userHasEdited = false`
2. Dados do backend carregam → preenche campos (se usuário não editou)
3. Usuário digita QUALQUER coisa → `userHasEdited = true`
4. Se `dadosAtuais` mudar → **NÃO reseta** (protegido por `!userHasEdited`)

**Teste E2E Validado**:
- ✅ Campos preenchidos DEVAGAR (com pausas) não foram resetados
- ✅ Valores digitados preservados durante toda a digitação
- ✅ Modal permite carregamento assíncrono de dados sem perder input do usuário

## Problemas de Backend Identificados (Fora do Escopo Frontend)

### 1. RPC `atualizar_dados_assinante` - Duplicate Key Error

**Erro Observado**: 
```
"duplicate key value violates unique constraint 'assinantes_cpf_cnpj_key'"
```

**Contexto**:
- Ocorre ao tentar atualizar dados cadastrais via ModalDadosCadastrais
- Frontend chama: `supabase.rpc('atualizar_dados_assinante', { p_cpf_cnpj, p_tipo_pessoa, ... })`
- Payload enviado: CPF/CNPJ sem formatação (apenas números, 11-14 chars)

**Passos para Reproduzir**:
1. Usuário já possui dados cadastrais salvos (CPF/CNPJ existente)
2. Acessar página Assinatura → Mudar Plano → Preencher dados cadastrais
3. Tentar salvar com MESMO CPF/CNPJ ou qualquer CPF/CNPJ
4. Erro: constraint violation

**Causa Raiz Identificada**: 
RPC está tentando fazer INSERT em vez de UPDATE quando registro do assinante já existe.

**Impacto**: 
Usuários com dados cadastrais prévios não conseguem atualizar informações para contratar planos pagos.

**Solução Necessária**: 
Corrigir lógica da RPC `atualizar_dados_assinante` no Supabase:
- Verificar se registro existe (por auth.uid())
- Se existe → UPDATE
- Se não existe → INSERT
- Ou usar UPSERT (INSERT ... ON CONFLICT DO UPDATE)

**Critério de Aceitação**:
- ✅ Usuário com dados prévios consegue atualizar CPF/CNPJ sem erro
- ✅ Toast de sucesso "Dados atualizados" aparece
- ✅ Modal de pagamento abre após salvar

### 2. Edge Function `iniciar_pagto_assinante` - Status 500

**Erro Observado**: 
```
"Edge Function returned a non-2xx status code"
Status: 500
```

**Contexto**:
- Ocorre após criar assinatura e tentar iniciar pagamento
- Frontend chama: `supabase.functions.invoke('iniciar_pagto_assinante', { body: { cobranca_id, meio_pagamento } })`
- Assinatura é criada com sucesso (toast "Assinatura criada" aparece)
- Modal de pagamento abre mas falha ao confirmar

**Passos para Reproduzir**:
1. Criar conta → Completar onboarding (plano Free criado)
2. Assinatura → Mudar Plano → Selecionar plano pago
3. Preencher dados cadastrais → Salvar
4. Modal de pagamento abre → Confirmar Pagamento
5. Erro: Vite overlay "Edge Function returned a non-2xx status code"

**Logs do Browser Console**:
- `Failed to load resource: the server responded with a status of 500`
- Modal fica em estado "Processando..." indefinidamente

**Impacto**: 
Pagamentos não são iniciados. Usuários não conseguem ativar planos pagos mesmo após assinatura criada.

**Solução Necessária**: 
1. Verificar logs da Edge Function `iniciar_pagto_assinante` no Supabase
2. Investigar integração com API Pluggy (credenciais, payload, endpoints)
3. Adicionar tratamento de erros adequado
4. Retornar erro estruturado para o frontend em vez de 500

**Critério de Aceitação**:
- ✅ Edge Function retorna 200 com URL de pagamento Pluggy
- ✅ Ou retorna erro estruturado (400/422) com mensagem clara
- ✅ Modal de pagamento não trava em "Processando..."
- ✅ Usuário é redirecionado para Pluggy ou vê mensagem de erro clara

### Workarounds Temporários

**Para Duplicate Key Error**:
- Deletar dados cadastrais existentes via Supabase Dashboard antes de atualizar
- Ou criar função temporária que força UPDATE baseado em auth.uid()

**Para Edge Function 500**:
- Verificar credenciais Pluggy (PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET)
- Confirmar que ambiente de testes Pluggy está ativo
- Validar formato do payload enviado à API Pluggy