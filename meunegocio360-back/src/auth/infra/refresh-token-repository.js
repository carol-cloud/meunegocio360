import { binarioParaUuid, uuidParaBinario } from '../../shared/db/uuid.js';

function paraRefreshToken(linha) {
  return {
    id: binarioParaUuid(linha.id),
    usuarioId: binarioParaUuid(linha.usuario_id),
    familiaId: binarioParaUuid(linha.familia_id),
    expiraEm: linha.expira_em,
    revogadoEm: linha.revogado_em,
  };
}

// Repositório de refresh tokens. Guarda apenas o hash SHA-256 (RN-09).
export function criarRefreshTokenRepository(knex) {
  const tabela = (trx) => (trx ?? knex)('refresh_token');

  return {
    async inserir({ id, usuarioId, familiaId, tokenHash, expiraEm, criadoEm }, trx) {
      await tabela(trx).insert({
        id: uuidParaBinario(id),
        usuario_id: uuidParaBinario(usuarioId),
        familia_id: uuidParaBinario(familiaId),
        token_hash: tokenHash,
        expira_em: expiraEm,
        criado_em: criadoEm,
      });
    },

    // RN-07: SELECT ... FOR UPDATE na linha do token, para serializar renovações simultâneas.
    async buscarPorHash(tokenHash, { trx, bloquear = false } = {}) {
      let consulta = tabela(trx)
        .select('id', 'usuario_id', 'familia_id', 'expira_em', 'revogado_em')
        .where({ token_hash: tokenHash });
      if (bloquear) consulta = consulta.forUpdate();
      const linha = await consulta.first();
      return linha ? paraRefreshToken(linha) : null;
    },

    revogar: (id, agora, trx) =>
      tabela(trx)
        .where({ id: uuidParaBinario(id) })
        .whereNull('revogado_em')
        .update({ revogado_em: agora }),

    // RN-08 e RN-10: revoga todos os tokens ainda ativos da família.
    revogarFamilia: (familiaId, agora, trx) =>
      tabela(trx)
        .where({ familia_id: uuidParaBinario(familiaId) })
        .whereNull('revogado_em')
        .update({ revogado_em: agora }),

    // RN-13: revoga todas as famílias ativas do usuário.
    revogarTodosDoUsuario: (usuarioId, agora, trx) =>
      tabela(trx)
        .where({ usuario_id: uuidParaBinario(usuarioId) })
        .whereNull('revogado_em')
        .update({ revogado_em: agora }),

    // Limpeza periódica: remove tokens expirados ou revogados antes de `limite`.
    removerAnterioresA: (limite) =>
      tabela().where('expira_em', '<', limite).orWhere('revogado_em', '<', limite).del(),
  };
}
