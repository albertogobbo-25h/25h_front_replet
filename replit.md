# Sistema 25h.com.br - Gestão de Cobranças

## Overview
Sistema SaaS de gestão de cobranças com PIX automático via Pluggy, desenvolvido para profissionais autônomos e pequenas empresas no Brasil. O projeto visa otimizar a gestão financeira dos usuários, economizando tempo e aumentando a rentabilidade. A plataforma oferece funcionalidades completas de autenticação, gestão de assinaturas, clientes e cobranças, e é exclusiva para Pessoa Jurídica (CNPJ).

## User Preferences
I prefer simple language and clear, concise explanations. I want iterative development with frequent, small updates. Ask for my confirmation before making any major architectural changes or implementing new features. Ensure all new code adheres to the existing coding style and uses Brazilian Portuguese localization where applicable. Do not make changes to files or folders unless explicitly instructed.

## System Architecture

### UI/UX Decisions
- **Color Scheme**: Professional blue (`hsl(217, 91%, 60%)`) as primary, with distinct colors for success, warning, and destructive actions.
- **Typography**: Inter for general UI, Roboto Mono for financial values and dates.
- **Components**: Utilizes `shadcn/ui` for standardized components.
- **Localization**: Full Brazilian Portuguese (R$, WhatsApp masks, date formats, currency formatting).
- **Design Principles**: Mobile-first responsive design, Dark mode support, Accessibility (WCAG AA contrast, visible labels, focus indicators).

### Technical Implementations
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Wouter for routing, TanStack Query v5 for state management.
- **Authentication**: Supabase (email/password, Google OAuth, session management, role-based access control).
- **Subscription Management**: Complete flow including plan selection, cadastral data validation, Pluggy PIX payment, automatic polling, upgrade, and cancellation.
- **Data Management**: Supabase PostgreSQL with multi-tenancy (app_data schema) and RLS policies for tenant isolation. All queries use `.schema('app_data')`.
- **API Response Pattern**: Unified helper `callSupabase()` for RPC/Edge Functions with consistent error handling (`ApiError`) and `{status, message, data}` format.
- **Masks**: Brazilian masks for WhatsApp, CNPJ, CEP.
- **CEP Autocomplete**: Uses ViaCEP API (`client/src/lib/cep.ts`) for address lookup. Implements debounce and race condition protection via useRef to prevent stale responses from overwriting user input.
- **Testing**: `data-testid` attributes used for E2E testing with Playwright.
- **Logout Security**: Complete cache clearing and state/localStorage cleanup.

### Feature Specifications
- **Authentication**: Login/Signup, onboarding, automatic Free plan, session management, route protection, role-based access control (ADMIN, PROFISSIONAL, CLIENTE).
- **Dashboard**: Real data integration via `useDashboard` hook. KPI cards show: Faturamento Mensal/Anual (sum of PAGO charges), Clientes Ativos/Inativos (from `listar_clientes`), Cobranças Geradas (current month total). Includes trend indicators (% variation vs previous period) and recent charges table. Loading/skeleton states and error handling.
- **Client Management**: Complete CRUD via Supabase RPCs, including validation, filtering, and WhatsApp message sending via template selection modal (Send button in actions column).
- **Client Plans Management**: CRUD for service plans (VALOR_FIXO, PACOTE, VALOR_VARIAVEL).
- **Client Subscriptions Management**: Complete CRUD for client subscriptions via Supabase RPCs. Includes listing with filters, create new subscription with client/plan selection (ModalNovaAssinatura), suspend, cancel, and reactivate actions. Handles API envelope pattern (OK/WARNING/ERROR) with duplicate subscription detection (ASSINATURA_DUPLICADA warning).
- **Charge Management**: Complete CRUD for charges via Supabase RPCs. Manual charge creation (ModalCobranca) is exclusively for standalone/avulsa charges not linked to subscriptions. Supports dynamic statuses, comprehensive filters, and actions (send via WhatsApp, mark paid, cancel, generate payment link).
- **Templates WhatsApp**: Complete CRUD for WhatsApp message templates with markdown support, placeholder extraction, and real-time preview.
- **WhatsApp Integration**: Send messages via Edge Function, template selection modal, automatic placeholder filling.
- **Admin Panel**: Protected routes for ADMIN role, dashboard, assinantes, and planos management.
- **Public Payment Page**: Unauthenticated page for clients to view charge details and select payment method (PIX Automático or PIX Imediato).
- **Public Subscription Page**: Unauthenticated page for clients to subscribe to plans. Features CEP autocomplete via ViaCEP API with debounced search. Address is mandatory for paid plans (valor_mensal > 0). Race condition protection ensures stale API responses don't overwrite user edits.
- **Subscription Management Flow**: Two tabs (Plano Atual, Histórico) with auto-polling, actions for plan changes, cancellation, renewal, and enforced business rules for subscription states and validity.
- **Profile**: Integration with Supabase RPCs for viewing/updating subscriber data (CNPJ-only validation, full address), including a **Bank Account (Recebedor)** section.
- **Bank Account Management (Recebedor)**: Complete flow for configuring bank accounts, including bank selection via ComboboxBanco, validation, and interception of client/charge creation until configured.

### System Design Choices
- **Public Routes**: `/publico/pagar/{uuid}` and `/publico/assinar/{plano_id}` bypass authentication using Supabase anon key for secure RPC calls. Legacy formats (`/pagar?c={uuid}`, `/assinar/{id}`) supported for backward compatibility.
- **Onboarding Flow**: Manages user creation, initial data collection, and navigation based on subscription status. Free subscription automatically created.
- **Data Formatting**: Cadastral data is unformatted for backend, formatted for frontend display.
- **Form Protection**: User input in critical forms protected against accidental resets.
- **Business Rule**: Exclusively supports Pessoa Jurídica (CNPJ).
- **Edge Functions**: All Supabase Edge Function calls use `supabase.functions.invoke()` for automatic resolution and authentication. Used for payment initiation, subscription cancellation, WhatsApp messages, and receiver management.
- **Cascaded Validation Pattern**: State machine in `useValidarRecebedor` hook ensures sequential validation of cadastral data and bank account before allowing client/charge creation.
- **Role Management**: User roles fetched via RPC `obter_funcoes_usuario` and used for conditional UI/route protection.
- **Subscription Business Rules**: Handles coexistence of ATIVA and PENDENTE subscriptions, activation by payment, validity projection, user-initiated cancellation, and idempotency for webhooks.

## External Dependencies
- **Supabase**: Authentication and PostgreSQL database.
- **Pluggy**: Automatic PIX payments and webhook-based status updates.
- **Vite**: Frontend build tool.
- **TanStack Query**: Data fetching and state management.
- **shadcn/ui**: UI component library.
- **Tailwind CSS**: Utility-first CSS framework.
- **react-markdown**: Markdown rendering.
- **remark-gfm**: GitHub Flavored Markdown support.