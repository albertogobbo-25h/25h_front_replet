import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { buscarCep } from "@/lib/cep";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, XCircle, AlertCircle, User, Building2, MapPin } from "lucide-react";
import { formatCurrency, formatWhatsApp, formatCPF, formatCNPJ, formatCEP } from "@/lib/masks";
import type {
  PlanoPublico,
  AssinantePublico,
  DadosClienteAssinatura,
  ApiResponsePublicaSemAuth,
  ObterPlanoResponse,
  BuscarClienteResponse,
  CriarAssinaturaResponse,
  CriarAssinaturaWarningResponse,
} from "@/types/assinatura-publica";
import ThemeToggle from "@/components/ThemeToggle";

const ERROR_MESSAGES: Record<string, string> = {
  'NOME_OBRIGATORIO': 'O nome é obrigatório.',
  'WHATSAPP_OBRIGATORIO': 'O WhatsApp é obrigatório.',
  'INVALID_WHATSAPP': 'WhatsApp inválido. Use 11 dígitos: DDD + 9 + número.',
  'INVALID_EMAIL': 'Email inválido.',
  'PLANO_NAO_ENCONTRADO': 'Plano não encontrado.',
  'PLANO_INATIVO': 'Este plano foi desativado.',
  'PLANO_SEM_VALOR': 'Este plano não tem valor configurado.',
  'ASSINANTE_NAO_ENCONTRADO': 'Assinante não encontrado.',
  'ENDERECO_OBRIGATORIO': 'Para planos pagos, é necessário informar o endereço completo.',
};

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

function extractPlanoId(location: string): string | null {
  const pathMatch = location.match(/\/(?:publico\/)?assinar\/([a-f0-9-]+)/i);
  return pathMatch?.[1] || null;
}

