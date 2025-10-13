import { useState } from "react";
import ClienteTable from "@/components/ClienteTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  // TODO: Remove mock data
  const mockClientes = [
    { id: '1', nome: 'Maria Santos', whatsapp: '(11) 98765-4321', indAtivo: true },
    { id: '2', nome: 'João Oliveira', whatsapp: '(11) 97654-3210', indAtivo: true },
    { id: '3', nome: 'Ana Costa', whatsapp: '(11) 96543-2109', indAtivo: false },
    { id: '4', nome: 'Pedro Silva', whatsapp: '(11) 95432-1098', indAtivo: true },
    { id: '5', nome: 'Carla Mendes', whatsapp: '(11) 94321-0987', indAtivo: true },
  ];

  const filteredClientes = mockClientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || 
      (statusFilter === "ativo" && cliente.indAtivo) ||
      (statusFilter === "inativo" && !cliente.indAtivo);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes</p>
        </div>
        <Button data-testid="button-add-cliente" onClick={() => console.log('Add cliente clicked')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-cliente"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {filteredClientes.length} {filteredClientes.length === 1 ? 'cliente' : 'clientes'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClienteTable clientes={filteredClientes} />
        </CardContent>
      </Card>
    </div>
  );
}
