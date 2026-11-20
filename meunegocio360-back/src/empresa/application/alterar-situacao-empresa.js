import { podeAtivar } from '../domain/regras.js';
import { erroConflitoDeVersao, erroEmpresaJaAtiva, erroEmpresaNaoEncontrada } from './erros.js';

// Caso de uso: PATCH /empresa/{id}/situacao (RN-02, RN-04). Inativa ou reativa; nunca exclui.
export function makeAlterarSituacaoEmpresaUseCase({ transacao, empresaRepository, clock }) {
  return async function alterarSituacaoEmpresa(id, { ativa, versao }) {
    return transacao(async (trx) => {
      const empresa = await empresaRepository.buscarPorId(id, { trx });
      if (!empresa) throw erroEmpresaNaoEncontrada();

      if (ativa) {
        const empresaAtiva = await empresaRepository.buscarAtiva({ trx, bloquear: true });
        if (!podeAtivar(empresa, empresaAtiva)) throw erroEmpresaJaAtiva();
      }

      const linhas = await empresaRepository.atualizar(id, versao, { ativa }, clock.now(), trx);
      if (linhas === 0) throw erroConflitoDeVersao();
      return empresaRepository.buscarPorId(id, { trx });
    });
  };
}
