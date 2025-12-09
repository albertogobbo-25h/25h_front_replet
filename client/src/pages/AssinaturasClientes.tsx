import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MoreHorizontal, RefreshCw, Ban, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAssinaturasCliente, useCancelarAssinaturaCliente, useSuspenderAssinaturaCliente, useReativarAssinaturaCliente } from "@/hooks/useAssinaturasCliente";
import type { AssinaturaClienteStatus } from "@/types/assinatura-cliente";
import ModalNovaAssinatura from "@/components/ModalNovaAssinatura";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
}

function getStatusBadge(status: AssinaturaClienteStatus) {
  const statusConfig: Record<AssinaturaClienteStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ATIVA: { label: "Ativa", variant: "default" },
    SUSPENSA: { label: "Suspensa", variant: "secondary" },
    CANCELADA: { label: "Cancelada", variant: "destructive" },
    AGUARDANDO_PAGAMENTO: { label: "Aguardando Pagamento", variant: "outline" },
    CANCELAMENTO_SOLICITADO: { label: "Cancelamento Solicitado", variant: "outline" },
  };

  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function AssinaturasClientes() {
  const [filtroStatus, setFiltroStatus] = useState<AssinaturaClienteStatus | "TODOS">("TODOS");
  const [busca, setBusca] = useState("");
  const [modalNovaAssinaturaOpen, setModalNovaAssinaturaOpen] = useState(false);

  const { data, isLoading, refetch } = useAssinaturasCliente({
    p_status: filtroStatus === "TODOS" ? undefined : filtroStatus,
    p_limit: 100,
    p_offset: 0,
  });

  const cancelarMutation = useCancelarAssinaturaCliente();
  const suspenderMutation = useSuspenderAssinaturaCliente();
  const reativarMutation = useReativarAssinaturaCliente();

  const assinaturas = data?.assinaturas || [];
  
  const assinaturasFiltradas = assinaturas.filter((assinatura) => {
    if (!busca) return true;
    const termoBusca = busca.toLowerCase();
    const nomeCliente = (assinatura.cliente?.nome_visualizacao || assinatura.cliente?.nome || "").toLowerCase();
    const nomePlano = (assinatura.plano?.nome || "").toLowerCase();
    return nomeCliente.includes(termoBusca) || nomePlano.includes(termoBusca);
  });

  const handleCancelar = (assinaturaId: string) => {
    if (confirm("Tem certeza que deseja cancelar esta assinatura?")) {
      cancelarMutation.mutate({ p_assinatura_id: assinaturaId });
    }
  };

  const handleSuspender = (assinaturaId: string) => {
    if (confirm("Tem certeza que deseja suspender esta assinatura?")) {
      suspenderMutation.mutate({ p_assinatura_id: assinaturaId });
    }
  };

  const handleReativar = (assinaturaId: string) => {
    reativarMutation.mutate({ p_assinatura_id: assinaturaId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assinaturas</h1>
          <p className="text-muted-foreground">
            Gerencie as assinaturas dos seus clientes
          </p>
        </div>
        <Button data-testid="button-nova-assinatura" onClick={() => setModalNovaAssinaturaOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Assinatura
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <span>Lista de Assinaturas</span>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente ou plano..."
                  className="pl-10 w-64"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  data-testid="input-busca-assinatura"
                />
              </div>
              <Select
                value={filtroStatus}
                onValueChange={(value) => setFiltroStatus(value as AssinaturaClienteStatus | "TODOS")}
              >
                <SelectTrigger className="w-48" data-testid="select-status-filtro">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os status</SelectItem>
                  <SelectItem value="ATIVA">Ativa</SelectItem>
                  <SelectItem value="SUSPENSA">Suspensa</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                  <SelectItem value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()} data-testid="button-atualizar">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : assinaturasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {busca || filtroStatus !== "TODOS"
                ? "Nenhuma assinatura encontrada com os filtros aplicados."
                : "Nenhuma assinatura cadastrada ainda."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Próximo Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assinaturasFiltradas.map((assinatura) => (
                  <TableRow key={assinatura.id} data-testid={`row-assinatura-${assinatura.id}`}>
                    <TableCell className="font-medium">
                      {assinatura.cliente?.nome_visualizacao || assinatura.cliente?.nome || "-"}
                    </TableCell>
                    <TableCell>{assinatura.plano?.nome || "-"}</TableCell>
                    <TableCell className="font-mono">
                      {assinatura.plano?.valor_mensal
                        ? formatCurrency(assinatura.plano.valor_mensal)
                        : "-"}
                    </TableCell>
                    <TableCell>{formatDate(assinatura.inicio || assinatura.data_inicio || null)}</TableCell>
                    <TableCell>{formatDate(assinatura.data_proximo_vencimento || assinatura.fim || null)}</TableCell>
                    <TableCell>{getStatusBadge(assinatura.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-acoes-${assinatura.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {assinatura.status === "ATIVA" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleSuspender(assinatura.id)}
                                data-testid={`action-suspender-${assinatura.id}`}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Suspender
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancelar(assinatura.id)}
                                className="text-destructive"
                                data-testid={`action-cancelar-${assinatura.id}`}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Cancelar
                              </DropdownMenuItem>
                            </>
                          )}
                          {assinatura.status === "SUSPENSA" && (
                            <DropdownMenuItem
                              onClick={() => handleReativar(assinatura.id)}
                              data-testid={`action-reativar-${assinatura.id}`}
                            >
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Reativar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ModalNovaAssinatura
        open={modalNovaAssinaturaOpen}
        onClose={() => setModalNovaAssinaturaOpen(false)}
        onSuccess={() => {
          setModalNovaAssinaturaOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
