import { toFornecedorResponse } from './mappers.js';
import {
  fornecedorSchema,
  editarFornecedorSchema,
  idParamSchema,
  listarFornecedoresQuerySchema,
  situacaoSchema,
} from './schemas.js';

// Controllers finos (RNF-BE-01): validam a entrada, chamam o caso de uso e devolvem o DTO.
export function makeFornecedorController({
  listarFornecedores,
  consultarFornecedor,
  cadastrarFornecedor,
  editarFornecedor,
  alterarSituacaoFornecedor,
  excluirFornecedor,
}) {
  return {
    async listar(req, res) {
      const pagina = await listarFornecedores(listarFornecedoresQuerySchema.parse(req.query));
      res.status(200).json({ ...pagina, content: pagina.content.map(toFornecedorResponse) });
    },

    async consultar(req, res) {
      const { id } = idParamSchema.parse(req.params);
      res.status(200).json(toFornecedorResponse(await consultarFornecedor(id)));
    },

    async cadastrar(req, res) {
      const fornecedor = await cadastrarFornecedor(fornecedorSchema.parse(req.body));
      res
        .status(201)
        .location(`/api/v1/fornecedores/${fornecedor.id}`)
        .json(toFornecedorResponse(fornecedor));
    },

    async editar(req, res) {
      const { id } = idParamSchema.parse(req.params);
      const fornecedor = await editarFornecedor(id, editarFornecedorSchema.parse(req.body));
      res.status(200).json(toFornecedorResponse(fornecedor));
    },

    async alterarSituacao(req, res) {
      const { id } = idParamSchema.parse(req.params);
      const fornecedor = await alterarSituacaoFornecedor(id, situacaoSchema.parse(req.body));
      res.status(200).json(toFornecedorResponse(fornecedor));
    },

    async excluir(req, res) {
      const { id } = idParamSchema.parse(req.params);
      await excluirFornecedor(id);
      res.status(204).end();
    },
  };
}
