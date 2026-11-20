import Button from 'react-bootstrap/Button';
import PageLoader from '../../../shared/ui/PageLoader.jsx';
import { useAuth } from '../hooks/useAuth.js';

// Enquanto a sessão é restaurada, nada de login nem de telas protegidas (sem "flash").
export default function SessionGate({ children }) {
  const { status, tentarRestaurarNovamente } = useAuth();

  if (status === 'carregando') return <PageLoader mensagem="Verificando sua sessão…" />;

  if (status === 'erro') {
    return (
      <main className="container py-5 text-center">
        <title>Erro de conexão | MeuNegócio360</title>
        <h1>Não foi possível conectar</h1>
        <p role="alert">Verifique sua conexão e tente novamente.</p>
        <Button variant="primary" onClick={() => tentarRestaurarNovamente()}>
          Tentar novamente
        </Button>
      </main>
    );
  }

  return children;
}
