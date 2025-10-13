# Design Guidelines - Sistema 25h

## Visão Geral
Sistema de gestão de cobranças com PIX automático, focado em profissionais autônomos e pequenas empresas. O design segue princípios de Material Design adaptados para uma aplicação B2B SaaS de gestão financeira.

## Identidade Visual

### Logo
- **Marca**: "25h" em branco sobre fundo escuro
- **Conceito**: +1 hora no dia, representando economia de tempo
- **Tagline**: "Mais Dinheiro no Bolso"

### Paleta de Cores

#### Cores Primárias
- **Primary Blue**: `hsl(217, 91%, 60%)` - #3B82F6
  - Cor principal do sistema
  - Usado em CTAs, links e elementos interativos
  - Transmite confiança e profissionalismo (essencial para aplicações financeiras)

#### Cores de Superfície
- **Background Light**: `hsl(0, 0%, 100%)` - Branco puro
- **Card Light**: `hsl(0, 0%, 100%)` - Mesmo que background para look limpo
- **Muted Light**: `hsl(210, 40%, 96%)` - Cinza muito claro

- **Background Dark**: `hsl(222, 47%, 11%)` - Azul escuro profundo
- **Card Dark**: `hsl(217, 33%, 17%)` - Azul escuro elevado
- **Muted Dark**: `hsl(217, 33%, 20%)` - Azul escuro levemente elevado

#### Cores Semânticas
- **Success**: `hsl(142, 76%, 36%)` - Verde para pagamentos confirmados
- **Warning**: `hsl(38, 92%, 50%)` - Amarelo para cobranças pendentes
- **Destructive**: `hsl(0, 84%, 60%)` - Vermelho para falhas e cancelamentos
- **Info**: `hsl(199, 89%, 48%)` - Azul informativo

### Tipografia

#### Fontes
- **Sans-serif**: Inter (UI, texto geral)
  - Weights: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
  - Usada para interface, títulos, labels, botões
  
- **Monospace**: Roboto Mono (valores financeiros)
  - Weights: 400 (regular), 500 (medium), 600 (semibold)
  - Usada exclusivamente para valores monetários, datas, CPF/CNPJ, códigos

#### Hierarquia
- **H1**: 3xl (30px) - Títulos principais de página
- **H2**: 2xl (24px) - Seções principais
- **H3**: xl (20px) - Subsections
- **Body**: base (16px) - Texto padrão
- **Small**: sm (14px) - Legendas e labels
- **XSmall**: xs (12px) - Metadados e informações terciárias

#### Cores de Texto
- **Foreground**: Texto principal (preto escuro / branco claro)
- **Muted Foreground**: Texto secundário com 60% de opacidade
- **Tertiary**: Informações terciárias (não implementado, usar muted-foreground)

## Componentes

### Cartões KPI (Dashboard)
- **Estrutura**: CardHeader com ícone + título, CardContent com valor grande
- **Valores**: Sempre em Roboto Mono, bold, tamanho 2xl
- **Ícones**: Lucide React, 16x16px, cor muted-foreground
- **Trend**: Indicadores com ↑/↓ em verde/vermelho

### Tabelas
- **Header**: Background muted, texto semibold
- **Rows**: Hover elevate sutil
- **Células financeiras**: Roboto Mono para valores
- **Actions**: Botões ghost icon-only alinhados à direita

### Badges de Status
- **EM_ABERTO**: Variant default (azul)
- **PAGO**: Variant secondary (verde/cinza)
- **CANCELADO**: Variant outline (cinza)
- **FALHOU**: Variant destructive (vermelho)

### Formulários
- **Labels**: Sempre acima do campo, texto sm, semibold
- **Inputs**: Border sutil, focus ring primary
- **Máscaras**: WhatsApp (XX) XXXXX-XXXX, CPF/CNPJ formatados
- **Validation**: Mensagens de erro abaixo do campo em destructive

### Sidebar
- **Width**: 16rem (256px)
- **Background**: Sidebar color (ligeiramente elevada do background)
- **Items**: SidebarMenuButton com ícone + texto
- **Active**: Background sidebar-accent
- **Footer**: User avatar + nome + email + botão logout

### Botões
- **Primary**: Background primary, hover elevate
- **Secondary**: Background secondary, hover elevate
- **Outline**: Border + transparent bg, hover elevate
- **Ghost**: Transparent, hover elevate (usado em tabelas)
- **Icon**: 36x36px quadrado

## Layout

### Estrutura Principal
- **Sidebar**: Fixa à esquerda, 256px
- **Header**: Barra superior com SidebarTrigger + ThemeToggle
- **Main**: Content area com padding 32px, scrollable
- **Max-width**: Nenhum (full-width para aproveitar espaço)

### Espaçamento
- **Small**: 1rem (16px) - Entre elementos relacionados
- **Medium**: 1.5rem (24px) - Entre seções de um card
- **Large**: 2rem (32px) - Entre cards/componentes principais

### Grid
- **Dashboard KPIs**: 4 colunas em desktop, 2 em tablet, 1 em mobile
- **Plan Cards**: 3 colunas em desktop, 1 em mobile
- **Forms**: 2 colunas para campos relacionados

## Interações

### Estados
- **Hover**: Brightness elevation (+5% light / +10% dark)
- **Active**: Brightness elevation (+10% light / +25% dark)
- **Focus**: Ring primary, offset 2px
- **Disabled**: Opacity 50%, cursor not-allowed

### Animações
- **Transitions**: 200ms ease para hover, 100ms para active
- **Accordion**: 200ms ease-out
- **Page transitions**: Sem animações (navegação instantânea)

## Acessibilidade

### Contraste
- Todas as combinações de cores atendem WCAG AA (4.5:1)
- Primary text sobre background: ✓
- Muted text sobre background: ✓
- White text sobre primary: ✓

### Navegação
- Todos os botões têm `data-testid` para testes
- Labels associadas a inputs via htmlFor
- Sidebar navegável por teclado

### Dark Mode
- Toggle sempre visível no header
- Persistido em localStorage
- Cores ajustadas para manter contraste adequado

## Localização (pt-BR)

### Formatação
- **Moeda**: R$ 1.234,56 (ponto para milhar, vírgula para decimal)
- **Data**: DD/MM/YYYY (01/01/2024)
- **WhatsApp**: (XX) XXXXX-XXXX
- **CPF**: XXX.XXX.XXX-XX
- **CNPJ**: XX.XXX.XXX/XXXX-XX

### Mensagens
- "Bem-vindo" → "1 hora a mais no seu dia"
- Preferência por linguagem direta e objetiva
- Tom profissional mas acolhedor

## Princípios de Design

1. **Clareza sobre estilo**: Informação primeiro, decoração depois
2. **Consistência**: Mesmo padrão em toda a aplicação
3. **Feedback imediato**: Loading states, success/error messages
4. **Mobile-first responsivo**: Funciona bem em todos os tamanhos
5. **Eficiência**: Minimizar cliques para tarefas comuns
6. **Confiança**: Design profissional para lidar com dinheiro

## Componentes Futuros (não implementados)

- [ ] Gráficos de faturamento (Recharts)
- [ ] Timeline de pagamentos
- [ ] Notifications/Toasts customizados
- [ ] Data pickers brasileiros
- [ ] Upload de documentos/anexos
- [ ] Multi-step wizards para onboarding complexo
