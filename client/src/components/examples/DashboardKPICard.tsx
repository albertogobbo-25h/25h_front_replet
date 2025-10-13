import DashboardKPICard from '../DashboardKPICard'
import { DollarSign, Users, TrendingUp, FileText } from 'lucide-react'

export default function DashboardKPICardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <DashboardKPICard
        title="Faturamento Mensal"
        value="R$ 12.450,00"
        subtitle="Janeiro 2024"
        icon={DollarSign}
        trend={{ value: '+12%', isPositive: true }}
      />
      <DashboardKPICard
        title="Clientes Ativos"
        value="42"
        subtitle="Total cadastrado"
        icon={Users}
      />
      <DashboardKPICard
        title="Cobranças Geradas"
        value="156"
        subtitle="Este mês"
        icon={FileText}
        trend={{ value: '+8%', isPositive: true }}
      />
      <DashboardKPICard
        title="Taxa de Sucesso"
        value="94%"
        subtitle="Pagamentos"
        icon={TrendingUp}
        trend={{ value: '+2%', isPositive: true }}
      />
    </div>
  )
}
