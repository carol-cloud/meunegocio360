import { erroCategoriaEmUso, erroCategoriaNaoEncontrada } from './erros.js';

// Caso de uso: DELETE /categorias/{id} (RN-06). Conta os itens vinculados antes de excluir; a FK sem
// cascata garante a regra no banco (ER_ROW_IS_REFERENCED_2, traduzido pelo repositório).
export function makeExcluirCategoriaUseCase({
  transacao,
  categoriaRepository,
  obterEmpresaAtivaId,
}) {
  return async function excluirCategoria(id) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const categoria = await categoriaRepository.buscarPorId(empresaId, id, {
        trx,
        bloquear: true,
      });
      if (!categoria) throw erroCategoriaNaoEncontrada();

      const quantidade = await categoriaRepository.contarItens(empresaId, id, trx);
      if (quantidade > 0) throw erroCategoriaEmUso(quantidade);
      await categoriaRepository.excluir(empresaId, id, trx);
    });
  };
}
