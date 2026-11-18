import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth-api.js';
import { useAuth } from './useAuth.js';

// GET /auth/me: chamada autenticada que passa pela renovação automática diante de 401.
export function useUsuarioAutenticado() {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: usuario !== null,
    placeholderData: usuario ?? undefined,
  });
}
