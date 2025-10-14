import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Power, Phone } from "lucide-react";
import { formatWhatsApp } from "@/lib/masks";
import type { Cliente } from "@/types/cliente";

interface ClienteTableProps {
  clientes: Cliente[];
  onEditar?: (cliente: Cliente) => void;
  onToggleStatus?: (cliente: Cliente) => void;
}

export default function ClienteTable({ clientes, onEditar, onToggleStatus }: ClienteTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => (
            <TableRow key={cliente.id} data-testid={`row-cliente-${cliente.id}`}>
              <TableCell data-testid={`text-cliente-nome-${cliente.id}`}>
                <div>
                  <p className="font-medium">{cliente.nome}</p>
                  {cliente.nome_visualizacao && cliente.nome_visualizacao !== cliente.nome && (
                    <p className="text-xs text-muted-foreground">"{cliente.nome_visualizacao}"</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {cliente.whatsapp && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-sm">{formatWhatsApp(cliente.whatsapp)}</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={cliente.ind_ativo ? "secondary" : "outline"}>
                  {cliente.ind_ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditar?.(cliente)}
                    data-testid={`button-edit-cliente-${cliente.id}`}
                    title="Editar cliente"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleStatus?.(cliente)}
                    data-testid={`button-toggle-status-cliente-${cliente.id}`}
                    title={cliente.ind_ativo ? "Desativar cliente" : "Ativar cliente"}
                  >
                    <Power className={`h-4 w-4 ${cliente.ind_ativo ? 'text-destructive' : 'text-green-600'}`} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
