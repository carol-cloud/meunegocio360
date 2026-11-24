import express from 'express';
import { exigirPerfil } from '../../shared/security/autorizacao.js';
import { PERFIS } from '../../shared/security/perfis.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     FornecedorRequest:
 *       type: object
 *       additionalProperties: false
 *       required: [tipoPessoa, nome, documento]
 *       properties:
 *         tipoPessoa: { type: string, enum: [FISICA, JURIDICA], example: JURIDICA }
 *         nome: { type: string, minLength: 2, maxLength: 150, example: Distribuidora Alfa Ltda }
 *         documento:
 *           type: string
 *           description: 'CPF (FISICA) ou CNPJ (JURIDICA), com ou sem máscara; gravado só com dígitos.'
 *           example: 11.222.333/0001-81
 *         email: { type: string, format: email, maxLength: 160, nullable: true, example: compras@alfa.com.br }
 *         telefone: { type: string, description: 10 ou 11 dígitos (com ou sem máscara)., nullable: true, example: '11987654321' }
 *     FornecedorUpdateRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/FornecedorRequest'
 *         - type: object
 *           required: [versao]
 *           properties:
 *             versao: { type: integer, minimum: 0, example: 0 }
 *     FornecedorSituacaoRequest:
 *       type: object
 *       additionalProperties: false
 *       required: [ativo, versao]
 *       properties:
 *         ativo: { type: boolean, example: false }
 *         versao: { type: integer, minimum: 0, example: 0 }
 *     Fornecedor:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid, example: 6c1f0a52-3b7e-4f0e-9a3e-2f7a1d5b8c90 }
 *         tipoPessoa: { type: string, enum: [FISICA, JURIDICA], example: JURIDICA }
 *         nome: { type: string, example: Distribuidora Alfa Ltda }
 *         documento: { type: string, example: '11222333000181' }
 *         email: { type: string, nullable: true, example: compras@alfa.com.br }
 *         telefone: { type: string, nullable: true, example: '11987654321' }
 *         ativo: { type: boolean, example: true }
 *         criadoEm: { type: string, format: date-time }
 *         atualizadoEm: { type: string, format: date-time }
 *         versao: { type: integer, example: 0 }
 *     PaginaDeFornecedores:
 *       type: object
 *       properties:
 *         content:
 *           type: array
 *           items: { $ref: '#/components/schemas/Fornecedor' }
 *         page: { type: integer, example: 0 }
 *         size: { type: integer, example: 20 }
 *         totalElements: { type: integer, example: 1 }
 *         totalPages: { type: integer, example: 1 }
 *   parameters:
 *     FornecedorId:
 *       name: id
 *       in: path
 *       required: true
 *       schema: { type: string, format: uuid }
 *   responses:
 *     FornecedorNaoEncontrado:
 *       description: SUPPLIER_NOT_FOUND (inclusive fornecedor de outra empresa)
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *           example:
 *             type: https://meunegocio360.com.br/problemas/fornecedor-nao-encontrado
 *             title: Fornecedor não encontrado
 *             status: 404
 *             detail: O fornecedor informado não existe.
 *             instance: /api/v1/fornecedores/6c1f0a52-3b7e-4f0e-9a3e-2f7a1d5b8c90
 *             code: SUPPLIER_NOT_FOUND
 *             traceId: 9f1c2e7a-0000-0000-0000-000000000000
 *     ConflitoFornecedor:
 *       description: SUPPLIER_DOCUMENT_DUPLICATE ou VERSION_CONFLICT
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *           example:
 *             type: https://meunegocio360.com.br/problemas/fornecedor-documento-duplicado
 *             title: Documento já cadastrado
 *             status: 409
 *             detail: 'Já existe um fornecedor com este documento. Ele pode estar inativo: consulte a listagem com a situação "Todos" e reative-o, se for o caso.'
 *             instance: /api/v1/fornecedores
 *             code: SUPPLIER_DOCUMENT_DUPLICATE
 *             traceId: 9f1c2e7a-0000-0000-0000-000000000000
 *     FornecedorComHistorico:
 *       description: SUPPLIER_HAS_HISTORY (fornecedor com pedidos de compra ou contas a pagar vinculados; inative-o)
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *           example:
 *             type: https://meunegocio360.com.br/problemas/fornecedor-com-historico
 *             title: Fornecedor com histórico
 *             status: 422
 *             detail: O fornecedor possui pedidos de compra ou contas a pagar vinculados e não pode ser excluído. Inative o fornecedor.
 *             instance: /api/v1/fornecedores/6c1f0a52-3b7e-4f0e-9a3e-2f7a1d5b8c90
 *             code: SUPPLIER_HAS_HISTORY
 *             traceId: 9f1c2e7a-0000-0000-0000-000000000000
 */
