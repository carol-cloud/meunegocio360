import { AppError } from '../../shared/errors/app-error.js';

// Erros esperados do RF-BE-002 (tabela "Erros").

export function erroEmpresaNaoCadastrada() {
  return new AppError({
    status: 404,
    code: 'COMPANY_NOT_REGISTERED',
    title: 'Empresa não cadastrada',
    detail: 'Não existe empresa ativa. Cadastre a empresa para continuar.',
    tipo: 'empresa-nao-cadastrada',
  });
}

// Lacuna do RF: PUT/PATCH com UUID válido de empresa inexistente.
export function erroEmpresaNaoEncontrada() {
  return new AppError({
    status: 404,
    code: 'COMPANY_NOT_FOUND',
    title: 'Empresa não encontrada',
    detail: 'A empresa informada não existe.',
    tipo: 'empresa-nao-encontrada',
  });
}

export function erroCnpjDuplicado() {
  return new AppError({
    status: 409,
    code: 'COMPANY_CNPJ_DUPLICATE',
    title: 'CNPJ já cadastrado',
    detail: 'Já existe uma empresa cadastrada com este CNPJ.',
    tipo: 'empresa-cnpj-duplicado',
  });
}

export function erroEmpresaJaAtiva() {
  return new AppError({
    status: 409,
    code: 'COMPANY_ALREADY_ACTIVE',
    title: 'Já existe empresa ativa',
    detail: 'Só pode existir uma empresa ativa. Inative a empresa atual antes.',
    tipo: 'empresa-ja-ativa',
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

// Transversal (RNF-096): usado pelas outras features por meio de obterEmpresaAtivaId.
export function erroEmpresaNaoAtiva() {
  return new AppError({
    status: 422,
    code: 'COMPANY_NOT_ACTIVE',
    title: 'Empresa não ativa',
    detail: 'Não existe empresa ativa. Cadastre ou reative a empresa para continuar.',
    tipo: 'empresa-nao-ativa',
  });
}
