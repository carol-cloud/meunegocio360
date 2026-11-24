import { useMutation } from '@tanstack/react-query';
import { empresaApi } from '../api/empresa-api.js';
import { useEmpresa } from './useEmpresa.js';

// Cada mutação atualiza o EmpresaProvider com a resposta (sem nova consulta ao GET /empresa).

export function useCadastrarEmpresa() {
  const { atualizarEmpresa } = useEmpresa();
  return useMutation({ mutationFn: empresaApi.cadastrar, onSuccess: atualizarEmpresa });
}

export function useEditarEmpresa() {
  const { atualizarEmpresa } = useEmpresa();
  return useMutation({
    mutationFn: ({ id, dados }) => empresaApi.editar(id, dados),
    onSuccess: atualizarEmpresa,
  });
}

export function useAlterarSituacaoEmpresa() {
  const { atualizarEmpresa } = useEmpresa();
  return useMutation({
    mutationFn: ({ id, ativa, versao }) => empresaApi.alterarSituacao(id, { ativa, versao }),
    onSuccess: atualizarEmpresa,
  });
}
