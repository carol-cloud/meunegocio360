// Chaves do TanStack Query da feature (RNF-FE-04). Invalidar CLIENTES_KEY atualiza lista,
// seletor e detalhes de uma vez.
export const CLIENTES_KEY = ['clientes'];
export const clientesListaKey = (params) => [...CLIENTES_KEY, 'lista', params];
export const clienteKey = (id) => [...CLIENTES_KEY, 'detalhe', id];
