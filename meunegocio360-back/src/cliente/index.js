// API pública da feature cliente (RNF-BE-05). Recebe por injeção tudo o que vem de outras
// features: a função de empresa ativa (RF-BE-002) e os verificadores de vínculo (RN-06).
import { criarExecutorDeTransacao } from '../shared/db/knex.js';
import { makeClienteController } from './api/controller.js';
import { criarClienteRouter } from './api/routes.js';
import { makeAlterarSituacaoClienteUseCase } from './application/alterar-situacao-cliente.js';
import { makeCadastrarClienteUseCase } from './application/cadastrar-cliente.js';
import { makeConsultarClienteUseCase } from './application/consultar-cliente.js';
import { makeEditarClienteUseCase } from './application/editar-cliente.js';
import { makeExcluirClienteUseCase } from './application/excluir-cliente.js';
import { makeListarClientesUseCase } from './application/listar-clientes.js';
import { criarClienteRepository } from './infra/cliente-repository.js';

/**
 * Verificador de vínculo do cliente (ponto de extensão da RN-06). Cada requisito que criar um
 * vínculo com cliente (vendas, OS) exporta um verificador no próprio index.js, e o app.js o
 * acrescenta à lista `verificadoresDeVinculo`, sem alterar o código desta feature. Para OS
 * (outro serviço), o verificador consulta a API do serviço (RNF-092).
 *
 * @callback VerificadorDeVinculo
 * @param {{ clienteId: string, empresaId: string, trx: import('knex').Knex.Transaction }} contexto
 * @returns {Promise<boolean>} `true` quando o cliente possui vínculo (e não pode ser excluído).
 */

/**
 * @param {object} dependencias
 * @param {import('knex').Knex} dependencias.knex
 * @param {{ now: () => Date }} dependencias.clock
 * @param {(trx?: object) => Promise<string>} dependencias.obterEmpresaAtivaId
 * @param {VerificadorDeVinculo[]} [dependencias.verificadoresDeVinculo]
 */
export function criarModuloCliente({
  knex,
  clock,
  obterEmpresaAtivaId,
  verificadoresDeVinculo = [],
}) {
  const transacao = criarExecutorDeTransacao(knex);
  const clienteRepository = criarClienteRepository(knex);
  const dependencias = { transacao, clienteRepository, obterEmpresaAtivaId, clock };

  const controller = makeClienteController({
    listarClientes: makeListarClientesUseCase(dependencias),
    consultarCliente: makeConsultarClienteUseCase(dependencias),
    cadastrarCliente: makeCadastrarClienteUseCase(dependencias),
    editarCliente: makeEditarClienteUseCase(dependencias),
    alterarSituacaoCliente: makeAlterarSituacaoClienteUseCase(dependencias),
    excluirCliente: makeExcluirClienteUseCase({ ...dependencias, verificadoresDeVinculo }),
  });

  return { router: criarClienteRouter({ controller }) };
}
