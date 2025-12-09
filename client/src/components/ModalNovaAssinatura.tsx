import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { callSupabase } from "@/lib/api-helper";
import { useCriarAssinaturaCliente } from "@/hooks/useAssinaturasCliente";
import { useToast } from "@/hooks/use-toast";
import type { ClientePlano } from "@/types/cliente";
import type { CriarAssinaturaClienteWarningResponse } from "@/types/assinatura-cliente";

interface ClienteSelect {
  id: string;
  nome: string;
  nome_visualizacao: string | null;
}

interface ModalNovaAssinaturaProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function ModalNovaAssinatura({
  open,
  onClose,
  onSuccess,
}: ModalNovaAssinaturaProps) {
  const { toast } = useToast();
  const criarAssinaturaMutation = useCriarAssinaturaCliente();
  
  const [formData, setFormData] = useState({
    cliente_id: "",
    cliente_plano_id: "",
    data_inicio: "",
    data_vencimento: "",
  });
  
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState("");
  const [duplicateAssinaturaId, setDuplicateAssinaturaId] = useState<string | null>(null);

  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery<ClienteSelect[]>({
    queryKey: ['/api/clientes-ativos-assinatura'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('listar_clientes', {
        p_nome: null,
        p_cpf_cnpj: null,
        p_email: null,
        p_whatsapp: null,
        p_ind_ativo: true,
        p_limit: 500,
        p_offset: 0,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const { data: planos = [], isLoading: isLoadingPlanos } = useQuery<ClientePlano[]>({
    queryKey: ['/api/cliente-planos-ativos'],
    queryFn: async () => {
      const data = await callSupabase<ClientePlano[]>(async () => 
        await supabase.rpc('listar_cliente_planos', {
          p_limit: 500,
        })
      );
      return (data || []).filter(p => p.ativo);
    },
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      const hoje = new Date();
      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 7);
      
      setFormData({
        cliente_id: "",
        cliente_plano_id: "",
        data_inicio: hoje.toISOString().split('T')[0],
        data_vencimento: vencimento.toISOString().split('T')[0],
      });
      setShowDuplicateAlert(false);
      setDuplicateMessage("");
      setDuplicateAssinaturaId(null);
    }
  }, [open]);

  const planoSelecionado = planos.find(p => p.id === formData.cliente_plano_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente_id || !formData.cliente_plano_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o cliente e o plano.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await criarAssinaturaMutation.mutateAsync({
        p_cliente_id: formData.cliente_id,
        p_cliente_plano_id: formData.cliente_plano_id,
        p_inicio: formData.data_inicio || undefined,
        p_data_vencimento_primeira_cobranca: formData.data_vencimento || undefined,
      });

      if (result?.status === 'OK') {
        onSuccess();
        onClose();
      } else if (result?.status === 'WARNING' && result.code === 'ASSINATURA_DUPLICADA') {
        const warningData = result.data as CriarAssinaturaClienteWarningResponse | undefined;
        setDuplicateMessage(result.message || "Este cliente já possui uma assinatura ativa para este plano.");
        setDuplicateAssinaturaId(warningData?.assinatura_existente_id ?? null);
        setShowDuplicateAlert(true);
      } else if (result?.status === 'WARNING') {
        toast({
          title: "Aviso",
          description: result.message || "Verifique as informações e tente novamente.",
        });
      }
    } catch (error) {
      console.error("Erro ao criar assinatura:", error);
    }
  };

  const handleCloseDuplicateAlert = () => {
    setShowDuplicateAlert(false);
    setDuplicateMessage("");
    setDuplicateAssinaturaId(null);
  };

  const isLoading = criarAssinaturaMutation.isPending;
  const canSubmit = formData.cliente_id && formData.cliente_plano_id && !isLoading;

  return (
    <>
      <Dialog open={open && !showDuplicateAlert} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Assinatura</DialogTitle>
            <DialogDescription>
              Crie uma nova assinatura para um cliente. A primeira cobrança será gerada automaticamente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select
                value={formData.cliente_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cliente_id: value }))}
                disabled={isLoadingClientes}
              >
                <SelectTrigger data-testid="select-cliente-assinatura">
                  <SelectValue placeholder={isLoadingClientes ? "Carregando..." : "Selecione o cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome_visualizacao || cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plano">Plano *</Label>
              <Select
                value={formData.cliente_plano_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cliente_plano_id: value }))}
                disabled={isLoadingPlanos}
              >
                <SelectTrigger data-testid="select-plano-assinatura">
                  <SelectValue placeholder={isLoadingPlanos ? "Carregando..." : "Selecione o plano"} />
                </SelectTrigger>
                <SelectContent>
                  {planos.map((plano) => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.nome} - {formatCurrency(plano.valor_mensal || 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {planoSelecionado && (
                <p className="text-sm text-muted-foreground">
                  {planoSelecionado.descricao || `Periodicidade: ${planoSelecionado.periodicidade}`}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data de Início</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
                  data-testid="input-data-inicio"
                />
                <p className="text-xs text-muted-foreground">Padrão: hoje</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_vencimento">Vencimento 1ª Cobrança</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
                  data-testid="input-data-vencimento-primeira"
                />
                <p className="text-xs text-muted-foreground">Padrão: início + 7 dias</p>
              </div>
            </div>

            {planoSelecionado && (
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-2">Resumo</h4>
                <div className="text-sm space-y-1">
                  <p>Plano: {planoSelecionado.nome}</p>
                  <p>Valor da 1ª cobrança: <span className="font-mono font-medium">{formatCurrency(planoSelecionado.valor_mensal || 0)}</span></p>
                  <p>Periodicidade: {planoSelecionado.periodicidade}</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!canSubmit} data-testid="button-confirmar-assinatura">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Assinatura
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDuplicateAlert} onOpenChange={handleCloseDuplicateAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Assinatura Duplicada
            </AlertDialogTitle>
            <AlertDialogDescription>
              {duplicateMessage || "Este cliente já possui uma assinatura ativa para este plano."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDuplicateAlert}>
              Fechar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
