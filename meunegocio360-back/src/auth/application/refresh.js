import {
  SituacaoRefreshToken,
  podeRenovarSessao,
  situacaoDoRefreshToken,
} from '../domain/regras.js';
import { erroRefreshTokenInvalido } from './erros.js';

// Caso de uso: POST /auth/refresh (RN-07, RN-08, RN-12 e RN-13).
export function makeRefreshUseCase({
  transacao,
  usuarioRepository,
  refreshTokenRepository,
  tokenService,
  emitirSessao,
  clock,
  logger,
}) {
  return async function refresh(refreshToken) {
    if (!refreshToken) throw erroRefreshTokenInvalido();

    const tokenHash = tokenService.hashDoRefreshToken(refreshToken);

    // Toda a rotação acontece em uma única transação, com a linha do token travada
    // (FOR UPDATE), para que duas renovações simultâneas não gerem dois tokens válidos.
    const resultado = await transacao(async (trx) => {
      const agora = clock.now();
      const registro = await refreshTokenRepository.buscarPorHash(tokenHash, {
        trx,
        bloquear: true,
      });
      if (!registro) return { falha: 'desconhecido' };

      const situacao = situacaoDoRefreshToken(registro, agora);
      if (situacao === SituacaoRefreshToken.REVOGADO) {
        // RN-08: reuso detectado -> revoga a família inteira (inclusive o token mais recente).
        await refreshTokenRepository.revogarFamilia(registro.familiaId, agora, trx);
        return { falha: 'reuso', usuarioId: registro.usuarioId };
      }
      if (situacao === SituacaoRefreshToken.EXPIRADO) {
        return { falha: 'expirado', usuarioId: registro.usuarioId };
      }

      // RN-02 e RN-13: usuário inativo ou bloqueado não renova a sessão.
      const usuario = await usuarioRepository.buscarPorId(registro.usuarioId, { trx });
      if (!podeRenovarSessao(usuario, agora)) {
        await refreshTokenRepository.revogarFamilia(registro.familiaId, agora, trx);
        return { falha: 'usuario_indisponivel', usuarioId: registro.usuarioId };
      }

      // RN-07: revoga o token apresentado e emite um novo na mesma família.
      // RN-12: o refresh não altera ultimo_login_em.
      await refreshTokenRepository.revogar(registro.id, agora, trx);
      return {
        sessao: await emitirSessao({ usuario, familiaId: registro.familiaId, agora, trx }),
      };
    });

    if (resultado.falha) {
      const nivel = resultado.falha === 'reuso' ? 'warn' : 'info';
      logger[nivel](
        { evento: 'REFRESH_FALHA', motivo: resultado.falha, usuarioId: resultado.usuarioId },
        'Renovação de sessão recusada',
      );
      throw erroRefreshTokenInvalido();
    }

    return resultado.sessao;
  };
}
