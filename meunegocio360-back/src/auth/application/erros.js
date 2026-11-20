import { AppError } from '../../shared/errors/app-error.js';

// Erros esperados do RF-BE-001 (tabela "Erros").

// RN-03: mesma resposta para e-mail inexistente, senha incorreta e usuário inativo.
export function erroCredenciaisInvalidas() {
  return new AppError({
    status: 401,
    code: 'INVALID_CREDENTIALS',
    title: 'Credenciais inválidas',
    detail: 'E-mail ou senha inválidos.',
    tipo: 'credenciais-invalidas',
  });
}

// RN-04: conta temporariamente bloqueada, com Retry-After em segundos.
export function erroContaBloqueada(segundos) {
  return new AppError({
    status: 429,
    code: 'ACCOUNT_TEMPORARILY_LOCKED',
    title: 'Conta temporariamente bloqueada',
    detail: 'Muitas tentativas de login sem sucesso. Tente novamente mais tarde.',
    tipo: 'conta-bloqueada',
    headers: { 'Retry-After': String(segundos) },
  });
}

export function erroRefreshTokenInvalido() {
  return new AppError({
    status: 401,
    code: 'INVALID_REFRESH_TOKEN',
    title: 'Sessão inválida',
    detail: 'A sessão expirou ou é inválida. Faça login novamente.',
    tipo: 'refresh-token-invalido',
  });
}
