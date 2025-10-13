# Sistema 25h.com.br - Gestão de Cobranças

## Visão Geral
Sistema SaaS de gestão de cobranças com PIX automático via Pluggy. Desenvolvido para profissionais autônomos e pequenas empresas no Brasil.

**Tagline**: "1 hora a mais no seu dia. Mais Dinheiro no Bolso."

## Status do Projeto
**Fase Atual**: Autenticação Completa + Protótipo Visual
- ✅ UI/UX completo implementado
- ✅ Componentes reutilizáveis criados
- ✅ Navegação SPA funcional (Wouter)
- ✅ Dark mode implementado
- ✅ Localização brasileira (R$, WhatsApp, datas)
- ✅ **Autenticação Supabase integrada**
  - ✅ Login email/senha
  - ✅ Signup email/senha
  - ✅ Google OAuth (UI pronta)
  - ✅ Onboarding com metadados
  - ✅ Proteção de rotas
  - ✅ Navegação sem page reload
- 🔄 Backend CRUD pendente (próxima fase)

## Arquitetura

### Stack Tecnológica
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js (a ser implementado)
- **Autenticação**: Supabase (email/password + Google OAuth)
- **Banco de Dados**: PostgreSQL via Supabase
- **Pagamentos**: Pluggy (PIX automático)
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Routing**: Wouter
- **State Management**: TanStack Query v5

### Estrutura de Pastas
```
client/src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # shadcn components
│   ├── examples/       # Exemplos de uso dos componentes
│   ├── AppSidebar.tsx
│   ├── StatusBadge.tsx
│   ├── DashboardKPICard.tsx
│   ├── ClienteTable.tsx
│   ├── CobrancaTable.tsx
│   ├── OnboardingForm.tsx
│   └── PlanCard.tsx
├── pages/              # Páginas da aplicação
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Clientes.tsx
│   ├── Cobrancas.tsx
│   ├── Assinatura.tsx
│   └── Perfil.tsx
├── contexts/           # React contexts
│   ├── ThemeContext.tsx
│   └── AuthContext.tsx  # Supabase Auth integration
├── lib/               # Utilitários e configurações
│   ├── queryClient.ts
│   ├── supabase.ts
│   └── masks.ts       # Máscaras brasileiras (WhatsApp, CPF, etc)
└── App.tsx            # Root component

server/
├── index.ts           # Express server
└── (estrutura pendente)
```

## Funcionalidades Implementadas (UI)

### Autenticação (✅ COMPLETA)
- [x] Login com email/senha (Supabase Auth)
- [x] Signup com email/senha (Supabase Auth)
- [x] Login com Google OAuth (integrado)
- [x] Onboarding com nome e WhatsApp
- [x] Salvamento em user_metadata (Supabase)
- [x] Session management com listeners
- [x] Proteção de rotas via AuthContext
- [x] Logout funcional

### Dashboard
- [x] KPI cards (Faturamento, Clientes, Cobranças)
- [x] Tabela de cobranças recentes
- [x] Indicadores de tendência

### Gestão de Clientes
- [x] Listagem com filtros (busca, status)
- [x] Tabela com ações (editar, excluir)
- [x] Formatação de WhatsApp

### Gestão de Cobranças
- [x] Listagem com filtros (status, período)
- [x] Cards de totais (Em Aberto, Recebido, Geral)
- [x] Tabela com status badges
- [x] Ações por cobrança (visualizar, enviar)

### Assinatura
- [x] Visualização do plano atual
- [x] Cards de upgrade de plano
- [x] Informações de periodicidade e validade

### Perfil
- [x] Formulário de dados pessoais
- [x] Endereço completo (opcional)
- [x] Máscaras brasileiras (WhatsApp, CPF/CNPJ, CEP)

### Sistema
- [x] Sidebar com navegação
- [x] Dark mode com persistência
- [x] Responsive design (mobile-first)
- [x] Localização pt-BR completa

## Design System

### Cores
- **Primary**: `hsl(217, 91%, 60%)` - Azul profissional (confiança financeira)
- **Success**: `hsl(142, 76%, 36%)` - Verde (pagamento confirmado)
- **Warning**: `hsl(38, 92%, 50%)` - Amarelo (pendente)
- **Destructive**: `hsl(0, 84%, 60%)` - Vermelho (falhou/cancelado)

### Tipografia
- **Sans**: Inter (UI geral)
- **Mono**: Roboto Mono (valores financeiros, datas, códigos)

### Componentes Principais
- `DashboardKPICard`: Card de métrica com ícone, valor e trend
- `StatusBadge`: Badge colorido para status de pagamento
- `ClienteTable`: Tabela de clientes com ações
- `CobrancaTable`: Tabela de cobranças com formatação monetária
- `AppSidebar`: Navegação lateral com menu admin condicional
- `PlanCard`: Card de plano com features e CTA

Ver `design_guidelines.md` para detalhes completos.

## Autenticação Real (Supabase)

### Fluxo de Autenticação
1. **Signup**:
   - Usuário preenche email/senha no Login.tsx
   - `signUp()` cria conta no Supabase Auth
   - AuthContext detecta user sem `onboarding_completed`
   - Exibe OnboardingForm
   - Salva nome e WhatsApp em `user.user_metadata`
   - Marca `onboarding_completed = true`
   - Redireciona para Dashboard

2. **Login**:
   - Usuário preenche email/senha
   - `signInWithPassword()` autentica via Supabase
   - AuthContext verifica `onboarding_completed`
   - Se completo → Dashboard
   - Se não → OnboardingForm

3. **Google OAuth**:
   - Botão "Continuar com Google" no Login
   - `signInWithOAuth({ provider: 'google' })`
   - Redireciona para OAuth flow do Google
   - Retorna autenticado
   - Verifica onboarding (igual fluxo normal)

