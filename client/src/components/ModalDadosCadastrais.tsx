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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { DadosAssinante, TipoPessoa } from "@/types/assinatura";
import { formatWhatsApp, formatCPF, formatCNPJ } from "@/lib/masks";

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
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>('FISICA');
  const [formData, setFormData] = useState({
    nome: '',
    nome_fantasia: '',
    cpf_cnpj: '',
    email: '',
    whatsapp: '',
  });

  useEffect(() => {
    if (dadosAtuais) {
      setTipoPessoa(dadosAtuais.tipo_pessoa);
      setFormData({
        nome: dadosAtuais.nome || '',
        nome_fantasia: dadosAtuais.nome_fantasia || '',
        cpf_cnpj: dadosAtuais.cpf_cnpj || '',
        email: dadosAtuais.email || '',
        whatsapp: dadosAtuais.whatsapp || '',
      });
    }
  }, [dadosAtuais]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('atualizar_dados_assinante', {
        p_nome: formData.nome,
        p_nome_fantasia: formData.nome_fantasia || null,
        p_cpf_cnpj: formData.cpf_cnpj,
        p_tipo_pessoa: tipoPessoa,
        p_email: formData.email,
        p_whatsapp: formData.whatsapp,
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

  const handleCpfCnpjChange = (value: string) => {
    const formatted = tipoPessoa === 'FISICA' ? formatCPF(value) : formatCNPJ(value);
    setFormData({ ...formData, cpf_cnpj: formatted });
  };

  const handleWhatsAppChange = (value: string) => {
    setFormData({ ...formData, whatsapp: formatWhatsApp(value) });
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
                <Label htmlFor="tipo-pessoa">Tipo de Pessoa *</Label>
                <Select
                  value={tipoPessoa}
                  onValueChange={(value) => setTipoPessoa(value as TipoPessoa)}
                >
                  <SelectTrigger id="tipo-pessoa" data-testid="select-tipo-pessoa">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FISICA">Pessoa Física</SelectItem>
                    <SelectItem value="JURIDICA">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf-cnpj">
                  {tipoPessoa === 'FISICA' ? 'CPF' : 'CNPJ'} *
                </Label>
                <Input
                  id="cpf-cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => handleCpfCnpjChange(e.target.value)}
                  placeholder={tipoPessoa === 'FISICA' ? '000.000.000-00' : '00.000.000/0000-00'}
                  data-testid="input-cpf-cnpj"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">
                {tipoPessoa === 'FISICA' ? 'Nome Completo' : 'Razão Social'} *
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder={tipoPessoa === 'FISICA' ? 'João da Silva' : 'Empresa LTDA'}
                data-testid="input-nome"
                required
              />
            </div>

            {tipoPessoa === 'JURIDICA' && (
              <div className="space-y-2">
                <Label htmlFor="nome-fantasia">Nome Fantasia</Label>
                <Input
                  id="nome-fantasia"
                  value={formData.nome_fantasia}
                  onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                  placeholder="Nome comercial da empresa"
                  data-testid="input-nome-fantasia"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                  data-testid="input-email-cadastral"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp *</Label>
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
