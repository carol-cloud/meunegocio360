import cookieParser from 'cookie-parser';
import express from 'express';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { ROTAS_PUBLICAS_AUTH, criarModuloAuth } from './auth/index.js';
import { criarModuloCatalogo } from './catalogo/index.js';
import { criarModuloCliente } from './cliente/index.js';
import { criarModuloEmpresa } from './empresa/index.js';
import { criarModuloFornecedor } from './fornecedor/index.js';
import { relogioDoSistema } from './shared/clock.js';
import { criarEspecificacaoOpenApi } from './shared/docs/openapi.js';
import { naoEncontrado, tratadorDeErros } from './shared/errors/error-handler.js';
import { contextoDaRequisicao } from './shared/logging/contexto.js';
import { requestId } from './shared/logging/request-id.js';
import { criarAutenticacao } from './shared/security/autenticacao.js';
import { criarCors, criarHelmet, semCache } from './shared/security/http.js';
import { criarVerificarOrigin } from './shared/security/origin.js';

// Monta o Express e compõe as dependências (RNF-BE-03). Exporta o `app` sem subir o servidor,
// para uso futuro com Supertest (RNF-BE-46).
export function createApp({ config, knex, logger, clock = relogioDoSistema }) {
  const app = express();
  app.disable('x-powered-by');

  // Observabilidade (RNF-BE-43, RNF-BE-44)
  app.use(requestId);
  app.use(pinoHttp({ logger, genReqId: (req) => req.id }));

  // Segurança e entrada (RNF-BE-41, RNF-BE-42)
  app.use(criarHelmet(config));
  app.use(criarCors(config));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(contextoDaRequisicao);

  // Health check público e sem detalhes (RNF-051, RNF-104)
  app.get('/health', (_req, res) => {
    res.json({ status: 'UP' });
  });

  // Swagger UI somente fora de produção (RNF-030)
  if (!config.isProduction) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(criarEspecificacaoOpenApi()));
  }

  const auth = criarModuloAuth({
    config,
    knex,
    clock,
    logger,
    verificarOrigin: criarVerificarOrigin(config.cors.allowedOrigins),
  });

  // RF-BE-002: empresa.obterEmpresaAtivaId será injetada nas factories das features de
  // negócio (RF-BE-003 em diante), que nunca importam o repositório da empresa (RNF-096).
  const empresa = criarModuloEmpresa({ knex, clock });

  // RF-BE-003: a feature cliente recebe a empresa ativa e os verificadores de vínculo por
  // injeção (RN-06). Vendas e OS acrescentarão aqui os seus verificadores.
  const cliente = criarModuloCliente({
    knex,
    clock,
    obterEmpresaAtivaId: empresa.obterEmpresaAtivaId,
    verificadoresDeVinculo: [],
  });

  // RF-BE-004: a feature fornecedor segue o mesmo desenho de cliente, sem depender dela.
  // Compras (Suprimentos) e contas a pagar acrescentarão aqui os seus verificadores (RN-04).
  const fornecedor = criarModuloFornecedor({
    knex,
    clock,
    obterEmpresaAtivaId: empresa.obterEmpresaAtivaId,
    verificadoresDeVinculo: [],
  });

  // RF-BE-005: o catálogo recebe a empresa ativa e os verificadores de vínculo do item (RN-09).
  // Vendas e compras acrescentarão aqui os seus verificadores.
  const catalogo = criarModuloCatalogo({
    knex,
    clock,
    obterEmpresaAtivaId: empresa.obterEmpresaAtivaId,
    verificadoresDeVinculoItem: [],
  });

  // Router /api/v1 com autenticação deny-by-default (RNF-BE-40): o middleware vem antes de
  // qualquer rota; só a lista explícita de rotas públicas passa sem token.
  const api = express.Router();
  api.use(semCache);
  api.use(
    criarAutenticacao({
      verificarToken: auth.verificarToken,
      rotasPublicas: [...ROTAS_PUBLICAS_AUTH],
    }),
  );
  api.use(auth.router);
  api.use(empresa.router);
  api.use(cliente.router);
  api.use(fornecedor.router);
  api.use(catalogo.router);
  app.use('/api/v1', api);

  // 404 e middleware único de erros, sempre por último (RNF-BE-14)
  app.use(naoEncontrado);
  app.use(tratadorDeErros);

  return { app, iniciarJobs: () => [auth.iniciarLimpeza()] };
}
