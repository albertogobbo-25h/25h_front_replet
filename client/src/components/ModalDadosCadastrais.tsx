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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { DadosAssinante } from "@/types/assinatura";
import { formatWhatsApp, formatCNPJ, unformatWhatsApp, unformatCPFCNPJ } from "@/lib/masks";

interface ModalDadosCadastraisProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dadosAtuais?: DadosAssinante | null;
}

export default function ModalDadosCadastrais({
  open,
  onClose,
  onConfirm,
  dadosAtuais,
}: ModalDadosCadastraisProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    nome_fantasia: '',
    cpf_cnpj: '',
    email: '',
    whatsapp: '',
  });
  const [userHasEdited, setUserHasEdited] = useState(false);

  // Todos os assinantes são Pessoa Jurídica
  const tipoPessoa = 'JURIDICA';

  // Resetar estado de edição quando o modal abrir/fechar
  useEffect(() => {
    if (open) {
      setUserHasEdited(false);
    }
  }, [open]);

  // Carregar dados do backend quando disponíveis (somente se usuário não editou)
  useEffect(() => {
    if (open && dadosAtuais && !userHasEdited) {
      // Formatar CNPJ e WhatsApp vindos do backend (apenas números)
      const cnpjFormatado = formatCNPJ(dadosAtuais.cpf_cnpj || '');
      const whatsappFormatado = formatWhatsApp(dadosAtuais.whatsapp || '');
      
      setFormData({
        nome: dadosAtuais.nome || '',
        nome_fantasia: dadosAtuais.nome_fantasia || '',
        cpf_cnpj: cnpjFormatado,
        email: dadosAtuais.email || '',
        whatsapp: whatsappFormatado,
      });
    }
  }, [open, dadosAtuais, userHasEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Remover formatação antes de enviar ao backend
      const cpfCnpjSemFormatacao = unformatCPFCNPJ(formData.cpf_cnpj);
      const whatsappSemFormatacao = unformatWhatsApp(formData.whatsapp);

      const { data, error } = await supabase.rpc('atualizar_dados_assinante', {
        p_nome: formData.nome,
        p_nome_fantasia: formData.nome_fantasia || null,
        p_cpf_cnpj: cpfCnpjSemFormatacao,
        p_tipo_pessoa: tipoPessoa,
        p_email: formData.email,
        p_whatsapp: whatsappSemFormatacao,
      });

      if (error) throw error;

      if (data?.status === 'ERROR') {
        throw new Error(data.message || 'Erro ao atualizar dados');
      }

      toast({
        title: 'Dados atualizados',
        description: 'Seus dados foram atualizados com sucesso',
      });

      onConfirm();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCnpjChange = (value: string) => {
    setUserHasEdited(true);
    const formatted = formatCNPJ(value);
    setFormData({ ...formData, cpf_cnpj: formatted });
  };

  const handleWhatsAppChange = (value: string) => {
    setUserHasEdited(true);
    setFormData({ ...formData, whatsapp: formatWhatsApp(value) });
  };

  const handleFieldChange = (field: string, value: string) => {
    setUserHasEdited(true);
    setFormData({ ...formData, [field]: value });
  };

  const isFormValid = () => {
    return (
      formData.nome.trim() &&
      formData.cpf_cnpj.trim() &&
      formData.email.trim() &&
      formData.whatsapp.trim()
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dados Cadastrais</DialogTitle>
          <DialogDescription>
            Complete seus dados para contratar um plano pago
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj" data-testid="label-cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  data-testid="input-cnpj"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" data-testid="label-whatsapp">WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => handleWhatsAppChange(e.target.value)}
                  placeholder="(00) 00000-0000"
                  data-testid="input-whatsapp-cadastral"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome" data-testid="label-razao-social">Razão Social *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleFieldChange('nome', e.target.value)}
                placeholder="Empresa LTDA"
                data-testid="input-nome"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome-fantasia" data-testid="label-nome-fantasia">Nome Fantasia</Label>
              <Input
                id="nome-fantasia"
                value={formData.nome_fantasia}
                onChange={(e) => handleFieldChange('nome_fantasia', e.target.value)}
                placeholder="Nome comercial da empresa"
                data-testid="input-nome-fantasia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" data-testid="label-email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="seu@email.com"
                data-testid="input-email-cadastral"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              data-testid="button-cancelar-dados"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !isFormValid()}
              data-testid="button-salvar-dados"
            >
              {loading ? 'Salvando...' : 'Salvar e Continuar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
