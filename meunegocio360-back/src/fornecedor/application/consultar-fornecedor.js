import { erroFornecedorNaoEncontrado } from './erros.js';

// Caso de uso: GET /fornecedores/{id}. Fornecedor de outra empresa responde 404 (RN-01).
export function makeConsultarFornecedorUseCase({
  transacao,
  fornecedorRepository,
  obterEmpresaAtivaId,
}) {
  return async function consultarFornecedor(id) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const fornecedor = await fornecedorRepository.buscarPorId(empresaId, id, { trx });
      if (!fornecedor) throw erroFornecedorNaoEncontrado();
      return fornecedor;
    });
  };
}
