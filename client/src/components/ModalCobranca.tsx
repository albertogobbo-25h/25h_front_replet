import { useState, useEffect, useRef } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { callSupabase } from "@/lib/api-helper";
import { useCriarCobrancaExtra } from "@/hooks/useCobrancas";
import { format, addMonths } from "date-fns";

interface ClienteSelect {
  id: string;
  nome: string;
  nome_visualizacao: string | null;
}

interface PlanoAssinatura {
  nome: string;
  descricao: string | null;
  valor_mensal: number;
  periodicidade: string;
}

interface ClienteAssinatura {
  id: string;
  status: string;
  data_proximo_vencimento: string | null;
  plano: PlanoAssinatura;
}

interface ModalCobrancaProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type TipoCobranca = 'assinatura' | 'avulsa';

export default function ModalCobranca({
  open,
  onClose,
  onSuccess,
}: ModalCobrancaProps) {
  const criarCobrancaMutation = useCriarCobrancaExtra();
  const [tipoCobranca, setTipoCobranca] = useState<TipoCobranca>('avulsa');
  const [formData, setFormData] = useState({
    cliente_id: '',
    cliente_assinatura_id: '',
    descricao: '',
    valor_total: '',
    data_vencimento: '',
    observacao: '',
  });
  
  const avulsaValuesRef = useRef({
    descricao: '',
    valor_total: '',
    data_vencimento: '',
  });
  const prevClienteIdRef = useRef('');

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

  const { data: assinaturas = [], isLoading: isLoadingAssinaturas } = useQuery<ClienteAssinatura[]>({
    queryKey: ['/api/cliente-assinaturas', formData.cliente_id],
    queryFn: async () => {
      if (!formData.cliente_id) return [];
      
      const result = await callSupabase<{ assinaturas: ClienteAssinatura[] }>(async () =>
        await supabase.rpc('listar_assinaturas_cliente', {
          p_cliente_id: formData.cliente_id,
          p_status: 'ATIVA',
          p_limit: 50,
          p_offset: 0,
        })
      );
      
      return result.assinaturas || [];
    },
    enabled: open && !!formData.cliente_id,
  });

  const assinaturaSelecionada = assinaturas.find(a => a.id === formData.cliente_assinatura_id);
  const temAssinaturasDisponiveis = assinaturas.length > 0;

  useEffect(() => {
    if (open) {
      const defaultVencimento = new Date();
      defaultVencimento.setDate(defaultVencimento.getDate() + 10);
      
      avulsaValuesRef.current = {
        descricao: '',
        valor_total: '',
        data_vencimento: defaultVencimento.toISOString().split('T')[0],
      };
      prevClienteIdRef.current = '';
      
      setTipoCobranca('avulsa');
      setFormData({
        cliente_id: '',
        cliente_assinatura_id: '',
        descricao: '',
        valor_total: '',
        data_vencimento: defaultVencimento.toISOString().split('T')[0],
        observacao: '',
      });
    }
  }, [open]);
  
  useEffect(() => {
    if (formData.cliente_id && formData.cliente_id !== prevClienteIdRef.current) {
      const defaultVencimento = new Date();
      defaultVencimento.setDate(defaultVencimento.getDate() + 10);
      
      avulsaValuesRef.current = {
        descricao: '',
        valor_total: '',
        data_vencimento: defaultVencimento.toISOString().split('T')[0],
      };
      
      setFormData(prev => ({
        ...prev,
        cliente_assinatura_id: '',
        descricao: '',
        valor_total: '',
        data_vencimento: defaultVencimento.toISOString().split('T')[0],
      }));
      setTipoCobranca('avulsa');
    }
    prevClienteIdRef.current = formData.cliente_id;
  }, [formData.cliente_id]);

  const handleTipoChange = (novoTipo: TipoCobranca) => {
    if (novoTipo === tipoCobranca) return;
    
    if (novoTipo === 'assinatura') {
      avulsaValuesRef.current = {
        descricao: formData.descricao,
        valor_total: formData.valor_total,
        data_vencimento: formData.data_vencimento,
      };
    } else if (novoTipo === 'avulsa') {
      setFormData(prev => ({
        ...prev,
        cliente_assinatura_id: '',
        descricao: avulsaValuesRef.current.descricao,
        valor_total: avulsaValuesRef.current.valor_total,
        data_vencimento: avulsaValuesRef.current.data_vencimento,
      }));
    }
    
    setTipoCobranca(novoTipo);
  };

  useEffect(() => {
    if (tipoCobranca === 'assinatura' && assinaturaSelecionada) {
      const plano = assinaturaSelecionada.plano;
      const mesAtual = format(new Date(), 'MMMM/yyyy');
      
      let proximoVencimento = assinaturaSelecionada.data_proximo_vencimento;
      if (!proximoVencimento) {
        proximoVencimento = addMonths(new Date(), 1).toISOString().split('T')[0];
      }
      
      setFormData(prev => ({
        ...prev,
        descricao: `${plano.nome} - ${mesAtual}`,
        valor_total: String(plano.valor_mensal),
        data_vencimento: proximoVencimento.split('T')[0],
      }));
    }
  }, [assinaturaSelecionada]);

  const handleAssinaturaChange = (assinaturaId: string) => {
    setFormData(prev => ({ ...prev, cliente_assinatura_id: assinaturaId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await criarCobrancaMutation.mutateAsync({
        p_cliente_id: formData.cliente_id,
        p_cliente_assinatura_id: tipoCobranca === 'assinatura' && formData.cliente_assinatura_id 
          ? formData.cliente_assinatura_id 
          : undefined,
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
    const baseValid = 
      formData.cliente_id.trim() &&
      formData.descricao.trim() &&
      formData.valor_total.trim() &&
      parseFloat(formData.valor_total) > 0 &&
      formData.data_vencimento.trim();
    
    if (tipoCobranca === 'assinatura') {
      return baseValid && formData.cliente_assinatura_id.trim();
    }
    
    return baseValid;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Cobrança</DialogTitle>
          <DialogDescription>
            Crie uma cobrança vinculada a uma assinatura ou uma cobrança avulsa
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

            {formData.cliente_id && !isLoadingAssinaturas && (
              <div className="space-y-2">
                <Label>Tipo de Cobrança</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={tipoCobranca === 'avulsa' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => handleTipoChange('avulsa')}
                    data-testid="button-tipo-avulsa"
                  >
                    Cobrança Avulsa
                  </Button>
                  <Button
                    type="button"
                    variant={tipoCobranca === 'assinatura' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => handleTipoChange('assinatura')}
                    disabled={!temAssinaturasDisponiveis}
                    data-testid="button-tipo-assinatura"
                  >
                    Vincular Assinatura
                  </Button>
                </div>
                {!temAssinaturasDisponiveis && (
                  <p className="text-xs text-muted-foreground">
                    Este cliente não possui assinaturas ativas
                  </p>
                )}
              </div>
            )}

            {tipoCobranca === 'assinatura' && temAssinaturasDisponiveis && (
              <div className="space-y-2">
                <Label htmlFor="cliente_assinatura_id">
                  Selecione a Assinatura <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.cliente_assinatura_id}
                  onValueChange={handleAssinaturaChange}
                >
                  <SelectTrigger id="cliente_assinatura_id" data-testid="select-assinatura">
                    <SelectValue placeholder="Selecione uma assinatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {assinaturas.map((assinatura) => (
                      <SelectItem key={assinatura.id} value={assinatura.id}>
                        {assinatura.plano?.nome || 'Assinatura'} - R$ {assinatura.plano?.valor_mensal?.toFixed(2) || '0.00'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {tipoCobranca === 'assinatura' && assinaturaSelecionada && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Os campos abaixo foram preenchidos automaticamente com base na assinatura selecionada. 
                  Você pode ajustá-los se necessário.
                </AlertDescription>
              </Alert>
            )}

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
                placeholder={tipoCobranca === 'avulsa' 
                  ? "Ex: Consulta Avulsa, Serviço Extra" 
                  : "Ex: Mensalidade Janeiro/2024"
                }
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
