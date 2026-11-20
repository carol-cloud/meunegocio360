import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';
import { destinoSeguro } from '../redirect.js';

// Usuário autenticado não vê o login: vai para a rota de origem (from) ou para "/".
export default function PublicOnly({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'autenticado') {
    return <Navigate to={destinoSeguro(location.state?.from)} replace />;
  }
  return children;
}
