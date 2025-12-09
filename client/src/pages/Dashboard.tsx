import DashboardKPICard from "@/components/DashboardKPICard";
import CobrancaTable from "@/components/CobrancaTable";
import { DollarSign, Users, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/lib/masks";

function formatTrend(value: number | null): { value: string; isPositive: boolean } | undefined {
  if (value === null) return undefined;
  return {
    value: `${value >= 0 ? '+' : ''}${value}%`,
    isPositive: value >= 0
  };
}

function getMonthName(date: Date = new Date()): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function Dashboard() {
  const { kpis, cobrancasRecentes, loading, error, refetch } = useDashboard();
  const currentYear = new Date().getFullYear();
  const currentMonthName = capitalizeFirst(getMonthName());

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Erro ao carregar dados: {error}</span>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <DashboardKPICard
              title="Faturamento Mensal"
              value={formatCurrency(kpis.faturamentoMensal)}
              subtitle={currentMonthName}
              icon={DollarSign}
              trend={formatTrend(kpis.tendenciaMensal)}
              data-testid="card-faturamento-mensal"
            />
            <DashboardKPICard
              title="Faturamento Anual"
              value={formatCurrency(kpis.faturamentoAnual)}
              subtitle={`${currentYear}`}
              icon={TrendingUp}
              trend={formatTrend(kpis.tendenciaAnual)}
              data-testid="card-faturamento-anual"
            />
            <DashboardKPICard
              title="Clientes Ativos"
              value={String(kpis.clientesAtivos)}
              subtitle={kpis.clientesInativos > 0 ? `${kpis.clientesInativos} inativo${kpis.clientesInativos > 1 ? 's' : ''}` : 'Nenhum inativo'}
              icon={Users}
              data-testid="card-clientes-ativos"
            />
            <DashboardKPICard
              title="Cobranças Geradas"
              value={String(kpis.cobrancasGeradasMes)}
              subtitle="Este mês"
              icon={FileText}
              data-testid="card-cobrancas-geradas"
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cobranças Recentes</CardTitle>
          <CardDescription>Últimas cobranças geradas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : (
            <CobrancaTable cobrancas={cobrancasRecentes} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
