import { erroConflitoDeVersao, erroItemNaoEncontrado } from './erros.js';

// Caso de uso: PATCH /itens-catalogo/{id}/situacao (RN-09, RNF-097). Idempotente.
export function makeAlterarSituacaoItemCatalogoUseCase({
  transacao,
  itemCatalogoRepository,
  obterEmpresaAtivaId,
  clock,
}) {
  return async function alterarSituacaoItemCatalogo(id, { ativo, versao }) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const item = await itemCatalogoRepository.buscarPorId(empresaId, id, { trx });
      if (!item) throw erroItemNaoEncontrado();
      if (item.ativo === ativo) return item;

      const linhas = await itemCatalogoRepository.atualizar(
        empresaId,
        id,
        versao,
        { ativo },
        clock.now(),
        trx,
      );
      if (linhas === 0) throw erroConflitoDeVersao();
      return itemCatalogoRepository.buscarPorId(empresaId, id, { trx });
    });
  };
}
