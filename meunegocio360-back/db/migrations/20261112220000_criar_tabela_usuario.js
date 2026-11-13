// RF-BE-001 — Modelo de dados: tabela usuario.
// BINARY(16) via specificType: no Knex 3, table.binary('id', 16) gera VARBINARY(16).
export async function up(knex) {
  await knex.schema.createTable('usuario', (table) => {
    table.specificType('id', 'BINARY(16)').notNullable().primary();
    table.string('nome', 120).notNullable();
    table.string('email', 160).notNullable().unique('uk_usuario_email');
    table.string('senha_hash', 60).notNullable();
    table.string('perfil', 20).notNullable().checkIn(['ADMIN', 'USUARIO'], 'ck_usuario_perfil');
    table.boolean('ativo').notNullable().defaultTo(true);
    table.integer('tentativas_falhas').notNullable().defaultTo(0);
    table.datetime('bloqueado_ate', { precision: 6 }).nullable();
    table.datetime('ultimo_login_em', { precision: 6 }).nullable();
    table.datetime('criado_em', { precision: 6 }).notNullable();
    table.datetime('atualizado_em', { precision: 6 }).notNullable();
    table.bigInteger('versao').notNullable().defaultTo(0);
  });
}

export async function down(knex) {
  await knex.schema.dropTable('usuario');
}
