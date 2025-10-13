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