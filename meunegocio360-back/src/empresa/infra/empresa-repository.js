import { binarioParaUuid, uuidParaBinario } from '../../shared/db/uuid.js';
import { erroCnpjDuplicado, erroEmpresaJaAtiva } from '../application/erros.js';

// ativa_unica é coluna interna (gerada) e nunca é lida.
const COLUNAS = [
  'id',
  'razao_social',
  'nome_fantasia',
  'cnpj',
  'email',
  'telefone',
  'fuso_horario',
  'moeda',
  'ativa',
  'criado_em',
  'atualizado_em',
  'versao',
];

// Lista permitida de ordenação (RNF-BE-16): campo da API -> coluna.
const COLUNA_DE_ORDENACAO = {
  razaoSocial: 'razao_social',
  atualizadoEm: 'atualizado_em',
};

function paraEmpresa(linha) {
  return {
    id: binarioParaUuid(linha.id),
    razaoSocial: linha.razao_social,
    nomeFantasia: linha.nome_fantasia,
    cnpj: linha.cnpj,
    email: linha.email,
    telefone: linha.telefone,
    fusoHorario: linha.fuso_horario,
    moeda: linha.moeda,
    ativa: Boolean(linha.ativa),
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
    versao: Number(linha.versao),
  };
}

function paraLinha(dados) {
  const linha = {};
  if ('razaoSocial' in dados) linha.razao_social = dados.razaoSocial;
  if ('nomeFantasia' in dados) linha.nome_fantasia = dados.nomeFantasia ?? null;
  if ('cnpj' in dados) linha.cnpj = dados.cnpj;
  if ('email' in dados) linha.email = dados.email ?? null;
  if ('telefone' in dados) linha.telefone = dados.telefone ?? null;
  if ('fusoHorario' in dados) linha.fuso_horario = dados.fusoHorario;
  if ('moeda' in dados) linha.moeda = dados.moeda;
  if ('ativa' in dados) linha.ativa = dados.ativa;
  return linha;
}

// RNF-BE-15: violações de unicidade viram AppError, identificadas pelo nome da restrição.
// A mensagem do driver nunca é repassada ao cliente.
function traduzirErro(erro) {
  if (erro?.code === 'ER_DUP_ENTRY') {
    const mensagem = String(erro.sqlMessage ?? '');
    if (mensagem.includes('uk_empresa_cnpj')) return erroCnpjDuplicado();
    if (mensagem.includes('uk_empresa_ativa_unica')) return erroEmpresaJaAtiva();
  }
  return erro;
}

// Repositório da empresa (RNF-BE-03/04): todo método aceita um executor opcional (`trx`).
export function criarEmpresaRepository(knex) {
  const tabela = (trx) => (trx ?? knex)('empresa');

  async function buscarUm(filtro, { trx, bloquear = false } = {}) {
    let consulta = tabela(trx).select(COLUNAS).where(filtro);
    if (bloquear) consulta = consulta.forUpdate();
    const linha = await consulta.first();
    return linha ? paraEmpresa(linha) : null;
  }

  return {
    buscarAtiva: (opcoes) => buscarUm({ ativa: true }, opcoes),

    buscarPorId: (id, opcoes) => buscarUm({ id: uuidParaBinario(id) }, opcoes),

    // GET /empresa/inativas (RNF-BE-13): página das empresas inativas, com desempate por id.
    async listarInativas({ page, size, sort }, { trx } = {}) {
      const filtrada = tabela(trx).where({ ativa: false });
      const [{ total }] = await filtrada.clone().count({ total: '*' });
      const linhas = await filtrada
        .select(COLUNAS)
        .orderBy([
          { column: COLUNA_DE_ORDENACAO[sort], order: 'asc' },
          { column: 'id', order: 'asc' },
        ])
        .limit(size)
        .offset(page * size);
      return { empresas: linhas.map(paraEmpresa), total: Number(total) };
    },

    async existeCnpj(cnpj, { trx } = {}) {
      return Boolean(await tabela(trx).where({ cnpj }).first('id'));
    },

    async inserir({ id, agora, ...dados }, trx) {
      try {
        await tabela(trx).insert({
          id: uuidParaBinario(id),
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
    async atualizar(id, versao, dados, agora, trx) {
      try {
        return await tabela(trx)
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
  };
}
