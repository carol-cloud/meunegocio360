// Configuração lida pela CLI do Knex (npm run migrate / seed). Reaproveita a configuração
// validada da aplicação, que carrega o .env da raiz em desenvolvimento (README, apêndice A.2).
import { config } from './src/shared/config/env.js';
import { configuracaoKnex } from './src/shared/db/knex.js';

export default configuracaoKnex(config);
