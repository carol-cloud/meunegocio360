import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { configureAuth } from '../../../shared/lib/http.js';
import { renovarSessaoUnica } from '../api/auth-api.js';
import { AuthContext, SESSAO_QUERY_KEY } from './auth-context.js';

const ANTECEDENCIA_RENOVACAO_S = 60;

// Restauração na inicialização: somente 401 significa "sem sessão"; falha de rede ou 5xx
// vira erro, sem apagar nada (RF-FE-001, "Comportamentos e mensagens").
async function restaurarSessao() {
  try {
    return await renovarSessaoUnica();
  } catch (erro) {
    if (erro.status === 401) return null;
    throw erro;
  }
}

// Sessão em memória, no cache do TanStack Query (RNF-FE-04, RNF-FE-12).
// O refresh token é um cookie HttpOnly e nunca é lido aqui.
export default function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [sessaoExpirada, setSessaoExpirada] = useState(false);

  const restauracao = useQuery({
    queryKey: SESSAO_QUERY_KEY,
    queryFn: restaurarSessao,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const sessao = restauracao.data ?? null;

  const iniciarSessao = useCallback(
    (novaSessao) => {
      setSessaoExpirada(false);
      queryClient.setQueryData(SESSAO_QUERY_KEY, novaSessao);
    },
    [queryClient],
  );

  const encerrarSessao = useCallback(() => {
    queryClient.setQueryData(SESSAO_QUERY_KEY, null);
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== SESSAO_QUERY_KEY[0] });
    queryClient.getMutationCache().clear();
  }, [queryClient]);

  const expirarSessao = useCallback(() => {
    encerrarSessao();
    setSessaoExpirada(true);
  }, [encerrarSessao]);

  const renovarSessao = useCallback(async () => {
    const novaSessao = await renovarSessaoUnica();
    queryClient.setQueryData(SESSAO_QUERY_KEY, novaSessao);
    return novaSessao.accessToken;
  }, [queryClient]);

  useEffect(
    () =>
      configureAuth({
        getAccessToken: () => queryClient.getQueryData(SESSAO_QUERY_KEY)?.accessToken ?? null,
        refreshSession: renovarSessao,
        onSessionExpired: expirarSessao,
      }),
    [queryClient, renovarSessao, expirarSessao],
  );

  // Renovação preventiva cerca de 60 s antes de expirar; cancelada no logout e ao desmontar.
  const accessToken = sessao?.accessToken;
  const expiresIn = sessao?.expiresIn;
  useEffect(() => {
    if (!accessToken || !expiresIn) return undefined;
    const atrasoMs = Math.max(0, expiresIn - ANTECEDENCIA_RENOVACAO_S) * 1000;
    const timer = setTimeout(() => {
      renovarSessao().catch((erro) => {
        if (erro.status === 401) expirarSessao();
      });
    }, atrasoMs);
    return () => clearTimeout(timer);
  }, [accessToken, expiresIn, renovarSessao, expirarSessao]);

  let status = 'anonimo';
  if (restauracao.isPending) status = 'carregando';
  else if (restauracao.isError) status = restauracao.isFetching ? 'carregando' : 'erro';
  else if (sessao) status = 'autenticado';

  const valor = useMemo(
    () => ({
      status,
      usuario: sessao?.usuario ?? null,
      sessaoExpirada,
      iniciarSessao,
      encerrarSessao,
      tentarRestaurarNovamente: restauracao.refetch,
    }),
    [status, sessao, sessaoExpirada, iniciarSessao, encerrarSessao, restauracao.refetch],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
