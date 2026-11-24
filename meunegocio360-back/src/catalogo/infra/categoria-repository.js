import { binarioParaUuid, uuidParaBinario } from '../../shared/db/uuid.js';
import { escaparLike } from '../../shared/validation/paginacao.js';
import { erroCategoriaEmUso, erroNomeDeCategoriaDuplicado } from '../application/erros.js';

const COLUNAS = ['id', 'nome', 'ativo', 'criado_em', 'atualizado_em', 'versao'];

// RNF-BE-16: o sort da API é mapeado para uma coluna conhecida, nunca usado diretamente.
const COLUNA_DE_ORDENACAO = Object.freeze({ nome: 'nome' });

function paraCategoria(linha) {
  return {
    id: binarioParaUuid(linha.id),
    nome: linha.nome,
    ativo: Boolean(linha.ativo),
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
    versao: Number(linha.versao),
  };
}

function paraLinha(dados) {
  const linha = {};
  if ('nome' in dados) linha.nome = dados.nome;
  if ('ativo' in dados) linha.ativo = dados.ativo;
  return linha;
}

// RNF-BE-15: erros do mysql2 viram AppError, identificados pelo código e pela restrição.
function traduzirErro(erro, { quantidadeDeItens } = {}) {
  if (
    erro?.code === 'ER_DUP_ENTRY' &&
    String(erro.sqlMessage ?? '').includes('uk_categoria_empresa_nome')
  ) {
    return erroNomeDeCategoriaDuplicado();
  }
  if (erro?.code === 'ER_ROW_IS_REFERENCED_2') {
    return erroCategoriaEmUso(quantidadeDeItens ?? 1);
  }
  return erro;
}

// Repositório de categorias (RNF-BE-26): todo método filtra por empresa_id.
export function criarCategoriaRepository(knex) {
  const daEmpresa = (empresaId, trx) =>
    (trx ?? knex)('categoria').where('empresa_id', uuidParaBinario(empresaId));

  return {
    async listar(empresaId, { q, situacao, page, size, sort }, trx) {
      const filtrada = daEmpresa(empresaId, trx);
      if (situacao === 'ATIVO') filtrada.where('ativo', true);
      if (situacao === 'INATIVO') filtrada.where('ativo', false);
      if (q) filtrada.where('nome', 'like', `%${escaparLike(q)}%`);

      const [{ total }] = await filtrada.clone().count({ total: '*' });
      const linhas = await filtrada
        .select(COLUNAS)
        .orderBy([
          { column: COLUNA_DE_ORDENACAO[sort], order: 'asc' },
          { column: 'id', order: 'asc' },
        ])
        .limit(size)
        .offset(page * size);
      return { categorias: linhas.map(paraCategoria), total: Number(total) };
    },

    async buscarPorId(empresaId, id, { trx, bloquear = false } = {}) {
      let consulta = daEmpresa(empresaId, trx).select(COLUNAS).where('id', uuidParaBinario(id));
      if (bloquear) consulta = consulta.forUpdate();
      const linha = await consulta.first();
      return linha ? paraCategoria(linha) : null;
    },

    // RN-06: a comparação usa a collation da coluna (sem acento e sem caixa).
    async existeNome(empresaId, nome, { trx, exceto } = {}) {
      const consulta = daEmpresa(empresaId, trx).where({ nome });
      if (exceto) consulta.whereNot('id', uuidParaBinario(exceto));
      return Boolean(await consulta.first('id'));
    },

    async contarItens(empresaId, categoriaId, trx) {
      const [{ total }] = await (trx ?? knex)('item_catalogo')
        .where({
          empresa_id: uuidParaBinario(empresaId),
          categoria_id: uuidParaBinario(categoriaId),
        })
        .count({ total: '*' });
      return Number(total);
    },

    async inserir(empresaId, { id, agora, ...dados }, trx) {
      try {
        await (trx ?? knex)('categoria').insert({
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
          .where({ id: uuidParaBinario(id), versao })
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
      try {
        return await daEmpresa(empresaId, trx).where('id', uuidParaBinario(id)).delete();
      } catch (erro) {
        throw traduzirErro(erro);
      }
    },
  };
}
