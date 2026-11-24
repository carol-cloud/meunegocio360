import { erroItemComHistorico, erroItemNaoEncontrado } from './erros.js';

// Caso de uso: DELETE /itens-catalogo/{id} (RN-09, RNF-097). Consulta todos os verificadores de
// vínculo recebidos por injeção, na mesma transação. Com vínculo, 422 ITEM_HAS_HISTORY.
export function makeExcluirItemCatalogoUseCase({
  transacao,
  itemCatalogoRepository,
  obterEmpresaAtivaId,
  verificadoresDeVinculoItem,
}) {
  return async function excluirItemCatalogo(id) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const item = await itemCatalogoRepository.buscarPorId(empresaId, id, {
        trx,
        bloquear: true,
      });
      if (!item) throw erroItemNaoEncontrado();

      for (const possuiVinculo of verificadoresDeVinculoItem) {
        if (await possuiVinculo({ itemId: id, empresaId, trx })) {
          throw erroItemComHistorico();
        }
      }
      await itemCatalogoRepository.excluir(empresaId, id, trx);
    });
  };
}
