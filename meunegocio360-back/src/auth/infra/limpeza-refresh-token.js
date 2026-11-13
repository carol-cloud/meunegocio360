const UMA_HORA_MS = 60 * 60 * 1000;
const RETENCAO_MS = 30 * 24 * UMA_HORA_MS;

// Rotina periódica (RF-BE-001, "Modelo de dados"): remove refresh tokens expirados ou
// revogados há mais de 30 dias. O unref() não impede o processo de encerrar.
export function iniciarLimpezaDeRefreshTokens({
  refreshTokenRepository,
  clock,
  logger,
  intervaloMs = UMA_HORA_MS,
}) {
  async function limpar() {
    try {
      const limite = new Date(clock.now().getTime() - RETENCAO_MS);
      const removidos = await refreshTokenRepository.removerAnterioresA(limite);
      logger.info({ evento: 'LIMPEZA_REFRESH_TOKEN', removidos }, 'Limpeza de refresh tokens');
    } catch (err) {
      logger.error({ err }, 'Falha na limpeza de refresh tokens');
    }
  }

  const temporizador = setInterval(limpar, intervaloMs);
  temporizador.unref();
  return () => clearInterval(temporizador);
}
