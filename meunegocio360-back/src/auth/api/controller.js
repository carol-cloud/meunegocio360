import { loginSchema } from './schemas.js';
import { toSessaoResponse, toUsuarioResponse } from './mappers.js';

// Controllers finos (RNF-BE-01): validam a entrada, chamam o caso de uso e devolvem o DTO.
// Erros seguem para o middleware único (o Express 5 encaminha exceções de handlers async).
export function makeAuthController({
  login,
  refresh,
  logout,
  obterUsuarioAutenticado,
  cookieDeRefresh,
  clock,
}) {
  function responderSessao(res, sessao) {
    cookieDeRefresh.definir(res, sessao.refreshToken, sessao.refreshExpiraEm, clock.now());
    res.status(200).json(toSessaoResponse(sessao));
  }

  return {
    async login(req, res) {
      const credenciais = loginSchema.parse(req.body);
      responderSessao(res, await login(credenciais));
    },

    async refresh(req, res) {
      let sessao;
      try {
        sessao = await refresh(cookieDeRefresh.ler(req));
      } catch (erro) {
        // Contrato: em INVALID_REFRESH_TOKEN o cookie é limpo na resposta.
        if (erro.code === 'INVALID_REFRESH_TOKEN') cookieDeRefresh.limpar(res);
        throw erro;
      }
      responderSessao(res, sessao);
    },

    async logout(req, res) {
      await logout(cookieDeRefresh.ler(req));
      cookieDeRefresh.limpar(res);
      res.status(204).end();
    },

    async me(req, res) {
      const usuario = await obterUsuarioAutenticado(req.usuario.id);
      res.status(200).json(toUsuarioResponse(usuario));
    },
  };
}
