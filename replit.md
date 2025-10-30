# Sistema 25h.com.br - Gestão de Cobranças

## Overview
Sistema SaaS de gestão de cobranças com PIX automático via Pluggy, desenvolvido para profissionais autônomos e pequenas empresas no Brasil. O projeto visa otimizar a gestão financeira dos usuários, economizando tempo e aumentando a rentabilidade. A plataforma oferece funcionalidades completas de autenticação, gestão de assinaturas, clientes e cobranças. A plataforma é exclusiva para Pessoa Jurídica (CNPJ).

## Recent Changes (October 30, 2025)
- **Unified API Response Pattern Implementation**:
  - Created `lib/api-helper.ts` with `callSupabase()` helper and `ApiError` class
  - Migrated all RPC and Edge Functions calls to use unified error handling
  - Standardized response format: `{status: "OK"|"ERROR", message: string, data: any}`
  - Helper automatically extracts `data` from successful responses
  - Throws `ApiError` with code, message, and details for all failures
  - Improved error messages and type safety across all API calls
  - Migrated files: AuthContext, Perfil, Assinatura, PlanosCliente, OnboardingForm, ModalPlanoCliente, ModalDadosCadastrais
  - Benefits: Consistent error handling, better UX with clear error messages, easier debugging
- **Enhanced Error Logging and Diagnostics**:
  - Added function name tracking to all callSupabase() calls for better debugging
  - Implemented detailed error logging with full error context, hints, and details
  - Added specific error messages for Edge Function failures
  - Errors now clearly identify which function failed and provide actionable guidance
  - Example: "Edge Function 'iniciar_pagto_assinante' não está acessível. Verifique se a função está deployada no Supabase."
- **TypeScript Type Safety Improvements**:
  - Fixed all LSP diagnostics in Assinatura.tsx (5 errors resolved)
  - Added proper type annotations to Assinatura[] query
  - Improved type inference across all API calls

## Previous Changes (October 16, 2025)
- **Date Formatting Null Safety Fix**:
  - Fixed runtime error "Cannot read properties of undefined (reading 'split')"
  - Added null/undefined validation to formatDate() function
  - Now returns '-' for empty/null dates instead of crashing
  - Prevents errors when database records have null date fields
- **Profile Page Bug Fix**:
  - Added queryClient.invalidateQueries() to force data reload after saving
  - Implemented automatic navigation to dashboard after profile save
  - Fixed issue where address data wasn't reloading when returning to profile page
- **Subscription Page UX Improvements**:
  - Increased status badge size by 50% for better visibility
  - Added "Status:" label next to badge for clarity
  - Reorganized CardHeader layout to give more prominence to subscription status
  - Improved visual hierarchy in subscription details card
- **Date Formatting Timezone Fix**:
  - Fixed bug where dates from database (e.g., 16/10) appeared as one day less (15/10) on screen
  - Root cause: JavaScript Date constructor converting UTC midnight to local timezone (UTC-3 Brazil)
  - Solution: Parse dates without timezone conversion for date-only strings
- **Login/Onboarding Navigation Fix**:
  - Fixed bug where users were redirected to last visited page (e.g., /assinatura) after login
  - Changed OnboardingForm to explicitly navigate to '/' (dashboard) using wouter's setLocation
  - Removed window.location.reload() which maintained current URL
- **Payment URL Handling Improvements**:
  - Added comprehensive logging for Edge Function iniciar_pagto_assinante responses
  - Implemented fallback checks for multiple possible payment URL fields (paymentUrl, qrCodeUrl, pixUrl, url)
  - Added warning toast when payment is processed but no URL is found for PIX Imediato
  - Helps diagnose differences between PIX Automático and PIX Imediato responses

## Previous Changes (October 14, 2025)
- **Fixed Client Registration Error**: Updated all Supabase queries to use app_data schema for multi-tenancy support
- **Enhanced AuthContext**: Added assinante_id fetching via obter_dados_assinante() RPC
- **Complete Profile Implementation**: 
  - Integrated with obter_dados_assinante() and atualizar_dados_assinante() RPCs
  - Added Nome Fantasia field
  - Removed "Tipo de Pessoa" (always JURIDICA)
  - Implemented CNPJ and CEP masks
  - Real-time data loading and saving with proper error handling
- **Multi-tenancy Support**: All cliente and cliente_cobranca queries now properly use app_data schema
- **Subscription Cancellation via Edge Function**:
  - Integrated with Supabase Edge Function `cancelar_assinatura`
  - Added optional cancellation reason field in ModalCancelamento
  - Uses `supabase.functions.invoke()` for standardized Edge Function calls
  - Automatic Pluggy integration for payment cancellation (fire-and-forget)
  - Complete error handling and user feedback

## User Preferences
I prefer simple language and clear, concise explanations. I want iterative development with frequent, small updates. Ask for my confirmation before making any major architectural changes or implementing new features. Ensure all new code adheres to the existing coding style and uses Brazilian Portuguese localization where applicable. Do not make changes to files or folders unless explicitly instructed.

## System Architecture

### UI/UX Decisions
- **Color Scheme**: Professional blue (`hsl(217, 91%, 60%)`) as primary, with distinct colors for success, warning, and destructive actions.
- **Typography**: Inter for general UI, Roboto Mono for financial values and dates.
- **Components**: Utilizes `shadcn/ui` for standardized components like `DashboardKPICard`, `StatusBadge`, `ClienteTable`, `CobrancaTable`, `AppSidebar`, `PlanCard`, `ModalCliente`, `ModalPlanoCliente`, and `ModalCobranca`.
- **Localization**: Full Brazilian Portuguese (R$, WhatsApp masks, date formats, currency formatting).
- **Design Principles**: Mobile-first responsive design, Dark mode support, Accessibility (WCAG AA contrast, visible labels, focus indicators).

