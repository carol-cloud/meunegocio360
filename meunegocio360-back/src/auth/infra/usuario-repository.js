import { binarioParaUuid, uuidParaBinario } from '../../shared/db/uuid.js';

const COLUNAS = [
  'id',
  'nome',
  'email',
  'senha_hash',
  'perfil',
  'ativo',
  'tentativas_falhas',
  'bloqueado_ate',
  'ultimo_login_em',
  'versao',
];

// Linha do banco (snake_case) -> objeto interno (camelCase). Nunca sai direto na API.
function paraUsuario(linha) {
  return {
    id: binarioParaUuid(linha.id),
    nome: linha.nome,
    email: linha.email,
    senhaHash: linha.senha_hash,
    perfil: linha.perfil,
    ativo: Boolean(linha.ativo),
    tentativasFalhas: Number(linha.tentativas_falhas),
    bloqueadoAte: linha.bloqueado_ate,
    ultimoLoginEm: linha.ultimo_login_em,
    versao: Number(linha.versao),
  };
}

// Repositório de usuário (RNF-BE-03/04): somente infra/ conhece o Knex; todo método aceita
// um executor opcional (`trx`) para participar da transação aberta pelo caso de uso.
export function criarUsuarioRepository(knex) {
  const tabela = (trx) => (trx ?? knex)('usuario');

  async function buscarUm(filtro, { trx, bloquear = false } = {}) {
    let consulta = tabela(trx).select(COLUNAS).where(filtro);
    if (bloquear) consulta = consulta.forUpdate();
    const linha = await consulta.first();
    return linha ? paraUsuario(linha) : null;
  }

  function atualizar(id, agora, campos, trx) {
    return tabela(trx)
      .where({ id: uuidParaBinario(id) })
      .update({
        ...campos,
        atualizado_em: agora,
        versao: knex.raw('versao + 1'),
      });
  }

  return {
    buscarPorEmail: (email, opcoes) => buscarUm({ email }, opcoes),

    buscarPorId: (id, opcoes) => buscarUm({ id: uuidParaBinario(id) }, opcoes),

    // RN-04: incremento atômico no banco (sem ler, somar em JS e gravar).
    registrarFalha: (id, agora, trx) =>
      atualizar(id, agora, { tentativas_falhas: knex.raw('tentativas_falhas + 1') }, trx),

    // RN-04: bloqueio temporário; o contador recomeça para o período seguinte.
    bloquear: (id, bloqueadoAte, agora, trx) =>
      atualizar(id, agora, { tentativas_falhas: 0, bloqueado_ate: bloqueadoAte }, trx),

    // RN-04 e RN-12: login com sucesso zera o contador e registra ultimo_login_em.
    registrarLoginComSucesso: (id, agora, trx) =>
      atualizar(
        id,
        agora,
        { tentativas_falhas: 0, bloqueado_ate: null, ultimo_login_em: agora },
        trx,
      ),
  };
}
