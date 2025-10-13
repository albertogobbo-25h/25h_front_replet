import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PlanCardProps {
  titulo: string;
  descricao: string;
  valorMensal: number;
  valorAnual?: number;
  features: string[];
  isGratuito?: boolean;
  isPopular?: boolean;
  onSelect?: () => void;
}

export default function PlanCard({
  titulo,
  descricao,
  valorMensal,
  valorAnual,
  features,
  isGratuito = false,
  isPopular = false,
  onSelect,
}: PlanCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
            Mais Popular
          </span>
        </div>
      )}
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-3xl font-bold font-mono">
            {isGratuito ? 'Grátis' : formatCurrency(valorMensal)}
            {!isGratuito && <span className="text-base font-normal text-muted-foreground">/mês</span>}
          </div>
          {valorAnual && (
            <p className="text-sm text-muted-foreground mt-1">
              ou {formatCurrency(valorAnual)}/ano
            </p>
          )}
        </div>
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={isPopular ? "default" : "outline"}
          onClick={() => {
            console.log('Plan selected:', titulo);
            onSelect?.();
          }}
          data-testid={`button-select-plan-${titulo.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {isGratuito ? 'Começar Grátis' : 'Assinar Agora'}
        </Button>
      </CardFooter>
    </Card>
  );
}
