import PlanCard from "@/components/PlanCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";

export default function Assinatura() {
  // TODO: Remove mock data
  const currentPlan = {
    titulo: 'Gratuito',
    status: 'ATIVA' as const,
    dataInicio: '2024-01-01',
    dataValidade: '2024-12-31',
    periodicidade: 'MENSAL',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Minha Assinatura</h1>
        <p className="text-muted-foreground">Gerencie seu plano e assinatura</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plano Atual</CardTitle>
          <CardDescription>Informações da sua assinatura ativa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{currentPlan.titulo}</h3>
              <p className="text-sm text-muted-foreground">
                Periodicidade: {currentPlan.periodicidade}
              </p>
            </div>
            <StatusBadge status={currentPlan.status} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Data de Início</p>
              <p className="font-mono">{formatDate(currentPlan.dataInicio)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de Validade</p>
              <p className="font-mono">{formatDate(currentPlan.dataValidade)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Fazer Upgrade</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PlanCard
            titulo="Profissional"
            descricao="Para profissionais autônomos"
            valorMensal={49.90}
            valorAnual={499.90}
            isPopular={true}
            features={[
              'Até 50 clientes ativos',
              'PIX Automático',
              'Dashboard completo',
              'Suporte prioritário',
              'Relatórios avançados',
            ]}
          />
          <PlanCard
            titulo="Empresarial"
            descricao="Para empresas e clínicas"
            valorMensal={99.90}
            valorAnual={999.90}
            features={[
              'Clientes ilimitados',
              'PIX Automático',
              'Multi-usuários',
              'API de integração',
              'Suporte 24/7',
              'Customização',
            ]}
          />
          <PlanCard
            titulo="Enterprise"
            descricao="Solução customizada"
            valorMensal={199.90}
            features={[
              'Tudo do Empresarial',
              'Servidor dedicado',
              'White label',
              'Gerente de contas',
              'SLA garantido',
              'Treinamento equipe',
            ]}
          />
        </div>
      </div>
    </div>
  );
}
