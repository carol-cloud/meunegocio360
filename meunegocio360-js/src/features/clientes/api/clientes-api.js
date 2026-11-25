import { request } from '../../../shared/lib/http.js';

const caminho = (id) => `/clientes/${encodeURIComponent(id)}`;

// Contrato do RF-BE-003 (caminhos relativos a VITE_API_BASE_URL). empresa_id nunca é enviado.
export const clientesApi = {
  // q, situacao (ATIVO | INATIVO | TODOS), page (a partir de 0) e size; signal cancela buscas antigas.
  listar: ({ q, situacao, page, size }, { signal } = {}) => {
    const params = new URLSearchParams({ situacao, page, size });
    if (q) params.set('q', q);
    return request(`/clientes?${params}`, { auth: true, signal });
  },
  obter: (id, { signal } = {}) => request(caminho(id), { auth: true, signal }),
  cadastrar: (dados) => request('/clientes', { method: 'POST', body: dados, auth: true }),
  editar: (id, dados) => request(caminho(id), { method: 'PUT', body: dados, auth: true }),
  alterarSituacao: (id, { ativo, versao }) =>
    request(`${caminho(id)}/situacao`, { method: 'PATCH', body: { ativo, versao }, auth: true }),
  excluir: (id) => request(caminho(id), { method: 'DELETE', auth: true }),
};
