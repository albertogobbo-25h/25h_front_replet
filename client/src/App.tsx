import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import AppSidebar from "@/components/AppSidebar";
import OnboardingForm from "@/components/OnboardingForm";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Clientes from "@/pages/Clientes";
import PlanosCliente from "@/pages/PlanosCliente";
import AssinaturasClientes from "@/pages/AssinaturasClientes";
import Cobrancas from "@/pages/Cobrancas";
import MinhaAssinatura from "@/pages/Assinatura";
import Perfil from "@/pages/Perfil";
import TemplatesWhatsApp from "@/pages/TemplatesWhatsApp";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminAssinantes from "@/pages/admin/AdminAssinantes";
import AdminPlanos from "@/pages/admin/AdminPlanos";
import PagamentoPublico from "@/pages/PagamentoPublico";
import AssinarPublico from "@/pages/AssinarPublico";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  const { user, loading, isAdmin } = useAuth();
  
  // Rotas públicas que não precisam de autenticação
  if (location.startsWith('/publico/pagar/') || location.startsWith('/pagar')) {
    return <PagamentoPublico />;
  }
  
  if (location.startsWith('/publico/assinar/') || location.startsWith('/assinar/')) {
    return <AssinarPublico />;
  }
  
  // Verificar se precisa de onboarding (usuário não tem nome salvo)
  const needsOnboarding = user && !user.user_metadata?.onboarding_completed;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (needsOnboarding) {
    return <OnboardingForm />;
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar isAdmin={isAdmin} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-8">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/clientes" component={Clientes} />
              <Route path="/planos" component={PlanosCliente} />
              <Route path="/assinaturas" component={AssinaturasClientes} />
              <Route path="/cobrancas" component={Cobrancas} />
              <Route path="/minha-assinatura" component={MinhaAssinatura} />
              <Route path="/assinatura" component={MinhaAssinatura} />
              <Route path="/templates-whatsapp" component={TemplatesWhatsApp} />
              <Route path="/perfil" component={Perfil} />
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/admin/assinantes" component={AdminAssinantes} />
              <Route path="/admin/planos" component={AdminPlanos} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
