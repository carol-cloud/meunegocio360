export const NOME_COOKIE_REFRESH = 'mn360_refresh';

// Atributos do cookie de refresh (RF-BE-001, "Cookie de refresh"). As mesmas opções são
// usadas na criação e na limpeza; caso contrário o navegador não apaga o cookie (RN-10).
export function criarCookieDeRefresh({ secure }) {
  const opcoes = Object.freeze({
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/api/v1/auth',
  });

  return {
    ler: (req) => req.cookies?.[NOME_COOKIE_REFRESH],

    // maxAge em milissegundos (o Express espera ms), igual à validade do refresh token.
    definir(res, token, expiraEm, agora) {
      res.cookie(NOME_COOKIE_REFRESH, token, {
        ...opcoes,
        maxAge: expiraEm.getTime() - agora.getTime(),
      });
    },

    limpar(res) {
      res.clearCookie(NOME_COOKIE_REFRESH, opcoes);
    },
  };
}
