import { erroItemNaoEncontrado } from './erros.js';

// Caso de uso: GET /itens-catalogo/{id}. Item de outra empresa responde 404 (RN-01).
export function makeConsultarItemCatalogoUseCase({
  transacao,
  itemCatalogoRepository,
  obterEmpresaAtivaId,
}) {
  return async function consultarItemCatalogo(id) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const item = await itemCatalogoRepository.buscarPorId(empresaId, id, { trx });
      if (!item) throw erroItemNaoEncontrado();
      return item;
    });
  };
}
