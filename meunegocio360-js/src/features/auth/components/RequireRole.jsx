import { Outlet } from 'react-router';
import AcessoNegadoPage from '../../../shared/ui/AcessoNegadoPage.jsx';
import { useAuth } from '../hooks/useAuth.js';

// Guarda de perfil (RF-FE-002, guarda 3; RNF-FE-16). O perfil vem da sessão em memória,
// nunca do localStorage. Sem permissão, a página protegida nem é montada: nenhuma requisição
// de dados é feita. Apenas UX: a autorização real é do backend (RNF-BE-47).
export default function RequireRole({ perfis, children }) {
  const { usuario } = useAuth();

  if (!usuario || !perfis.includes(usuario.perfil)) return <AcessoNegadoPage />;
  return children ?? <Outlet />;
}
