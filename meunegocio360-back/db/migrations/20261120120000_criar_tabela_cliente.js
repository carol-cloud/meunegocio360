// RF-BE-003 — Modelo de dados: tabela cliente, sempre vinculada a uma empresa (RNF-096).
export async function up(knex) {
  await knex.schema.createTable('cliente', (table) => {
    table.specificType('id', 'BINARY(16)').notNullable().primary();
    table.specificType('empresa_id', 'BINARY(16)').notNullable();
    table
      .string('tipo_pessoa', 10)
      .notNullable()
      .checkIn(['FISICA', 'JURIDICA'], 'ck_cliente_tipo_pessoa');
    table.string('nome', 150).notNullable().collate('utf8mb4_0900_ai_ci');
    table.string('documento', 14).notNullable();
    table.string('email', 160).nullable();
    table.string('telefone', 11).nullable();
    table.boolean('ativo').notNullable().defaultTo(true);
    table.datetime('criado_em', { precision: 6 }).notNullable();
    table.datetime('atualizado_em', { precision: 6 }).notNullable();
    table.bigInteger('versao').notNullable().defaultTo(0);

    table.foreign('empresa_id', 'fk_cliente_empresa').references('id').inTable('empresa');
    table.unique(['empresa_id', 'documento'], { indexName: 'uk_cliente_empresa_documento' });
    table.index(['empresa_id', 'nome'], 'idx_cliente_empresa_nome');
    table.index(['empresa_id', 'ativo'], 'idx_cliente_empresa_ativo');
  });
}

export async function down(knex) {
  await knex.schema.dropTable('cliente');
}
