// Perfis de acesso (RF-BE-002, RN-07). Use sempre esta constante, nunca strings soltas.
export const PERFIS = Object.freeze({
  ADMIN: 'ADMIN',
  OPERADOR_COMERCIAL: 'OPERADOR_COMERCIAL',
  OPERADOR_FINANCEIRO: 'OPERADOR_FINANCEIRO',
});

export const LISTA_PERFIS = Object.freeze(Object.values(PERFIS));
