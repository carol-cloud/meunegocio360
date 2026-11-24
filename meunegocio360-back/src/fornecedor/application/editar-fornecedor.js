import { erroFornecedorNaoEncontrado, erroConflitoDeVersao } from './erros.js';

// Caso de uso: PUT /fornecedores/{id} (RN-01; RN-09 do RF-BE-003). Tipo e documento podem ser corrigidos, respeitando
// a validação (schema) e a unicidade (índice, traduzido pelo repositório).
export function makeEditarFornecedorUseCase({
  transacao,
  fornecedorRepository,
  obterEmpresaAtivaId,
  clock,
}) {
  return async function editarFornecedor(id, { versao, ...dados }) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      if (!(await fornecedorRepository.buscarPorId(empresaId, id, { trx }))) {
        throw erroFornecedorNaoEncontrado();
      }
      const linhas = await fornecedorRepository.atualizar(
        empresaId,
        id,
        versao,
        dados,
        clock.now(),
        trx,
      );
      if (linhas === 0) throw erroConflitoDeVersao();
      return fornecedorRepository.buscarPorId(empresaId, id, { trx });
    });
  };
}
