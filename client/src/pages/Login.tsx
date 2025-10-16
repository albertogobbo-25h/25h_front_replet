import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Fechar painel de recuperação quando alternar para signup
  const handleToggleMode = () => {
    setIsSignup(!isSignup);
    setShowForgotPassword(false);
  };
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = isSignup 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        const errorMessage = !isSignup && error.message.includes('Invalid login credentials')
          ? 'Email ou senha incorretos. Não tem uma conta? Clique em "Cadastre-se" abaixo.'
          : error.message;
        
        toast({
          variant: "destructive",
          title: "Erro na autenticação",
          description: errorMessage,
        });
      } else if (isSignup) {
        toast({
          title: "Conta criada!",
          description: "Verifique seu email para confirmar a conta.",
        });
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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: error.message,
        });
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

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email necessário",
        description: "Por favor, digite seu email para recuperar a senha.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao enviar email",
          description: error.message,
        });
      } else {
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
        setShowForgotPassword(false);
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
          <CardTitle>{isSignup ? 'Criar Conta' : '1 hora a mais no seu dia'}</CardTitle>
          <CardDescription>
            {isSignup 
              ? 'Crie sua conta para começar a gerenciar suas cobranças' 
              : 'Entre com suas credenciais para acessar o sistema'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {!isSignup && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-primary hover:underline"
                    data-testid="button-forgot-password"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!email || !password || isLoading}
              data-testid="button-submit-auth"
            >
              {isLoading ? 'Aguarde...' : (isSignup ? 'Criar Conta' : 'Entrar')}
            </Button>
          </form>

          {showForgotPassword && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <h3 className="font-medium">Recuperar Senha</h3>
                <p className="text-sm text-muted-foreground">
                  Digite seu email acima e clique em "Enviar Link" para receber instruções de recuperação.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={isLoading}
                  className="flex-1"
                  data-testid="button-cancel-forgot-password"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleForgotPassword}
                  disabled={!email || isLoading}
                  className="flex-1"
                  data-testid="button-send-reset-email"
                >
                  {isLoading ? 'Enviando...' : 'Enviar Link'}
                </Button>
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            data-testid="button-google-auth"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar com Google
          </Button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-primary hover:underline"
              data-testid="button-toggle-auth-mode"
            >
              {isSignup ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Cadastre-se'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
