import { binarioParaUuid, uuidParaBinario } from '../../shared/db/uuid.js';
import { escaparLike } from '../../shared/validation/paginacao.js';
import { erroCodigoDuplicado } from '../application/erros.js';

// RN-07: colunas explícitas, sem SELECT *; estoque_minimo nunca é lido nesta fase.
const COLUNAS = [
  'item_catalogo.id',
  'item_catalogo.tipo',
  'item_catalogo.codigo',
  'item_catalogo.nome',
  'item_catalogo.descricao',
  'item_catalogo.unidade',
  'item_catalogo.preco',
  'item_catalogo.categoria_id',
  'item_catalogo.ativo',
  'item_catalogo.criado_em',
  'item_catalogo.atualizado_em',
  'item_catalogo.versao',
  'categoria.nome as categoria_nome',
];

// RNF-BE-16: o sort da API é mapeado para uma coluna conhecida, nunca usado diretamente.
const COLUNA_DE_ORDENACAO = Object.freeze({
  nome: 'item_catalogo.nome',
  preco: 'item_catalogo.preco',
  criadoEm: 'item_catalogo.criado_em',
});

// RNF-033: o mysql2 devolve DECIMAL como string; o preço não passa por Number.
function paraItem(linha) {
  return {
    id: binarioParaUuid(linha.id),
    tipo: linha.tipo,
    codigo: linha.codigo,
    nome: linha.nome,
    descricao: linha.descricao,
    unidade: linha.unidade,
    preco: linha.preco,
    categoria: linha.categoria_id
      ? { id: binarioParaUuid(linha.categoria_id), nome: linha.categoria_nome }
      : null,
    ativo: Boolean(linha.ativo),
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
    versao: Number(linha.versao),
  };
}

function paraLinha(dados) {
  const linha = {};
  if ('tipo' in dados) linha.tipo = dados.tipo;
  if ('codigo' in dados) linha.codigo = dados.codigo ?? null;
  if ('nome' in dados) linha.nome = dados.nome;
  if ('descricao' in dados) linha.descricao = dados.descricao ?? null;
  if ('unidade' in dados) linha.unidade = dados.unidade;
  if ('preco' in dados) linha.preco = dados.preco;
  if ('categoriaId' in dados) {
    linha.categoria_id = dados.categoriaId ? uuidParaBinario(dados.categoriaId) : null;
  }
  if ('ativo' in dados) linha.ativo = dados.ativo;
  return linha;
}

// RNF-BE-15: a violação de unicidade do código vira AppError, sem repassar a mensagem do driver.
function traduzirErro(erro) {
  if (
    erro?.code === 'ER_DUP_ENTRY' &&
    String(erro.sqlMessage ?? '').includes('uk_item_catalogo_empresa_codigo')
  ) {
    return erroCodigoDuplicado();
  }
  return erro;
}

// RN-08, RN-10: filtros combinados (E). O tipo é comparado por igualdade, nunca por exclusão.
function aplicarFiltros(consulta, { q, tipo, categoriaId, situacao }) {
  if (tipo) consulta.where('item_catalogo.tipo', tipo);
  if (categoriaId) consulta.where('item_catalogo.categoria_id', uuidParaBinario(categoriaId));
  if (situacao === 'ATIVO') consulta.where('item_catalogo.ativo', true);
  if (situacao === 'INATIVO') consulta.where('item_catalogo.ativo', false);
  if (q) {
    // Nome e código usam a collation utf8mb4_0900_ai_ci (sem acento e sem caixa).
    const termo = `%${escaparLike(q)}%`;
    consulta.where((qb) =>
      qb.where('item_catalogo.nome', 'like', termo).orWhere('item_catalogo.codigo', 'like', termo),
    );
  }
  return consulta;
}

// Repositório de itens de catálogo (RNF-BE-26): todo método filtra por empresa_id.
export function criarItemCatalogoRepository(knex) {
  const daEmpresa = (empresaId, trx) =>
    (trx ?? knex)('item_catalogo').where('item_catalogo.empresa_id', uuidParaBinario(empresaId));

  const comCategoria = (consulta) =>
    consulta.leftJoin('categoria', 'categoria.id', 'item_catalogo.categoria_id');

  return {
    async listar(empresaId, { q, tipo, categoriaId, situacao, page, size, sort }, trx) {
      const filtrada = aplicarFiltros(daEmpresa(empresaId, trx), {
        q,
        tipo,
        categoriaId,
        situacao,
      });
      const [{ total }] = await filtrada.clone().count({ total: '*' });
      const linhas = await comCategoria(filtrada)
        .select(COLUNAS)
        .orderBy([
          { column: COLUNA_DE_ORDENACAO[sort], order: 'asc' },
          { column: 'item_catalogo.id', order: 'asc' },
        ])
        .limit(size)
        .offset(page * size);
      return { itens: linhas.map(paraItem), total: Number(total) };
    },

    async buscarPorId(empresaId, id, { trx, bloquear = false } = {}) {
      let consulta = comCategoria(daEmpresa(empresaId, trx))
        .select(COLUNAS)
        .where('item_catalogo.id', uuidParaBinario(id));
      if (bloquear) consulta = consulta.forUpdate();
      const linha = await consulta.first();
      return linha ? paraItem(linha) : null;
    },

    async existeCodigo(empresaId, codigo, { trx, exceto } = {}) {
      const consulta = daEmpresa(empresaId, trx).where('item_catalogo.codigo', codigo);
      if (exceto) consulta.whereNot('item_catalogo.id', uuidParaBinario(exceto));
      return Boolean(await consulta.first('item_catalogo.id'));
    },

    async inserir(empresaId, { id, agora, ...dados }, trx) {
      try {
        await (trx ?? knex)('item_catalogo').insert({
          id: uuidParaBinario(id),
          empresa_id: uuidParaBinario(empresaId),
          ...paraLinha(dados),
          criado_em: agora,
          atualizado_em: agora,
          versao: 0,
        });
      } catch (erro) {
        throw traduzirErro(erro);
      }
    },

    // RNF-BE-28: controle otimista. Retorna o número de linhas afetadas (0 = versão divergente).
    async atualizar(empresaId, id, versao, dados, agora, trx) {
      try {
        return await daEmpresa(empresaId, trx)
          .where({ 'item_catalogo.id': uuidParaBinario(id), 'item_catalogo.versao': versao })
          .update({
            ...paraLinha(dados),
            atualizado_em: agora,
            versao: knex.raw('versao + 1'),
          });
      } catch (erro) {
        throw traduzirErro(erro);
      }
    },

    async excluir(empresaId, id, trx) {
      return daEmpresa(empresaId, trx).where('item_catalogo.id', uuidParaBinario(id)).delete();
    },
  };
}
