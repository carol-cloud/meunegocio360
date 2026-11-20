import { AppError } from '../errors/app-error.js';

export function erroNaoAutenticado() {
  return new AppError({
    status: 401,
    code: 'UNAUTHORIZED',
    title: 'Não autenticado',
    detail: 'É necessário um token de acesso válido.',
    tipo: 'nao-autenticado',
    headers: { 'WWW-Authenticate': 'Bearer' },
  });
}

// Autenticação deny-by-default (RNF-BE-40): aplicada a todo o router /api/v1. Somente as
// rotas da lista `rotasPublicas` passam sem token; a comparação é exata (método + caminho).
// `verificarToken` é injetado (vem da feature auth), para que shared/ não dependa de features.
export function criarAutenticacao({ verificarToken, rotasPublicas }) {
  const publicas = new Set(rotasPublicas.map(({ metodo, caminho }) => `${metodo} ${caminho}`));

  return function autenticar(req, _res, next) {
    if (publicas.has(`${req.method} ${req.path}`)) return next();

    const [esquema, token, ...resto] = (req.get('Authorization') ?? '').split(' ');
    if (esquema !== 'Bearer' || !token || resto.length > 0) throw erroNaoAutenticado();

    try {
      req.usuario = verificarToken(token);
    } catch {
      throw erroNaoAutenticado();
    }
    next();
  };
}
