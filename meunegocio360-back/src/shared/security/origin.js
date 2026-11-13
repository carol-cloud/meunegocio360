import { AppError } from '../errors/app-error.js';

// Protege os endpoints que usam o cookie (/auth/refresh e /auth/logout) contra requisições
// de outras origens (RNF-BE-40). Se o cabeçalho Origin estiver presente e fora da lista,
// rejeita com 403 antes de qualquer acesso ao banco.
export function criarVerificarOrigin(origensPermitidas) {
  const permitidas = new Set(origensPermitidas);

  return function verificarOrigin(req, _res, next) {
    const origem = req.get('Origin');
    if (origem !== undefined && !permitidas.has(origem)) {
      throw new AppError({
        status: 403,
        code: 'ORIGIN_NOT_ALLOWED',
        title: 'Origem não permitida',
        detail: 'A origem da requisição não é permitida.',
        tipo: 'origem-nao-permitida',
      });
    }
    next();
  };
}
