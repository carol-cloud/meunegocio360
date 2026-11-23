import { toClienteResponse } from './mappers.js';
import {
  clienteSchema,
  editarClienteSchema,
  idParamSchema,
  listarClientesQuerySchema,
  situacaoSchema,
} from './schemas.js';

// Controllers finos (RNF-BE-01): validam a entrada, chamam o caso de uso e devolvem o DTO.
export function makeClienteController({
  listarClientes,
  consultarCliente,
  cadastrarCliente,
  editarCliente,
  alterarSituacaoCliente,
  excluirCliente,
}) {
  return {
    async listar(req, res) {
      const pagina = await listarClientes(listarClientesQuerySchema.parse(req.query));
      res.status(200).json({ ...pagina, content: pagina.content.map(toClienteResponse) });
    },

    async consultar(req, res) {
      const { id } = idParamSchema.parse(req.params);
      res.status(200).json(toClienteResponse(await consultarCliente(id)));
    },

    async cadastrar(req, res) {
      const cliente = await cadastrarCliente(clienteSchema.parse(req.body));
      res.status(201).location(`/api/v1/clientes/${cliente.id}`).json(toClienteResponse(cliente));
    },

    async editar(req, res) {
      const { id } = idParamSchema.parse(req.params);
      const cliente = await editarCliente(id, editarClienteSchema.parse(req.body));
      res.status(200).json(toClienteResponse(cliente));
    },

    async alterarSituacao(req, res) {
      const { id } = idParamSchema.parse(req.params);
      const cliente = await alterarSituacaoCliente(id, situacaoSchema.parse(req.body));
      res.status(200).json(toClienteResponse(cliente));
    },

    async excluir(req, res) {
      const { id } = idParamSchema.parse(req.params);
      await excluirCliente(id);
      res.status(204).end();
    },
  };
}