### Technical Implementations
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Wouter for routing, TanStack Query v5 for state management.
- **Authentication**: Supabase (email/password, Google OAuth, session management, user metadata for onboarding, assinante_id in AuthContext).
- **Subscription Management**: Complete flow including plan selection, cadastral data validation, Pluggy PIX payment integration, conditional statuses, automatic polling, upgrade, and cancellation flows.
- **Data Management**: 
  - Supabase PostgreSQL with multi-tenancy (app_data schema)
  - RLS policies using app_internal.current_assinante_id() for tenant isolation
  - All queries use .schema('app_data') for proper schema access
- **API Response Pattern**: 
  - Unified helper `callSupabase()` in `lib/api-helper.ts` for all RPC/Edge Functions
  - Consistent error handling with `ApiError` class (code, message, details)
  - All backend responses follow `{status, message, data}` format
  - Frontend automatically receives normalized data (no need to check status or unwrap .data)
  - Usage: `const result = await callSupabase(async () => await supabase.rpc('function_name', params))`
- **Masks**: Brazilian masks implemented for WhatsApp, CNPJ, CEP.
- **Testing**: `data-testid` attributes are extensively used for E2E testing with Playwright.

### Feature Specifications
- **Authentication**: Login/Signup, onboarding with name and WhatsApp, automatic Free plan creation on signup, session management, route protection.
- **Dashboard**: KPI cards (revenue, clients, charges), recent charges table, trend indicators.
- **Client Management**: 
  - List clients with filters (name, status: active/inactive)
  - CRUD operations: create, read, update, activate/deactivate
  - Client details: name, display name, WhatsApp (formatted), observation
  - ModalCliente component with form validation and WhatsApp masking
- **Client Plans Management**:
  - Create and manage service plans for clients
  - Three plan types with dynamic fields:
    - VALOR_FIXO: Fixed recurring value with periodicity (monthly/quarterly/semi-annual/annual)
    - PACOTE: Pre-paid package with fixed value and service quantity (non-recurring)
    - VALOR_VARIAVEL: Variable value per service with periodicity
  - Full CRUD operations: create, update, activate/deactivate, delete
  - Plan details: name, description, type, values, quantity, periodicity
  - ModalPlanoCliente with dynamic form fields based on plan type
  - Integrated with Supabase RPCs: criar_cliente_plano, atualizar_cliente_plano, listar_cliente_planos, desativar_cliente_plano, reativar_cliente_plano, excluir_cliente_plano
- **Charge Management**:
  - Complete CRUD operations for charges
  - Create standalone charges (ModalCobranca)
  - List charges with Supabase integration (cliente_cobranca table with cliente join)
  - Dynamic status calculation: EM_ABERTO, VENCIDO (based on due date), PAGO, CANCELADO, FALHOU
  - Comprehensive filters:
    - Status filter (all, open, paid, canceled, failed)
    - Period filter (current month, last 3/6/12 months)
  - Dynamic totalizers (aggregations):
    - Total Open (in BRL with count)
    - Total Overdue (in BRL with count)
    - Total Received (in BRL with count)
    - Grand Total (in BRL with count)
  - Actions on charges:
    - View details (full dialog with all charge information)
    - Send via WhatsApp (placeholder integration)
    - Mark as paid manually (admin action)
    - Cancel charge
  - CobrancaTable with actions and confirmation dialogs
  - Utility functions for status calculations and formatting
- **Subscription**: Display current plan, pending payment actions, plan selection modal (monthly/annual), cadastral data validation, PIX payment integration via Pluggy, automatic status polling, upgrade/renewal/cancellation flows.
- **Profile**: 
  - Complete integration with Supabase RPCs (obter_dados_assinante, atualizar_dados_assinante)
  - Real-time data loading with TanStack Query
  - CNPJ-only validation (Pessoa Jurídica exclusivo)
  - Fields: Razão Social, Nome Fantasia, CNPJ, Email, WhatsApp
  - Optional full address (Rua, Número, Complemento, Bairro, Cidade, UF, CEP)
  - Brazilian masks for CNPJ, CEP, and WhatsApp
  - Loading states and error handling with toasts

### System Design Choices
- **Onboarding**: Upon signup, users complete an onboarding form, and an automatic Free plan is created via a `processar_pos_login` RPC call.
- **Data Formatting**: All cadastral data (e.g., CNPJ, WhatsApp) is unformatted (numbers only) before being sent to the backend and formatted for display on the frontend.
- **Form Protection**: User input in critical forms like "Modal de Dados Cadastrais" is protected against accidental resets during re-renders or data loads by tracking user edits.
- **Business Rule**: The system exclusively supports Pessoa Jurídica (CNPJ), removing the "Tipo de Pessoa" selection and enforcing CNPJ-specific fields and validations.
- **Edge Functions**: All Supabase Edge Function calls use `supabase.functions.invoke()` method from the SDK instead of direct `fetch()` calls. This provides:
  - Automatic URL resolution (no environment variables needed)
  - Automatic authentication header injection
  - Consistent error handling
  - Example: `await supabase.functions.invoke('nome_funcao', { body: { ...params } })`

## External Dependencies
- **Supabase**: Used for authentication (email/password, Google OAuth) and as the PostgreSQL database.
- **Pluggy**: Integrated for automatic PIX payments and webhook-based status updates for subscriptions.
- **Vite**: Frontend build tool.
- **TanStack Query**: Data fetching and state management.
- **shadcn/ui**: UI component library.
- **Tailwind CSS**: Utility-first CSS framework.