// RF-BE-002 — Modelo de dados: tabela empresa (única tabela de negócio sem empresa_id).
export async function up(knex) {
  await knex.schema.createTable('empresa', (table) => {
    table.specificType('id', 'BINARY(16)').notNullable().primary();
    table.string('razao_social', 150).notNullable();
    table.string('nome_fantasia', 150).nullable();
    table.specificType('cnpj', 'CHAR(14)').notNullable().unique({ indexName: 'uk_empresa_cnpj' });
    table.string('email', 160).nullable();
    table.string('telefone', 11).nullable();
    table.string('fuso_horario', 50).notNullable().defaultTo('America/Sao_Paulo');
    table.specificType('moeda', 'CHAR(3)').notNullable().defaultTo('BRL');
    table.boolean('ativa').notNullable().defaultTo(true);
    // RN-02: o Knex não tem API para coluna gerada. Vale 1 só na empresa ativa e NULL nas
    // inativas; como o índice único aceita vários NULL, só uma linha pode estar ativa.
    table.specificType('ativa_unica', 'TINYINT AS (CASE WHEN ativa THEN 1 END) STORED');
    table.datetime('criado_em', { precision: 6 }).notNullable();
    table.datetime('atualizado_em', { precision: 6 }).notNullable();
    table.bigInteger('versao').notNullable().defaultTo(0);

    table.unique(['ativa_unica'], { indexName: 'uk_empresa_ativa_unica' });
  });
}

export async function down(knex) {
  await knex.schema.dropTable('empresa');
}
