import CobrancaTable from '../CobrancaTable'

export default function CobrancaTableExample() {
  const mockCobrancas = [
    {
      id: '1',
      cliente: 'Maria Santos',
      descricao: 'Mensalidade Janeiro/2024',
      valor: 250.00,
      dataVencimento: '2024-01-10',
      statusPagamento: 'PAGO' as const,
    },
    {
      id: '2',
      cliente: 'João Oliveira',
      descricao: 'Mensalidade Janeiro/2024',
      valor: 350.00,
      dataVencimento: '2024-01-15',
      statusPagamento: 'EM_ABERTO' as const,
    },
    {
      id: '3',
      cliente: 'Ana Costa',
      descricao: 'Consulta Avulsa',
      valor: 180.00,
      dataVencimento: '2024-01-20',
      statusPagamento: 'FALHOU' as const,
    },
  ];

  return (
    <div className="p-4">
      <CobrancaTable cobrancas={mockCobrancas} />
    </div>
  )
}
