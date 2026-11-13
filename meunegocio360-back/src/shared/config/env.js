import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

// Único módulo que lê process.env (RNF-BE-31). Em desenvolvimento, carrega o .env da raiz
// do repositório; em produção, as variáveis vêm do ambiente (painel do Render).
if (process.env.NODE_ENV !== 'production') {
  const raizDoRepositorio = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../..',
  );
  dotenv.config({ path: path.join(raizDoRepositorio, '.env'), quiet: true });
}

const textoObrigatorio = z.string().min(1, 'é obrigatório');
const inteiroPositivo = (padrao) => z.coerce.number().int().positive().default(padrao);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DB_HOST: textoObrigatorio,
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_NAME: textoObrigatorio,
  DB_USER: textoObrigatorio,
  DB_PASSWORD: textoObrigatorio,

  // RNF-BE-32: segredo do JWT com pelo menos 32 bytes, sem valor padrão.
  JWT_SECRET: z
    .string()
    .refine((valor) => Buffer.byteLength(valor, 'utf8') >= 32, 'deve ter no mínimo 32 bytes'),
  CORS_ALLOWED_ORIGINS: z
    .string()
    .transform((valor) =>
      valor
        .split(',')
        .map((origem) => origem.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(z.url().refine((origem) => !origem.includes('*'), 'não pode conter *'))
        .min(1, 'informe ao menos uma origem'),
    ),
  APP_AUTH_COOKIE_SECURE: z.enum(['true', 'false']).transform((valor) => valor === 'true'),
  APP_AUTH_MAX_TENTATIVAS: inteiroPositivo(5),
  APP_AUTH_BLOQUEIO_MINUTOS: inteiroPositivo(15),
  APP_AUTH_JWT_EXPIRACAO_MINUTOS: inteiroPositivo(15),
  APP_AUTH_REFRESH_EXPIRACAO_DIAS: inteiroPositivo(7),

  // Usadas apenas pelo seed de desenvolvimento, que valida a presença delas.
  SEED_ADMIN_SENHA: z.string().optional(),
  SEED_USUARIO_SENHA: z.string().optional(),
});

const resultado = schema.safeParse(process.env);

if (!resultado.success) {
  // Fail fast (RNF-BE-32): informa apenas o nome da variável e o motivo, nunca o valor.
  // O logger ainda não existe aqui (depende desta configuração), por isso stderr direto.
  const problemas = resultado.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  process.stderr.write(
    `Configuração inválida. Verifique as variáveis de ambiente:\n${problemas}\n`,
  );
  process.exit(1);
}

const env = resultado.data;

export const config = Object.freeze({
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,
  logLevel: env.LOG_LEVEL,
  db: Object.freeze({
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  }),
  cors: Object.freeze({ allowedOrigins: Object.freeze(env.CORS_ALLOWED_ORIGINS) }),
  auth: Object.freeze({
    jwtSecret: env.JWT_SECRET,
    jwtExpiracaoMinutos: env.APP_AUTH_JWT_EXPIRACAO_MINUTOS,
    refreshExpiracaoDias: env.APP_AUTH_REFRESH_EXPIRACAO_DIAS,
    maxTentativas: env.APP_AUTH_MAX_TENTATIVAS,
    bloqueioMinutos: env.APP_AUTH_BLOQUEIO_MINUTOS,
    cookieSecure: env.APP_AUTH_COOKIE_SECURE,
  }),
  seed: Object.freeze({
    adminSenha: env.SEED_ADMIN_SENHA,
    usuarioSenha: env.SEED_USUARIO_SENHA,
  }),
});
