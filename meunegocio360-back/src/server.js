// Ponto de entrada: valida o ambiente (fail fast, RNF-BE-32), sobe o HTTP e os jobs.
import { config } from './shared/config/env.js';
import { criarKnex } from './shared/db/knex.js';
import { criarLogger } from './shared/logging/logger.js';
import { createApp } from './app.js';

const logger = criarLogger(config);
const knex = criarKnex(config);
const { app, iniciarJobs } = createApp({ config, knex, logger });

// Porta informada pelo ambiente (Render) ou 8080 em desenvolvimento (RNF-BE-31, RNF-101)
app.listen(config.port, (erro) => {
  if (erro) {
    logger.fatal({ err: erro }, 'Falha ao iniciar o servidor HTTP');
    process.exit(1);
  }
  logger.info({ porta: config.port, ambiente: config.nodeEnv }, 'meunegocio360-back no ar');
});

iniciarJobs();
