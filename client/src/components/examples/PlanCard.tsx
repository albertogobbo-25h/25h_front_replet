import PlanCard from '../PlanCard'

export default function PlanCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
      <PlanCard
        titulo="Gratuito"
        descricao="Ideal para começar"
        valorMensal={0}
        isGratuito={true}
        features={[
          'Até 5 clientes ativos',
          'PIX manual',
          'Dashboard básico',
          'Suporte por email',
        ]}
      />
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
    </div>
  )
}
