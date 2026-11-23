import express from 'express';
import { exigirPerfil } from '../../shared/security/autorizacao.js';
import { PERFIS } from '../../shared/security/perfis.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     ClienteRequest:
 *       type: object
 *       additionalProperties: false
 *       required: [tipoPessoa, nome, documento]
 *       properties:
 *         tipoPessoa: { type: string, enum: [FISICA, JURIDICA], example: FISICA }
 *         nome: { type: string, minLength: 2, maxLength: 150, example: Maria da Silva }
 *         documento:
 *           type: string
 *           description: 'CPF (FISICA) ou CNPJ (JURIDICA), com ou sem máscara; gravado só com dígitos.'
 *           example: 529.982.247-25
 *         email: { type: string, format: email, maxLength: 160, nullable: true, example: maria@exemplo.com.br }
 *         telefone: { type: string, description: 10 ou 11 dígitos (com ou sem máscara)., nullable: true, example: '11987654321' }
 *     ClienteUpdateRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/ClienteRequest'
 *         - type: object
 *           required: [versao]
 *           properties:
 *             versao: { type: integer, minimum: 0, example: 0 }
 *     ClienteSituacaoRequest:
 *       type: object
 *       additionalProperties: false
 *       required: [ativo, versao]
 *       properties:
 *         ativo: { type: boolean, example: false }
 *         versao: { type: integer, minimum: 0, example: 0 }
 *     Cliente:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid, example: 6c1f0a52-3b7e-4f0e-9a3e-2f7a1d5b8c90 }
 *         tipoPessoa: { type: string, enum: [FISICA, JURIDICA], example: FISICA }
 *         nome: { type: string, example: Maria da Silva }
 *         documento: { type: string, example: '52998224725' }
 *         email: { type: string, nullable: true, example: maria@exemplo.com.br }
 *         telefone: { type: string, nullable: true, example: '11987654321' }
 *         ativo: { type: boolean, example: true }
 *         criadoEm: { type: string, format: date-time }
 *         atualizadoEm: { type: string, format: date-time }
 *         versao: { type: integer, example: 0 }
 *     PaginaDeClientes:
 *       type: object
 *       properties:
 *         content:
 *           type: array
 *           items: { $ref: '#/components/schemas/Cliente' }
 *         page: { type: integer, example: 0 }
 *         size: { type: integer, example: 20 }
 *         totalElements: { type: integer, example: 1 }
 *         totalPages: { type: integer, example: 1 }
 *   parameters:
 *     ClienteId:
 *       name: id
 *       in: path
 *       required: true
 *       schema: { type: string, format: uuid }
 *   responses:
 *     ClienteNaoEncontrado:
 *       description: CUSTOMER_NOT_FOUND (inclusive cliente de outra empresa)
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *           example:
 *             type: https://meunegocio360.com.br/problemas/cliente-nao-encontrado
 *             title: Cliente não encontrado
 *             status: 404
 *             detail: O cliente informado não existe.
 *             instance: /api/v1/clientes/6c1f0a52-3b7e-4f0e-9a3e-2f7a1d5b8c90
 *             code: CUSTOMER_NOT_FOUND
 *             traceId: 9f1c2e7a-0000-0000-0000-000000000000
 *     ConflitoCliente:
 *       description: CUSTOMER_DOCUMENT_DUPLICATE ou VERSION_CONFLICT
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *           example:
 *             type: https://meunegocio360.com.br/problemas/cliente-documento-duplicado
 *             title: Documento já cadastrado
 *             status: 409
 *             detail: 'Já existe um cliente com este documento. Ele pode estar inativo: consulte a listagem com a situação "Todos" e reative-o, se for o caso.'
 *             instance: /api/v1/clientes
 *             code: CUSTOMER_DOCUMENT_DUPLICATE
 *             traceId: 9f1c2e7a-0000-0000-0000-000000000000
 *     ClienteComHistorico:
 *       description: CUSTOMER_HAS_HISTORY (cliente com vendas ou OS vinculadas; inative-o)
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *           example:
 *             type: https://meunegocio360.com.br/problemas/cliente-com-historico
 *             title: Cliente com histórico
 *             status: 422
 *             detail: O cliente possui vendas ou ordens de serviço vinculadas e não pode ser excluído. Inative o cliente.
 *             instance: /api/v1/clientes/6c1f0a52-3b7e-4f0e-9a3e-2f7a1d5b8c90
 *             code: CUSTOMER_HAS_HISTORY
 *             traceId: 9f1c2e7a-0000-0000-0000-000000000000
 */
