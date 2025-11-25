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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatWhatsApp, unformatWhatsApp, formatCPFCNPJ, unformatCPFCNPJ, formatCEP } from "@/lib/masks";
import { useCriarCliente, useAtualizarCliente, useBuscarClientePorCpfCnpj } from "@/hooks/useClientes";
import { Loader2, AlertTriangle } from "lucide-react";
import type { Cliente, TipoPessoa } from "@/types/cliente";

interface ModalClienteProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cliente?: Cliente | null;
}

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface FormData {
  nome: string;
  nome_visualizacao: string;
  whatsapp: string;
  cpf_cnpj: string;
  tipo_pessoa: TipoPessoa | '';
  email: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  observacao: string;
}

const INITIAL_FORM_DATA: FormData = {
  nome: '',
  nome_visualizacao: '',
  whatsapp: '',
  cpf_cnpj: '',
  tipo_pessoa: '',
  email: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
  observacao: '',
};

export default function ModalCliente({
  open,
  onClose,
  onSuccess,
  cliente,
}: ModalClienteProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [cpfCnpjDuplicado, setCpfCnpjDuplicado] = useState<{ encontrado: boolean; clienteId?: string } | null>(null);

  const isEdit = !!cliente;

  const criarMutation = useCriarCliente();
  const atualizarMutation = useAtualizarCliente();
  const buscarPorCpfCnpj = useBuscarClientePorCpfCnpj();

  const loading = criarMutation.isPending || atualizarMutation.isPending;

  useEffect(() => {
    if (open && cliente) {
      setFormData({
        nome: cliente.nome || '',
        nome_visualizacao: cliente.nome_visualizacao || '',
        whatsapp: formatWhatsApp(cliente.whatsapp || ''),
        cpf_cnpj: cliente.cpf_cnpj ? formatCPFCNPJ(cliente.cpf_cnpj) : '',
        tipo_pessoa: cliente.tipo_pessoa || '',
        email: cliente.email || '',
        rua: cliente.rua || '',
        numero: cliente.numero || '',
        complemento: cliente.complemento || '',
        bairro: cliente.bairro || '',
        cidade: cliente.cidade || '',
        uf: cliente.uf || '',
        cep: cliente.cep ? formatCEP(cliente.cep) : '',
        observacao: cliente.observacao || '',
      });
      setCpfCnpjDuplicado(null);
    } else if (open && !cliente) {
      setFormData(INITIAL_FORM_DATA);
      setCpfCnpjDuplicado(null);
    }
  }, [open, cliente]);

  const handleCpfCnpjChange = async (value: string) => {
    const formatted = formatCPFCNPJ(value);
    const numbers = unformatCPFCNPJ(value);
    
    let tipoPessoa: TipoPessoa | '' = formData.tipo_pessoa;
    if (numbers.length === 11) {
      tipoPessoa = 'FISICA';
    } else if (numbers.length === 14) {
      tipoPessoa = 'JURIDICA';
    }
    
    setFormData({ ...formData, cpf_cnpj: formatted, tipo_pessoa: tipoPessoa });
    setCpfCnpjDuplicado(null);

    if ((numbers.length === 11 || numbers.length === 14) && !isEdit) {
      try {
        const resultado = await buscarPorCpfCnpj.mutateAsync(numbers);
        if (resultado.encontrado && resultado.cliente) {
          setCpfCnpjDuplicado({ 
            encontrado: true, 
            clienteId: resultado.cliente.id 
          });
        }
      } catch {
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cpfCnpjNumeros = unformatCPFCNPJ(formData.cpf_cnpj);
    const whatsappNumeros = unformatWhatsApp(formData.whatsapp);
    const cepNumeros = formData.cep.replace(/\D/g, '');

    const dadosCliente = {
      nome: formData.nome,
      nome_visualizacao: formData.nome_visualizacao || undefined,
      whatsapp: whatsappNumeros || undefined,
      cpf_cnpj: cpfCnpjNumeros || undefined,
      tipo_pessoa: (formData.tipo_pessoa || undefined) as TipoPessoa | undefined,
      email: formData.email || undefined,
      rua: formData.rua || undefined,
      numero: formData.numero || undefined,
      complemento: formData.complemento || undefined,
      bairro: formData.bairro || undefined,
      cidade: formData.cidade || undefined,
      uf: formData.uf || undefined,
      cep: cepNumeros || undefined,
      observacao: formData.observacao || undefined,
    };

    try {
      if (isEdit && cliente) {
        await atualizarMutation.mutateAsync({
          cliente_id: cliente.id,
          ...dadosCliente,
        });
      } else {
        await criarMutation.mutateAsync(dadosCliente);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.code === 'CPF_CNPJ_JA_CADASTRADO' && error.clienteExistenteId) {
        setCpfCnpjDuplicado({ 
          encontrado: true, 
          clienteId: error.clienteExistenteId 
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize as informações do cliente'
              : 'Preencha os dados do novo cliente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Dados Básicos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">
                      Nome Completo <span className="text-destructive">*</span>
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
                      onChange={(e) => setFormData({ ...formData, nome_visualizacao: e.target.value })}
                      placeholder="Como prefere ser chamado"
                      data-testid="input-nome-visualizacao"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj">CPF / CNPJ</Label>
                    <Input
                      id="cpf_cnpj"
                      value={formData.cpf_cnpj}
                      onChange={(e) => handleCpfCnpjChange(e.target.value)}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      maxLength={18}
                      data-testid="input-cpf-cnpj"
                    />
                    {cpfCnpjDuplicado?.encontrado && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Já existe um cliente com este CPF/CNPJ.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo_pessoa">Tipo de Pessoa</Label>
                    <Select 
                      value={formData.tipo_pessoa} 
                      onValueChange={(value) => setFormData({ ...formData, tipo_pessoa: value as TipoPessoa })}
                    >
                      <SelectTrigger data-testid="select-tipo-pessoa">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FISICA">Pessoa Física</SelectItem>
                        <SelectItem value="JURIDICA">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Contato</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: formatWhatsApp(e.target.value) })}
                      placeholder="(11) 98765-4321"
                      maxLength={15}
                      data-testid="input-whatsapp-cliente"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      data-testid="input-email-cliente"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Endereço</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="rua">Rua</Label>
                    <Input
                      id="rua"
                      value={formData.rua}
                      onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                      placeholder="Nome da rua"
                      data-testid="input-rua"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="123"
                      data-testid="input-numero"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.complemento}
                      onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                      placeholder="Apto, Bloco, etc."
                      data-testid="input-complemento"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      placeholder="Nome do bairro"
                      data-testid="input-bairro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      placeholder="Nome da cidade"
                      data-testid="input-cidade"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uf">Estado</Label>
                    <Select 
                      value={formData.uf} 
                      onValueChange={(value) => setFormData({ ...formData, uf: value })}
                    >
                      <SelectTrigger data-testid="select-uf">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS_BRASIL.map((uf) => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                      placeholder="00000-000"
                      maxLength={9}
                      data-testid="input-cep"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Informações Adicionais</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="observacao">Observações</Label>
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
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              data-testid="button-cancelar"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || cpfCnpjDuplicado?.encontrado} 
              data-testid="button-salvar-cliente"
            >
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
