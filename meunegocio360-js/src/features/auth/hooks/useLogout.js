import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authApi } from '../api/auth-api.js';
import { useAuth } from './useAuth.js';

// Logout: a falha da chamada é ignorada; a sessão local é sempre descartada (ciclo de vida, item 5).
export function useLogout() {
  const { encerrarSessao } = useAuth();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => authApi.logout().catch(() => null),
    onSettled: () => {
      encerrarSessao();
      navigate('/login', { replace: true });
    },
  });
}
