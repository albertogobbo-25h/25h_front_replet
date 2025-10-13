import StatusBadge from '../StatusBadge'

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      <StatusBadge status="EM_ABERTO" />
      <StatusBadge status="PAGO" />
      <StatusBadge status="CANCELADO" />
      <StatusBadge status="FALHOU" />
      <StatusBadge status="ATIVA" />
      <StatusBadge status="AGUARDANDO_PAGAMENTO" />
      <StatusBadge status="SUSPENSA" />
      <StatusBadge status="CANCELADA" />
    </div>
  )
}
