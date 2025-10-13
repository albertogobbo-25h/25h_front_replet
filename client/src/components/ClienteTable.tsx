import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Phone } from "lucide-react";

interface Cliente {
  id: string;
  nome: string;
  whatsapp?: string;
  indAtivo: boolean;
}

interface ClienteTableProps {
  clientes: Cliente[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function ClienteTable({ clientes, onEdit, onDelete }: ClienteTableProps) {
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
              <TableCell className="font-medium" data-testid={`text-cliente-nome-${cliente.id}`}>
                {cliente.nome}
              </TableCell>
              <TableCell>
                {cliente.whatsapp && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span className="font-mono text-sm">{cliente.whatsapp}</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={cliente.indAtivo ? "secondary" : "outline"}>
                  {cliente.indAtivo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      console.log('Edit cliente:', cliente.id);
                      onEdit?.(cliente.id);
                    }}
                    data-testid={`button-edit-cliente-${cliente.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      console.log('Delete cliente:', cliente.id);
                      onDelete?.(cliente.id);
                    }}
                    data-testid={`button-delete-cliente-${cliente.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
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
