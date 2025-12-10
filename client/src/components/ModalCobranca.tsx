import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCriarCobrancaExtra } from "@/hooks/useCobrancas";

interface ClienteSelect {
  id: string;
  nome: string;
  nome_visualizacao: string | null;
}

interface ModalCobrancaProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalCobranca({
  open,
  onClose,
  onSuccess,
}: ModalCobrancaProps) {
  const criarCobrancaMutation = useCriarCobrancaExtra();
  const [formData, setFormData] = useState({
    cliente_id: '',
    descricao: '',
    valor_total: '',
    data_vencimento: '',
    observacao: '',
  });

  const { data: clientes = [] } = useQuery<ClienteSelect[]>({
    queryKey: ['/api/clientes-ativos'],
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

  useEffect(() => {
    if (open) {
      const defaultVencimento = new Date();
      defaultVencimento.setDate(defaultVencimento.getDate() + 10);
      
      setFormData({
        cliente_id: '',
        descricao: '',
        valor_total: '',
        data_vencimento: defaultVencimento.toISOString().split('T')[0],
        observacao: '',
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await criarCobrancaMutation.mutateAsync({
        p_cliente_id: formData.cliente_id,
        p_descricao: formData.descricao,
        p_valor_total: parseFloat(formData.valor_total),
        p_data_vencimento: formData.data_vencimento,
        p_observacao: formData.observacao || undefined,
      });

      onSuccess();
      onClose();
    } catch (error) {
    }
  };

  const isFormValid = () => {
    return (
      formData.cliente_id.trim() &&
      formData.descricao.trim() &&
      formData.valor_total.trim() &&
      parseFloat(formData.valor_total) > 0 &&
      formData.data_vencimento.trim()
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Cobrança Avulsa</DialogTitle>
          <DialogDescription>
            Crie uma cobrança extra não vinculada a uma assinatura
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cliente_id">
                Cliente <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.cliente_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, cliente_id: value })
                }
              >
                <SelectTrigger id="cliente_id" data-testid="select-cliente">
                  <SelectValue placeholder="Selecione um cliente" />
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
              <Label htmlFor="descricao">
                Descrição <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Ex: Consulta Avulsa, Serviço Extra"
                rows={2}
                required
                data-testid="textarea-descricao"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_total">
                Valor (R$) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="valor_total"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.valor_total}
                onChange={(e) =>
                  setFormData({ ...formData, valor_total: e.target.value })
                }
                placeholder="0.00"
                required
                data-testid="input-valor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_vencimento">
                Data de Vencimento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data_vencimento"
                type="date"
                value={formData.data_vencimento}
                onChange={(e) =>
                  setFormData({ ...formData, data_vencimento: e.target.value })
                }
                required
                data-testid="input-data-vencimento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observação (opcional)</Label>
              <Textarea
                id="observacao"
                value={formData.observacao}
                onChange={(e) =>
                  setFormData({ ...formData, observacao: e.target.value })
                }
                placeholder="Informações adicionais sobre esta cobrança"
                rows={2}
                data-testid="textarea-observacao"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={criarCobrancaMutation.isPending}
              data-testid="button-cancelar"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={criarCobrancaMutation.isPending || !isFormValid()} 
              data-testid="button-salvar-cobranca"
            >
              {criarCobrancaMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Cobrança'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
