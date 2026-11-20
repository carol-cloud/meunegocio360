// Cliente HTTP único da aplicação (RNF-FE-10, RNF-FE-11, RNF-FE-14).
// Não conhece nenhuma feature: a sessão se registra nele por configureAuth (RNF-FE-01).

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor({ status, code, detail, errors = [], retryAfter = null }) {
    super(detail ?? code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
    this.errors = errors;
    this.retryAfter = retryAfter;
  }

  get isServerOrNetworkError() {
    return this.status === 0 || this.status >= 500;
  }
}

const semSessao = {
  getAccessToken: () => null,
  refreshSession: () => Promise.reject(new ApiError({ status: 401, code: 'UNAUTHORIZED' })),
  onSessionExpired: () => {},
};

let sessao = semSessao;

// refreshSession DEVE ser single-flight (RNF-FE-15) e resolver com o novo token de acesso.
export function configureAuth(handlers) {
  sessao = { ...semSessao, ...handlers };
  return () => {
    sessao = semSessao;
  };
}

function lerRetryAfter(valor) {
  if (!valor) return null;
  const segundos = Number(valor);
  if (Number.isFinite(segundos)) return Math.max(0, segundos);
  const data = Date.parse(valor);
  return Number.isNaN(data) ? null : Math.max(0, Math.ceil((data - Date.now()) / 1000));
}

async function paraApiError(resposta) {
  const tipo = resposta.headers.get('Content-Type') ?? '';
  const corpo = tipo.includes('json') ? await resposta.json().catch(() => ({})) : {};
  return new ApiError({
    status: resposta.status,
    code: corpo.code ?? `HTTP_${resposta.status}`,
    detail: corpo.detail,
    errors: Array.isArray(corpo.errors) ? corpo.errors : [],
    retryAfter: lerRetryAfter(resposta.headers.get('Retry-After')),
  });
}

async function executar(caminho, { method = 'GET', body, headers = {} }, token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const cabecalhos = {
    Accept: 'application/json, application/problem+json',
    'X-Request-Id': crypto.randomUUID(),
    ...headers,
  };
  if (body !== undefined) cabecalhos['Content-Type'] = 'application/json';
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      method,
      headers: cabecalhos,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      signal: controller.signal,
    });
  } catch {
    throw new ApiError({
      status: 0,
      code: controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
  } finally {
    clearTimeout(timer);
  }

  if (!resposta.ok) throw await paraApiError(resposta);
  if (resposta.status === 204) return null;
  return resposta.json();
}

// auth: true injeta o token e, diante de 401, renova a sessão uma única vez e repete a
// requisição. As rotas /auth/* usam auth: false e nunca entram nesse fluxo (sem laço).
export async function request(caminho, { auth = false, ...opcoes } = {}) {
  if (!auth) return executar(caminho, opcoes);

  try {
    return await executar(caminho, opcoes, sessao.getAccessToken());
  } catch (erro) {
    if (!(erro instanceof ApiError) || erro.status !== 401) throw erro;
  }

  let novoToken;
  try {
    novoToken = await sessao.refreshSession();
  } catch (falha) {
    if (falha instanceof ApiError && falha.status === 401) sessao.onSessionExpired();
    throw falha;
  }
  return executar(caminho, opcoes, novoToken);
}
