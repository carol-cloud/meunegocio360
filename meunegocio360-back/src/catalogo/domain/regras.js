// Regras de negócio puras do RF-BE-005 (sem Express nem Knex, RNF-010).

export const TIPOS_ITEM = Object.freeze(['PRODUTO', 'SERVICO']);

export const SITUACOES = Object.freeze(['ATIVO', 'INATIVO', 'TODOS']);

// RN-04: unidade padrão definida pelo tipo do item.
export const UNIDADE_PADRAO = Object.freeze({ PRODUTO: 'UN', SERVICO: 'H' });

export function unidadeOuPadrao(tipo, unidade) {
  return unidade ?? UNIDADE_PADRAO[tipo];
}

// RN-02: o tipo não pode mudar depois da criação.
export function tipoAlterado(tipoAtual, tipoNovo) {
  return tipoAtual !== tipoNovo;
}

// RN-05: a categoria só é validada quando há uma nova associação (diferente da atual).
export function categoriaMudou(categoriaIdAtual, categoriaIdNova) {
  return categoriaIdNova !== null && categoriaIdNova !== categoriaIdAtual;
}
