// RF-BE-001 — Modelo de dados: tabela refresh_token (apenas o hash SHA-256 do token, RN-09).
export async function up(knex) {
  await knex.schema.createTable('refresh_token', (table) => {
    table.specificType('id', 'BINARY(16)').notNullable().primary();
    table.specificType('usuario_id', 'BINARY(16)').notNullable();
    table.specificType('familia_id', 'BINARY(16)').notNullable();
    table.specificType('token_hash', 'CHAR(64)').notNullable().unique('uk_refresh_token_hash');
    table.datetime('expira_em', { precision: 6 }).notNullable();
    table.datetime('revogado_em', { precision: 6 }).nullable();
    table.datetime('criado_em', { precision: 6 }).notNullable();

    table.index(['usuario_id'], 'ix_refresh_token_usuario');
    table.index(['familia_id'], 'ix_refresh_token_familia');
    table.foreign('usuario_id', 'fk_refresh_token_usuario').references('id').inTable('usuario');
  });
}

export async function down(knex) {
  await knex.schema.dropTable('refresh_token');
}
