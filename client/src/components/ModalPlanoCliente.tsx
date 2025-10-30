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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { callSupabase, ApiError } from "@/lib/api-helper";
import { Loader2, Info } from "lucide-react";
import type { ClientePlano } from "@/types/cliente";

interface ModalPlanoClienteProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plano?: ClientePlano | null;
}

export default function ModalPlanoCliente({
  open,
  onClose,
  onSuccess,
  plano,
}: ModalPlanoClienteProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'VALOR_FIXO' as 'VALOR_FIXO' | 'PACOTE' | 'VALOR_VARIAVEL',
    valor_mensal: '',
    valor_atendimento: '',
    qtd_atendimentos: '',
    periodicidade: 'MENSAL' as 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL',
  });

  const isEdit = !!plano;

  useEffect(() => {
    if (open && plano) {
      setFormData({
        nome: plano.nome || '',
        descricao: plano.descricao || '',
        tipo: plano.tipo || 'VALOR_FIXO',
        valor_mensal: plano.valor_mensal?.toString() || '',
        valor_atendimento: plano.valor_atendimento?.toString() || '',
        qtd_atendimentos: plano.qtd_atendimentos?.toString() || '',
        periodicidade: plano.periodicidade || 'MENSAL',
      });
    } else if (open && !plano) {
      setFormData({
        nome: '',
        descricao: '',
        tipo: 'VALOR_FIXO',
        valor_mensal: '',
        valor_atendimento: '',
        qtd_atendimentos: '',
        periodicidade: 'MENSAL',
      });
    }
  }, [open, plano]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const params: any = {
        p_nome: formData.nome,
        p_tipo: formData.tipo,
        p_descricao: formData.descricao || null,
      };

      // Adicionar campos específicos do tipo
      if (formData.tipo === 'VALOR_FIXO') {
        params.p_valor_mensal = parseFloat(formData.valor_mensal);
        params.p_periodicidade = formData.periodicidade;
      } else if (formData.tipo === 'PACOTE') {
        params.p_valor_mensal = parseFloat(formData.valor_mensal);
        params.p_qtd_atendimentos = parseInt(formData.qtd_atendimentos);
      } else if (formData.tipo === 'VALOR_VARIAVEL') {
        params.p_valor_atendimento = parseFloat(formData.valor_atendimento);
        params.p_periodicidade = formData.periodicidade;
      }

      if (isEdit && plano) {
        // Atualizar plano existente
        params.p_plano_id = plano.id;
        await callSupabase(async () => 
          await supabase.rpc('atualizar_cliente_plano', params)
        );

        toast({
          title: 'Plano atualizado',
          description: 'O plano foi atualizado com sucesso',
        });
      } else {
        // Criar novo plano
        await callSupabase(async () => 
          await supabase.rpc('criar_cliente_plano', params)
        );

        toast({
          title: 'Plano criado',
          description: 'O plano foi criado com sucesso',
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar plano',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTipoDescription = () => {
    switch (formData.tipo) {
      case 'VALOR_FIXO':
        return 'Cobrança periódica com valor fixo (ex: mensalidade)';
      case 'PACOTE':
        return 'Pacote pré-pago de atendimentos (não recorrente)';
      case 'VALOR_VARIAVEL':
        return 'Cobrança periódica baseada em uso (por atendimento)';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize as informações do plano'
              : 'Crie um novo plano para seus clientes'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome do Plano <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Plano Mensal, Pacote 10 sessões"
                required
                data-testid="input-nome-plano"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva os benefícios e detalhes do plano"
                rows={2}
                data-testid="textarea-descricao-plano"
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo de Plano <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger id="tipo" data-testid="select-tipo-plano">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VALOR_FIXO">Valor Fixo</SelectItem>
                  <SelectItem value="PACOTE">Pacote</SelectItem>
                  <SelectItem value="VALOR_VARIAVEL">Valor Variável</SelectItem>
                </SelectContent>
              </Select>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">{getTipoDescription()}</AlertDescription>
              </Alert>
            </div>

            {/* Campos dinâmicos baseados no tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* VALOR_FIXO: valor_mensal + periodicidade */}
              {formData.tipo === 'VALOR_FIXO' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="valor_mensal">
                      Valor <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="valor_mensal"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor_mensal}
                      onChange={(e) =>
                        setFormData({ ...formData, valor_mensal: e.target.value })
                      }
                      placeholder="0.00"
                      required
                      data-testid="input-valor-mensal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodicidade">
                      Periodicidade <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.periodicidade}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, periodicidade: value })
                      }
                    >
                      <SelectTrigger id="periodicidade" data-testid="select-periodicidade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SEMANAL">Semanal</SelectItem>
                        <SelectItem value="MENSAL">Mensal</SelectItem>
                        <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                        <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                        <SelectItem value="ANUAL">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* PACOTE: valor_mensal + qtd_atendimentos */}
              {formData.tipo === 'PACOTE' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="valor_mensal">
                      Valor do Pacote <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="valor_mensal"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor_mensal}
                      onChange={(e) =>
                        setFormData({ ...formData, valor_mensal: e.target.value })
                      }
                      placeholder="0.00"
                      required
                      data-testid="input-valor-pacote"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qtd_atendimentos">
                      Quantidade de Atendimentos <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="qtd_atendimentos"
                      type="number"
                      min="1"
                      value={formData.qtd_atendimentos}
                      onChange={(e) =>
                        setFormData({ ...formData, qtd_atendimentos: e.target.value })
                      }
                      placeholder="Ex: 10"
                      required
                      data-testid="input-qtd-atendimentos"
                    />
                  </div>
                </>
              )}

              {/* VALOR_VARIAVEL: valor_atendimento + periodicidade */}
              {formData.tipo === 'VALOR_VARIAVEL' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="valor_atendimento">
                      Valor por Atendimento <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="valor_atendimento"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor_atendimento}
                      onChange={(e) =>
                        setFormData({ ...formData, valor_atendimento: e.target.value })
                      }
                      placeholder="0.00"
                      required
                      data-testid="input-valor-atendimento"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodicidade">
                      Periodicidade da Cobrança <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.periodicidade}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, periodicidade: value })
                      }
                    >
                      <SelectTrigger id="periodicidade" data-testid="select-periodicidade-variavel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SEMANAL">Semanal</SelectItem>
                        <SelectItem value="MENSAL">Mensal</SelectItem>
                        <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                        <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                        <SelectItem value="ANUAL">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              data-testid="button-cancelar-plano"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} data-testid="button-salvar-plano">
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
