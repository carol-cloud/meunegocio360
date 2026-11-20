const BASE_TIPO = 'https://meunegocio360.com.br/problemas/';

// Erro esperado da aplicação, convertido em application/problem+json pelo middleware único
// de erros (RNF-BE-14). `headers` permite cabeçalhos associados ao erro (Retry-After,
// WWW-Authenticate).
export class AppError extends Error {
  constructor({ status, code, title, detail, tipo, errors, headers }) {
    super(detail ?? title);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.title = title;
    this.detail = detail;
    this.type = `${BASE_TIPO}${tipo}`;
    this.errors = errors;
    this.headers = headers;
  }
}

export function tipoDeProblema(tipo) {
  return `${BASE_TIPO}${tipo}`;
}
