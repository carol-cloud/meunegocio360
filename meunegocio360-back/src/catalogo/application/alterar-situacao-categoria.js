import { erroCategoriaNaoEncontrada, erroConflitoDeVersao } from './erros.js';

// Caso de uso: PATCH /categorias/{id}/situacao (RN-05, RN-06). Idempotente. Inativar a categoria
// não altera os itens que a usam.
export function makeAlterarSituacaoCategoriaUseCase({
  transacao,
  categoriaRepository,
  obterEmpresaAtivaId,
  clock,
}) {
  return async function alterarSituacaoCategoria(id, { ativo, versao }) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const categoria = await categoriaRepository.buscarPorId(empresaId, id, { trx });
      if (!categoria) throw erroCategoriaNaoEncontrada();
      if (categoria.ativo === ativo) return categoria;

      const linhas = await categoriaRepository.atualizar(
        empresaId,
        id,
        versao,
        { ativo },
        clock.now(),
        trx,
      );
      if (linhas === 0) throw erroConflitoDeVersao();
      return categoriaRepository.buscarPorId(empresaId, id, { trx });
    });
  };
}
