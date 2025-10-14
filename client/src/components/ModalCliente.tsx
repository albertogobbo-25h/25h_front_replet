import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { formatWhatsApp, unformatWhatsApp } from "@/lib/masks";
import { Loader2 } from "lucide-react";
import type { Cliente } from "@/types/cliente";

interface ModalClienteProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cliente?: Cliente | null;
}

export default function ModalCliente({
  open,
  onClose,
  onSuccess,
  cliente,
}: ModalClienteProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    nome_visualizacao: '',
    whatsapp: '',
    observacao: '',
  });

  const isEdit = !!cliente;

  useEffect(() => {
    if (open && cliente) {
      setFormData({
        nome: cliente.nome || '',
        nome_visualizacao: cliente.nome_visualizacao || '',
        whatsapp: formatWhatsApp(cliente.whatsapp || ''),
        observacao: cliente.observacao || '',
      });
    } else if (open && !cliente) {
      setFormData({
        nome: '',
        nome_visualizacao: '',
        whatsapp: '',
        observacao: '',
      });
    }
  }, [open, cliente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const whatsappSemFormatacao = unformatWhatsApp(formData.whatsapp);

      if (isEdit && cliente) {
        // Atualizar cliente existente
        const { error } = await supabase
          .schema('app_data')
          .from('cliente')
          .update({
            nome: formData.nome,
            nome_visualizacao: formData.nome_visualizacao || null,
            whatsapp: whatsappSemFormatacao || null,
            observacao: formData.observacao || null,
            modificado_em: new Date().toISOString(),
          })
          .eq('id', cliente.id);

        if (error) throw error;

        toast({
          title: 'Cliente atualizado',
          description: 'Os dados do cliente foram atualizados com sucesso',
        });
      } else {
        // Criar novo cliente
        const { error } = await supabase
          .schema('app_data')
          .from('cliente')
          .insert({
            nome: formData.nome,
            nome_visualizacao: formData.nome_visualizacao || null,
            whatsapp: whatsappSemFormatacao || null,
            observacao: formData.observacao || null,
          });

        if (error) throw error;

        toast({
          title: 'Cliente criado',
          description: 'O cliente foi criado com sucesso',
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar cliente',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppChange = (value: string) => {
    setFormData({ ...formData, whatsapp: formatWhatsApp(value) });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize as informações do cliente'
              : 'Preencha os dados do novo cliente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                data-testid="input-nome-cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome_visualizacao">Nome de Exibição</Label>
              <Input
                id="nome_visualizacao"
                value={formData.nome_visualizacao}
                onChange={(e) =>
                  setFormData({ ...formData, nome_visualizacao: e.target.value })
                }
                placeholder="Como o cliente prefere ser chamado"
                data-testid="input-nome-visualizacao"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => handleWhatsAppChange(e.target.value)}
                placeholder="(11) 98765-4321"
                data-testid="input-whatsapp-cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea
                id="observacao"
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                placeholder="Notas adicionais sobre o cliente"
                rows={3}
                data-testid="textarea-observacao"
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
            <Button type="submit" disabled={loading} data-testid="button-salvar-cliente">
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
