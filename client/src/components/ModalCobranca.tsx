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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import type { CobrancaComCliente } from "@/types/cobranca";

interface ClienteSelect {
  id: string;
  nome: string;
  nome_visualizacao: string | null;
}

interface ModalCobrancaProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cobranca?: CobrancaComCliente | null;
}

export default function ModalCobranca({
  open,
  onClose,
  onSuccess,
  cobranca,
}: ModalCobrancaProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cliente_id: '',
    descricao: '',
    valor_total: '',
    data_vencimento: '',
    referencia_mes: '',
  });

  const isEdit = !!cobranca;

  // Query: Listar clientes ativos para o select
  const { data: clientes = [] } = useQuery<ClienteSelect[]>({
    queryKey: ['/api/clientes-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cliente')
        .select('id, nome, nome_visualizacao')
        .eq('ind_ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as ClienteSelect[];
    },
    enabled: open && !isEdit,
  });

  useEffect(() => {
    if (open && cobranca) {
      setFormData({
        cliente_id: cobranca.cliente_id,
        descricao: cobranca.descricao || '',
        valor_total: cobranca.valor_total.toString(),
        data_vencimento: cobranca.data_vencimento || '',
        referencia_mes: cobranca.referencia_mes || '',
      });
    } else if (open && !cobranca) {
      // Data de vencimento padrão: 10 dias a partir de hoje
      const defaultVencimento = new Date();
      defaultVencimento.setDate(defaultVencimento.getDate() + 10);
      
      setFormData({
        cliente_id: '',
        descricao: '',
        valor_total: '',
        data_vencimento: defaultVencimento.toISOString().split('T')[0],
        referencia_mes: '',
      });
    }
  }, [open, cobranca]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit && cobranca) {
        // Atualizar cobrança existente
        const { error } = await supabase
          .from('cliente_cobranca')
          .update({
            descricao: formData.descricao,
            valor_total: parseFloat(formData.valor_total),
            data_vencimento: formData.data_vencimento,
            referencia_mes: formData.referencia_mes || null,
            modificado_em: new Date().toISOString(),
          })
          .eq('id', cobranca.id);

        if (error) throw error;

        toast({
          title: 'Cobrança atualizada',
          description: 'A cobrança foi atualizada com sucesso',
        });
      } else {
        // Criar nova cobrança
        const { error } = await supabase
          .from('cliente_cobranca')
          .insert({
            cliente_id: formData.cliente_id,
            descricao: formData.descricao,
            valor_total: parseFloat(formData.valor_total),
            data_vencimento: formData.data_vencimento,
            referencia_mes: formData.referencia_mes || null,
            data_emissao: new Date().toISOString().split('T')[0],
            status_pagamento: 'EM_ABERTO',
          });

        if (error) throw error;

        toast({
          title: 'Cobrança criada',
          description: 'A cobrança foi criada com sucesso',
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar cobrança',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Cobrança' : 'Nova Cobrança'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize as informações da cobrança'
              : 'Crie uma nova cobrança avulsa para um cliente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Cliente (apenas ao criar) */}
            {!isEdit && (
              <div className="space-y-2">
                <Label htmlFor="cliente_id">
                  Cliente <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.cliente_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, cliente_id: value })
                  }
                  required
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
            )}

            {/* Descrição */}
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
                placeholder="Ex: Mensalidade Janeiro/2024, Consulta Avulsa"
                rows={2}
                required
                data-testid="textarea-descricao"
              />
            </div>

            {/* Valor */}
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

            {/* Data de Vencimento */}
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

            {/* Referência do Mês (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="referencia_mes">Referência do Mês (opcional)</Label>
              <Input
                id="referencia_mes"
                type="month"
                value={formData.referencia_mes}
                onChange={(e) =>
                  setFormData({ ...formData, referencia_mes: e.target.value })
                }
                placeholder="YYYY-MM"
                data-testid="input-referencia-mes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              data-testid="button-cancelar"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} data-testid="button-salvar-cobranca">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
