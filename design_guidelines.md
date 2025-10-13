# Design Guidelines - Sistema 25h.com.br

## Design Approach

**Selected Approach**: Design System-Based (Material Design principles with SaaS refinements)
**Rationale**: Financial/billing management system requiring clarity, trust, and efficiency. Information-dense dashboards and tables benefit from established patterns and strong visual hierarchy.

## Core Design Principles

1. **Clarity First**: Financial data must be immediately scannable
2. **Trust & Professionalism**: Clean, modern aesthetic for B2B SaaS
3. **Brazilian Market Fit**: Portuguese language, Pix payment prominence, local business needs

## Color Palette

**Note**: Adapt these recommendations to match the provided logo once colors are extracted.

### Light Mode
- **Primary Brand**: 220 85% 55% (Professional blue - trust/finance)
- **Secondary/Accent**: 142 76% 36% (Success green for payment confirmations)
- **Background**: 0 0% 98% (Subtle warm gray)
- **Surface**: 0 0% 100% (Pure white cards)
- **Text Primary**: 220 15% 20% (Deep blue-gray)
- **Text Secondary**: 220 10% 45%

### Dark Mode
- **Primary Brand**: 220 85% 65% (Lighter blue for contrast)
- **Secondary/Accent**: 142 70% 45% (Vibrant green)
- **Background**: 220 15% 10% (Deep blue-black)
- **Surface**: 220 12% 15% (Elevated dark cards)
- **Text Primary**: 0 0% 95%
- **Text Secondary**: 0 0% 70%

### Semantic Colors
- **Success**: 142 76% 36% (Green - payment received)
- **Warning**: 38 92% 50% (Amber - pending payment)
- **Error**: 0 84% 60% (Red - failed/overdue)
- **Info**: 199 89% 48% (Cyan - neutral information)

## Typography

**Primary Font Family**: 'Inter' or 'Manrope' (clean, modern sans-serif via Google Fonts)
**Secondary Font Family**: 'Roboto Mono' (for financial values, codes, IDs)

### Type Scale
- **Display**: text-4xl font-bold (Dashboard headers)
- **H1**: text-3xl font-semibold (Page titles)
- **H2**: text-2xl font-semibold (Section headers)
- **H3**: text-xl font-medium (Card titles)
- **Body**: text-base (Standard content)
- **Small**: text-sm (Secondary info, labels)
- **Tiny**: text-xs (Metadata, timestamps)

### Financial Data
- Use `font-mono` for: Currency values, IDs, dates
- Bold weights for totals and key metrics

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 8, 12, 16** (e.g., p-4, gap-8, mb-12)

### Grid Structure
- **Dashboard**: 12-column grid (lg:grid-cols-12)
- **Data Tables**: Full-width with horizontal scroll on mobile
- **Forms**: Max-width 2xl (max-w-2xl) centered
- **Sidebar**: Fixed 64 (w-64) on desktop, overlay on mobile

### Container Patterns
- **Page Container**: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- **Card Spacing**: p-6 on desktop, p-4 on mobile
- **Section Gaps**: space-y-8 or gap-8

## Component Library

### Navigation
- **Sidebar (Desktop)**: Fixed left, dark background, icons + text
- **Top Bar**: Mobile hamburger menu, user profile, notifications
- **Breadcrumbs**: For deep navigation (Dashboard > Clientes > Detalhes)

### Data Display
- **Tables**: 
  - Striped rows (odd:bg-gray-50 dark:odd:bg-gray-800)
  - Sticky headers
  - Action column (right-aligned)
  - Mobile: Card-based layout with stacked data

- **Cards**:
  - Elevated shadow (shadow-sm hover:shadow-md)
  - Rounded corners (rounded-lg)
  - Border on light mode (border border-gray-200)

- **KPI Cards (Dashboard)**:
  - Large numeric value (text-3xl font-bold font-mono)
  - Icon indicator (top-right)
  - Trend arrow (up/down with color)
  - Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4

