import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import ModalPlanoCliente from "@/components/ModalPlanoCliente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Loader2, Edit, Power, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/masks";
import type { ClientePlano } from "@/types/cliente";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PlanosCliente() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [planoParaEditar, setPlanoParaEditar] = useState<ClientePlano | null>(null);
  const [planoParaExcluir, setPlanoParaExcluir] = useState<ClientePlano | null>(null);

  // Query: Listar planos
  const { data: planos = [], isLoading } = useQuery<ClientePlano[]>({
    queryKey: ['/api/cliente-planos'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('listar_cliente_planos', {
        p_limit: 1000,
      });

      if (error) throw error;
      return data || [];
    },
  });

  // Mutation: Desativar/Ativar plano
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const rpcName = ativo ? 'reativar_cliente_plano' : 'desativar_cliente_plano';
      const { data, error } = await supabase.rpc(rpcName, { p_plano_id: id });

      if (error) throw error;
      if (data?.status === 'ERROR') throw new Error(data.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cliente-planos'] });
      toast({
        title: variables.ativo ? 'Plano reativado' : 'Plano desativado',
        description: `O plano foi ${variables.ativo ? 'reativado' : 'desativado'} com sucesso`,
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

  // Mutation: Excluir plano
  const excluirMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc('excluir_cliente_plano', {
        p_plano_id: id,
      });

      if (error) throw error;
      if (data?.status === 'ERROR') throw new Error(data.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cliente-planos'] });
      toast({
        title: 'Plano excluído',
        description: 'O plano foi excluído com sucesso',
      });
      setPlanoParaExcluir(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir plano',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleNovoPlano = () => {
    setPlanoParaEditar(null);
    setModalOpen(true);
  };

  const handleEditarPlano = (plano: ClientePlano) => {
    setPlanoParaEditar(plano);
    setModalOpen(true);
  };

  const handleToggleStatus = (plano: ClientePlano) => {
    toggleStatusMutation.mutate({
      id: plano.id,
      ativo: !plano.ativo,
    });
  };

  const handleConfirmarExclusao = () => {
    if (planoParaExcluir) {
      excluirMutation.mutate(planoParaExcluir.id);
    }
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/cliente-planos'] });
  };

  // Filtrar planos localmente
  const filteredPlanos = planos.filter((plano) => {
    const matchesSearch = plano.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo =
      tipoFilter === 'todos' || plano.tipo === tipoFilter;
    const matchesStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'ativo' && plano.ativo) ||
      (statusFilter === 'inativo' && !plano.ativo);
    return matchesSearch && matchesTipo && matchesStatus;
  });

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'VALOR_FIXO':
        return 'Valor Fixo';
      case 'PACOTE':
        return 'Pacote';
      case 'VALOR_VARIAVEL':
        return 'Valor Variável';
      default:
        return tipo;
    }
  };

  const getPeriodicidadeLabel = (periodicidade: string | null) => {
    if (!periodicidade) return '-';
    switch (periodicidade) {
      case 'SEMANAL':
        return 'Semanal';
      case 'MENSAL':
        return 'Mensal';
      case 'TRIMESTRAL':
        return 'Trimestral';
      case 'SEMESTRAL':
        return 'Semestral';
      case 'ANUAL':
        return 'Anual';
      default:
        return periodicidade;
    }
  };

  const getValorDisplay = (plano: ClientePlano) => {
    if (plano.tipo === 'VALOR_FIXO' && plano.valor_mensal) {
      return `${formatCurrency(plano.valor_mensal)}/${getPeriodicidadeLabel(plano.periodicidade).toLowerCase()}`;
    }
    if (plano.tipo === 'PACOTE' && plano.valor_mensal && plano.qtd_atendimentos) {
      return `${formatCurrency(plano.valor_mensal)} (${plano.qtd_atendimentos} atendimentos)`;
    }
    if (plano.tipo === 'VALOR_VARIAVEL' && plano.valor_atendimento) {
      return `${formatCurrency(plano.valor_atendimento)}/atendimento`;
    }
    return '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planos do Cliente</h1>
          <p className="text-muted-foreground">
            Crie e gerencie planos para seus clientes
          </p>
        </div>
        <Button data-testid="button-add-plano" onClick={handleNovoPlano}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
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
                data-testid="input-search-plano"
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-tipo-filter">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="VALOR_FIXO">Valor Fixo</SelectItem>
                <SelectItem value="PACOTE">Pacote</SelectItem>
                <SelectItem value="VALOR_VARIAVEL">Valor Variável</SelectItem>
              </SelectContent>
            </Select>
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
                Carregando planos...
              </div>
            ) : (
              <>
                {filteredPlanos.length} {filteredPlanos.length === 1 ? ' Plano' : ' Planos'}
              </>
            )}
          </CardTitle>
          <CardDescription>
            Gerencie os planos de cobrança dos seus clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredPlanos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum plano encontrado
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlanos.map((plano) => (
                    <TableRow key={plano.id} data-testid={`row-plano-${plano.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{plano.nome}</p>
                          {plano.descricao && (
                            <p className="text-xs text-muted-foreground">
                              {plano.descricao}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTipoLabel(plano.tipo)}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {getValorDisplay(plano)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={plano.ativo ? 'secondary' : 'outline'}>
                          {plano.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditarPlano(plano)}
                            data-testid={`button-edit-plano-${plano.id}`}
                            title="Editar plano"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(plano)}
                            data-testid={`button-toggle-status-plano-${plano.id}`}
                            title={plano.ativo ? 'Desativar plano' : 'Ativar plano'}
                          >
                            <Power
                              className={`h-4 w-4 ${
                                plano.ativo ? 'text-destructive' : 'text-green-600'
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPlanoParaExcluir(plano)}
                            data-testid={`button-delete-plano-${plano.id}`}
                            title="Excluir plano"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ModalPlanoCliente
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        plano={planoParaEditar}
      />

      <AlertDialog
        open={!!planoParaExcluir}
        onOpenChange={(open) => !open && setPlanoParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o plano "{planoParaExcluir?.nome}"? Esta ação não
              pode ser desfeita.
              {planoParaExcluir && (
                <span className="block mt-2 text-sm font-medium text-destructive">
                  Observação: Não é possível excluir planos com assinaturas ativas.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-exclusao">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirmar-exclusao"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
