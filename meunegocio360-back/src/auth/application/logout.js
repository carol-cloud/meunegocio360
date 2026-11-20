// Caso de uso: POST /auth/logout (RN-10). Idempotente: sem token, ou com token desconhecido
// ou já revogado, simplesmente não há o que revogar.
export function makeLogoutUseCase({
  transacao,
  refreshTokenRepository,
  tokenService,
  clock,
  logger,
}) {
  return async function logout(refreshToken) {
    if (!refreshToken) return;

    const tokenHash = tokenService.hashDoRefreshToken(refreshToken);
    const usuarioId = await transacao(async (trx) => {
      const registro = await refreshTokenRepository.buscarPorHash(tokenHash, {
        trx,
        bloquear: true,
      });
      if (!registro) return undefined;
      await refreshTokenRepository.revogarFamilia(registro.familiaId, clock.now(), trx);
      return registro.usuarioId;
    });

    if (usuarioId) logger.info({ evento: 'LOGOUT', usuarioId }, 'Logout realizado');
  };
}
