// RF-BE-004 — Modelo de dados: tabela fornecedor, sempre vinculada a uma empresa (RNF-096).
export async function up(knex) {
  await knex.schema.createTable('fornecedor', (table) => {
    table.specificType('id', 'BINARY(16)').notNullable().primary();
    table.specificType('empresa_id', 'BINARY(16)').notNullable();
    table
      .string('tipo_pessoa', 10)
      .notNullable()
      .checkIn(['FISICA', 'JURIDICA'], 'ck_fornecedor_tipo_pessoa');
    table.string('nome', 150).notNullable().collate('utf8mb4_0900_ai_ci');
    table.string('documento', 14).notNullable();
    table.string('email', 160).nullable();
    table.string('telefone', 11).nullable();
    table.boolean('ativo').notNullable().defaultTo(true);
    table.datetime('criado_em', { precision: 6 }).notNullable();
    table.datetime('atualizado_em', { precision: 6 }).notNullable();
    table.bigInteger('versao').notNullable().defaultTo(0);

    table.foreign('empresa_id', 'fk_fornecedor_empresa').references('id').inTable('empresa');
    table.unique(['empresa_id', 'documento'], { indexName: 'uk_fornecedor_empresa_documento' });
    table.index(['empresa_id', 'nome'], 'idx_fornecedor_empresa_nome');
    table.index(['empresa_id', 'ativo'], 'idx_fornecedor_empresa_ativo');
  });
}

export async function down(knex) {
  await knex.schema.dropTable('fornecedor');
}
