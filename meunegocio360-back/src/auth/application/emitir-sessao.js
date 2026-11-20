import { randomUUID } from 'node:crypto';
import { somarDias } from '../domain/regras.js';

// Emite um novo par (token de acesso + refresh token) para o usuário. Usado pelo login (nova
// família) e pelo refresh (mesma família, RN-07). Deve rodar dentro da transação do caso de uso.
export function criarEmissorDeSessao({
  refreshTokenRepository,
  tokenService,
  refreshExpiracaoDias,
}) {
  return async function emitirSessao({ usuario, familiaId, agora, trx }) {
    const refreshToken = tokenService.gerarRefreshToken();
    const refreshExpiraEm = somarDias(agora, refreshExpiracaoDias);

    await refreshTokenRepository.inserir(
      {
        id: randomUUID(),
        usuarioId: usuario.id,
        familiaId,
        tokenHash: tokenService.hashDoRefreshToken(refreshToken),
        expiraEm: refreshExpiraEm,
        criadoEm: agora,
      },
      trx,
    );

    return {
      accessToken: tokenService.emitirTokenDeAcesso(usuario),
      expiresIn: tokenService.expiresIn,
      refreshToken,
      refreshExpiraEm,
      usuario,
    };
  };
}
