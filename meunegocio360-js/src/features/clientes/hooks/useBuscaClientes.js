import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { clientesApi } from '../api/clientes-api.js';
import { clientesListaKey } from './chaves.js';

export const TAMANHO_PAGINA = 20;

// Única lógica de busca de clientes (RF-FE-003): usada pela lista e pelo ClienteSelect, para que
// a busca se comporte igual em todas as telas. Cada combinação de parâmetros é uma chave própria
// e a busca anterior é cancelada pelo signal, logo um resultado atrasado nunca sobrescreve o novo.
export function useBuscaClientes(
  { q = '', situacao = 'ATIVO', page = 0, size = TAMANHO_PAGINA },
  { enabled = true } = {},
) {
  const params = { q: q.trim(), situacao, page, size };
  return useQuery({
    queryKey: clientesListaKey(params),
    queryFn: ({ signal }) => clientesApi.listar(params, { signal }),
    enabled,
    placeholderData: keepPreviousData,
  });
}
