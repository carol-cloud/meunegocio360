import express from 'express';
import { exigirPerfil } from '../../shared/security/autorizacao.js';
import { PERFIS } from '../../shared/security/perfis.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     EmpresaRequest:
 *       type: object
 *       required: [razaoSocial, cnpj]
 *       properties:
 *         razaoSocial: { type: string, minLength: 3, maxLength: 150, example: Comércio Exemplo Ltda }
 *         nomeFantasia: { type: string, maxLength: 150, nullable: true, example: Exemplo Informática }
 *         cnpj: { type: string, description: Com ou sem máscara; gravado só com dígitos., example: 11.222.333/0001-81 }
 *         email: { type: string, format: email, maxLength: 160, nullable: true, example: contato@exemplo.com.br }
 *         telefone: { type: string, description: 10 ou 11 dígitos (com ou sem máscara)., nullable: true, example: '11987654321' }
 *         fusoHorario: { type: string, description: Identificador IANA., default: America/Sao_Paulo }
 *         moeda: { type: string, enum: [BRL], default: BRL }
 *     EmpresaUpdateRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/EmpresaRequest'
 *         - type: object
 *           required: [versao]
 *           properties:
 *             versao: { type: integer, minimum: 0, example: 0 }
 *     SituacaoRequest:
 *       type: object
 *       required: [ativa, versao]
 *       properties:
 *         ativa: { type: boolean, example: false }
 *         versao: { type: integer, minimum: 0, example: 0 }
 *     Empresa:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         razaoSocial: { type: string, example: Comércio Exemplo Ltda }
 *         nomeFantasia: { type: string, nullable: true, example: Exemplo Informática }
 *         cnpj: { type: string, example: '11222333000181' }
 *         email: { type: string, nullable: true, example: contato@exemplo.com.br }
 *         telefone: { type: string, nullable: true, example: '11987654321' }
 *         fusoHorario: { type: string, example: America/Sao_Paulo }
 *         moeda: { type: string, example: BRL }
 *         ativa: { type: boolean, example: true }
 *         criadoEm: { type: string, format: date-time }
 *         atualizadoEm: { type: string, format: date-time }
 *         versao: { type: integer, example: 0 }
 *   parameters:
 *     EmpresaId:
 *       name: id
 *       in: path
 *       required: true
 *       schema: { type: string, format: uuid }
 *   responses:
 *     EmpresaNaoEncontrada:
 *       description: COMPANY_NOT_FOUND
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *     ConflitoEmpresa:
 *       description: COMPANY_CNPJ_DUPLICATE, COMPANY_ALREADY_ACTIVE ou VERSION_CONFLICT
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *           example:
 *             type: https://meunegocio360.com.br/problemas/empresa-ja-ativa
 *             title: Já existe empresa ativa
 *             status: 409
 *             detail: Só pode existir uma empresa ativa. Inative a empresa atual antes.
 *             instance: /api/v1/empresa
 *             code: COMPANY_ALREADY_ACTIVE
 *             traceId: 9f1c2e7a-0000-0000-0000-000000000000
 *     EmpresaNaoAtiva:
 *       description: >-
 *         COMPANY_NOT_ACTIVE — devolvido pelas operações de negócio das demais features
 *         (clientes, fornecedores, catálogo) quando não existe empresa ativa (RNF-096).
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *           example:
 *             type: https://meunegocio360.com.br/problemas/empresa-nao-ativa
 *             title: Empresa não ativa
 *             status: 422
 *             detail: Não existe empresa ativa. Cadastre ou reative a empresa para continuar.
 *             instance: /api/v1/clientes
 *             code: COMPANY_NOT_ACTIVE
 *             traceId: 9f1c2e7a-0000-0000-0000-000000000000
 */
export function criarEmpresaRouter({ controller }) {
  const router = express.Router();
  const somenteAdmin = exigirPerfil(PERFIS.ADMIN);

  /**
   * @openapi
   * /empresa:
   *   get:
   *     tags: [Empresa]
   *     summary: Consulta a empresa ativa (qualquer perfil)
   *     responses:
   *       200:
   *         description: Empresa ativa
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Empresa' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       404:
   *         description: COMPANY_NOT_REGISTERED (não existe empresa ativa)
   *         content:
   *           application/problem+json:
   *             schema: { $ref: '#/components/schemas/Problema' }
   *             example:
   *               type: https://meunegocio360.com.br/problemas/empresa-nao-cadastrada
   *               title: Empresa não cadastrada
   *               status: 404
   *               detail: Não existe empresa ativa. Cadastre a empresa para continuar.
   *               instance: /api/v1/empresa
   *               code: COMPANY_NOT_REGISTERED
   *               traceId: 9f1c2e7a-0000-0000-0000-000000000000
   *       500: { $ref: '#/components/responses/InternalError' }
   *   post:
   *     tags: [Empresa]
   *     summary: Cadastra a empresa, já ativa (ADMIN)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/EmpresaRequest' }
   *     responses:
   *       201:
   *         description: Empresa cadastrada
   *         headers:
   *           Location: { description: '/api/v1/empresa/{id}', schema: { type: string } }
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Empresa' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       409: { $ref: '#/components/responses/ConflitoEmpresa' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.get('/empresa', controller.consultar);
  router.post('/empresa', somenteAdmin, controller.cadastrar);

  /**
   * @openapi
   * /empresa/{id}:
   *   put:
   *     tags: [Empresa]
   *     summary: Edita a empresa (ADMIN), com controle de versão
   *     parameters:
   *       - $ref: '#/components/parameters/EmpresaId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/EmpresaUpdateRequest' }
   *     responses:
   *       200:
   *         description: Empresa atualizada
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Empresa' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/EmpresaNaoEncontrada' }
   *       409: { $ref: '#/components/responses/ConflitoEmpresa' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.put('/empresa/:id', somenteAdmin, controller.editar);

  /**
   * @openapi
   * /empresa/{id}/situacao:
   *   patch:
   *     tags: [Empresa]
   *     summary: Inativa ou reativa a empresa (ADMIN)
   *     parameters:
   *       - $ref: '#/components/parameters/EmpresaId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/SituacaoRequest' }
   *     responses:
   *       200:
   *         description: Situação alterada
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Empresa' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/EmpresaNaoEncontrada' }
   *       409: { $ref: '#/components/responses/ConflitoEmpresa' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.patch('/empresa/:id/situacao', somenteAdmin, controller.alterarSituacao);

  return router;
}
