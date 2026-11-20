import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth-api.js';
import { useAuth } from './useAuth.js';

export function useLogin() {
  const { iniciarSessao } = useAuth();
  return useMutation({ mutationFn: authApi.login, onSuccess: iniciarSessao });
}
