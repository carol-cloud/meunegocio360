// Regras de negócio puras do RF-BE-001 (sem Express nem Knex, RNF-010).

const MS_POR_MINUTO = 60 * 1000;
const MS_POR_DIA = 24 * 60 * MS_POR_MINUTO;

export function somarMinutos(data, minutos) {
  return new Date(data.getTime() + minutos * MS_POR_MINUTO);
}

export function somarDias(data, dias) {
  return new Date(data.getTime() + dias * MS_POR_DIA);
}

// RN-04: conta bloqueada enquanto `bloqueadoAte` estiver no futuro.
export function estaBloqueado(usuario, agora) {
  return usuario.bloqueadoAte instanceof Date && usuario.bloqueadoAte > agora;
}

// Valor do Retry-After (em segundos, arredondado para cima e nunca menor que 1).
export function segundosAteDesbloqueio(usuario, agora) {
  return Math.max(1, Math.ceil((usuario.bloqueadoAte.getTime() - agora.getTime()) / 1000));
}

// RN-04: a falha que atinge o limite bloqueia a conta.
export function atingiuLimiteDeTentativas(tentativasFalhas, maxTentativas) {
  return tentativasFalhas >= maxTentativas;
}

// RN-02 e RN-13: o usuário só pode manter/renovar a sessão se estiver ativo e não bloqueado.
export function podeRenovarSessao(usuario, agora) {
  return Boolean(usuario?.ativo) && !estaBloqueado(usuario, agora);
}

// RN-07 e RN-08: situação de um refresh token apresentado.
export const SituacaoRefreshToken = Object.freeze({
  VALIDO: 'VALIDO',
  REVOGADO: 'REVOGADO',
  EXPIRADO: 'EXPIRADO',
});

export function situacaoDoRefreshToken(refreshToken, agora) {
  if (refreshToken.revogadoEm) return SituacaoRefreshToken.REVOGADO;
  if (refreshToken.expiraEm <= agora) return SituacaoRefreshToken.EXPIRADO;
  return SituacaoRefreshToken.VALIDO;
}
