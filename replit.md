# Sistema 25h.com.br - Gestão de Cobranças

## Overview
Sistema SaaS de gestão de cobranças com PIX automático via Pluggy, desenvolvido para profissionais autônomos e pequenas empresas no Brasil. O projeto visa otimizar a gestão financeira dos usuários, economizando tempo e aumentando a rentabilidade. A plataforma oferece funcionalidades completas de autenticação, gestão de assinaturas, clientes e cobranças. A plataforma é exclusiva para Pessoa Jurídica (CNPJ).

## User Preferences
I prefer simple language and clear, concise explanations. I want iterative development with frequent, small updates. Ask for my confirmation before making any major architectural changes or implementing new features. Ensure all new code adheres to the existing coding style and uses Brazilian Portuguese localization where applicable. Do not make changes to files or folders unless explicitly instructed.

## System Architecture

### UI/UX Decisions
- **Color Scheme**: Professional blue (`hsl(217, 91%, 60%)`) as primary, with distinct colors for success, warning, and destructive actions.
- **Typography**: Inter for general UI, Roboto Mono for financial values and dates.
- **Components**: Utilizes `shadcn/ui` for standardized components (`DashboardKPICard`, `StatusBadge`, `ClienteTable`, `CobrancaTable`, `AppSidebar`, `PlanCard`, `ModalCliente`, `ModalPlanoCliente`, `ModalCobranca`).
- **Localization**: Full Brazilian Portuguese (R$, WhatsApp masks, date formats, currency formatting).
- **Design Principles**: Mobile-first responsive design, Dark mode support, Accessibility (WCAG AA contrast, visible labels, focus indicators).

### Technical Implementations
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Wouter for routing, TanStack Query v5 for state management.
- **Authentication**: Supabase (email/password, Google OAuth, session management, user metadata for onboarding, assinante_id in AuthContext).
- **Subscription Management**: Complete flow including plan selection, cadastral data validation, Pluggy PIX payment integration, conditional statuses, automatic polling, upgrade, and cancellation flows.
- **Data Management**:
  - Supabase PostgreSQL with multi-tenancy (app_data schema)
  - RLS policies using `app_internal.current_assinante_id()` for tenant isolation
  - All queries use `.schema('app_data')` for proper schema access
- **API Response Pattern**:
  - Unified helper `callSupabase()` in `lib/api-helper.ts` for all RPC/Edge Functions
  - Consistent error handling with `ApiError` class (code, message, details)
  - All backend responses follow `{status, message, data}` format
  - Frontend automatically receives normalized data.
- **Masks**: Brazilian masks implemented for WhatsApp, CNPJ, CEP.
- **Testing**: `data-testid` attributes are extensively used for E2E testing with Playwright.

### Feature Specifications
- **Authentication**: Login/Signup, onboarding with name and WhatsApp, automatic Free plan creation on signup, session management, route protection.
- **Dashboard**: KPI cards (revenue, clients, charges), recent charges table, trend indicators.
- **Client Management**: List clients, CRUD operations (create, read, update, activate/deactivate), client details.
- **Client Plans Management**: Create and manage service plans for clients (VALOR_FIXO, PACOTE, VALOR_VARIAVEL), CRUD operations, dynamic form fields.
- **Charge Management**: Complete CRUD operations for charges, create standalone charges, list charges with Supabase integration, dynamic status calculation (EM_ABERTO, VENCIDO, PAGO, CANCELADO, FALHOU), comprehensive filters, dynamic totalizers, actions on charges (view details, send via WhatsApp, mark as paid manually, cancel).
- **Subscription Management** (Complete Flow):
  - **Page Structure**: Two tabs (Plano Atual, Histórico) with automatic 30s polling
  - **Ativa**: Display current plan with "Mudar Plano" and "Cancelar Assinatura" actions
  - **Pendente (AGUARDANDO_PAGAMENTO)**: Alert showing plan, value, due date, and "Pagar Agora" + "Cancelar" actions
  - **Suspensa**: Alert with "Renovar Agora" action (creates new pending subscription)
  - **Sem Assinatura**: Call-to-action to choose plan
  - **Histórico**: Lists all subscriptions (including CANCELADAS) with status badges
  - **Actions Implemented**:
    - Pagar Pendente → Opens payment modal with PIX options
    - Mudar Plano → Opens plan selection modal, validates data, creates pending subscription
    - Cancelar Ativa/Pendente → Opens cancellation modal (backend function pending)
    - Renovar (when Suspensa) → Opens plan selection modal
  - **Business Rules Enforced**:
    - Maximum 1 AGUARDANDO_PAGAMENTO subscription per user
    - Coexistence of ATIVA + PENDENTE allowed (upgrade/renewal scenario)
    - Payment activation cancels previous ATIVA subscription
    - Validity projection based on previous non-free subscription
