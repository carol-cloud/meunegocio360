import { request } from '../../../shared/lib/http.js';

// Contrato do RF-BE-002 (caminhos relativos a VITE_API_BASE_URL). empresa_id nunca é enviado.
export const empresaApi = {
  obter: () => request('/empresa', { auth: true }),
  // Somente ADMIN (GET /empresa/inativas, paginado): base da reativação após recarregar a página.
  listarInativas: ({ page = 0, size = 10 } = {}) =>
    request(`/empresa/inativas?${new URLSearchParams({ page, size })}`, { auth: true }),
  cadastrar: (dados) => request('/empresa', { method: 'POST', body: dados, auth: true }),
  editar: (id, dados) =>
    request(`/empresa/${encodeURIComponent(id)}`, { method: 'PUT', body: dados, auth: true }),
  alterarSituacao: (id, { ativa, versao }) =>
    request(`/empresa/${encodeURIComponent(id)}/situacao`, {
      method: 'PATCH',
      body: { ativa, versao },
      auth: true,
    }),
};
