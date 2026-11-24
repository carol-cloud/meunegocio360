import express from 'express';
import { exigirPerfil } from '../../shared/security/autorizacao.js';
import { PERFIS } from '../../shared/security/perfis.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     ItemCatalogoRequest:
 *       type: object
 *       additionalProperties: false
 *       required: [tipo, nome, preco]
 *       properties:
 *         tipo: { type: string, enum: [PRODUTO, SERVICO], description: 'Imutável após o cadastro (sem conversão de caixa).', example: PRODUTO }
 *         codigo: { type: string, maxLength: 40, nullable: true, description: 'Único por empresa; vazio vira null.', example: MSE-01 }
 *         nome: { type: string, minLength: 2, maxLength: 150, example: Mouse sem fio }
 *         descricao: { type: string, maxLength: 500, nullable: true, example: Mouse óptico sem fio 2.4 GHz }
 *         unidade: { type: string, minLength: 1, maxLength: 6, nullable: true, description: 'Letras ou números, convertidos para maiúsculas. Padrão UN (PRODUTO) ou H (SERVICO).', example: UN }
 *         preco: { type: string, pattern: '^\d{1,10}(\.\d{1,2})?$', description: 'Decimal em texto, não negativo, até 2 casas.', example: '89.90' }
 *         categoriaId: { type: string, format: uuid, nullable: true, description: 'Categoria ativa da empresa (opcional).' }
 *     ItemCatalogoUpdateRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/ItemCatalogoRequest'
 *         - type: object
 *           required: [versao]
 *           properties:
 *             versao: { type: integer, minimum: 0, example: 0 }
 *     SituacaoRequest:
 *       type: object
 *       additionalProperties: false
 *       required: [ativo, versao]
 *       properties:
 *         ativo: { type: boolean, example: false }
 *         versao: { type: integer, minimum: 0, example: 0 }
 *     ItemCatalogo:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid, example: 9d3e7c10-5c2a-4a8e-8d1b-3a9f6e2b7c44 }
 *         tipo: { type: string, enum: [PRODUTO, SERVICO], example: PRODUTO }
 *         codigo: { type: string, nullable: true, example: MSE-01 }
 *         nome: { type: string, example: Mouse sem fio }
 *         descricao: { type: string, nullable: true, example: Mouse óptico sem fio 2.4 GHz }
 *         unidade: { type: string, example: UN }
 *         preco: { type: string, example: '89.90' }
 *         categoria:
 *           type: object
 *           nullable: true
 *           properties:
 *             id: { type: string, format: uuid, example: 2f0a8c9e-1b3d-4e5f-a6b7-c8d9e0f1a2b3 }
 *             nome: { type: string, example: Informática }
 *         ativo: { type: boolean, example: true }
 *         criadoEm: { type: string, format: date-time }
 *         atualizadoEm: { type: string, format: date-time }
 *         versao: { type: integer, example: 0 }
 *     PaginaDeItensCatalogo:
 *       type: object
 *       properties:
 *         content:
 *           type: array
 *           items: { $ref: '#/components/schemas/ItemCatalogo' }
 *         page: { type: integer, example: 0 }
 *         size: { type: integer, example: 20 }
 *         totalElements: { type: integer, example: 1 }
 *         totalPages: { type: integer, example: 1 }
 *     CategoriaRequest:
 *       type: object
 *       additionalProperties: false
 *       required: [nome]
 *       properties:
 *         nome: { type: string, minLength: 2, maxLength: 80, example: Informática }
 *     CategoriaUpdateRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/CategoriaRequest'
 *         - type: object
 *           required: [versao]
 *           properties:
 *             versao: { type: integer, minimum: 0, example: 0 }
 *     Categoria:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid, example: 2f0a8c9e-1b3d-4e5f-a6b7-c8d9e0f1a2b3 }
 *         nome: { type: string, example: Informática }
 *         ativo: { type: boolean, example: true }
 *         criadoEm: { type: string, format: date-time }
 *         atualizadoEm: { type: string, format: date-time }
 *         versao: { type: integer, example: 0 }
 *     PaginaDeCategorias:
 *       type: object
 *       properties:
 *         content:
 *           type: array
 *           items: { $ref: '#/components/schemas/Categoria' }
 *         page: { type: integer, example: 0 }
 *         size: { type: integer, example: 20 }
 *         totalElements: { type: integer, example: 1 }
 *         totalPages: { type: integer, example: 1 }
 *   parameters:
 *     CatalogoId:
 *       name: id
 *       in: path
 *       required: true
 *       schema: { type: string, format: uuid }
 *   responses:
 *     ItemNaoEncontrado:
 *       description: ITEM_NOT_FOUND (inclusive item de outra empresa)
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *           example:
 *             type: https://meunegocio360.com.br/problemas/item-nao-encontrado
 *             title: Item não encontrado
 *             status: 404
 *             detail: O item de catálogo informado não existe.
 *             instance: /api/v1/itens-catalogo/9d3e7c10-5c2a-4a8e-8d1b-3a9f6e2b7c44
 *             code: ITEM_NOT_FOUND
 *             traceId: 9f1c2e7a-0000-0000-0000-000000000000
 *     CategoriaNaoEncontrada:
 *       description: CATEGORY_NOT_FOUND (inclusive categoria de outra empresa)
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *           example:
 *             type: https://meunegocio360.com.br/problemas/categoria-nao-encontrada
 *             title: Categoria não encontrada
 *             status: 404
 *             detail: A categoria informada não existe.
 *             instance: /api/v1/categorias/2f0a8c9e-1b3d-4e5f-a6b7-c8d9e0f1a2b3
 *             code: CATEGORY_NOT_FOUND
 *             traceId: 9f1c2e7a-0000-0000-0000-000000000000
 *     ConflitoItem:
 *       description: ITEM_CODE_DUPLICATE ou VERSION_CONFLICT
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *           example:
 *             type: https://meunegocio360.com.br/problemas/item-codigo-duplicado
 *             title: Código já cadastrado
 *             status: 409
 *             detail: 'Já existe um item com este código. Ele pode estar inativo: consulte a listagem com a situação "Todos" e reative-o, se for o caso.'
 *             instance: /api/v1/itens-catalogo
 *             code: ITEM_CODE_DUPLICATE
 *             traceId: 9f1c2e7a-0000-0000-0000-000000000000
 *     ConflitoCategoria:
 *       description: CATEGORY_NAME_DUPLICATE ou VERSION_CONFLICT
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *           example:
 *             type: https://meunegocio360.com.br/problemas/categoria-nome-duplicado
 *             title: Categoria já cadastrada
 *             status: 409
 *             detail: 'Já existe uma categoria com este nome (sem considerar maiúsculas e acentos). Ela pode estar inativa: consulte a listagem com a situação "Todos" e reative-a, se for o caso.'
 *             instance: /api/v1/categorias
 *             code: CATEGORY_NAME_DUPLICATE
 *             traceId: 9f1c2e7a-0000-0000-0000-000000000000
 *     RegraDoItem:
 *       description: COMPANY_NOT_ACTIVE, ITEM_TYPE_IMMUTABLE ou CATEGORY_INVALID
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *           example:
 *             type: https://meunegocio360.com.br/problemas/item-tipo-imutavel
 *             title: Tipo do item não pode ser alterado
 *             status: 422
 *             detail: O tipo do item (produto ou serviço) não pode ser alterado depois do cadastro. Cadastre um novo item com o tipo desejado.
 *             instance: /api/v1/itens-catalogo/9d3e7c10-5c2a-4a8e-8d1b-3a9f6e2b7c44
 *             code: ITEM_TYPE_IMMUTABLE
 *             traceId: 9f1c2e7a-0000-0000-0000-000000000000
 *     ItemComHistorico:
 *       description: ITEM_HAS_HISTORY (item com vendas ou compras vinculadas; inative-o) ou COMPANY_NOT_ACTIVE
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *           example:
 *             type: https://meunegocio360.com.br/problemas/item-com-historico
 *             title: Item com histórico
 *             status: 422
 *             detail: O item possui vendas ou compras vinculadas e não pode ser excluído. Inative o item.
 *             instance: /api/v1/itens-catalogo/9d3e7c10-5c2a-4a8e-8d1b-3a9f6e2b7c44
 *             code: ITEM_HAS_HISTORY
 *             traceId: 9f1c2e7a-0000-0000-0000-000000000000
 *     CategoriaEmUso:
 *       description: CATEGORY_IN_USE (categoria com itens; inative-a) ou COMPANY_NOT_ACTIVE
 *       content:
 *         application/problem+json:
 *           schema: { $ref: '#/components/schemas/Problema' }
 *           example:
 *             type: https://meunegocio360.com.br/problemas/categoria-em-uso
 *             title: Categoria em uso
 *             status: 422
 *             detail: A categoria possui 3 itens vinculados e não pode ser excluída. Inative a categoria.
 *             instance: /api/v1/categorias/2f0a8c9e-1b3d-4e5f-a6b7-c8d9e0f1a2b3
 *             code: CATEGORY_IN_USE
 *             traceId: 9f1c2e7a-0000-0000-0000-000000000000
 */
