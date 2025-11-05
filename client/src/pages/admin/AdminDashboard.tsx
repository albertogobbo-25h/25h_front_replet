import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, TrendingUp, DollarSign } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminDashboard() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Dashboard Administrativo
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do sistema e métricas gerais
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-total-assinantes">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Assinantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-assinantes">-</div>
              <p className="text-xs text-muted-foreground">
                Contas ativas no sistema
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-assinaturas-ativas">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-assinaturas-ativas">-</div>
              <p className="text-xs text-muted-foreground">
                Planos pagos ativos
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-mrr">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-mrr">R$ 0,00</div>
              <p className="text-xs text-muted-foreground">
                Receita Recorrente Mensal
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-crescimento">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-crescimento">+0%</div>
              <p className="text-xs text-muted-foreground">
                Novos assinantes este mês
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card data-testid="card-info-sistema">
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Versão:</span>
                <span className="text-sm font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ambiente:</span>
                <span className="text-sm font-medium">Produção</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Última atualização:</span>
                <span className="text-sm font-medium">Hoje</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-acoes-rapidas">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Use o menu lateral para acessar:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Gerenciamento de assinantes</li>
                <li>Configuração de planos</li>
                <li>Relatórios e métricas</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
