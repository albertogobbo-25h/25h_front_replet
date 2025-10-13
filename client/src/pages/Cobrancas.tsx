import { useState } from "react";
import CobrancaTable from "@/components/CobrancaTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Filter } from "lucide-react";

export default function Cobrancas() {
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [periodoFilter, setPeriodoFilter] = useState<string>("mes_atual");

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
    {
      id: '4',
      cliente: 'Pedro Silva',
      descricao: 'Mensalidade Janeiro/2024',
      valor: 420.00,
      dataVencimento: '2024-01-25',
      statusPagamento: 'EM_ABERTO' as const,
    },
    {
      id: '5',
      cliente: 'Carla Mendes',
      descricao: 'Pacote 10 sessões',
      valor: 800.00,
      dataVencimento: '2024-01-30',
      statusPagamento: 'PAGO' as const,
    },
  ];

  const filteredCobrancas = mockCobrancas.filter(cobranca => {
    if (statusFilter === "todos") return true;
    return cobranca.statusPagamento === statusFilter;
  });

  const totalEmAberto = filteredCobrancas
    .filter(c => c.statusPagamento === 'EM_ABERTO')
    .reduce((sum, c) => sum + c.valor, 0);

  const totalPago = filteredCobrancas
    .filter(c => c.statusPagamento === 'PAGO')
    .reduce((sum, c) => sum + c.valor, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cobranças</h1>
          <p className="text-muted-foreground">Gerencie suas cobranças</p>
        </div>
        <Button data-testid="button-add-cobranca" onClick={() => console.log('Add cobranca clicked')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Cobrança
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total em Aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-warning">
              {formatCurrency(totalEmAberto)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-success">
              {formatCurrency(totalPago)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(totalEmAberto + totalPago)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle>Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="EM_ABERTO">Em Aberto</SelectItem>
                <SelectItem value="PAGO">Pago</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
                <SelectItem value="FALHOU">Falhou</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-periodo-filter">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes_atual">Mês Atual</SelectItem>
                <SelectItem value="3_meses">Últimos 3 Meses</SelectItem>
                <SelectItem value="6_meses">Últimos 6 Meses</SelectItem>
                <SelectItem value="12_meses">Últimos 12 Meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {filteredCobrancas.length} {filteredCobrancas.length === 1 ? 'cobrança' : 'cobranças'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CobrancaTable cobrancas={filteredCobrancas} />
        </CardContent>
      </Card>
    </div>
  );
}