### Forms
- **Input Fields**: 
  - Consistent height (h-10)
  - Border with focus ring (focus:ring-2 focus:ring-primary)
  - Label above input (text-sm font-medium mb-1)

- **Buttons**:
  - Primary: Filled with brand color
  - Secondary: Outline (border-2)
  - Ghost: Transparent (text only)
  - Sizes: sm (h-8 px-3), md (h-10 px-4), lg (h-12 px-6)

### Status Indicators
- **Payment Status Badges**:
  - EM_ABERTO: Yellow/amber background
  - PAGO: Green background
  - CANCELADO: Gray background
  - FALHOU: Red background
  - Use: rounded-full px-3 py-1 text-xs font-medium

### Modals & Overlays
- **Modal**: Centered, max-w-2xl, backdrop blur (backdrop-blur-sm)
- **Drawer**: Side panel for filters/details (right-side slide)
- **Toast Notifications**: Top-right, auto-dismiss, color-coded by type

## Page-Specific Layouts

### Dashboard (Logado)
- **Hero Stats**: 4-column KPI grid (Cobranças, Faturamento, Clientes)
- **Charts Section**: 2-column layout (Revenue graph + Client distribution)
- **Recent Activity**: Table of latest 10 cobranças
- **Quick Actions**: Floating action button (bottom-right) for "Nova Cobrança"

### Cliente Management
- **List View**: 
  - Search bar + filters (top)
  - Table with: Nome, WhatsApp, Status, Ações
  - Pagination (bottom)
  - Empty state: Illustration + "Adicionar Primeiro Cliente"

### Cobranças
- **Filters Panel**: Collapsible left sidebar (desktop) or top drawer (mobile)
- **Status Overview**: Mini KPI cards showing count by status
- **Table Columns**: Cliente, Valor, Vencimento, Status, Ações
- **Bulk Actions**: Checkbox selection for multiple operations

### Onboarding Flow
- **Step Indicator**: Progress bar (top) showing 3 steps
- **Form Layout**: Centered card (max-w-md), single column
- **Plan Selection**: Card grid with hover elevation
- **Payment Screen**: Two-column (Payment details | QR Code/Link)

### Painel Administrativo
- **Full-width Layout**: No max-width constraint
- **Advanced Tables**: Sortable columns, inline editing
- **Assinante Details**: Tab navigation (Dados | Assinatura | Histórico)

## Icons

**Library**: Lucide React (via CDN or npm)
**Usage**:
- Navigation: 20px icons
- Buttons: 16px icons
- Status: 12px icons
- Illustrations: Use placeholder comments for custom SVGs

## Animations

**Minimal & Purposeful**:
- Page transitions: Fade-in (200ms)
- Hover states: Scale 1.02 on cards
- Loading: Spinner for async operations
- No decorative animations

## Images

**Usage**:
1. **Empty States**: Use illustrations for "No clients yet", "No charges"
2. **Logo**: Header placement (top-left in sidebar)
3. **User Avatars**: Circular, initials fallback
4. **No Hero Images**: Utility-focused app - prioritize data over imagery

## Accessibility

- Maintain WCAG AA contrast ratios
- All interactive elements: min 44x44px touch targets
- Form labels always visible (no placeholder-only)
- Dark mode toggle: Persistent across sessions
- Keyboard navigation: Focus indicators on all controls

## Responsive Breakpoints

- **Mobile**: < 768px (single column, card-based)
- **Tablet**: 768px - 1024px (2-column grids)
- **Desktop**: > 1024px (full layout with sidebar)

## Brazilian Localization

- Currency: Format as `R$ 1.234,56` (Brazilian real)
- Dates: dd/MM/yyyy format
- Phone: WhatsApp format `(11) 98765-4321`
- CPF/CNPJ: Proper masking `123.456.789-00` / `12.345.678/0001-90`