import ClienteTable from '../ClienteTable'

export default function ClienteTableExample() {
  const mockClientes = [
    { id: '1', nome: 'Maria Santos', whatsapp: '(11) 98765-4321', indAtivo: true },
    { id: '2', nome: 'João Oliveira', whatsapp: '(11) 97654-3210', indAtivo: true },
    { id: '3', nome: 'Ana Costa', whatsapp: '(11) 96543-2109', indAtivo: false },
  ];

  return (
    <div className="p-4">
      <ClienteTable clientes={mockClientes} />
    </div>
  )
}
