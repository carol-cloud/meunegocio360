import { erroClienteNaoEncontrado, erroConflitoDeVersao } from './erros.js';

// Caso de uso: PUT /clientes/{id} (RN-09). Tipo e documento podem ser corrigidos, respeitando
// a validação (schema) e a unicidade (índice, traduzido pelo repositório).
export function makeEditarClienteUseCase({
  transacao,
  clienteRepository,
  obterEmpresaAtivaId,
  clock,
}) {
  return async function editarCliente(id, { versao, ...dados }) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      if (!(await clienteRepository.buscarPorId(empresaId, id, { trx }))) {
        throw erroClienteNaoEncontrado();
      }
      const linhas = await clienteRepository.atualizar(
        empresaId,
        id,
        versao,
        dados,
        clock.now(),
        trx,
      );
      if (linhas === 0) throw erroConflitoDeVersao();
      return clienteRepository.buscarPorId(empresaId, id, { trx });
    });
  };
}
