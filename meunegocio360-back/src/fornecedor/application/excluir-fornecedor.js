import { erroFornecedorComHistorico, erroFornecedorNaoEncontrado } from './erros.js';

// Caso de uso: DELETE /fornecedores/{id} (RN-03, RN-04, RNF-097). Antes de excluir, consulta todos
// os verificadores de vínculo recebidos por injeção, na mesma transação. Com vínculo, 422.
export function makeExcluirFornecedorUseCase({
  transacao,
  fornecedorRepository,
  obterEmpresaAtivaId,
  verificadoresDeVinculo,
}) {
  return async function excluirFornecedor(id) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const fornecedor = await fornecedorRepository.buscarPorId(empresaId, id, {
        trx,
        bloquear: true,
      });
      if (!fornecedor) throw erroFornecedorNaoEncontrado();

      for (const possuiVinculo of verificadoresDeVinculo) {
        if (await possuiVinculo({ fornecedorId: id, empresaId, trx })) {
          throw erroFornecedorComHistorico();
        }
      }
      await fornecedorRepository.excluir(empresaId, id, trx);
    });
  };
}
