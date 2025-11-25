import { useState, useMemo } from "react";
import ClienteTable from "@/components/ClienteTable";
import ModalCliente from "@/components/ModalCliente";
import ModalConfigContaBancaria from "@/components/ModalConfigContaBancaria";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Loader2, AlertTriangle, Building2 } from "lucide-react";
import { useValidarRecebedor } from "@/hooks/useValidarRecebedor";
import { useListarClientes, useAtivarCliente, useDesativarCliente } from "@/hooks/useClientes";
import type { Cliente } from "@/types/cliente";

export default function Clientes() {
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

  const indAtivoFilter = useMemo(() => {
    if (statusFilter === "ativo") return true;
    if (statusFilter === "inativo") return false;
    return null;
  }, [statusFilter]);

  const { data: clientes = [], isLoading } = useListarClientes({
    nome: searchTerm || undefined,
    ind_ativo: indAtivoFilter,
    limit: 100,
    offset: 0,
  });

  const ativarMutation = useAtivarCliente();
  const desativarMutation = useDesativarCliente();

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
    if (cliente.ind_ativo) {
      desativarMutation.mutate(cliente.id);
    } else {
      ativarMutation.mutate(cliente.id);
    }
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setClienteParaEditar(null);
  };

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
                {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          ) : (
            <ClienteTable
              clientes={clientes}
              onEditar={handleEditarCliente}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </CardContent>
      </Card>

      <ModalCliente
        open={modalOpen}
        onClose={handleModalClose}
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
