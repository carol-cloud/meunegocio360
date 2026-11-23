import { AppError } from '../../shared/errors/app-error.js';

// Erros esperados do RF-BE-003 (tabela "Erros").

export function erroClienteNaoEncontrado() {
  return new AppError({
    status: 404,
    code: 'CUSTOMER_NOT_FOUND',
    title: 'Cliente não encontrado',
    detail: 'O cliente informado não existe.',
    tipo: 'cliente-nao-encontrado',
  });
}

export function erroDocumentoDuplicado() {
  return new AppError({
    status: 409,
    code: 'CUSTOMER_DOCUMENT_DUPLICATE',
    title: 'Documento já cadastrado',
    detail:
      'Já existe um cliente com este documento. Ele pode estar inativo: consulte a listagem ' +
      'com a situação "Todos" e reative-o, se for o caso.',
    tipo: 'cliente-documento-duplicado',
  });
}

export function erroClienteComHistorico() {
  return new AppError({
    status: 422,
    code: 'CUSTOMER_HAS_HISTORY',
    title: 'Cliente com histórico',
    detail:
      'O cliente possui vendas ou ordens de serviço vinculadas e não pode ser excluído. ' +
      'Inative o cliente.',
    tipo: 'cliente-com-historico',
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
