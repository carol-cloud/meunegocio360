import { AppError } from '../errors/app-error.js';

export function erroAcessoNegado() {
  return new AppError({
    status: 403,
    code: 'ACCESS_DENIED',
    title: 'Acesso negado',
    detail: 'Seu perfil não tem permissão para esta operação.',
    tipo: 'acesso-negado',
  });
}

// Autorização por perfil nas rotas (RNF-BE-47). Registrado depois da autenticação, que grava
// req.usuario a partir da claim `perfil` do JWT, e antes do controller.
export function exigirPerfil(...perfis) {
  const permitidos = new Set(perfis);
  return function verificarPerfil(req, _res, next) {
    if (!permitidos.has(req.usuario?.perfil)) throw erroAcessoNegado();
    next();
  };
}