export function criarFornecedorRouter({ controller }) {
  const router = express.Router();
  // Matriz de autorização do RF-BE-004 (RN-05), invertida em relação a clientes:
  // OPERADOR_COMERCIAL recebe 403 em todas as rotas.
  const financeiro = exigirPerfil(PERFIS.ADMIN, PERFIS.OPERADOR_FINANCEIRO);

  /**
   * @openapi
   * /fornecedores:
   *   get:
   *     tags: [Fornecedores]
   *     summary: Lista fornecedores da empresa ativa, com busca e paginação (ADMIN, OPERADOR_FINANCEIRO)
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
   *         description: Página de fornecedores
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/PaginaDeFornecedores' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   *   post:
   *     tags: [Fornecedores]
   *     summary: Cadastra um fornecedor, já ativo, na empresa ativa (ADMIN, OPERADOR_FINANCEIRO)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/FornecedorRequest' }
   *     responses:
   *       201:
   *         description: Fornecedor cadastrado
   *         headers:
   *           Location: { description: '/api/v1/fornecedores/{id}', schema: { type: string } }
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Fornecedor' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       409: { $ref: '#/components/responses/ConflitoFornecedor' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.get('/fornecedores', financeiro, controller.listar);
  router.post('/fornecedores', financeiro, controller.cadastrar);

  /**
   * @openapi
   * /fornecedores/{id}:
   *   get:
   *     tags: [Fornecedores]
   *     summary: Consulta um fornecedor da empresa ativa (ADMIN, OPERADOR_FINANCEIRO)
   *     parameters:
   *       - $ref: '#/components/parameters/FornecedorId'
   *     responses:
   *       200:
   *         description: Fornecedor
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Fornecedor' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/FornecedorNaoEncontrado' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   *   put:
   *     tags: [Fornecedores]
   *     summary: Edita um fornecedor, com controle de versão (ADMIN, OPERADOR_FINANCEIRO)
   *     parameters:
   *       - $ref: '#/components/parameters/FornecedorId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/FornecedorUpdateRequest' }
   *     responses:
   *       200:
   *         description: Fornecedor atualizado
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Fornecedor' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/FornecedorNaoEncontrado' }
   *       409: { $ref: '#/components/responses/ConflitoFornecedor' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   *   delete:
   *     tags: [Fornecedores]
   *     summary: Exclui um fornecedor sem vínculos (ADMIN, OPERADOR_FINANCEIRO)
   *     parameters:
   *       - $ref: '#/components/parameters/FornecedorId'
   *     responses:
   *       204: { description: Fornecedor excluído }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/FornecedorNaoEncontrado' }
   *       422: { $ref: '#/components/responses/FornecedorComHistorico' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.get('/fornecedores/:id', financeiro, controller.consultar);
  router.put('/fornecedores/:id', financeiro, controller.editar);
  router.delete('/fornecedores/:id', financeiro, controller.excluir);

  /**
   * @openapi
   * /fornecedores/{id}/situacao:
   *   patch:
   *     tags: [Fornecedores]
   *     summary: Inativa ou reativa um fornecedor; idempotente (ADMIN, OPERADOR_FINANCEIRO)
   *     parameters:
   *       - $ref: '#/components/parameters/FornecedorId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/FornecedorSituacaoRequest' }
   *     responses:
   *       200:
   *         description: Situação alterada (ou já era a pedida)
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Fornecedor' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/FornecedorNaoEncontrado' }
   *       409: { $ref: '#/components/responses/ConflitoFornecedor' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.patch('/fornecedores/:id/situacao', financeiro, controller.alterarSituacao);

  return router;
}
