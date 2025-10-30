import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { formatWhatsApp, unformatWhatsApp, formatCNPJ, unformatCPFCNPJ, formatCEP } from "@/lib/masks";
import { callSupabase, ApiError } from "@/lib/api-helper";
import { Loader2 } from "lucide-react";

interface DadosAssinante {
  id: string;
  nome: string;
  nome_fantasia: string | null;
  cpf_cnpj: string;
  tipo_pessoa: 'FISICA' | 'JURIDICA';
  email: string;
  whatsapp: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
}

export default function Perfil() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    nome: '',
    nome_fantasia: '',
    email: '',
    cnpj: '',
    whatsapp: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
  });

  // Query: Obter dados do assinante
  const { data: dadosAssinante, isLoading } = useQuery<DadosAssinante | null>({
    queryKey: ['/api/assinante/dados'],
    queryFn: async () => {
      return await callSupabase<DadosAssinante>(async () =>
        await supabase.rpc('obter_dados_assinante')
      );
    },
  });

  // Carregar dados do assinante no formulário
  useEffect(() => {
    if (dadosAssinante) {
      setFormData({
        nome: dadosAssinante.nome || '',
        nome_fantasia: dadosAssinante.nome_fantasia || '',
        email: dadosAssinante.email || '',
        cnpj: formatCNPJ(dadosAssinante.cpf_cnpj || ''),
        whatsapp: formatWhatsApp(dadosAssinante.whatsapp || ''),
        rua: dadosAssinante.rua || '',
        numero: dadosAssinante.numero || '',
        complemento: dadosAssinante.complemento || '',
        bairro: dadosAssinante.bairro || '',
        cidade: dadosAssinante.cidade || '',
        uf: dadosAssinante.uf || '',
        cep: formatCEP(dadosAssinante.cep || ''),
      });
    }
  }, [dadosAssinante]);

  // Mutation: Atualizar dados do assinante
  const atualizarDadosMutation = useMutation({
    mutationFn: async () => {
      return await callSupabase(async () =>
        await supabase.rpc('atualizar_dados_assinante', {
          p_nome: formData.nome,
          p_nome_fantasia: formData.nome_fantasia || null,
          p_cpf_cnpj: unformatCPFCNPJ(formData.cnpj),
          p_tipo_pessoa: 'JURIDICA',
          p_email: formData.email,
          p_whatsapp: unformatWhatsApp(formData.whatsapp) || null,
          p_rua: formData.rua || null,
          p_numero: formData.numero || null,
          p_complemento: formData.complemento || null,
          p_bairro: formData.bairro || null,
          p_cidade: formData.cidade || null,
          p_uf: formData.uf || null,
          p_cep: formData.cep.replace(/\D/g, '') || null,
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assinante/dados'] });
      
      toast({
        title: 'Dados atualizados',
        description: 'Seus dados foram atualizados com sucesso',
      });
      
      // Navegar para o dashboard após salvar
      setTimeout(() => {
        setLocation('/');
      }, 500);
    },
    onError: (error: any) => {
      // Tratamento de erros específicos conforme guia
      if (error instanceof ApiError) {
        if (error.code === 'INVALID_EMAIL') {
          toast({
            title: 'Email inválido',
            description: 'Por favor, informe um endereço de email válido.',
            variant: 'destructive',
          });
        } else if (error.code === 'INVALID_WHATSAPP') {
          toast({
            title: 'WhatsApp inválido',
            description: 'Por favor, informe um número de WhatsApp válido.',
            variant: 'destructive',
          });
        } else if (error.code === 'INVALID_DOCUMENTO') {
          toast({
            title: 'CNPJ inválido',
            description: 'Por favor, informe um CNPJ válido.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro ao atualizar dados',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Erro ao atualizar dados',
          description: 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    atualizarDadosMutation.mutate();
  };

  const handleChange = (field: string, value: string) => {
    if (field === 'whatsapp') {
      setFormData(prev => ({ ...prev, [field]: formatWhatsApp(value) }));
    } else if (field === 'cnpj') {
      setFormData(prev => ({ ...prev, [field]: formatCNPJ(value) }));
    } else if (field === 'cep') {
      setFormData(prev => ({ ...prev, [field]: formatCEP(value) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados da Empresa</CardTitle>
            <CardDescription>Informações cadastrais da sua empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Razão Social <span className="text-destructive">*</span></Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  required
                  data-testid="input-nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                <Input
                  id="nome_fantasia"
                  value={formData.nome_fantasia}
                  onChange={(e) => handleChange('nome_fantasia', e.target.value)}
                  placeholder="Como sua empresa é conhecida"
                  data-testid="input-nome-fantasia"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ <span className="text-destructive">*</span></Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleChange('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                  required
                  data-testid="input-cnpj"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="(11) 98765-4321"
                data-testid="input-whatsapp"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
            <CardDescription>Informações de endereço (opcional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="rua">Rua</Label>
                <Input
                  id="rua"
                  value={formData.rua}
                  onChange={(e) => handleChange('rua', e.target.value)}
                  data-testid="input-rua"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleChange('numero', e.target.value)}
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
                  onChange={(e) => handleChange('complemento', e.target.value)}
                  data-testid="input-complemento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleChange('bairro', e.target.value)}
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
                  onChange={(e) => handleChange('cidade', e.target.value)}
                  data-testid="input-cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  maxLength={2}
                  value={formData.uf}
                  onChange={(e) => handleChange('uf', e.target.value.toUpperCase())}
                  data-testid="input-uf"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleChange('cep', e.target.value)}
                  data-testid="input-cep"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={atualizarDadosMutation.isPending}
            data-testid="button-save-profile"
          >
            {atualizarDadosMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
