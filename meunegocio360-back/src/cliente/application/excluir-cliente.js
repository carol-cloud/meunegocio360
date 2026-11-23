import { erroClienteComHistorico, erroClienteNaoEncontrado } from './erros.js';

// Caso de uso: DELETE /clientes/{id} (RN-05, RN-06, RNF-097). Antes de excluir, consulta todos
// os verificadores de vínculo recebidos por injeção, na mesma transação. Com vínculo, 422.
export function makeExcluirClienteUseCase({
  transacao,
  clienteRepository,
  obterEmpresaAtivaId,
  verificadoresDeVinculo,
}) {
  return async function excluirCliente(id) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const cliente = await clienteRepository.buscarPorId(empresaId, id, { trx, bloquear: true });
      if (!cliente) throw erroClienteNaoEncontrado();

      for (const possuiVinculo of verificadoresDeVinculo) {
        if (await possuiVinculo({ clienteId: id, empresaId, trx })) {
          throw erroClienteComHistorico();
        }
      }
      await clienteRepository.excluir(empresaId, id, trx);
    });
  };
}