export default function AssinarPublico() {
  const [location] = useLocation();
  const planoId = extractPlanoId(location);

  const [plano, setPlano] = useState<PlanoPublico | null>(null);
  const [assinante, setAssinante] = useState<AssinantePublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [erroSubmit, setErroSubmit] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepEncontrado, setCepEncontrado] = useState(false);
  const [cepInvalido, setCepInvalido] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [showDuplicadoDialog, setShowDuplicadoDialog] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [linkPagamento, setLinkPagamento] = useState<string | null>(null);

  const [formData, setFormData] = useState<DadosClienteAssinatura>({
    nome: '',
    whatsapp: '',
    cpf_cnpj: '',
    tipo_pessoa: 'FISICA',
    email: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
  });

  const isPlanoPago = (plano?.valor_mensal || 0) > 0;

  useEffect(() => {
    async function carregarPlano() {
      if (!planoId) {
        setErro('Link de assinatura inválido.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('obter_plano_para_assinatura_sem_auth', {
          p_cliente_plano_id: planoId
        });

        if (error) {
          console.error('Erro ao carregar plano:', error);
          setErro('Erro ao carregar informações do plano.');
          setLoading(false);
          return;
        }

        const response = data as ApiResponsePublicaSemAuth<ObterPlanoResponse>;

        if (response.status === 'ERROR') {
          const mensagem = ERROR_MESSAGES[response.code || ''] || response.message || 'Link inválido ou expirado.';
          setErro(mensagem);
          setLoading(false);
          return;
        }

        if (response.status === 'OK' && response.data) {
          setPlano(response.data.plano);
          setAssinante(response.data.assinante);
        }
      } catch (err) {
        console.error('Erro ao carregar plano:', err);
        setErro('Erro ao carregar informações do plano.');
      } finally {
        setLoading(false);
      }
    }

    carregarPlano();
  }, [planoId]);

  const buscarClientePorCpfCnpj = useCallback(
    debounce(async (cpfCnpj: string) => {
      if (!assinante?.id) return;

      const cpfLimpo = cpfCnpj.replace(/\D/g, '');
      if (cpfLimpo.length !== 11 && cpfLimpo.length !== 14) {
        setClienteEncontrado(false);
        return;
      }

      setBuscandoCliente(true);
      try {
        const { data, error } = await supabase.rpc('buscar_cliente_por_cpf_cnpj_sem_auth', {
          p_assinante_id: assinante.id,
          p_cpf_cnpj: cpfLimpo
        });

        if (error) {
          console.error('Erro ao buscar cliente:', error);
          return;
        }

        const response = data as ApiResponsePublicaSemAuth<BuscarClienteResponse>;

        if (response.status === 'OK' && response.data?.encontrado && response.data.cliente) {
          const cliente = response.data.cliente;
          setFormData(prev => ({
            ...prev,
            nome: cliente.nome || prev.nome,
            whatsapp: cliente.whatsapp || prev.whatsapp,
            email: cliente.email || prev.email,
            tipo_pessoa: cliente.tipo_pessoa || prev.tipo_pessoa,
            rua: cliente.rua || prev.rua,
            numero: cliente.numero || prev.numero,
            complemento: cliente.complemento || prev.complemento,
            bairro: cliente.bairro || prev.bairro,
            cidade: cliente.cidade || prev.cidade,
            uf: cliente.uf || prev.uf,
            cep: cliente.cep || prev.cep,
          }));
          setClienteEncontrado(true);
          if (cliente.cep) {
            setCepEncontrado(true);
          }
        } else {
          setClienteEncontrado(false);
        }
      } catch (err) {
        console.error('Erro ao buscar cliente:', err);
      } finally {
        setBuscandoCliente(false);
      }
    }, 500),
    [assinante?.id]
  );

  const buscarEnderecoPorCep = useCallback(
    debounce(async (cep: string) => {
      const cepLimpo = cep.replace(/\D/g, '');
      
      if (cepLimpo.length !== 8) {
        setCepEncontrado(false);
        setCepInvalido(false);
        return;
      }

      setBuscandoCep(true);
      setCepInvalido(false);
      
      try {
        const endereco = await buscarCep(cepLimpo);
        
        if (endereco) {
          setFormData(prev => ({
            ...prev,
            rua: endereco.rua || prev.rua,
            bairro: endereco.bairro || prev.bairro,
            cidade: endereco.cidade || prev.cidade,
            uf: endereco.uf || prev.uf,
            complemento: endereco.complemento || prev.complemento,
          }));
          setCepEncontrado(true);
          setCepInvalido(false);
        } else {
          setCepEncontrado(false);
          setCepInvalido(true);
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
        setCepInvalido(true);
      } finally {
        setBuscandoCep(false);
      }
    }, 500),
    []
  );

  const handleCpfCnpjChange = (value: string) => {
    const numeros = value.replace(/\D/g, '');
    let formatted = numeros;
    
    if (numeros.length <= 11) {
      formatted = formatCPF(numeros);
      setFormData(prev => ({ ...prev, cpf_cnpj: formatted, tipo_pessoa: 'FISICA' }));
    } else {
      formatted = formatCNPJ(numeros.slice(0, 14));
      setFormData(prev => ({ ...prev, cpf_cnpj: formatted, tipo_pessoa: 'JURIDICA' }));
    }

    buscarClientePorCpfCnpj(numeros);
  };

  const handleWhatsAppChange = (value: string) => {
    const numeros = value.replace(/\D/g, '').slice(0, 11);
    setFormData(prev => ({ ...prev, whatsapp: formatWhatsApp(numeros) }));
  };

  const handleCepChange = (value: string) => {
    const numeros = value.replace(/\D/g, '').slice(0, 8);
    const formatted = formatCEP(numeros);
    setFormData(prev => ({ ...prev, cep: formatted }));
    
    if (numeros.length === 8) {
      buscarEnderecoPorCep(numeros);
    } else {
      setCepEncontrado(false);
      setCepInvalido(false);
    }
  };

  const validarEndereco = (): boolean => {
    if (!isPlanoPago) return true;

    const { cep, rua, numero, bairro, cidade, uf } = formData;
    const cepLimpo = cep?.replace(/\D/g, '') || '';
    
    return (
      cepLimpo.length === 8 &&
      (rua?.trim() || '').length > 0 &&
      (numero?.trim() || '').length > 0 &&
      (bairro?.trim() || '').length > 0 &&
      (cidade?.trim() || '').length > 0 &&
      (uf?.trim() || '').length === 2
    );
  };

  const criarAssinatura = async (confirmarDuplicacao: boolean = false) => {
    if (!planoId) return;

    if (isPlanoPago && !validarEndereco()) {
      setErroSubmit('Para planos pagos, é necessário informar o endereço completo (CEP, rua, número, bairro, cidade e UF).');
      return;
    }

    setProcessando(true);
    setErroSubmit(null);

    try {
      const dadosCliente: DadosClienteAssinatura = {
        nome: formData.nome.trim(),
        whatsapp: formData.whatsapp.replace(/\D/g, ''),
        cpf_cnpj: formData.cpf_cnpj?.replace(/\D/g, '') || undefined,
        tipo_pessoa: formData.tipo_pessoa,
        email: formData.email?.trim() || undefined,
        rua: formData.rua?.trim() || undefined,
        numero: formData.numero?.trim() || undefined,
        complemento: formData.complemento?.trim() || undefined,
        bairro: formData.bairro?.trim() || undefined,
        cidade: formData.cidade?.trim() || undefined,
        uf: formData.uf?.trim().toUpperCase() || undefined,
        cep: formData.cep?.replace(/\D/g, '') || undefined,
      };

      const { data, error } = await supabase.rpc('criar_assinatura_sem_auth', {
        p_cliente_plano_id: planoId,
        p_dados_cliente: dadosCliente,
        p_confirmar_duplicacao: confirmarDuplicacao
      });

      if (error) {
        console.error('Erro ao criar assinatura:', error);
        setErroSubmit('Erro de conexão. Tente novamente.');
        return;
      }

      const response = data as ApiResponsePublicaSemAuth<CriarAssinaturaResponse | CriarAssinaturaWarningResponse>;

      if (response.status === 'ERROR') {
        const mensagem = ERROR_MESSAGES[response.code || ''] || response.message || 'Erro ao criar assinatura.';
        setErroSubmit(mensagem);
        return;
      }

      if (response.status === 'WARNING' && response.code === 'ASSINATURA_DUPLICADA') {
        setShowDuplicadoDialog(true);
        return;
      }

      if (response.status === 'OK' && response.data) {
        const successData = response.data as CriarAssinaturaResponse;
        setLinkPagamento(successData.link_pagamento);
        setSucesso(true);
      }
    } catch (err) {
      console.error('Erro ao criar assinatura:', err);
      setErroSubmit('Erro inesperado. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    criarAssinatura(false);
  };

  const handleConfirmarDuplicacao = () => {
    setShowDuplicadoDialog(false);
    criarAssinatura(true);
  };

  const handleIrParaPagamento = () => {
    if (linkPagamento) {
      window.location.href = linkPagamento;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando informações do plano...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Link Inválido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{erro}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Assinatura Criada!
            </CardTitle>
            <CardDescription>
              Sua assinatura foi criada com sucesso. Clique abaixo para realizar o pagamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Valor da primeira cobrança</p>
              <p className="text-2xl font-bold font-mono text-primary">
                {formatCurrency(plano?.valor_mensal || 0)}
              </p>
            </div>
            <Button onClick={handleIrParaPagamento} className="w-full" data-testid="button-ir-pagamento">
              Ir para Pagamento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">25h.com.br</h1>
            <p className="text-sm text-muted-foreground">Gestão de Cobranças</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>{plano?.nome}</CardTitle>
                  <CardDescription>{plano?.descricao}</CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg font-mono" data-testid="badge-valor">
                  {formatCurrency(plano?.valor_mensal || 0)}/{plano?.periodicidade?.toLowerCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Oferecido por: <span className="font-medium text-foreground">{assinante?.nome_fantasia || assinante?.nome}</span></p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seus Dados</CardTitle>
              <CardDescription>Preencha seus dados para realizar a assinatura</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="cpf_cnpj">CPF ou CNPJ</Label>
                    <div className="relative">
                      <Input
                        id="cpf_cnpj"
                        value={formData.cpf_cnpj}
                        onChange={(e) => handleCpfCnpjChange(e.target.value)}
                        placeholder="000.000.000-00"
                        data-testid="input-cpf-cnpj"
                      />
                      {buscandoCliente && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {clienteEncontrado && !buscandoCliente && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {clienteEncontrado && (
                      <p className="text-xs text-green-600 mt-1">Dados encontrados! Campos preenchidos automaticamente.</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Seu nome completo"
                      required
                      data-testid="input-nome"
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp">WhatsApp *</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => handleWhatsAppChange(e.target.value)}
                      placeholder="(00) 00000-0000"
                      required
                      data-testid="input-whatsapp"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      data-testid="input-email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tipo_pessoa">Tipo de Pessoa</Label>
                    <Select
                      value={formData.tipo_pessoa}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_pessoa: value as 'FISICA' | 'JURIDICA' }))}
                    >
                      <SelectTrigger data-testid="select-tipo-pessoa">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FISICA">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Pessoa Física
                          </div>
                        </SelectItem>
                        <SelectItem value="JURIDICA">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Pessoa Jurídica
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Endereço {isPlanoPago ? <span className="text-destructive">*</span> : '(opcional)'}
                    </p>
                  </div>
                  
                  {isPlanoPago && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Para planos pagos, o endereço completo é obrigatório.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="cep">
                        CEP {isPlanoPago && <span className="text-destructive">*</span>}
                      </Label>
                      <div className="relative">
                        <Input
                          id="cep"
                          value={formData.cep}
                          onChange={(e) => handleCepChange(e.target.value)}
                          placeholder="00000-000"
                          required={isPlanoPago}
                          data-testid="input-cep"
                        />
                        {buscandoCep && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {cepEncontrado && !buscandoCep && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                        {cepInvalido && !buscandoCep && (
                          <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                        )}
                      </div>
                      {cepEncontrado && (
                        <p className="text-xs text-green-600 mt-1">Endereço encontrado! Campos preenchidos automaticamente.</p>
                      )}
                      {cepInvalido && (
                        <p className="text-xs text-destructive mt-1">CEP não encontrado. Verifique o número ou preencha manualmente.</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="rua">
                        Rua {isPlanoPago && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        id="rua"
                        value={formData.rua}
                        onChange={(e) => setFormData(prev => ({ ...prev, rua: e.target.value }))}
                        placeholder="Nome da rua"
                        required={isPlanoPago}
                        data-testid="input-rua"
                      />
                    </div>

                    <div>
                      <Label htmlFor="numero">
                        Número {isPlanoPago && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        id="numero"
                        value={formData.numero}
                        onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                        placeholder="123"
                        required={isPlanoPago}
                        data-testid="input-numero"
                      />
                    </div>

                    <div>
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        value={formData.complemento}
                        onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                        placeholder="Apto, sala, etc."
                        data-testid="input-complemento"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bairro">
                        Bairro {isPlanoPago && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        id="bairro"
                        value={formData.bairro}
                        onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                        placeholder="Nome do bairro"
                        required={isPlanoPago}
                        data-testid="input-bairro"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cidade">
                        Cidade {isPlanoPago && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                        placeholder="Nome da cidade"
                        required={isPlanoPago}
                        data-testid="input-cidade"
                      />
                    </div>

                    <div>
                      <Label htmlFor="uf">
                        UF {isPlanoPago && <span className="text-destructive">*</span>}
                      </Label>
                      <Select
                        value={formData.uf}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, uf: value }))}
                      >
                        <SelectTrigger data-testid="select-uf">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {UF_OPTIONS.map((uf) => (
                            <SelectItem key={uf} value={uf}>
                              {uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {erroSubmit && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{erroSubmit}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={processando} data-testid="button-assinar">
                  {processando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    `Assinar por ${formatCurrency(plano?.valor_mensal || 0)}/${plano?.periodicidade?.toLowerCase()}`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Ao assinar, você concorda em receber cobranças mensais de {assinante?.nome_fantasia || assinante?.nome}.
          </p>
        </div>
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 25h.com.br - Gestão de Cobranças</p>
        </div>
      </footer>

      <Dialog open={showDuplicadoDialog} onOpenChange={setShowDuplicadoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Assinatura Existente
            </DialogTitle>
            <DialogDescription>
              Você já possui uma assinatura ativa deste plano. Deseja criar outra mesmo assim?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDuplicadoDialog(false)} data-testid="button-cancelar-duplicacao">
              Cancelar
            </Button>
            <Button onClick={handleConfirmarDuplicacao} disabled={processando} data-testid="button-confirmar-duplicacao">
              {processando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Sim, criar nova assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
