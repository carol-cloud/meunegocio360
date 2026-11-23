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
        description:
          'API do microsserviço Núcleo. Requisitos implementados: RF-BE-001 a RF-BE-003.',
      },
      tags: [
        { name: 'Autenticação' },
        {
          name: 'Empresa',
          description:
            'Empresa única ativa (RF-BE-002). Sem empresa ativa, as operações de negócio das ' +
            'demais features respondem 422 COMPANY_NOT_ACTIVE (ver a resposta EmpresaNaoAtiva).',
        },
        {
          name: 'Clientes',
          description:
            'Clientes da empresa ativa (RF-BE-003). Acesso: ADMIN e OPERADOR_COMERCIAL; ' +
            'OPERADOR_FINANCEIRO recebe 403 ACCESS_DENIED.',
        },
      ],
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
          Forbidden: {
            description: 'ACCESS_DENIED (perfil sem permissão)',
            ...problema({
              type: 'https://meunegocio360.com.br/problemas/acesso-negado',
              title: 'Acesso negado',
              status: 403,
              detail: 'Seu perfil não tem permissão para esta operação.',
              instance: '/api/v1/empresa',
              code: 'ACCESS_DENIED',
              traceId: '9f1c2e7a-0000-0000-0000-000000000000',
            }),
          },
          OriginNotAllowed: { description: 'ORIGIN_NOT_ALLOWED', ...problema() },
          InternalError: { description: 'INTERNAL_ERROR', ...problema() },
        },
      },
    },
    apis: [path.join(raizSrc, '*/api/routes.js')],
  });
}
