import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatWhatsApp, unformatWhatsApp } from "@/lib/masks";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { callSupabase, ApiError } from "@/lib/api-helper";
import { useToast } from "@/hooks/use-toast";

interface OnboardingFormProps {
  onComplete?: () => void;
}

export default function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setWhatsapp(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Remover formatação do WhatsApp antes de enviar
      const whatsappSemFormatacao = unformatWhatsApp(whatsapp);

      // Chamar RPC para processar pós-login e criar assinatura gratuita
      await callSupabase(async () => 
        await supabase.rpc('processar_pos_login', {
          p_nome: nome,
          p_whatsapp: whatsappSemFormatacao
        })
      );

      // Atualizar metadados do usuário no Supabase Auth
      await supabase.auth.updateUser({
        data: {
          nome,
          whatsapp: whatsappSemFormatacao,
          onboarding_completed: true,
        }
      });

      toast({
        title: "Bem-vindo ao 25h!",
        description: "Sua conta foi criada com o plano Free.",
      });

      // Navegar para o dashboard após completar onboarding
      setTimeout(() => {
        setLocation('/');
      }, 500);

      onComplete?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro inesperado.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-3xl font-bold text-primary mb-4">25h</div>
          <CardTitle>Bem-vindo!</CardTitle>
          <CardDescription>
            Para começar, precisamos de algumas informações básicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Digite seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                data-testid="input-nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="(11) 98765-4321"
                value={whatsapp}
                onChange={handleWhatsAppChange}
                required
                data-testid="input-whatsapp"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!nome || !whatsapp || isLoading}
              data-testid="button-submit-onboarding"
            >
              {isLoading ? 'Salvando...' : 'Continuar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
