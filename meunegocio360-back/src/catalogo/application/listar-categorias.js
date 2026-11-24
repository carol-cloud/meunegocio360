import { montarPagina } from '../../shared/validation/paginacao.js';

// Caso de uso: GET /categorias (RN-01, RNF-054). Lista só as categorias da empresa ativa.
export function makeListarCategoriasUseCase({
  transacao,
  categoriaRepository,
  obterEmpresaAtivaId,
}) {
  return async function listarCategorias({ q, situacao, page, size, sort }) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const { categorias, total } = await categoriaRepository.listar(
        empresaId,
        { q, situacao, page, size, sort },
        trx,
      );
      return montarPagina({ conteudo: categorias, page, size, totalElements: total });
    });
  };
}
