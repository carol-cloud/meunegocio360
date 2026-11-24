import { toEmpresaResponse } from './mappers.js';
import {
  editarEmpresaSchema,
  empresaSchema,
  idParamSchema,
  listarInativasQuerySchema,
  situacaoSchema,
} from './schemas.js';

// Controllers finos (RNF-BE-01): validam a entrada, chamam o caso de uso e devolvem o DTO.
export function makeEmpresaController({
  consultarEmpresaAtiva,
  listarEmpresasInativas,
  cadastrarEmpresa,
  editarEmpresa,
  alterarSituacaoEmpresa,
}) {
  return {
    async consultar(_req, res) {
      res.status(200).json(toEmpresaResponse(await consultarEmpresaAtiva()));
    },

    async listarInativas(req, res) {
      const pagina = await listarEmpresasInativas(listarInativasQuerySchema.parse(req.query));
      res.status(200).json({ ...pagina, content: pagina.content.map(toEmpresaResponse) });
    },

    async cadastrar(req, res) {
      const empresa = await cadastrarEmpresa(empresaSchema.parse(req.body));
      res.status(201).location(`/api/v1/empresa/${empresa.id}`).json(toEmpresaResponse(empresa));
    },

    async editar(req, res) {
      const { id } = idParamSchema.parse(req.params);
      const empresa = await editarEmpresa(id, editarEmpresaSchema.parse(req.body));
      res.status(200).json(toEmpresaResponse(empresa));
    },

    async alterarSituacao(req, res) {
      const { id } = idParamSchema.parse(req.params);
      const empresa = await alterarSituacaoEmpresa(id, situacaoSchema.parse(req.body));
      res.status(200).json(toEmpresaResponse(empresa));
    },
  };
}
