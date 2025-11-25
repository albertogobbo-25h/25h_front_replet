import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import ClienteTable from "@/components/ClienteTable";
import ModalCliente from "@/components/ModalCliente";
import ModalConfigContaBancaria from "@/components/ModalConfigContaBancaria";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Loader2, AlertTriangle, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useValidarRecebedor } from "@/hooks/useValidarRecebedor";
import type { Cliente } from "@/types/cliente";

export default function Clientes() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | null>(null);

  const {
    temRecebedorAtivo,
    loadingRecebedor,
    modalContaAberto,
    validarEExecutar,
    handleModalContaSuccess,
    handleModalContaClose,
  } = useValidarRecebedor();

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ['/api/clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('app_data')
        .from('cliente')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, novoStatus }: { id: string; novoStatus: boolean }) => {
      const { error } = await supabase
        .schema('app_data')
        .from('cliente')
        .update({ ind_ativo: novoStatus, modificado_em: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/clientes'] });
      toast({
        title: variables.novoStatus ? 'Cliente ativado' : 'Cliente desativado',
        description: `O cliente foi ${variables.novoStatus ? 'ativado' : 'desativado'} com sucesso`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleNovoCliente = () => {
    validarEExecutar(() => {
      setClienteParaEditar(null);
      setModalOpen(true);
    });
  };

  const handleEditarCliente = (cliente: Cliente) => {
    setClienteParaEditar(cliente);
    setModalOpen(true);
  };

  const handleToggleStatus = (cliente: Cliente) => {
    toggleStatusMutation.mutate({
      id: cliente.id,
      novoStatus: !cliente.ind_ativo,
    });
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/clientes'] });
  };

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || 
      (statusFilter === "ativo" && cliente.ind_ativo) ||
      (statusFilter === "inativo" && !cliente.ind_ativo);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes</p>
        </div>
        <Button 
          data-testid="button-add-cliente" 
          onClick={handleNovoCliente}
          disabled={loadingRecebedor}
        >
          {loadingRecebedor ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Novo Cliente
        </Button>
      </div>

      {!loadingRecebedor && !temRecebedorAtivo && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Você precisa configurar sua conta bancária antes de cadastrar clientes.
            </span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => validarEExecutar(() => {})}
              data-testid="button-configurar-conta-alert"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando clientes...
              </div>
            ) : (
              <>
                {filteredClientes.length} {filteredClientes.length === 1 ? 'cliente' : 'clientes'}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          ) : (
            <ClienteTable
              clientes={filteredClientes}
              onEditar={handleEditarCliente}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </CardContent>
      </Card>

      <ModalCliente
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        cliente={clienteParaEditar}
      />

      <ModalConfigContaBancaria
        open={modalContaAberto}
        onClose={handleModalContaClose}
        onSuccess={handleModalContaSuccess}
        titulo="Configure sua Conta Bancária"
        descricao="Para cadastrar clientes, você precisa primeiro configurar sua conta bancária para recebimento."
      />
    </div>
  );
}
