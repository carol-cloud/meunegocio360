import { AppError } from '../../shared/errors/app-error.js';

// Erros esperados do RF-BE-004 (tabela "Erros").

export function erroFornecedorNaoEncontrado() {
  return new AppError({
    status: 404,
    code: 'SUPPLIER_NOT_FOUND',
    title: 'Fornecedor não encontrado',
    detail: 'O fornecedor informado não existe.',
    tipo: 'fornecedor-nao-encontrado',
  });
}

export function erroDocumentoDuplicado() {
  return new AppError({
    status: 409,
    code: 'SUPPLIER_DOCUMENT_DUPLICATE',
    title: 'Documento já cadastrado',
    detail:
      'Já existe um fornecedor com este documento. Ele pode estar inativo: consulte a listagem ' +
      'com a situação "Todos" e reative-o, se for o caso.',
    tipo: 'fornecedor-documento-duplicado',
  });
}

export function erroFornecedorComHistorico() {
  return new AppError({
    status: 422,
    code: 'SUPPLIER_HAS_HISTORY',
    title: 'Fornecedor com histórico',
    detail:
      'O fornecedor possui pedidos de compra ou contas a pagar vinculados e não pode ser ' +
      'excluído. Inative o fornecedor.',
    tipo: 'fornecedor-com-historico',
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
