import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Eye, Send, MoreVertical, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/masks";
import { getStatusEfetivo, getStatusLabel, getStatusVariant, getDiasAteVencimento } from "@/lib/cobrancaUtils";
import type { CobrancaComCliente } from "@/types/cobranca";

interface CobrancaTableProps {
  cobrancas: CobrancaComCliente[];
  onView?: (cobranca: CobrancaComCliente) => void;
  onEnviarWhatsApp?: (cobranca: CobrancaComCliente) => void;
  onMarcarPago?: (cobranca: CobrancaComCliente) => void;
  onCancelar?: (cobranca: CobrancaComCliente) => void;
}

export default function CobrancaTable({
  cobrancas,
  onView,
  onEnviarWhatsApp,
  onMarcarPago,
  onCancelar,
}: CobrancaTableProps) {
  const [cobrancaParaAcao, setCobrancaParaAcao] = useState<{
    cobranca: CobrancaComCliente;
    acao: 'marcar_pago' | 'cancelar' | null;
  } | null>(null);

  const handleConfirmarAcao = () => {
    if (!cobrancaParaAcao) return;

    if (cobrancaParaAcao.acao === 'marcar_pago') {
      onMarcarPago?.(cobrancaParaAcao.cobranca);
    } else if (cobrancaParaAcao.acao === 'cancelar') {
      onCancelar?.(cobrancaParaAcao.cobranca);
    }

    setCobrancaParaAcao(null);
  };

  return (
    <>
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
            {cobrancas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma cobrança encontrada
                </TableCell>
              </TableRow>
            ) : (
              cobrancas.map((cobranca) => {
                const statusEfetivo = getStatusEfetivo(
                  cobranca.status_pagamento,
                  cobranca.data_vencimento
                );
                const diasAteVencimento = getDiasAteVencimento(cobranca.data_vencimento);

                return (
                  <TableRow key={cobranca.id} data-testid={`row-cobranca-${cobranca.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {cobranca.cliente?.nome_visualizacao || cobranca.cliente?.nome}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {cobranca.descricao}
                    </TableCell>
                    <TableCell className="font-mono font-semibold" data-testid={`text-valor-${cobranca.id}`}>
                      {formatCurrency(Number(cobranca.valor_total))}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm">{formatDate(cobranca.data_vencimento)}</p>
                        {statusEfetivo === 'EM_ABERTO' && diasAteVencimento >= 0 && (
                          <p className="text-xs text-muted-foreground">
                            {diasAteVencimento === 0
                              ? 'Vence hoje'
                              : diasAteVencimento === 1
                              ? 'Vence amanhã'
                              : `${diasAteVencimento} dias`}
                          </p>
                        )}
                        {statusEfetivo === 'VENCIDO' && (
                          <p className="text-xs text-destructive">
                            Vencido há {Math.abs(diasAteVencimento)} {Math.abs(diasAteVencimento) === 1 ? 'dia' : 'dias'}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(statusEfetivo)}>
                        {getStatusLabel(statusEfetivo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onView?.(cobranca)}
                          data-testid={`button-view-cobranca-${cobranca.id}`}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {(statusEfetivo === 'EM_ABERTO' || statusEfetivo === 'VENCIDO') && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEnviarWhatsApp?.(cobranca)}
                              data-testid={`button-send-cobranca-${cobranca.id}`}
                              title="Enviar por WhatsApp"
                            >
                              <Send className="h-4 w-4" />
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  data-testid={`button-menu-cobranca-${cobranca.id}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setCobrancaParaAcao({ cobranca, acao: 'marcar_pago' })}
                                  data-testid={`menu-marcar-pago-${cobranca.id}`}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  Marcar como Pago
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setCobrancaParaAcao({ cobranca, acao: 'cancelar' })}
                                  className="text-destructive focus:text-destructive"
                                  data-testid={`menu-cancelar-${cobranca.id}`}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancelar Cobrança
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog
        open={!!cobrancaParaAcao}
        onOpenChange={(open) => !open && setCobrancaParaAcao(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {cobrancaParaAcao?.acao === 'marcar_pago' ? 'Marcar como Pago' : 'Cancelar Cobrança'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cobrancaParaAcao?.acao === 'marcar_pago' ? (
                <>
                  Tem certeza que deseja marcar esta cobrança como paga?
                  <br />
                  <span className="font-medium">
                    Cliente: {cobrancaParaAcao.cobranca.cliente?.nome}
                  </span>
                  <br />
                  <span className="font-medium">
                    Valor: {formatCurrency(Number(cobrancaParaAcao.cobranca.valor_total))}
                  </span>
                </>
              ) : (
                <>
                  Tem certeza que deseja cancelar esta cobrança? Esta ação não pode ser desfeita.
                  <br />
                  <span className="font-medium">
                    Cliente: {cobrancaParaAcao?.cobranca.cliente?.nome}
                  </span>
                  <br />
                  <span className="font-medium">
                    Valor: {formatCurrency(Number(cobrancaParaAcao?.cobranca.valor_total || 0))}
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-acao">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarAcao}
              className={cobrancaParaAcao?.acao === 'cancelar' ? 'bg-destructive hover:bg-destructive/90' : ''}
              data-testid="button-confirmar-acao"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
