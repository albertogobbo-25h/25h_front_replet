import { Badge } from "@/components/ui/badge";

type StatusType = 'EM_ABERTO' | 'PAGO' | 'CANCELADO' | 'FALHOU' | 'ATIVA' | 'AGUARDANDO_PAGAMENTO' | 'SUSPENSA' | 'CANCELADA';

const statusConfig: Record<StatusType, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  EM_ABERTO: { label: 'Em Aberto', variant: 'default' },
  PAGO: { label: 'Pago', variant: 'secondary' },
  CANCELADO: { label: 'Cancelado', variant: 'outline' },
  FALHOU: { label: 'Falhou', variant: 'destructive' },
  ATIVA: { label: 'Ativa', variant: 'default' },
  AGUARDANDO_PAGAMENTO: { label: 'Aguardando', variant: 'default' },
  SUSPENSA: { label: 'Suspensa', variant: 'destructive' },
  CANCELADA: { label: 'Cancelada', variant: 'outline' },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant} 
      className={className}
      data-testid={`badge-status-${status.toLowerCase()}`}
    >
      {config.label}
    </Badge>
  );
}
