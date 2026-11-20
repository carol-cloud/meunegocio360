import { erroEmpresaNaoAtiva } from './erros.js';

// Função pública de empresa ativa (RNF-096): resolve o empresa_id no servidor para as demais
// features, que a recebem injetada pelo app.js. Sem empresa ativa, 422 COMPANY_NOT_ACTIVE.
export function makeObterEmpresaAtivaId({ empresaRepository }) {
  return async function obterEmpresaAtivaId(trx) {
    const empresa = await empresaRepository.buscarAtiva({ trx });
    if (!empresa) throw erroEmpresaNaoAtiva();
    return empresa.id;
  };
}
