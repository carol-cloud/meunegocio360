import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { empresaApi } from '../api/empresa-api.js';
import { EMPRESAS_INATIVAS_QUERY_KEY } from '../context/empresa-context.js';

export const TAMANHO_PAGINA_INATIVAS = 10;

// Página de empresas inativas (GET /empresa/inativas, somente ADMIN).
export function useEmpresasInativas({ page, enabled }) {
  return useQuery({
    queryKey: [...EMPRESAS_INATIVAS_QUERY_KEY, page],
    queryFn: () => empresaApi.listarInativas({ page, size: TAMANHO_PAGINA_INATIVAS }),
    enabled,
    placeholderData: keepPreviousData,
  });
}
