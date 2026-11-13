import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJsdoc from 'swagger-jsdoc';

const raizSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const problema = (exemplo) => ({
  content: {
    'application/problem+json': {
      schema: { $ref: '#/components/schemas/Problema' },
      ...(exemplo && { example: exemplo }),
    },
  },
});

// Especificação OpenAPI (RNF-030), montada a partir das anotações @openapi das rotas.
export function criarEspecificacaoOpenApi() {
  return swaggerJsdoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'MeuNegocio360 — Núcleo',
        version: '1.0.0',
        description: 'API do microsserviço Núcleo. Requisito implementado: RF-BE-001.',
      },
      servers: [{ url: '/api/v1' }],
      security: [{ bearerAuth: [] }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
        schemas: {
          Problema: {
            type: 'object',
            properties: {
              type: { type: 'string', format: 'uri' },
              title: { type: 'string' },
              status: { type: 'integer' },
              detail: { type: 'string' },
              instance: { type: 'string' },
              code: { type: 'string' },
              traceId: { type: 'string' },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { field: { type: 'string' }, message: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          ValidationError: {
            description: 'VALIDATION_ERROR',
            ...problema({
              type: 'https://meunegocio360.com.br/problemas/validacao',
              title: 'Dados inválidos',
              status: 400,
              detail: 'Um ou mais campos são inválidos.',
              instance: '/api/v1/auth/login',
              code: 'VALIDATION_ERROR',
              traceId: '9f1c2e7a-0000-0000-0000-000000000000',
              errors: [{ field: 'email', message: 'deve ser um e-mail válido' }],
            }),
          },
          Unauthorized: {
            description: 'UNAUTHORIZED (inclui WWW-Authenticate: Bearer)',
            ...problema(),
          },
          OriginNotAllowed: { description: 'ORIGIN_NOT_ALLOWED', ...problema() },
          InternalError: { description: 'INTERNAL_ERROR', ...problema() },
        },
      },
    },
    apis: [path.join(raizSrc, '*/api/routes.js')],
  });
}
