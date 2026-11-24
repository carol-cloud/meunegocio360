// API pública da feature catálogo (RF-BE-005, RNF-BE-05). Recebe por injeção tudo o que vem de
// outras features: a função de empresa ativa (RF-BE-002) e os verificadores de vínculo (RN-09).
import { criarExecutorDeTransacao } from '../shared/db/knex.js';
import { makeCatalogoController } from './api/controller.js';
import { criarCatalogoRouter } from './api/routes.js';
import { makeAlterarSituacaoCategoriaUseCase } from './application/alterar-situacao-categoria.js';
import { makeAlterarSituacaoItemCatalogoUseCase } from './application/alterar-situacao-item-catalogo.js';
import { makeCadastrarCategoriaUseCase } from './application/cadastrar-categoria.js';
import { makeCadastrarItemCatalogoUseCase } from './application/cadastrar-item-catalogo.js';
import { makeConsultarItemCatalogoUseCase } from './application/consultar-item-catalogo.js';
import { makeEditarCategoriaUseCase } from './application/editar-categoria.js';
import { makeEditarItemCatalogoUseCase } from './application/editar-item-catalogo.js';
import { makeExcluirCategoriaUseCase } from './application/excluir-categoria.js';
import { makeExcluirItemCatalogoUseCase } from './application/excluir-item-catalogo.js';
import { makeListarCategoriasUseCase } from './application/listar-categorias.js';
import { makeListarItensCatalogoUseCase } from './application/listar-itens-catalogo.js';
import { criarCategoriaRepository } from './infra/categoria-repository.js';
import { criarItemCatalogoRepository } from './infra/item-catalogo-repository.js';

/**
 * Verificador de vínculo do item (ponto de extensão da RN-09). Cada requisito que criar um vínculo
 * com item de catálogo (vendas, compras) fornece um verificador, e o app.js o acrescenta à lista
 * `verificadoresDeVinculoItem`, sem alterar o código desta feature.
 *
 * @callback VerificadorDeVinculoItem
 * @param {{ itemId: string, empresaId: string, trx: import('knex').Knex.Transaction }} contexto
 * @returns {Promise<boolean>} `true` quando o item possui vínculo (e não pode ser excluído).
 */

/**
 * @param {object} dependencias
 * @param {import('knex').Knex} dependencias.knex
 * @param {{ now: () => Date }} dependencias.clock
 * @param {(trx?: object) => Promise<string>} dependencias.obterEmpresaAtivaId
 * @param {VerificadorDeVinculoItem[]} [dependencias.verificadoresDeVinculoItem]
 */
export function criarModuloCatalogo({
  knex,
  clock,
  obterEmpresaAtivaId,
  verificadoresDeVinculoItem = [],
}) {
  const transacao = criarExecutorDeTransacao(knex);
  const categoriaRepository = criarCategoriaRepository(knex);
  const itemCatalogoRepository = criarItemCatalogoRepository(knex);
  const dependencias = {
    transacao,
    categoriaRepository,
    itemCatalogoRepository,
    obterEmpresaAtivaId,
    clock,
  };

  const controller = makeCatalogoController({
    itens: {
      listar: makeListarItensCatalogoUseCase(dependencias),
      consultar: makeConsultarItemCatalogoUseCase(dependencias),
      cadastrar: makeCadastrarItemCatalogoUseCase(dependencias),
      editar: makeEditarItemCatalogoUseCase(dependencias),
      alterarSituacao: makeAlterarSituacaoItemCatalogoUseCase(dependencias),
      excluir: makeExcluirItemCatalogoUseCase({ ...dependencias, verificadoresDeVinculoItem }),
    },
    categorias: {
      listar: makeListarCategoriasUseCase(dependencias),
      cadastrar: makeCadastrarCategoriaUseCase(dependencias),
      editar: makeEditarCategoriaUseCase(dependencias),
      alterarSituacao: makeAlterarSituacaoCategoriaUseCase(dependencias),
      excluir: makeExcluirCategoriaUseCase(dependencias),
    },
  });

  return { router: criarCatalogoRouter({ controller }) };
}
