import cors from 'cors';
import helmet from 'helmet';

// Cabeçalhos de segurança (RNF-BE-41): HSTS somente em produção.
export function criarHelmet(config) {
  return helmet(config.isProduction ? {} : { strictTransportSecurity: false });
}

// CORS configurado uma única vez (RNF-BE-42): lista explícita, nunca '*' nem `origin: true`.
export function criarCors(config) {
  return cors({ origin: [...config.cors.allowedOrigins], credentials: true });
}

// Respostas da API não devem ser armazenadas em cache (tokens e dados autenticados).
export function semCache(_req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}
