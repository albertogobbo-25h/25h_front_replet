import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, Zap } from "lucide-react";
import type { MeioPagamento } from "@/types/assinatura";
import { formatCurrency } from "@/lib/masks";

interface ModalPagamentoProps {
  open: boolean;
  onClose: () => void;
  cobrancaId: string;
  valor: number;
  onPagar: (meioPagamento: MeioPagamento) => Promise<void>;
}

export default function ModalPagamento({
  open,
  onClose,
  cobrancaId,
  valor,
  onPagar,
}: ModalPagamentoProps) {
  const [meioPagamento, setMeioPagamento] = useState<MeioPagamento>('OPF_PIX_AUTOMATICO');
  const [loading, setLoading] = useState(false);

  const handlePagar = async () => {
    setLoading(true);
    try {
      await onPagar(meioPagamento);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Realizar Pagamento</DialogTitle>
          <DialogDescription>
            Escolha o meio de pagamento para sua assinatura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
            <p className="text-3xl font-bold font-mono">{formatCurrency(valor)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meio-pagamento">Meio de Pagamento</Label>
            <Select
              value={meioPagamento}
              onValueChange={(value) => setMeioPagamento(value as MeioPagamento)}
            >
              <SelectTrigger id="meio-pagamento" data-testid="select-meio-pagamento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPF_PIX_AUTOMATICO">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">PIX Automático</p>
                      <p className="text-xs text-muted-foreground">Renovação automática mensal</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="OPF_PIX_IMEDIATO">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <div>
                      <p className="font-medium">PIX Imediato</p>
                      <p className="text-xs text-muted-foreground">Pagamento único, mês a mês</p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {meioPagamento === 'OPF_PIX_AUTOMATICO' && (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Com PIX Automático, você autoriza PIX mensais automáticos de forma recorrente. Você pode cancelar a
                qualquer momento.
              </AlertDescription>
            </Alert>
          )}

          {meioPagamento === 'OPF_PIX_IMEDIATO' && (
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                Com PIX Imediato, você autoriza somente o PIX da cobrança atual sem recorrência, sendo necessário autorizar a cobrança todos os meses.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            data-testid="button-cancelar-pagamento"
          >
            Cancelar
          </Button>
          <Button
            onClick={handlePagar}
            disabled={loading}
            data-testid="button-confirmar-pagamento"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar Pagamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
