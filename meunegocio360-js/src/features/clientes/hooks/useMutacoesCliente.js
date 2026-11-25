import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesApi } from '../api/clientes-api.js';
import { CLIENTES_KEY } from './chaves.js';

// Toda mutação invalida as consultas de clientes: a lista é atualizada sem recarregar a página.
function useMutacaoCliente(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: CLIENTES_KEY }),
  });
}

export function useCadastrarCliente() {
  return useMutacaoCliente(clientesApi.cadastrar);
}

export function useEditarCliente() {
  return useMutacaoCliente(({ id, dados }) => clientesApi.editar(id, dados));
}

export function useAlterarSituacaoCliente() {
  return useMutacaoCliente(({ id, ativo, versao }) =>
    clientesApi.alterarSituacao(id, { ativo, versao }),
  );
}

export function useExcluirCliente() {
  return useMutacaoCliente(({ id }) => clientesApi.excluir(id));
}
