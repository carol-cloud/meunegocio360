import { montarPagina } from '../../shared/validation/paginacao.js';

// Caso de uso: GET /empresa/inativas (RN-03, RN-04, RNF-BE-13). Lista o histórico de empresas
// inativas para que o ADMIN possa reativar uma delas. Não exige empresa ativa.
export function makeListarEmpresasInativasUseCase({ empresaRepository }) {
  return async function listarEmpresasInativas({ page, size, sort }) {
    const { empresas, total } = await empresaRepository.listarInativas({ page, size, sort });
    return montarPagina({ conteudo: empresas, page, size, totalElements: total });
  };
}
