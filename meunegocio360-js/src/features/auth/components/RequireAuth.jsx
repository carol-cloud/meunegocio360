import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';

// Guarda de rota (RNF-FE-13): apenas UX; a autorização real é do backend.
export default function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status !== 'autenticado') {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }
  return children;
}
