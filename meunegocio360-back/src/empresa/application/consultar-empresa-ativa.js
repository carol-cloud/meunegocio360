import { erroEmpresaNaoCadastrada } from './erros.js';

// Caso de uso: GET /empresa. Sem empresa ativa, 404 COMPANY_NOT_REGISTERED.
export function makeConsultarEmpresaAtivaUseCase({ empresaRepository }) {
  return async function consultarEmpresaAtiva() {
    const empresa = await empresaRepository.buscarAtiva();
    if (!empresa) throw erroEmpresaNaoCadastrada();
    return empresa;
  };
}
