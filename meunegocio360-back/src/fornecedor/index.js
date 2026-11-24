// API pública da feature fornecedor (RNF-BE-05). Recebe por injeção tudo o que vem de outras
// features: a função de empresa ativa (RF-BE-002) e os verificadores de vínculo (RN-04).
// Não importa nada de src/cliente/: os dois cadastros são independentes.
import { criarExecutorDeTransacao } from '../shared/db/knex.js';
import { makeFornecedorController } from './api/controller.js';
import { criarFornecedorRouter } from './api/routes.js';
import { makeAlterarSituacaoFornecedorUseCase } from './application/alterar-situacao-fornecedor.js';
import { makeCadastrarFornecedorUseCase } from './application/cadastrar-fornecedor.js';
import { makeConsultarFornecedorUseCase } from './application/consultar-fornecedor.js';
import { makeEditarFornecedorUseCase } from './application/editar-fornecedor.js';
import { makeExcluirFornecedorUseCase } from './application/excluir-fornecedor.js';
import { makeListarFornecedoresUseCase } from './application/listar-fornecedores.js';
import { criarFornecedorRepository } from './infra/fornecedor-repository.js';

/**
 * Verificador de vínculo do fornecedor (ponto de extensão da RN-04). Cada requisito que criar um
 * vínculo com fornecedor (compras, contas a pagar) fornece um verificador, e o app.js o
 * acrescenta à lista `verificadoresDeVinculo`, sem alterar o código desta feature. Para compras
 * (serviço Suprimentos), o verificador consulta a API do serviço com timeout (RNF-092).
 *
 * @callback VerificadorDeVinculo
 * @param {{ fornecedorId: string, empresaId: string, trx: import('knex').Knex.Transaction }}
 *   contexto
 * @returns {Promise<boolean>} `true` quando o fornecedor possui vínculo (e não pode ser excluído).
 */

/**
 * @param {object} dependencias
 * @param {import('knex').Knex} dependencias.knex
 * @param {{ now: () => Date }} dependencias.clock
 * @param {(trx?: object) => Promise<string>} dependencias.obterEmpresaAtivaId
 * @param {VerificadorDeVinculo[]} [dependencias.verificadoresDeVinculo]
 */
export function criarModuloFornecedor({
  knex,
  clock,
  obterEmpresaAtivaId,
  verificadoresDeVinculo = [],
}) {
  const transacao = criarExecutorDeTransacao(knex);
  const fornecedorRepository = criarFornecedorRepository(knex);
  const dependencias = { transacao, fornecedorRepository, obterEmpresaAtivaId, clock };

  const controller = makeFornecedorController({
    listarFornecedores: makeListarFornecedoresUseCase(dependencias),
    consultarFornecedor: makeConsultarFornecedorUseCase(dependencias),
    cadastrarFornecedor: makeCadastrarFornecedorUseCase(dependencias),
    editarFornecedor: makeEditarFornecedorUseCase(dependencias),
    alterarSituacaoFornecedor: makeAlterarSituacaoFornecedorUseCase(dependencias),
    excluirFornecedor: makeExcluirFornecedorUseCase({ ...dependencias, verificadoresDeVinculo }),
  });

  return { router: criarFornecedorRouter({ controller }) };
}
