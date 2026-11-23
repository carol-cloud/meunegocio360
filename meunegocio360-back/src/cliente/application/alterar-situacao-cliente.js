import { erroClienteNaoEncontrado, erroConflitoDeVersao } from './erros.js';

// Caso de uso: PATCH /clientes/{id}/situacao (RN-07). Inativar e reativar são idempotentes:
// pedir a situação que o cliente já tem devolve o cliente sem alterá-lo.
export function makeAlterarSituacaoClienteUseCase({
  transacao,
  clienteRepository,
  obterEmpresaAtivaId,
  clock,
}) {
  return async function alterarSituacaoCliente(id, { ativo, versao }) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const cliente = await clienteRepository.buscarPorId(empresaId, id, { trx });
      if (!cliente) throw erroClienteNaoEncontrado();
      if (cliente.ativo === ativo) return cliente;

      const linhas = await clienteRepository.atualizar(
        empresaId,
        id,
        versao,
        { ativo },
        clock.now(),
        trx,
      );
      if (linhas === 0) throw erroConflitoDeVersao();
      return clienteRepository.buscarPorId(empresaId, id, { trx });
    });
  };
}
