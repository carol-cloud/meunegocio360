import { montarPagina } from '../../shared/validation/paginacao.js';

// Caso de uso: GET /itens-catalogo (RN-01, RN-08, RN-10, RNF-054). Filtros combinados no banco.
export function makeListarItensCatalogoUseCase({
  transacao,
  itemCatalogoRepository,
  obterEmpresaAtivaId,
}) {
  return async function listarItensCatalogo(filtros) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const { itens, total } = await itemCatalogoRepository.listar(empresaId, filtros, trx);
      return montarPagina({
        conteudo: itens,
        page: filtros.page,
        size: filtros.size,
        totalElements: total,
      });
    });
  };
}
