import Button from 'react-bootstrap/Button';
import { Navigate, Outlet } from 'react-router';
import { PERFIS } from '../../../shared/lib/perfis.js';
import PageLoader from '../../../shared/ui/PageLoader.jsx';
import { useAuth } from '../../auth/index.js';
import { useEmpresa } from '../hooks/useEmpresa.js';

// Guarda das rotas de negócio (RF-FE-002, guarda 2). Apenas UX: o backend responde
// 422 COMPANY_NOT_ACTIVE às operações sem empresa ativa.
export default function RequireEmpresa({ children }) {
  const { usuario } = useAuth();
  const { status, tentarNovamente } = useEmpresa();

  if (status === 'carregando') return <PageLoader mensagem="Carregando os dados da empresa…" />;

  if (status === 'erro') {
    return (
      <div className="py-5 text-center">
        <title>Erro de conexão | MeuNegócio360</title>
        <h1>Não foi possível carregar a empresa</h1>
        <p role="alert">Verifique sua conexão e tente novamente.</p>
        <Button variant="primary" onClick={() => tentarNovamente()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (status === 'ausente') {
    if (usuario?.perfil === PERFIS.ADMIN) return <Navigate to="/empresa/cadastro" replace />;
    return (
      <div className="py-5 text-center">
        <title>Aguardando o cadastro da empresa | MeuNegócio360</title>
        <h1>Aguardando o cadastro da empresa</h1>
        <p className="text-body-secondary">
          Ainda não há uma empresa ativa no sistema. Fale com o administrador para cadastrá-la ou
          reativá-la.
        </p>
      </div>
    );
  }

  return children ?? <Outlet />;
}
