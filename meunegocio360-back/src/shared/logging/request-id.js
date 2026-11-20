import { randomUUID } from 'node:crypto';

// Aceita o X-Request-Id recebido apenas se for um identificador simples, para evitar
// injeção de conteúdo arbitrário nos logs.
const FORMATO_ACEITO = /^[A-Za-z0-9._-]{1,128}$/;

// Lê ou gera o X-Request-Id e o devolve no cabeçalho da resposta (RNF-BE-43).
export function requestId(req, res, next) {
  const recebido = req.get('X-Request-Id');
  req.id = recebido && FORMATO_ACEITO.test(recebido) ? recebido : randomUUID();
  res.set('X-Request-Id', req.id);
  next();
}
