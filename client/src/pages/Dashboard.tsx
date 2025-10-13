import DashboardKPICard from "@/components/DashboardKPICard";
import CobrancaTable from "@/components/CobrancaTable";
import { DollarSign, Users, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  // TODO: Remove mock data
  const mockCobrancas = [
    {
      id: '1',
      cliente: 'Maria Santos',
      descricao: 'Mensalidade Janeiro/2024',
      valor: 250.00,
      dataVencimento: '2024-01-10',
      statusPagamento: 'PAGO' as const,
    },
    {
      id: '2',
      cliente: 'João Oliveira',
      descricao: 'Mensalidade Janeiro/2024',
      valor: 350.00,
      dataVencimento: '2024-01-15',
      statusPagamento: 'EM_ABERTO' as const,
    },
    {
      id: '3',
      cliente: 'Ana Costa',
      descricao: 'Consulta Avulsa',
      valor: 180.00,
      dataVencimento: '2024-01-20',
      statusPagamento: 'FALHOU' as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardKPICard
          title="Faturamento Mensal"
          value="R$ 12.450,00"
          subtitle="Janeiro 2024"
          icon={DollarSign}
          trend={{ value: '+12%', isPositive: true }}
        />
        <DashboardKPICard
          title="Faturamento Anual"
          value="R$ 142.300,00"
          subtitle="2024"
          icon={TrendingUp}
          trend={{ value: '+25%', isPositive: true }}
        />
        <DashboardKPICard
          title="Clientes Ativos"
          value="42"
          subtitle="3 inativos"
          icon={Users}
        />
        <DashboardKPICard
          title="Cobranças Geradas"
          value="156"
          subtitle="Este mês"
          icon={FileText}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cobranças Recentes</CardTitle>
          <CardDescription>Últimas cobranças geradas</CardDescription>
        </CardHeader>
        <CardContent>
          <CobrancaTable cobrancas={mockCobrancas} />
        </CardContent>
      </Card>
    </div>
  );
}
