import { AppError } from '../../shared/errors/app-error.js';

// Erros esperados do RF-BE-005 (tabela "Erros").

export function erroItemNaoEncontrado() {
  return new AppError({
    status: 404,
    code: 'ITEM_NOT_FOUND',
    title: 'Item não encontrado',
    detail: 'O item de catálogo informado não existe.',
    tipo: 'item-nao-encontrado',
  });
}

export function erroCategoriaNaoEncontrada() {
  return new AppError({
    status: 404,
    code: 'CATEGORY_NOT_FOUND',
    title: 'Categoria não encontrada',
    detail: 'A categoria informada não existe.',
    tipo: 'categoria-nao-encontrada',
  });
}

export function erroCodigoDuplicado() {
  return new AppError({
    status: 409,
    code: 'ITEM_CODE_DUPLICATE',
    title: 'Código já cadastrado',
    detail:
      'Já existe um item com este código. Ele pode estar inativo: consulte a listagem com a ' +
      'situação "Todos" e reative-o, se for o caso.',
    tipo: 'item-codigo-duplicado',
  });
}

export function erroNomeDeCategoriaDuplicado() {
  return new AppError({
    status: 409,
    code: 'CATEGORY_NAME_DUPLICATE',
    title: 'Categoria já cadastrada',
    detail:
      'Já existe uma categoria com este nome (sem considerar maiúsculas e acentos). Ela pode ' +
      'estar inativa: consulte a listagem com a situação "Todos" e reative-a, se for o caso.',
    tipo: 'categoria-nome-duplicado',
  });
}

export function erroTipoImutavel() {
  return new AppError({
    status: 422,
    code: 'ITEM_TYPE_IMMUTABLE',
    title: 'Tipo do item não pode ser alterado',
    detail:
      'O tipo do item (produto ou serviço) não pode ser alterado depois do cadastro. ' +
      'Cadastre um novo item com o tipo desejado.',
    tipo: 'item-tipo-imutavel',
  });
}

export function erroCategoriaInvalida() {
  return new AppError({
    status: 422,
    code: 'CATEGORY_INVALID',
    title: 'Categoria inválida',
    detail: 'A categoria informada não existe ou está inativa.',
    tipo: 'categoria-invalida',
  });
}

// RN-06: o detail informa quantos itens usam a categoria.
export function erroCategoriaEmUso(quantidade) {
  const itens = quantidade === 1 ? '1 item vinculado' : `${quantidade} itens vinculados`;
  return new AppError({
    status: 422,
    code: 'CATEGORY_IN_USE',
    title: 'Categoria em uso',
    detail: `A categoria possui ${itens} e não pode ser excluída. Inative a categoria.`,
    tipo: 'categoria-em-uso',
  });
}

export function erroItemComHistorico() {
  return new AppError({
    status: 422,
    code: 'ITEM_HAS_HISTORY',
    title: 'Item com histórico',
    detail: 'O item possui vendas ou compras vinculadas e não pode ser excluído. Inative o item.',
    tipo: 'item-com-historico',
  });
}

export function erroConflitoDeVersao() {
  return new AppError({
    status: 409,
    code: 'VERSION_CONFLICT',
    title: 'Conflito de versão',
    detail: 'O registro foi alterado por outra pessoa. Recarregue os dados e tente novamente.',
    tipo: 'conflito-de-versao',
  });
}
