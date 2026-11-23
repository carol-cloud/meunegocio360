import { montarPagina } from '../../shared/validation/paginacao.js';

// Caso de uso: GET /clientes (RN-07, RN-08, RNF-BE-13). Lista só os clientes da empresa ativa.
export function makeListarClientesUseCase({ transacao, clienteRepository, obterEmpresaAtivaId }) {
  return async function listarClientes({ q, situacao, page, size, sort }) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const { clientes, total } = await clienteRepository.listar(
        empresaId,
        { q, situacao, page, size, sort },
        trx,
      );
      return montarPagina({ conteudo: clientes, page, size, totalElements: total });
    });
  };
}
