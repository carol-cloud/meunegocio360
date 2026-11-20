import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { ehUuid } from '../../shared/db/uuid.js';

const EMISSOR = 'meunegocio360-core';
const ALGORITMO = 'HS256';

const emSegundos = (data) => Math.floor(data.getTime() / 1000);

// Emissão e validação de tokens (RN-05, RN-06, RN-09 e seção "Token de acesso (JWT)").
export function criarTokenService({ segredo, expiracaoMinutos, clock }) {
  const expiresIn = expiracaoMinutos * 60;

  return {
    expiresIn,

    // Claims: iss, sub, iat, exp, jti e perfil. O iat vem do clock injetado.
    emitirTokenDeAcesso(usuario) {
      return jwt.sign({ perfil: usuario.perfil, iat: emSegundos(clock.now()) }, segredo, {
        algorithm: ALGORITMO,
        issuer: EMISSOR,
        subject: usuario.id,
        jwtid: randomUUID(),
        expiresIn,
      });
    },

    // `algorithms` é obrigatório: rejeita `alg: none` e qualquer outro algoritmo.
    verificarTokenDeAcesso(token) {
      const payload = jwt.verify(token, segredo, {
        algorithms: [ALGORITMO],
        issuer: EMISSOR,
        clockTimestamp: emSegundos(clock.now()),
      });
      if (!ehUuid(payload.sub) || typeof payload.perfil !== 'string') {
        throw new Error('Token de acesso com claims inválidas');
      }
      return { id: payload.sub, perfil: payload.perfil };
    },

    // RN-06: refresh token opaco de 256 bits, Base64 URL-safe.
    gerarRefreshToken: () => randomBytes(32).toString('base64url'),

    // RN-09: apenas o hash SHA-256 é persistido.
    hashDoRefreshToken: (token) => createHash('sha256').update(token).digest('hex'),
  };
}
