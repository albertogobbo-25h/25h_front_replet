import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import type { Plano, AssinaturaPeriodicidade } from "@/types/assinatura";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModalEscolhaPlanosProps {
  open: boolean;
  onClose: () => void;
  planos: Plano[];
  onSelectPlano: (planoId: number, periodicidade: AssinaturaPeriodicidade) => void;
  loading?: boolean;
}

export default function ModalEscolhaPlanos({
  open,
  onClose,
  planos,
  onSelectPlano,
  loading = false,
}: ModalEscolhaPlanosProps) {
  const [periodicidade, setPeriodicidade] = useState<AssinaturaPeriodicidade>('MENSAL');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calcularDesconto = (valorOriginal: number, valorComDesconto: number) => {
    const desconto = ((valorOriginal - valorComDesconto) / valorOriginal) * 100;
    return Math.round(desconto);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Escolha seu Plano</DialogTitle>
          <DialogDescription>
            Selecione o plano ideal para o seu negócio
          </DialogDescription>
        </DialogHeader>

        <Tabs value={periodicidade} onValueChange={(v) => setPeriodicidade(v as AssinaturaPeriodicidade)}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="MENSAL" data-testid="tab-mensal">Mensal</TabsTrigger>
            <TabsTrigger value="ANUAL" data-testid="tab-anual">
              Anual <span className="ml-1 text-xs text-primary">(economize até 20%)</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={periodicidade} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {planos.map((plano) => {
                const valorOriginal = periodicidade === 'MENSAL' ? plano.valor_mensal : plano.valor_anual;
                const valorComDesconto = periodicidade === 'MENSAL' 
                  ? plano.valor_mensal_com_desconto 
                  : plano.valor_anual_com_desconto;
                const temDesconto = valorComDesconto && valorComDesconto < valorOriginal;
                const percentualDesconto = temDesconto ? calcularDesconto(valorOriginal, valorComDesconto) : 0;

                return (
                  <div
                    key={plano.id}
                    className="border rounded-lg p-6 hover-elevate active-elevate-2 flex flex-col"
                    data-testid={`card-plano-${plano.id}`}
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{plano.titulo}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{plano.descricao}</p>

                      <div className="mb-6">
                        {temDesconto && (
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm line-through text-muted-foreground font-mono">
                              {formatCurrency(valorOriginal)}
                            </span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              -{percentualDesconto}%
                            </span>
                          </div>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold font-mono">
                            {formatCurrency(temDesconto ? valorComDesconto : valorOriginal)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            /{periodicidade === 'MENSAL' ? 'mês' : 'ano'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          <span>Até {plano.limite_clientes_ativos} clientes ativos</span>
                        </div>
                        {plano.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {plano.dias_degustacao > 0 && (
                          <div className="flex items-center gap-2 text-sm text-primary font-medium">
                            <Check className="h-4 w-4" />
                            <span>{plano.dias_degustacao} dias de degustação</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => onSelectPlano(plano.id, periodicidade)}
                      disabled={loading}
                      className="w-full"
                      data-testid={`button-selecionar-plano-${plano.id}`}
                    >
                      {loading ? 'Processando...' : 'Selecionar Plano'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
