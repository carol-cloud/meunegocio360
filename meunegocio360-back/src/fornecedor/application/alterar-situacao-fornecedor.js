import { erroFornecedorNaoEncontrado, erroConflitoDeVersao } from './erros.js';

// Caso de uso: PATCH /fornecedores/{id}/situacao (RN-01; RN-07 do RF-BE-003). Inativar e reativar são idempotentes:
// pedir a situação que o fornecedor já tem devolve o fornecedor sem alterá-lo.
export function makeAlterarSituacaoFornecedorUseCase({
  transacao,
  fornecedorRepository,
  obterEmpresaAtivaId,
  clock,
}) {
  return async function alterarSituacaoFornecedor(id, { ativo, versao }) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const fornecedor = await fornecedorRepository.buscarPorId(empresaId, id, { trx });
      if (!fornecedor) throw erroFornecedorNaoEncontrado();
      if (fornecedor.ativo === ativo) return fornecedor;

      const linhas = await fornecedorRepository.atualizar(
        empresaId,
        id,
        versao,
        { ativo },
        clock.now(),
        trx,
      );
      if (linhas === 0) throw erroConflitoDeVersao();
      return fornecedorRepository.buscarPorId(empresaId, id, { trx });
    });
  };
}
