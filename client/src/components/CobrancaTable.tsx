import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import { Eye, Send } from "lucide-react";

interface Cobranca {
  id: string;
  cliente: string;
  valor: number;
  dataVencimento: string;
  statusPagamento: 'EM_ABERTO' | 'PAGO' | 'CANCELADO' | 'FALHOU';
  descricao: string;
}

interface CobrancaTableProps {
  cobrancas: Cobranca[];
  onView?: (id: string) => void;
  onSend?: (id: string) => void;
}

export default function CobrancaTable({ cobrancas, onView, onSend }: CobrancaTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cobrancas.map((cobranca) => (
            <TableRow key={cobranca.id} data-testid={`row-cobranca-${cobranca.id}`}>
              <TableCell className="font-medium">{cobranca.cliente}</TableCell>
              <TableCell className="text-muted-foreground">{cobranca.descricao}</TableCell>
              <TableCell className="font-mono font-semibold" data-testid={`text-valor-${cobranca.id}`}>
                {formatCurrency(cobranca.valor)}
              </TableCell>
              <TableCell className="font-mono text-sm">{formatDate(cobranca.dataVencimento)}</TableCell>
              <TableCell>
                <StatusBadge status={cobranca.statusPagamento} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      console.log('View cobranca:', cobranca.id);
                      onView?.(cobranca.id);
                    }}
                    data-testid={`button-view-cobranca-${cobranca.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {cobranca.statusPagamento === 'EM_ABERTO' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        console.log('Send cobranca:', cobranca.id);
                        onSend?.(cobranca.id);
                      }}
                      data-testid={`button-send-cobranca-${cobranca.id}`}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