export function criarCatalogoRouter({ controller }) {
  const router = express.Router();
  // Matriz de autorização do RF-BE-005: OPERADOR_FINANCEIRO recebe 403 em todas as rotas.
  const comercial = exigirPerfil(PERFIS.ADMIN, PERFIS.OPERADOR_COMERCIAL);

  /**
   * @openapi
   * /itens-catalogo:
   *   get:
   *     tags: [Catálogo — Itens]
   *     summary: Lista itens do catálogo da empresa ativa, com filtros e paginação (ADMIN, OPERADOR_COMERCIAL)
   *     parameters:
   *       - name: q
   *         in: query
   *         description: Parte do nome ou do código (sem distinção de acento ou caixa).
   *         schema: { type: string, maxLength: 150 }
   *       - name: tipo
   *         in: query
   *         description: PRODUTO nunca retorna serviços (e vice-versa).
   *         schema: { type: string, enum: [PRODUTO, SERVICO] }
   *       - name: categoriaId
   *         in: query
   *         schema: { type: string, format: uuid }
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
   *         schema: { type: string, enum: [nome, preco, criadoEm], default: nome }
   *     responses:
   *       200:
   *         description: Página de itens
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/PaginaDeItensCatalogo' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   *   post:
   *     tags: [Catálogo — Itens]
   *     summary: Cadastra um produto ou serviço, já ativo, na empresa ativa (ADMIN, OPERADOR_COMERCIAL)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/ItemCatalogoRequest' }
   *           examples:
   *             produto:
   *               summary: Produto sem categoria
   *               value: { tipo: PRODUTO, codigo: MSE-01, nome: Mouse sem fio, preco: '89.90' }
   *             servico:
   *               summary: Serviço (unidade padrão H)
   *               value: { tipo: SERVICO, nome: Formatação de notebook, preco: '150.00' }
   *     responses:
   *       201:
   *         description: Item cadastrado
   *         headers:
   *           Location: { description: '/api/v1/itens-catalogo/{id}', schema: { type: string } }
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ItemCatalogo' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       409: { $ref: '#/components/responses/ConflitoItem' }
   *       422: { $ref: '#/components/responses/RegraDoItem' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.get('/itens-catalogo', comercial, controller.listarItens);
  router.post('/itens-catalogo', comercial, controller.cadastrarItem);

  /**
   * @openapi
   * /itens-catalogo/{id}:
   *   get:
   *     tags: [Catálogo — Itens]
   *     summary: Consulta um item do catálogo (ADMIN, OPERADOR_COMERCIAL)
   *     parameters:
   *       - $ref: '#/components/parameters/CatalogoId'
   *     responses:
   *       200:
   *         description: Item
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ItemCatalogo' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/ItemNaoEncontrado' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   *   put:
   *     tags: [Catálogo — Itens]
   *     summary: Edita um item, com controle de versão; o tipo não pode mudar (ADMIN, OPERADOR_COMERCIAL)
   *     parameters:
   *       - $ref: '#/components/parameters/CatalogoId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/ItemCatalogoUpdateRequest' }
   *     responses:
   *       200:
   *         description: Item atualizado
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ItemCatalogo' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/ItemNaoEncontrado' }
   *       409: { $ref: '#/components/responses/ConflitoItem' }
   *       422: { $ref: '#/components/responses/RegraDoItem' }
   *       500: { $ref: '#/components/responses/InternalError' }
   *   delete:
   *     tags: [Catálogo — Itens]
   *     summary: Exclui um item sem vendas nem compras vinculadas (ADMIN, OPERADOR_COMERCIAL)
   *     parameters:
   *       - $ref: '#/components/parameters/CatalogoId'
   *     responses:
   *       204: { description: Item excluído }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/ItemNaoEncontrado' }
   *       422: { $ref: '#/components/responses/ItemComHistorico' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.get('/itens-catalogo/:id', comercial, controller.consultarItem);
  router.put('/itens-catalogo/:id', comercial, controller.editarItem);
  router.delete('/itens-catalogo/:id', comercial, controller.excluirItem);

  /**
   * @openapi
   * /itens-catalogo/{id}/situacao:
   *   patch:
   *     tags: [Catálogo — Itens]
   *     summary: Inativa ou reativa um item; idempotente (ADMIN, OPERADOR_COMERCIAL)
   *     parameters:
   *       - $ref: '#/components/parameters/CatalogoId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/SituacaoRequest' }
   *     responses:
   *       200:
   *         description: Situação alterada (ou já era a pedida)
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ItemCatalogo' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/ItemNaoEncontrado' }
   *       409: { $ref: '#/components/responses/ConflitoItem' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.patch('/itens-catalogo/:id/situacao', comercial, controller.alterarSituacaoItem);

  /**
   * @openapi
   * /categorias:
   *   get:
   *     tags: [Catálogo — Categorias]
   *     summary: Lista categorias da empresa ativa, com busca e paginação (ADMIN, OPERADOR_COMERCIAL)
   *     parameters:
   *       - name: q
   *         in: query
   *         description: Parte do nome (sem distinção de acento ou caixa).
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
   *         schema: { type: string, enum: [nome], default: nome }
   *     responses:
   *       200:
   *         description: Página de categorias
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/PaginaDeCategorias' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   *   post:
   *     tags: [Catálogo — Categorias]
   *     summary: Cadastra uma categoria, já ativa, na empresa ativa (ADMIN, OPERADOR_COMERCIAL)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/CategoriaRequest' }
   *     responses:
   *       201:
   *         description: Categoria cadastrada
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Categoria' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       409: { $ref: '#/components/responses/ConflitoCategoria' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.get('/categorias', comercial, controller.listarCategorias);
  router.post('/categorias', comercial, controller.cadastrarCategoria);

  /**
   * @openapi
   * /categorias/{id}:
   *   put:
   *     tags: [Catálogo — Categorias]
   *     summary: Renomeia uma categoria, com controle de versão (ADMIN, OPERADOR_COMERCIAL)
   *     parameters:
   *       - $ref: '#/components/parameters/CatalogoId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/CategoriaUpdateRequest' }
   *     responses:
   *       200:
   *         description: Categoria atualizada
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Categoria' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/CategoriaNaoEncontrada' }
   *       409: { $ref: '#/components/responses/ConflitoCategoria' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   *   delete:
   *     tags: [Catálogo — Categorias]
   *     summary: Exclui uma categoria sem itens vinculados (ADMIN, OPERADOR_COMERCIAL)
   *     parameters:
   *       - $ref: '#/components/parameters/CatalogoId'
   *     responses:
   *       204: { description: Categoria excluída }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/CategoriaNaoEncontrada' }
   *       422: { $ref: '#/components/responses/CategoriaEmUso' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.put('/categorias/:id', comercial, controller.editarCategoria);
  router.delete('/categorias/:id', comercial, controller.excluirCategoria);

  /**
   * @openapi
   * /categorias/{id}/situacao:
   *   patch:
   *     tags: [Catálogo — Categorias]
   *     summary: Inativa ou reativa uma categoria; os itens não são alterados (ADMIN, OPERADOR_COMERCIAL)
   *     parameters:
   *       - $ref: '#/components/parameters/CatalogoId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/SituacaoRequest' }
   *     responses:
   *       200:
   *         description: Situação alterada (ou já era a pedida)
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Categoria' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/CategoriaNaoEncontrada' }
   *       409: { $ref: '#/components/responses/ConflitoCategoria' }
   *       422: { $ref: '#/components/responses/EmpresaNaoAtiva' }
   *       500: { $ref: '#/components/responses/InternalError' }
   */
  router.patch('/categorias/:id/situacao', comercial, controller.alterarSituacaoCategoria);

  return router;
}
