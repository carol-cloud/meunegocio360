import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { useLocation } from 'react-router';
import { useUsuarioAutenticado } from '../hooks/useUsuarioAutenticado.js';

// Página inicial provisória (RF-FE-001); será substituída pelo dashboard. A barra de navegação
// e o rodapé passaram ao AppLayout (RF-FE-002).
export default function HomePage() {
  const { data: usuario, isPending, isError } = useUsuarioAutenticado();
  const location = useLocation();
  // Aviso de sucesso vindo de outra tela (ex.: "Empresa cadastrada com sucesso.").
  const [aviso, setAviso] = useState(location.state?.aviso ?? null);

  return (
    <div className="py-5">
      <title>Início | MeuNegócio360</title>
      <div aria-live="polite">
        {aviso && (
          <Alert
            variant="success"
            dismissible
            closeLabel="Fechar aviso"
            onClose={() => setAviso(null)}
          >
            {aviso}
          </Alert>
        )}
      </div>
      {isPending && (
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando seus dados…</span>
        </Spinner>
      )}
      {isError && (
        <Alert variant="danger" role="alert">
          Não foi possível carregar seus dados. Recarregue a página.
        </Alert>
      )}
      {usuario && (
        <>
          <h1>Olá, {usuario.nome}!</h1>
          <p className="text-body-secondary">Perfil: {usuario.perfil}</p>
          <p className="text-body-secondary">E-mail: {usuario.email}</p>
        </>
      )}
    </div>
  );
}