4. **Session Management**:
   - `supabase.auth.getSession()` no mount
   - Listener `onAuthStateChange()` detecta mudanças
   - Session persiste via localStorage (Supabase)
   - Logout: `signOut()` limpa session

### Usuário Atual (Real)
```typescript
// Vem do Supabase User object
{
  id: string; // UUID do Supabase
  email: string;
  user_metadata: {
    nome?: string;
    whatsapp?: string;
    onboarding_completed?: boolean;
  }
}
```

### Admin Mode
- Flag `isAdmin` no App.tsx controla visibilidade do menu admin
- Menu admin: Dashboard Admin, Assinantes, Planos

## Máscaras Implementadas

### WhatsApp
- **Formato**: `(XX) XXXXX-XXXX`
- **Função**: `formatWhatsApp()` em `lib/masks.ts`
- **Uso**: OnboardingForm, Perfil

### Outras (a implementar)
- CPF: `XXX.XXX.XXX-XX`
- CNPJ: `XX.XXX.XXX/XXXX-XX`
- CEP: `XXXXX-XXX`

## Integrações Configuradas

### Supabase (✅ COMPLETA)
- **Status**: Autenticação integrada e funcional
- **Arquivos**:
  - `client/src/lib/supabase.ts` - Cliente Supabase
  - `client/src/contexts/AuthContext.tsx` - Context + hooks
- **Variáveis configuradas**:
  - ✅ `VITE_SUPABASE_URL`
  - ✅ `VITE_SUPABASE_ANON_KEY`
- **Funcionalidades**:
  - ✅ Email/password auth
  - ✅ Google OAuth
  - ✅ Session persistence
  - ✅ User metadata storage
  - ✅ Auth state listeners

### Pluggy (Pendente)
- Integração PIX automática
- Webhooks para atualização de status
- Geração de QR Code e link de pagamento

## Próximas Etapas

### Backend (Prioridade Alta)
- [x] ~~Setup Supabase auth real~~ ✅ COMPLETO
- [ ] Implementar schema do banco (baseado em SCHEMA_PRISMA)
- [ ] Criar tabelas no Supabase (clientes, cobranças, assinantes)
- [ ] RPC `processar_pos_login` (verificar/criar assinante)
- [ ] APIs REST para CRUD de clientes
- [ ] APIs REST para CRUD de cobranças

### Integração Pluggy
- [ ] Setup credenciais Pluggy
- [ ] Endpoint de criação de cobrança PIX
- [ ] Webhook para atualização de status
- [ ] Fluxo de pagamento completo

### Features Faltantes
- [ ] Painel administrativo completo
- [ ] Gestão de múltiplos usuários (assinante)
- [ ] Relatórios e gráficos
- [ ] Exportação de dados
- [ ] Notificações WhatsApp (via Twilio/outras)

### Melhorias UI/UX
- [ ] Skeleton loaders
- [ ] Error boundaries
- [ ] Validação de formulários com Zod
- [ ] Toast notifications customizados
- [ ] Confirmação de ações destrutivas

## Arquivos Importantes

### Documentação
- `design_guidelines.md`: Design system completo
- `attached_assets/PRD 25h_*.txt`: Product Requirements Document
- `attached_assets/SCHEMA_PRISMA_*.md`: Schema do banco de dados
- `attached_assets/GUIA_FRONTEND_API_*.md`: Guia de integração frontend/backend

### Autenticação
- `client/src/contexts/AuthContext.tsx`: Context + hooks de autenticação
- `client/src/lib/supabase.ts`: Cliente Supabase configurado
- `client/src/pages/Login.tsx`: Página de login/signup
- `client/src/components/OnboardingForm.tsx`: Coleta dados pós-signup

### Configuração
- `tailwind.config.ts`: Configuração do Tailwind com cores do design system
- `client/index.html`: Meta tags e fonts
- `client/src/index.css`: CSS global com variáveis de cores

### State Management
- `client/src/lib/queryClient.ts`: TanStack Query setup
- `client/src/contexts/ThemeContext.tsx`: Dark/light mode

## Notas de Desenvolvimento

### Convenções
- **Mock data**: Todos os dados mock têm comentário `// TODO: Remove mock data`
- **Test IDs**: Todos os elementos interativos têm `data-testid` para testes E2E
- **Formatação**: Valores monetários sempre em `Roboto Mono` + `formatCurrency()`
- **Datas**: Sempre formatadas em pt-BR (`DD/MM/YYYY`)

### Performance
- TanStack Query v5 para cache de dados
- HMR configurado para desenvolvimento rápido
- Code splitting por rota (pendente)

### Acessibilidade
- Labels sempre visíveis (não usar placeholder como label)
- Contraste WCAG AA em todas as cores
- Focus indicators em todos os controles
- Touch targets mínimos 44x44px

## Secrets Necessários
- `DATABASE_URL`: PostgreSQL connection string (✅ configurado)
- `SESSION_SECRET`: Express session secret
- `VITE_SUPABASE_URL`: URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave pública Supabase
- Pluggy credentials (futuro)

## Comandos Úteis

### Desenvolvimento
```bash
npm run dev          # Inicia frontend + backend
npm run build        # Build de produção
npm run preview      # Preview do build
```

### Banco de Dados (quando implementado)
```bash
npm run db:generate  # Gera migrations
npm run db:migrate   # Aplica migrations
npm run db:studio    # Abre Drizzle Studio
```

## Links Úteis
- [Pluggy Docs](https://docs.pluggy.ai/)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/latest)

---

**Última Atualização**: 13/10/2025
**Versão**: 0.2.0 (Autenticação Completa)
