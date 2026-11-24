// Perfis da sessão (usuario.perfil), centralizados para nunca aparecerem como texto solto
// (RF-FE-002, "Perfis e acesso"). O controle de acesso no frontend é só UX (RNF-FE-16).
export const PERFIS = Object.freeze({
  ADMIN: 'ADMIN',
  OPERADOR_COMERCIAL: 'OPERADOR_COMERCIAL',
  OPERADOR_FINANCEIRO: 'OPERADOR_FINANCEIRO',
});

export const TODOS_OS_PERFIS = Object.freeze(Object.values(PERFIS));
