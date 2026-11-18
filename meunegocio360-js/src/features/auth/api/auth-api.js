import { request } from '../../../shared/lib/http.js';

// Contrato do RF-BE-001 (caminhos relativos a VITE_API_BASE_URL).
export const authApi = {
  login: ({ email, senha }) => request('/auth/login', { method: 'POST', body: { email, senha } }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me', { auth: true }),
};

let renovacaoEmAndamento = null;

// Single-flight (RNF-FE-15): restauração, renovação preventiva e renovação diante de 401
// compartilham a mesma chamada, pois o refresh token é rotativo. Também evita a chamada
// duplicada do StrictMode.
export function renovarSessaoUnica() {
  renovacaoEmAndamento ??= authApi.refresh().finally(() => {
    renovacaoEmAndamento = null;
  });
  return renovacaoEmAndamento;
}
