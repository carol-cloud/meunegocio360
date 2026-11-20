// API pública da feature auth (RNF-BE-05): composição das dependências por factory functions
// (RNF-BE-03). Somente infra/ recebe o Knex; casos de uso recebem repositórios e `transacao`.
import { criarExecutorDeTransacao } from '../shared/db/knex.js';
import { makeAuthController } from './api/controller.js';
import { criarCookieDeRefresh } from './api/cookie.js';
import { ROTAS_PUBLICAS_AUTH, criarAuthRouter } from './api/routes.js';
import { criarEmissorDeSessao } from './application/emitir-sessao.js';
import { makeLoginUseCase } from './application/login.js';
import { makeLogoutUseCase } from './application/logout.js';
import { makeObterUsuarioAutenticadoUseCase } from './application/obter-usuario-autenticado.js';
import { makeRefreshUseCase } from './application/refresh.js';
import { iniciarLimpezaDeRefreshTokens } from './infra/limpeza-refresh-token.js';
import { criarPasswordHasher } from './infra/password-hasher.js';
import { criarRefreshTokenRepository } from './infra/refresh-token-repository.js';
import { criarTokenService } from './infra/token-service.js';
import { criarUsuarioRepository } from './infra/usuario-repository.js';

export { ROTAS_PUBLICAS_AUTH };

export function criarModuloAuth({ config, knex, clock, logger, verificarOrigin }) {
  const transacao = criarExecutorDeTransacao(knex);
  const usuarioRepository = criarUsuarioRepository(knex);
  const refreshTokenRepository = criarRefreshTokenRepository(knex);
  const passwordHasher = criarPasswordHasher();
  const tokenService = criarTokenService({
    segredo: config.auth.jwtSecret,
    expiracaoMinutos: config.auth.jwtExpiracaoMinutos,
    clock,
  });
  const emitirSessao = criarEmissorDeSessao({
    refreshTokenRepository,
    tokenService,
    refreshExpiracaoDias: config.auth.refreshExpiracaoDias,
  });

  const controller = makeAuthController({
    login: makeLoginUseCase({
      transacao,
      usuarioRepository,
      refreshTokenRepository,
      passwordHasher,
      emitirSessao,
      clock,
      logger,
      maxTentativas: config.auth.maxTentativas,
      bloqueioMinutos: config.auth.bloqueioMinutos,
    }),
    refresh: makeRefreshUseCase({
      transacao,
      usuarioRepository,
      refreshTokenRepository,
      tokenService,
      emitirSessao,
      clock,
      logger,
    }),
    logout: makeLogoutUseCase({ transacao, refreshTokenRepository, tokenService, clock, logger }),
    obterUsuarioAutenticado: makeObterUsuarioAutenticadoUseCase({ usuarioRepository }),
    cookieDeRefresh: criarCookieDeRefresh({ secure: config.auth.cookieSecure }),
    clock,
  });

  return {
    router: criarAuthRouter({ controller, verificarOrigin }),
    verificarToken: (token) => tokenService.verificarTokenDeAcesso(token),
    iniciarLimpeza: () => iniciarLimpezaDeRefreshTokens({ refreshTokenRepository, clock, logger }),
  };
}