- **Profile**: Complete integration with Supabase RPCs (`obter_dados_assinante`, `atualizar_dados_assinante`), real-time data loading, CNPJ-only validation, fields (Razão Social, Nome Fantasia, CNPJ, Email, WhatsApp, full address), Brazilian masks, loading states and error handling.

### System Design Choices
- **Onboarding Flow** (Detailed):
  1. User signs up/logs in via Supabase Auth
  2. Frontend calls `processar_pos_login(p_nome?, p_whatsapp?)`
  3. Backend returns status: "OK", "ERROR", or "SEM ASSINATURA"
  4. **First Access (user doesn't exist)**:
     - If nome/whatsapp not provided → ERROR with code USER_NOT_FOUND_MISSING_DATA
     - Frontend shows onboarding form to collect data
     - If provided → Creates assinante, usuario, roles (ADMIN + PROFISSIONAL), and FREE subscription
  5. **Navigation Logic**:
     - status="OK" + assinatura.status=ATIVA → Dashboard
     - status="OK" + assinatura.status=AGUARDANDO_PAGAMENTO → Subscription page (payment link)
     - status="OK" + assinatura.status=SUSPENSA → Subscription page (renewal)
     - status="OK" + assinatura.status=CANCELADA → Subscription page (new plan)
     - status="SEM ASSINATURA" → Subscription page (plan selection)
     - status="ERROR" + code=USER_NOT_FOUND_MISSING_DATA → Onboarding form
  6. Free subscription is automatically created with validity = today + dias_degustacao
- **Data Formatting**: Cadastral data is unformatted before backend transmission and formatted for frontend display.
- **Form Protection**: User input in critical forms is protected against accidental resets.
- **Business Rule**: The system exclusively supports Pessoa Jurídica (CNPJ).
- **Edge Functions**: All Supabase Edge Function calls use `supabase.functions.invoke()` for automatic URL resolution, authentication header injection, and consistent error handling.
- **Subscription Business Rules**:
  - **Coexistence**: Can have one ATIVA and one PENDENTE subscription simultaneously (upgrade/renewal scenario)
  - **Activation by Payment**: When payment is confirmed, PENDENTE becomes ATIVA and previous ATIVA is cancelled
  - **Validity Projection**: 
    - If there's ATIVA non-free subscription: new validity = old.data_validade + period
    - If there's ATIVA free or no subscription: new validity = today + period
  - **Subscription Creation**: User can create new subscription anytime (expired free or not)
  - **Cancellation**: User can cancel ATIVA or PENDENTE; when cancelling PENDENTE, associated charge is also cancelled
  - **Suspensa**: Occurs when subscription expires; user can start new cycle creating PENDENTE + charge
  - **Idempotency**: Webhook must be idempotent (repeated calls return 200 without side effects)

## External Dependencies
- **Supabase**: Authentication (email/password, Google OAuth) and PostgreSQL database.
- **Pluggy**: Automatic PIX payments and webhook-based status updates for subscriptions.
- **Vite**: Frontend build tool.
- **TanStack Query**: Data fetching and state management.
- **shadcn/ui**: UI component library.
- **Tailwind CSS**: Utility-first CSS framework.