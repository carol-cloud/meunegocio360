import { useQuery } from '@tanstack/react-query';
import { clientesApi } from '../api/clientes-api.js';
import { clienteKey } from './chaves.js';

// Cliente para a tela de edição (GET /clientes/{id}).
export function useCliente(id) {
  return useQuery({
    queryKey: clienteKey(id),
    queryFn: ({ signal }) => clientesApi.obter(id, { signal }),
    enabled: Boolean(id),
    retry: (tentativas, erro) => erro?.status >= 500 && tentativas < 2,
  });
}
