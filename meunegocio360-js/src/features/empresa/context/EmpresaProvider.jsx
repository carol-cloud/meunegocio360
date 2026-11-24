import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/index.js';
import { empresaApi } from '../api/empresa-api.js';
import {
  EMPRESA_QUERY_KEY,
  EMPRESAS_INATIVAS_QUERY_KEY,
  EmpresaContext,
} from './empresa-context.js';

// 404 COMPANY_NOT_REGISTERED é o estado "ausente", não uma falha (RF-FE-002, guarda 1).
async function obterEmpresaAtiva() {
  try {
    return await empresaApi.obter();
  } catch (erro) {
    if (erro.code === 'COMPANY_NOT_REGISTERED') return null;
    throw erro;
  }
}

// Empresa ativa consultada uma única vez por sessão (TanStack Query, RNF-FE-04).
// O logout remove esta query junto com as demais (AuthProvider.encerrarSessao).
export default function EmpresaProvider({ children }) {
  const { status: statusSessao } = useAuth();
  const queryClient = useQueryClient();

  const consulta = useQuery({
    queryKey: EMPRESA_QUERY_KEY,
    queryFn: obterEmpresaAtiva,
    enabled: statusSessao === 'autenticado',
    staleTime: Infinity,
  });

  // GET /empresa só devolve a empresa ativa: uma resposta com ativa false vira o estado
  // "ausente". A lista de inativas (GET /empresa/inativas) é invalidada a cada mudança.
  const atualizarEmpresa = useCallback(
    (empresa) => {
      queryClient.setQueryData(EMPRESA_QUERY_KEY, empresa?.ativa ? empresa : null);
      queryClient.invalidateQueries({ queryKey: EMPRESAS_INATIVAS_QUERY_KEY });
    },
    [queryClient],
  );

  let status = 'carregando';
  if (consulta.isError) status = consulta.isFetching ? 'carregando' : 'erro';
  else if (consulta.isSuccess) status = consulta.data ? 'ativa' : 'ausente';

  const empresa = consulta.data ?? null;

  const valor = useMemo(
    () => ({
      status,
      empresa,
      nomeExibicao: empresa ? empresa.nomeFantasia || empresa.razaoSocial : null,
      atualizarEmpresa,
      tentarNovamente: consulta.refetch,
    }),
    [status, empresa, atualizarEmpresa, consulta.refetch],
  );

  return <EmpresaContext.Provider value={valor}>{children}</EmpresaContext.Provider>;
}
