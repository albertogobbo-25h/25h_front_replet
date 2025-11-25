import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { callEdgeFunction, extractFriendlyErrorMessage } from '@/lib/api-helper';
import { Loader2, Building2, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useValidarContaDuplicada, useRecebedor } from '@/hooks/useRecebedor';
import ComboboxBanco from '@/components/ComboboxBanco';
import type { TipoConta, CadastrarRecebedorResponse, AtivarRecebedorResponse } from '@/types/recebedor';

interface ModalConfigContaBancariaProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  titulo?: string;
  descricao?: string;
}

type Estado = 'formulario' | 'cadastrando' | 'erro_retry' | 'sucesso';

export default function ModalConfigContaBancaria({
  open,
  onClose,
  onSuccess,
  titulo = 'Configure sua Conta Bancária',
  descricao = 'Para receber pagamentos dos seus clientes, você precisa configurar sua conta bancária.',
}: ModalConfigContaBancariaProps) {
  const { toast } = useToast();
  const { invalidarRecebedor } = useRecebedor();
  const { validar, carregando: carregandoValidacao } = useValidarContaDuplicada();

  const [estado, setEstado] = useState<Estado>('formulario');
  const [erro, setErro] = useState('');
  const [recebedorErroId, setRecebedorErroId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    instituicao_id: '',
    instituicao_nome: '',
    agencia: '',
    conta: '',
    tipo_conta: '' as TipoConta | '',
  });

  useEffect(() => {
    if (open) {
      setEstado('formulario');
      setErro('');
      setRecebedorErroId(null);
      setFormData({
        instituicao_id: '',
        instituicao_nome: '',
        agencia: '',
        conta: '',
        tipo_conta: '',
      });
    }
  }, [open]);

  const handleAgenciaChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setFormData({ ...formData, agencia: cleaned });
  };

  const handleContaChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 12);
    setFormData({ ...formData, conta: cleaned });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setRecebedorErroId(null);

    if (!formData.instituicao_id || !formData.agencia || !formData.conta || !formData.tipo_conta) {
      setErro('Por favor, preencha todos os campos.');
      return;
    }

    const validacao = validar(
      formData.instituicao_id,
      formData.agencia,
      formData.conta,
      formData.tipo_conta
    );

    if (!validacao.valido) {
      setErro(validacao.erro || 'Conta já cadastrada.');
      if (validacao.podeReativar && validacao.recebedorId) {
        setRecebedorErroId(validacao.recebedorId);
        setEstado('erro_retry');
      }
      return;
    }

    setEstado('cadastrando');

    try {
      const response = await callEdgeFunction<CadastrarRecebedorResponse>(
        supabase,
        'cadastrar_recebedor',
        {
          instituicao_id: formData.instituicao_id,
          agencia: formData.agencia.replace(/\D/g, ''),
          conta: formData.conta.replace(/\D/g, ''),
          tipo_conta: formData.tipo_conta,
        },
        'Erro ao cadastrar conta bancária. Tente novamente.'
      );

      if (response.status === 'error') {
        const friendlyMessage = extractFriendlyErrorMessage(
          { code: response.code, message: response.message },
          'Erro ao cadastrar conta bancária. Tente novamente.'
        );
        
        if (response.data?.recebedor_id) {
          setRecebedorErroId(response.data.recebedor_id);
          setErro(friendlyMessage);
          setEstado('erro_retry');
        } else {
          setErro(friendlyMessage);
          setEstado('formulario');
        }
        return;
      }

      setEstado('sucesso');
      invalidarRecebedor();

      toast({
        title: 'Conta bancária configurada',
        description: 'Sua conta foi cadastrada com sucesso!',
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao cadastrar recebedor:', err);
      const friendlyMessage = extractFriendlyErrorMessage(err, 'Erro ao cadastrar conta bancária. Tente novamente.');
      setErro(friendlyMessage);
      setEstado('formulario');
    }
  };

  const handleRetry = async () => {
    if (!recebedorErroId) return;

    setEstado('cadastrando');
    setErro('');

    try {
      const response = await callEdgeFunction<AtivarRecebedorResponse>(
        supabase,
        'ativar_recebedor',
        { recebedor_id: recebedorErroId },
        'Erro ao ativar conta bancária. Tente novamente.'
      );

      if (response.status === 'error') {
        const friendlyMessage = extractFriendlyErrorMessage(
          { code: response.code, message: response.message },
          'Falha ao ativar conta. Tente novamente.'
        );
        setErro(friendlyMessage);
        setEstado('erro_retry');
        return;
      }

      setEstado('sucesso');
      invalidarRecebedor();

      toast({
        title: 'Conta bancária ativada',
        description: response.data?.chamou_n8n
          ? 'Conta cadastrada na Pluggy com sucesso!'
          : 'Conta reativada com sucesso!',
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao ativar recebedor:', err);
      const friendlyMessage = extractFriendlyErrorMessage(err, 'Erro ao ativar conta bancária. Tente novamente.');
      setErro(friendlyMessage);
      setEstado('erro_retry');
    }
  };

  const isLoading = carregandoValidacao;
  const isCadastrando = estado === 'cadastrando';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isCadastrando && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="modal-config-conta-bancaria">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {titulo}
          </DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>

        {estado === 'sucesso' ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <p className="text-lg font-medium text-center">
              Conta configurada com sucesso!
            </p>
          </div>
        ) : estado === 'erro_retry' ? (
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao cadastrar conta</AlertTitle>
              <AlertDescription>{erro}</AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground text-center">
              A conta foi criada no sistema, mas houve um problema ao integrá-la com o gateway de pagamento. 
              Clique no botão abaixo para tentar novamente.
            </p>

            <div className="flex justify-center">
              <Button
                onClick={handleRetry}
                disabled={isCadastrando}
                data-testid="button-retry-cadastro"
              >
                {isCadastrando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tentando novamente...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tentar Novamente
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="instituicao">
                    Banco <span className="text-destructive">*</span>
                  </Label>
                  <ComboboxBanco
                    value={formData.instituicao_id}
                    displayName={formData.instituicao_nome}
                    onChange={(id, nome) => setFormData({ ...formData, instituicao_id: id, instituicao_nome: nome })}
                    disabled={isCadastrando}
                    placeholder="Digite o nome do banco..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agencia">
                      Agência <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="agencia"
                      value={formData.agencia}
                      onChange={(e) => handleAgenciaChange(e.target.value)}
                      placeholder="0001"
                      disabled={isCadastrando}
                      data-testid="input-agencia"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conta">
                      Conta <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="conta"
                      value={formData.conta}
                      onChange={(e) => handleContaChange(e.target.value)}
                      placeholder="12345"
                      disabled={isCadastrando}
                      data-testid="input-conta"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_conta">
                    Tipo de Conta <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.tipo_conta}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipo_conta: value as TipoConta })
                    }
                    disabled={isCadastrando}
                  >
                    <SelectTrigger id="tipo_conta" data-testid="select-tipo-conta">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHECKING_ACCOUNT">Conta Corrente</SelectItem>
                      <SelectItem value="SAVINGS_ACCOUNT">Conta Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {erro && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{erro}</AlertDescription>
                  </Alert>
                )}
              </>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isCadastrando}
                data-testid="button-cancelar-conta"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isCadastrando}
                data-testid="button-cadastrar-conta"
              >
                {isCadastrando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  'Cadastrar Conta'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