export function criarClienteRouter({ controller }) {
  const router = express.Router();
  // Matriz de autorização do RF-BE-003: OPERADOR_FINANCEIRO recebe 403 em todas as rotas.
  const comercial = exigirPerfil(PERFIS.ADMIN, PERFIS.OPERADOR_COMERCIAL);

  /**
   * @openapi
   * /clientes:
   *   get:
   *     tags: [Clientes]
   *     summary: Lista clientes da empresa ativa, com busca e paginação (ADMIN, OPERADOR_COMERCIAL)
   *     parameters:
   *       - name: q
   *         in: query
   *         description: Parte do nome (sem distinção de acento ou caixa) ou do documento (com ou sem máscara).
   *         schema: { type: string, maxLength: 150 }
   *       - name: situacao
   *         in: query
   *         schema: { type: string, enum: [ATIVO, INATIVO, TODOS], default: ATIVO }
   *       - name: page
   *         in: query
   *         schema: { type: integer, minimum: 0, default: 0 }
   *       - name: size
   *         in: query
   *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
   *       - name: sort
   *         in: query
   *         schema: { type: string, enum: [nome, criadoEm], default: nome }
   *     responses:
   *       200:
   *         description: Página de clientes
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/PaginaDeClientes' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   *   post:
   *     tags: [Clientes]
   *     summary: Cadastra um cliente, já ativo, na empresa ativa (ADMIN, OPERADOR_COMERCIAL)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/ClienteRequest' }
   *     responses:
   *       201:
   *         description: Cliente cadastrado
   *         headers:
   *           Location: { description: '/api/v1/clientes/{id}', schema: { type: string } }
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Cliente' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       409: { $ref: '#/components/responses/ConflitoCliente' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.get('/clientes', comercial, controller.listar);
  router.post('/clientes', comercial, controller.cadastrar);

  /**
   * @openapi
   * /clientes/{id}:
   *   get:
   *     tags: [Clientes]
   *     summary: Consulta um cliente da empresa ativa (ADMIN, OPERADOR_COMERCIAL)
   *     parameters:
   *       - $ref: '#/components/parameters/ClienteId'
   *     responses:
   *       200:
   *         description: Cliente
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Cliente' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/ClienteNaoEncontrado' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   *   put:
   *     tags: [Clientes]
   *     summary: Edita um cliente, com controle de versão (ADMIN, OPERADOR_COMERCIAL)
   *     parameters:
   *       - $ref: '#/components/parameters/ClienteId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/ClienteUpdateRequest' }
   *     responses:
   *       200:
   *         description: Cliente atualizado
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Cliente' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/ClienteNaoEncontrado' }
   *       409: { $ref: '#/components/responses/ConflitoCliente' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   *   delete:
   *     tags: [Clientes]
   *     summary: Exclui um cliente sem vínculos (ADMIN, OPERADOR_COMERCIAL)
   *     parameters:
   *       - $ref: '#/components/parameters/ClienteId'
   *     responses:
   *       204: { description: Cliente excluído }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/ClienteNaoEncontrado' }
   *       422: { $ref: '#/components/responses/ClienteComHistorico' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.get('/clientes/:id', comercial, controller.consultar);
  router.put('/clientes/:id', comercial, controller.editar);
  router.delete('/clientes/:id', comercial, controller.excluir);

  /**
   * @openapi
   * /clientes/{id}/situacao:
   *   patch:
   *     tags: [Clientes]
   *     summary: Inativa ou reativa um cliente; idempotente (ADMIN, OPERADOR_COMERCIAL)
   *     parameters:
   *       - $ref: '#/components/parameters/ClienteId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/ClienteSituacaoRequest' }
   *     responses:
   *       200:
   *         description: Situação alterada (ou já era a pedida)
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Cliente' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/ClienteNaoEncontrado' }
   *       409: { $ref: '#/components/responses/ConflitoCliente' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.patch('/clientes/:id/situacao', comercial, controller.alterarSituacao);

  return router;
}
