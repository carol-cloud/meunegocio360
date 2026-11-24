// RF-BE-005 — Modelo de dados: categoria e item_catalogo, sempre vinculados a uma empresa (RNF-096).
export async function up(knex) {
  await knex.schema.createTable('categoria', (table) => {
    table.specificType('id', 'BINARY(16)').notNullable().primary();
    table.specificType('empresa_id', 'BINARY(16)').notNullable();
    // RN-06: a collation ai_ci torna a unicidade do nome insensível a acentos e maiúsculas.
    table.string('nome', 80).notNullable().collate('utf8mb4_0900_ai_ci');
    table.boolean('ativo').notNullable().defaultTo(true);
    table.datetime('criado_em', { precision: 6 }).notNullable();
    table.datetime('atualizado_em', { precision: 6 }).notNullable();
    table.bigInteger('versao').notNullable().defaultTo(0);

    table.foreign('empresa_id', 'fk_categoria_empresa').references('id').inTable('empresa');
    table.unique(['empresa_id', 'nome'], { indexName: 'uk_categoria_empresa_nome' });
  });

  await knex.schema.createTable('item_catalogo', (table) => {
    table.specificType('id', 'BINARY(16)').notNullable().primary();
    table.specificType('empresa_id', 'BINARY(16)').notNullable();
    table.specificType('categoria_id', 'BINARY(16)').nullable();
    table.string('tipo', 10).notNullable().checkIn(['PRODUTO', 'SERVICO'], 'ck_item_catalogo_tipo');
    // RN-10: busca por código sem distinguir maiúsculas e acentos.
    table.string('codigo', 40).nullable().collate('utf8mb4_0900_ai_ci');
    table.string('nome', 150).notNullable().collate('utf8mb4_0900_ai_ci');
    table.string('descricao', 500).nullable();
    table.string('unidade', 6).notNullable();
    // RN-03: CHECK (preco >= 0). Não usar .checkPositive(), que gera "> 0" e barraria o preço zero.
    table.decimal('preco', 12, 2).notNullable();
    table.check('?? >= 0', ['preco'], 'ck_item_catalogo_preco');
    // RN-07: existe no banco, mas não é exposto na API nesta fase (uso futuro de Suprimentos).
    table.decimal('estoque_minimo', 15, 3).notNullable().defaultTo(0);
    table.check('?? >= 0', ['estoque_minimo'], 'ck_item_catalogo_estoque_minimo');
    table.boolean('ativo').notNullable().defaultTo(true);
    table.datetime('criado_em', { precision: 6 }).notNullable();
    table.datetime('atualizado_em', { precision: 6 }).notNullable();
    table.bigInteger('versao').notNullable().defaultTo(0);

    table.foreign('empresa_id', 'fk_item_catalogo_empresa').references('id').inTable('empresa');
    // RN-06: sem ON DELETE CASCADE; a exclusão de categoria com itens é barrada.
    table
      .foreign('categoria_id', 'fk_item_catalogo_categoria')
      .references('id')
      .inTable('categoria');
    table.unique(['empresa_id', 'codigo'], { indexName: 'uk_item_catalogo_empresa_codigo' });
    table.index(['categoria_id'], 'idx_item_catalogo_categoria');
    table.index(['empresa_id', 'tipo', 'ativo'], 'idx_item_catalogo_empresa_tipo_ativo');
    table.index(['empresa_id', 'nome'], 'idx_item_catalogo_empresa_nome');
  });
}

export async function down(knex) {
  await knex.schema.dropTable('item_catalogo');
  await knex.schema.dropTable('categoria');
}
