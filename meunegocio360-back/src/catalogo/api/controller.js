import { toCategoriaResponse, toItemCatalogoResponse } from './mappers.js';
import {
  categoriaSchema,
  editarCategoriaSchema,
  editarItemCatalogoSchema,
  idParamSchema,
  itemCatalogoSchema,
  listarCategoriasQuerySchema,
  listarItensCatalogoQuerySchema,
  situacaoSchema,
} from './schemas.js';

// Controllers finos (RNF-BE-01): validam a entrada, chamam o caso de uso e devolvem o DTO.
export function makeCatalogoController({ itens, categorias }) {
  return {
    async listarItens(req, res) {
      const pagina = await itens.listar(listarItensCatalogoQuerySchema.parse(req.query));
      res.status(200).json({ ...pagina, content: pagina.content.map(toItemCatalogoResponse) });
    },

    async consultarItem(req, res) {
      const { id } = idParamSchema.parse(req.params);
      res.status(200).json(toItemCatalogoResponse(await itens.consultar(id)));
    },

    async cadastrarItem(req, res) {
      const item = await itens.cadastrar(itemCatalogoSchema.parse(req.body));
      res
        .status(201)
        .location(`/api/v1/itens-catalogo/${item.id}`)
        .json(toItemCatalogoResponse(item));
    },

    async editarItem(req, res) {
      const { id } = idParamSchema.parse(req.params);
      const item = await itens.editar(id, editarItemCatalogoSchema.parse(req.body));
      res.status(200).json(toItemCatalogoResponse(item));
    },

    async alterarSituacaoItem(req, res) {
      const { id } = idParamSchema.parse(req.params);
      const item = await itens.alterarSituacao(id, situacaoSchema.parse(req.body));
      res.status(200).json(toItemCatalogoResponse(item));
    },

    async excluirItem(req, res) {
      const { id } = idParamSchema.parse(req.params);
      await itens.excluir(id);
      res.status(204).end();
    },

    async listarCategorias(req, res) {
      const pagina = await categorias.listar(listarCategoriasQuerySchema.parse(req.query));
      res.status(200).json({ ...pagina, content: pagina.content.map(toCategoriaResponse) });
    },

    async cadastrarCategoria(req, res) {
      const categoria = await categorias.cadastrar(categoriaSchema.parse(req.body));
      res.status(201).json(toCategoriaResponse(categoria));
    },

    async editarCategoria(req, res) {
      const { id } = idParamSchema.parse(req.params);
      const categoria = await categorias.editar(id, editarCategoriaSchema.parse(req.body));
      res.status(200).json(toCategoriaResponse(categoria));
    },

    async alterarSituacaoCategoria(req, res) {
      const { id } = idParamSchema.parse(req.params);
      const categoria = await categorias.alterarSituacao(id, situacaoSchema.parse(req.body));
      res.status(200).json(toCategoriaResponse(categoria));
    },

    async excluirCategoria(req, res) {
      const { id } = idParamSchema.parse(req.params);
      await categorias.excluir(id);
      res.status(204).end();
    },
  };
}
