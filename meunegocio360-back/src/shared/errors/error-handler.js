import { ZodError } from 'zod';
import { AppError, tipoDeProblema } from './app-error.js';

// Handler de rota inexistente, em problem+json (RNF-BE-14).
export function naoEncontrado(_req, _res, next) {
  next(
    new AppError({
      status: 404,
      code: 'NOT_FOUND',
      title: 'Recurso não encontrado',
      detail: 'O recurso solicitado não existe.',
      tipo: 'nao-encontrado',
    }),
  );
}

function deZod(erro) {
  return {
    status: 400,
    code: 'VALIDATION_ERROR',
    title: 'Dados inválidos',
    detail: 'Um ou mais campos são inválidos.',
    type: tipoDeProblema('validacao'),
    errors: erro.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'body',
      message: issue.message,
    })),
  };
}

// Erros do express.json(): JSON malformado, corpo grande demais, charset inválido etc.
function ehErroDoCorpo(erro) {
  return erro?.expose === true && typeof erro.type === 'string' && erro.status < 500;
}

// Middleware único de erros, registrado por último em app.js. Precisa dos 4 parâmetros
// para o Express reconhecê-lo como tratador de erros.
export function tratadorDeErros(erro, req, res, _next) {
  let problema;

  if (erro instanceof AppError) {
    problema = erro;
    if (erro.headers) res.set(erro.headers);
  } else if (erro instanceof ZodError) {
    problema = deZod(erro);
  } else if (ehErroDoCorpo(erro)) {
    problema = {
      status: 400,
      code: 'VALIDATION_ERROR',
      title: 'Dados inválidos',
      detail:
        erro.type === 'entity.parse.failed'
          ? 'O corpo da requisição não é um JSON válido.'
          : 'O corpo da requisição é inválido.',
      type: tipoDeProblema('validacao'),
    };
  } else {
    // Erro inesperado: registra no log e responde sem detalhes internos (RNF-024).
    req.log?.error({ err: erro }, 'Erro inesperado');
    problema = {
      status: 500,
      code: 'INTERNAL_ERROR',
      title: 'Erro interno',
      detail: 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
      type: tipoDeProblema('erro-interno'),
    };
  }

  const corpo = {
    type: problema.type,
    title: problema.title,
    status: problema.status,
    detail: problema.detail,
    instance: req.originalUrl.split('?')[0],
    code: problema.code,
    traceId: req.id,
  };
  if (problema.errors) corpo.errors = problema.errors;

  res.status(problema.status).type('application/problem+json').json(corpo);
}
