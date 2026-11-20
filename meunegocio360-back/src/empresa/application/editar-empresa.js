import { erroConflitoDeVersao, erroEmpresaNaoEncontrada } from './erros.js';

// Caso de uso: PUT /empresa/{id} (RN-01, RN-06). O CNPJ pode mudar, respeitando a unicidade.
export function makeEditarEmpresaUseCase({ transacao, empresaRepository, clock }) {
  return async function editarEmpresa(id, { versao, ...dados }) {
    return transacao(async (trx) => {
      if (!(await empresaRepository.buscarPorId(id, { trx }))) throw erroEmpresaNaoEncontrada();
      const linhas = await empresaRepository.atualizar(id, versao, dados, clock.now(), trx);
      if (linhas === 0) throw erroConflitoDeVersao();
      return empresaRepository.buscarPorId(id, { trx });
    });
  };
}
