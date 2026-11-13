import express from 'express';

// Rotas públicas da feature (RNF-BE-40). Todas as demais exigem token de acesso.
export const ROTAS_PUBLICAS_AUTH = Object.freeze([
  { metodo: 'POST', caminho: '/auth/login' },
  { metodo: 'POST', caminho: '/auth/refresh' },
  { metodo: 'POST', caminho: '/auth/logout' },
]);

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required: [email, senha]
 *       properties:
 *         email: { type: string, format: email, maxLength: 160, example: admin@meunegocio360.com.br }
 *         senha: { type: string, minLength: 8, maxLength: 72, format: password }
 *     Usuario:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         nome: { type: string, example: Administrador }
 *         email: { type: string, format: email, example: admin@meunegocio360.com.br }
 *         perfil: { type: string, enum: [ADMIN, USUARIO] }
 *     Sessao:
 *       type: object
 *       properties:
 *         tokenType: { type: string, example: Bearer }
 *         accessToken: { type: string, example: eyJhbGciOi... }
 *         expiresIn: { type: integer, example: 900 }
 *         usuario: { $ref: '#/components/schemas/Usuario' }
 *   headers:
 *     SetCookieRefresh:
 *       description: Cookie mn360_refresh (HttpOnly; SameSite=Strict; Path=/api/v1/auth).
 *       schema: { type: string }
 */
export function criarAuthRouter({ controller, verificarOrigin }) {
  const router = express.Router();

  /**
   * @openapi
   * /auth/login:
   *   post:
   *     tags: [Autenticação]
   *     summary: Autentica o usuário por e-mail e senha
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/LoginRequest' }
   *     responses:
   *       200:
   *         description: Autenticado. O refresh token vai somente no cookie.
   *         headers:
   *           Set-Cookie: { $ref: '#/components/headers/SetCookieRefresh' }
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Sessao' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401:
   *         description: INVALID_CREDENTIALS
   *         content:
   *           application/problem+json:
   *             schema: { $ref: '#/components/schemas/Problema' }
   *             example:
   *               type: https://meunegocio360.com.br/problemas/credenciais-invalidas
   *               title: Credenciais inválidas
   *               status: 401
   *               detail: E-mail ou senha inválidos.
   *               instance: /api/v1/auth/login
   *               code: INVALID_CREDENTIALS
   *               traceId: 9f1c2e7a-0000-0000-0000-000000000000
   *       429:
   *         description: ACCOUNT_TEMPORARILY_LOCKED
   *         headers:
   *           Retry-After: { description: Segundos até o desbloqueio, schema: { type: integer } }
   *         content:
   *           application/problem+json:
   *             schema: { $ref: '#/components/schemas/Problema' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.post('/auth/login', controller.login);

  /**
   * @openapi
   * /auth/refresh:
   *   post:
   *     tags: [Autenticação]
   *     summary: Renova a sessão (rotação do refresh token enviado no cookie)
   *     description: >-
   *       Sem corpo. O refresh token vai no cookie HttpOnly mn360_refresh, gravado pelo login e
   *       enviado automaticamente pelo navegador (não é possível informá-lo manualmente aqui).
   *     security: []
   *     responses:
   *       200:
   *         description: Sessão renovada, com novo cookie.
   *         headers:
   *           Set-Cookie: { $ref: '#/components/headers/SetCookieRefresh' }
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Sessao' }
   *       401:
   *         description: INVALID_REFRESH_TOKEN (o cookie é limpo)
   *         content:
   *           application/problem+json:
   *             schema: { $ref: '#/components/schemas/Problema' }
   *       403: { $ref: '#/components/responses/OriginNotAllowed' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.post('/auth/refresh', verificarOrigin, controller.refresh);

  /**
   * @openapi
   * /auth/logout:
   *   post:
   *     tags: [Autenticação]
   *     summary: Encerra a sessão (revoga a família do refresh token e limpa o cookie)
   *     security: []
   *     responses:
   *       204: { description: Sessão encerrada (idempotente). }
   *       403: { $ref: '#/components/responses/OriginNotAllowed' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.post('/auth/logout', verificarOrigin, controller.logout);

  /**
   * @openapi
   * /auth/me:
   *   get:
   *     tags: [Autenticação]
   *     summary: Dados do usuário autenticado
   *     responses:
   *       200:
   *         description: Usuário autenticado
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Usuario' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.get('/auth/me', controller.me);

  return router;
}
