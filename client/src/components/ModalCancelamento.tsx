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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info, Loader2 } from "lucide-react";
import type { Assinatura } from "@/types/assinatura";
import { formatDate } from "@/lib/masks";

interface ModalCancelamentoProps {
  open: boolean;
  onClose: () => void;
  assinatura: Assinatura;
  onConfirmar: (motivo?: string) => Promise<void>;
  isLoading?: boolean;
}

export default function ModalCancelamento({
  open,
  onClose,
  assinatura,
  onConfirmar,
  isLoading = false,
}: ModalCancelamentoProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [motivo, setMotivo] = useState("");
  
  const loading = isLoading || internalLoading;

  const handleConfirmar = async () => {
    setInternalLoading(true);
    try {
      await onConfirmar(motivo || undefined);
      setMotivo(""); // Limpa o campo após confirmar
    } finally {
      setInternalLoading(false);
    }
  };

  const isAssinaturaAtiva = assinatura.status === 'ATIVA';
  const isPendente = assinatura.status === 'AGUARDANDO_PAGAMENTO';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar Assinatura</DialogTitle>
          <DialogDescription>
            {isAssinaturaAtiva 
              ? 'Você tem certeza que deseja cancelar sua assinatura?'
              : 'Você tem certeza que deseja cancelar esta assinatura pendente?'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isAssinaturaAtiva && (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Você manterá acesso ao plano <strong>{assinatura.plano.titulo}</strong> até{' '}
                  <strong>{formatDate(assinatura.data_validade)}</strong>.
                </AlertDescription>
              </Alert>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">O que acontece ao cancelar:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Acesso mantido até o fim do período pago</li>
                  <li>Não haverá renovação automática</li>
                  <li>Você pode reativar a qualquer momento</li>
                  <li>Seus dados serão preservados</li>
                </ul>
              </div>
            </>
          )}

          {isPendente && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta assinatura pendente será cancelada e a cobrança em aberto será anulada.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="motivo" className="text-sm font-medium">
              Motivo do cancelamento (opcional)
            </Label>
            <Textarea
              id="motivo"
              placeholder="Nos ajude a melhorar. Por que você está cancelando?"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={loading}
              rows={3}
              data-testid="textarea-motivo-cancelamento"
            />
            <p className="text-xs text-muted-foreground">
              Suas informações nos ajudam a aprimorar nossos serviços.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            data-testid="button-manter-assinatura"
          >
            Manter Assinatura
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmar}
            disabled={loading}
            data-testid="button-confirmar-cancelamento"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Sim, Cancelar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
