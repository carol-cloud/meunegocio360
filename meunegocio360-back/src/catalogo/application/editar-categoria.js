import {
  erroCategoriaNaoEncontrada,
  erroConflitoDeVersao,
  erroNomeDeCategoriaDuplicado,
} from './erros.js';

// Caso de uso: PUT /categorias/{id} (RN-06, RNF-BE-28). Renomeia a categoria com controle de versão.
export function makeEditarCategoriaUseCase({
  transacao,
  categoriaRepository,
  obterEmpresaAtivaId,
  clock,
}) {
  return async function editarCategoria(id, { nome, versao }) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      if (!(await categoriaRepository.buscarPorId(empresaId, id, { trx }))) {
        throw erroCategoriaNaoEncontrada();
      }
      if (await categoriaRepository.existeNome(empresaId, nome, { trx, exceto: id })) {
        throw erroNomeDeCategoriaDuplicado();
      }
      const linhas = await categoriaRepository.atualizar(
        empresaId,
        id,
        versao,
        { nome },
        clock.now(),
        trx,
      );
      if (linhas === 0) throw erroConflitoDeVersao();
      return categoriaRepository.buscarPorId(empresaId, id, { trx });
    });
  };
}
