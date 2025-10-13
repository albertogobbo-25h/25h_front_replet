import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface OnboardingFormProps {
  onSubmit?: (data: { nome: string; whatsapp: string }) => void;
}

export default function OnboardingForm({ onSubmit }: OnboardingFormProps) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Onboarding submitted:', { nome, whatsapp });
    onSubmit?.({ nome, whatsapp });
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
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                data-testid="input-whatsapp"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!nome || !whatsapp}
              data-testid="button-submit-onboarding"
            >
              Continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
