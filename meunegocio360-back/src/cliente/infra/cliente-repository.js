import { binarioParaUuid, uuidParaBinario } from '../../shared/db/uuid.js';
import { somenteDigitos } from '../../shared/validation/documento.js';
import { escaparLike } from '../../shared/validation/paginacao.js';
import { erroDocumentoDuplicado } from '../application/erros.js';

const COLUNAS = [
  'id',
  'tipo_pessoa',
  'nome',
  'documento',
  'email',
  'telefone',
  'ativo',
  'criado_em',
  'atualizado_em',
  'versao',
];

// RNF-BE-16: o sort da API é mapeado para uma coluna conhecida, nunca usado diretamente.
const COLUNA_DE_ORDENACAO = Object.freeze({ nome: 'nome', criadoEm: 'criado_em' });

function paraCliente(linha) {
  return {
    id: binarioParaUuid(linha.id),
    tipoPessoa: linha.tipo_pessoa,
    nome: linha.nome,
    documento: linha.documento,
    email: linha.email,
    telefone: linha.telefone,
    ativo: Boolean(linha.ativo),
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
    versao: Number(linha.versao),
  };
}

function paraLinha(dados) {
  const linha = {};
  if ('tipoPessoa' in dados) linha.tipo_pessoa = dados.tipoPessoa;
  if ('nome' in dados) linha.nome = dados.nome;
  if ('documento' in dados) linha.documento = dados.documento;
  if ('email' in dados) linha.email = dados.email ?? null;
  if ('telefone' in dados) linha.telefone = dados.telefone ?? null;
  if ('ativo' in dados) linha.ativo = dados.ativo;
  return linha;
}

// RNF-BE-15: a violação de unicidade vira AppError, identificada pelo nome da restrição.
// A mensagem do driver nunca é repassada ao cliente.
function traduzirErro(erro) {
  if (
    erro?.code === 'ER_DUP_ENTRY' &&
    String(erro.sqlMessage ?? '').includes('uk_cliente_empresa_documento')
  ) {
    return erroDocumentoDuplicado();
  }
  return erro;
}

// RN-07 e RN-08: filtro de situação e busca por nome (collation sem acento/caixa) ou documento.
function aplicarFiltros(consulta, { q, situacao }) {
  if (situacao === 'ATIVO') consulta.where('ativo', true);
  if (situacao === 'INATIVO') consulta.where('ativo', false);
  if (q) {
    const termoNome = `%${escaparLike(q)}%`;
    const digitos = somenteDigitos(q);
    consulta.where((qb) => {
      qb.where('nome', 'like', termoNome);
      if (digitos) qb.orWhere('documento', 'like', `%${escaparLike(digitos)}%`);
    });
  }
  return consulta;
}

// Repositório de clientes (RNF-BE-03/04, RNF-BE-26): todo método recebe o empresaId e filtra
// por empresa_id; todos aceitam um executor opcional (`trx`).
export function criarClienteRepository(knex) {
  const daEmpresa = (empresaId, trx) =>
    (trx ?? knex)('cliente').where('empresa_id', uuidParaBinario(empresaId));

  return {
    async listar(empresaId, { q, situacao, page, size, sort }, trx) {
      const filtrada = aplicarFiltros(daEmpresa(empresaId, trx), { q, situacao });
      const [{ total }] = await filtrada.clone().count({ total: '*' });
      const linhas = await filtrada
        .select(COLUNAS)
        .orderBy([
          { column: COLUNA_DE_ORDENACAO[sort], order: 'asc' },
          { column: 'id', order: 'asc' },
        ])
        .limit(size)
        .offset(page * size);
      return { clientes: linhas.map(paraCliente), total: Number(total) };
    },

    async buscarPorId(empresaId, id, { trx, bloquear = false } = {}) {
      let consulta = daEmpresa(empresaId, trx).select(COLUNAS).where('id', uuidParaBinario(id));
      if (bloquear) consulta = consulta.forUpdate();
      const linha = await consulta.first();
      return linha ? paraCliente(linha) : null;
    },

    async existeDocumento(empresaId, documento, { trx } = {}) {
      return Boolean(await daEmpresa(empresaId, trx).where({ documento }).first('id'));
    },

    async inserir(empresaId, { id, agora, ...dados }, trx) {
      try {
        await (trx ?? knex)('cliente').insert({
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
      return daEmpresa(empresaId, trx).where('id', uuidParaBinario(id)).delete();
    },
  };
}
