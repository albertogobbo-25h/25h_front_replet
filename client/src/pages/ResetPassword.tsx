import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const setupRecoverySession = async () => {
      try {
        // Extrair tokens do hash da URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        // Validar presença dos tokens e tipo correto
        if (!accessToken || !refreshToken || type !== 'recovery') {
          toast({
            variant: "destructive",
            title: "Link inválido",
            description: "Este link de recuperação é inválido ou expirou.",
          });
          setTimeout(() => setLocation('/login'), 2000);
          return;
        }

        // Estabelecer sessão de recuperação com o Supabase
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao validar link",
            description: error.message,
          });
          setTimeout(() => setLocation('/login'), 2000);
          return;
        }

        // Limpar hash da URL para não expor tokens
        window.history.replaceState(null, '', window.location.pathname);
        
        setSessionReady(true);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Ocorreu um erro ao processar o link de recuperação.",
        });
        setTimeout(() => setLocation('/login'), 2000);
      }
    };

    setupRecoverySession();
  }, [toast, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas não coincidem",
        description: "Por favor, digite a mesma senha nos dois campos.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao redefinir senha",
          description: error.message,
        });
      } else {
        toast({
          title: "Senha redefinida!",
          description: "Sua senha foi alterada com sucesso. Faça login com sua nova senha.",
        });
        
        // Fazer logout antes de redirecionar para login
        await supabase.auth.signOut();
        setTimeout(() => setLocation('/login'), 2000);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl font-bold text-primary mb-4">25h</div>
          <CardTitle>Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                data-testid="input-confirm-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!password || !confirmPassword || isLoading || !sessionReady}
              data-testid="button-reset-password"
            >
              {!sessionReady ? 'Validando...' : (isLoading ? 'Aguarde...' : 'Redefinir Senha')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
