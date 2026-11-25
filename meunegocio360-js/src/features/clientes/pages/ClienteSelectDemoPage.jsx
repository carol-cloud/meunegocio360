import { useState } from 'react';
import Card from 'react-bootstrap/Card';
import { formatarDocumento } from '../../../shared/lib/documentos.js';
import ClienteSelect from '../components/ClienteSelect.jsx';

// Rota de apoio /dev/cliente-select (RF-FE-003): verifica o seletor enquanto nenhuma tela o
// consome. Registrada somente em desenvolvimento (import.meta.env.DEV).
export default function ClienteSelectDemoPage() {
  const [cliente, setCliente] = useState(null);

  return (
    <div className="py-4">
      <title>ClienteSelect (desenvolvimento) | MeuNegócio360</title>
      <h1 className="mb-3">ClienteSelect</h1>
      <p className="text-body-secondary">
        Página de apoio, disponível só em desenvolvimento. Busque por nome ou documento (somente
        clientes ativos).
      </p>
      <Card>
        <Card.Body className="p-4">
          <ClienteSelect value={cliente} onChange={setCliente} label="Cliente" />
          <p className="mb-0" aria-live="polite">
            {cliente
              ? `Selecionado: ${cliente.nome} (${formatarDocumento(cliente.documento)})`
              : 'Nenhum cliente selecionado.'}
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}
