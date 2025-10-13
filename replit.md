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
- **Authentication**: Login/Signup (email/password, Google OAuth), onboarding with name and WhatsApp, session management, route protection.
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