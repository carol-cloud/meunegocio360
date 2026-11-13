import pino from 'pino';
import { obterRequestId } from './contexto.js';

// Logger estruturado (RNF-BE-44): JSON fora de desenvolvimento, com redação de dados sensíveis.
export function criarLogger(config) {
  return pino({
    level: config.logLevel,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        'senha',
        'token',
        '*.senha',
        '*.token',
        '*.accessToken',
        '*.refreshToken',
      ],
      censor: '[REDACTED]',
    },
    // Inclui o X-Request-Id da requisição corrente em todo log emitido durante ela.
    mixin() {
      const requestId = obterRequestId();
      return requestId ? { requestId } : {};
    },
    ...(config.nodeEnv === 'development' && {
      transport: { target: 'pino-pretty', options: { translateTime: 'SYS:standard' } },
    }),
  });
}

// Mascara o e-mail para eventos de segurança: "ana@dominio.com" -> "a***@dominio.com".
export function mascararEmail(email) {
  if (typeof email !== 'string') return undefined;
  const [usuario, dominio] = email.split('@');
  if (!dominio) return '***';
  return `${usuario.slice(0, 1)}***@${dominio}`;
}
