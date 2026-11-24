import { montarPagina } from '../../shared/validation/paginacao.js';

// Caso de uso: GET /fornecedores (RN-01, RNF-BE-13). Lista só os fornecedores da empresa ativa.
export function makeListarFornecedoresUseCase({
  transacao,
  fornecedorRepository,
  obterEmpresaAtivaId,
}) {
  return async function listarFornecedores({ q, situacao, page, size, sort }) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const { fornecedores, total } = await fornecedorRepository.listar(
        empresaId,
        { q, situacao, page, size, sort },
        trx,
      );
      return montarPagina({ conteudo: fornecedores, page, size, totalElements: total });
    });
  };
}
