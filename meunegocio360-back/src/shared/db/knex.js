import path from 'node:path';
import { fileURLToPath } from 'node:url';
import knexFactory from 'knex';

const raizDoServico = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

// Configuração única do Knex, usada pela aplicação e pelo knexfile.js (CLI de migrations/seeds).
export function configuracaoKnex(config) {
  return {
    client: 'mysql2',
    connection: {
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
      // RNF-BE-22: datas sempre em UTC
      timezone: 'Z',
    },
    pool: { min: 0, max: 10 },
    migrations: {
      directory: path.join(raizDoServico, 'db/migrations'),
      extension: 'js',
      loadExtensions: ['.js'],
    },
    seeds: {
      directory: path.join(raizDoServico, 'db/seeds'),
      loadExtensions: ['.js'],
    },
  };
}

export function criarKnex(config) {
  return knexFactory(configuracaoKnex(config));
}

// Permite que os casos de uso abram transações sem conhecer o Knex (RNF-BE-03, RNF-BE-04).
export function criarExecutorDeTransacao(knex) {
  return (trabalho) => knex.transaction(trabalho);
}
