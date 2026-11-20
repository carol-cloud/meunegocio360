// "View" da API (RNF-BE-02): escolhe campo a campo o que sai na resposta.
// Nunca inclui senhaHash, tentativas, bloqueio ou o refresh token.
export function toUsuarioResponse(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
  };
}

export function toSessaoResponse(sessao) {
  return {
    tokenType: 'Bearer',
    accessToken: sessao.accessToken,
    expiresIn: sessao.expiresIn,
    usuario: toUsuarioResponse(sessao.usuario),
  };
}
