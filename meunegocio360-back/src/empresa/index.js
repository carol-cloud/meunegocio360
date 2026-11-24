// API pública da feature empresa (RNF-BE-05). As demais features usam somente o que este
// arquivo exporta (o router e obterEmpresaAtivaId), nunca infra/ ou domain/ diretamente.
import { criarExecutorDeTransacao } from '../shared/db/knex.js';
import { makeEmpresaController } from './api/controller.js';
import { criarEmpresaRouter } from './api/routes.js';
import { makeAlterarSituacaoEmpresaUseCase } from './application/alterar-situacao-empresa.js';
import { makeCadastrarEmpresaUseCase } from './application/cadastrar-empresa.js';
import { makeConsultarEmpresaAtivaUseCase } from './application/consultar-empresa-ativa.js';
import { makeEditarEmpresaUseCase } from './application/editar-empresa.js';
import { erroEmpresaNaoAtiva } from './application/erros.js';
import { makeListarEmpresasInativasUseCase } from './application/listar-empresas-inativas.js';
import { makeObterEmpresaAtivaId } from './application/obter-empresa-ativa-id.js';
import { criarEmpresaRepository } from './infra/empresa-repository.js';

export { erroEmpresaNaoAtiva };

export function criarModuloEmpresa({ knex, clock }) {
  const transacao = criarExecutorDeTransacao(knex);
  const empresaRepository = criarEmpresaRepository(knex);
  const dependencias = { transacao, empresaRepository, clock };

  const controller = makeEmpresaController({
    consultarEmpresaAtiva: makeConsultarEmpresaAtivaUseCase({ empresaRepository }),
    listarEmpresasInativas: makeListarEmpresasInativasUseCase({ empresaRepository }),
    cadastrarEmpresa: makeCadastrarEmpresaUseCase(dependencias),
    editarEmpresa: makeEditarEmpresaUseCase(dependencias),
    alterarSituacaoEmpresa: makeAlterarSituacaoEmpresaUseCase(dependencias),
  });

  return {
    router: criarEmpresaRouter({ controller }),
    obterEmpresaAtivaId: makeObterEmpresaAtivaId({ empresaRepository }),
  };
}
