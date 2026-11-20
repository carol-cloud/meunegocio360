import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { config } from '../../src/shared/config/env.js';
import { uuidParaBinario } from '../../src/shared/db/uuid.js';
import { PERFIS } from '../../src/shared/security/perfis.js';

// Seed de desenvolvimento (RF-BE-001, RF-BE-002 RN-08, RNF-BE-24): um usuário por perfil e
// nenhuma empresa. Senhas vêm do .env, nunca do repositório.
export async function seed(knex) {
  if (config.isProduction) {
    throw new Error('Seed recusado: não é permitido executar seeds com NODE_ENV=production.');
  }

  const { adminSenha, usuarioSenha, financeiroSenha } = config.seed;
  for (const [variavel, senha] of [
    ['SEED_ADMIN_SENHA', adminSenha],
    ['SEED_USUARIO_SENHA', usuarioSenha],
    ['SEED_FINANCEIRO_SENHA', financeiroSenha],
  ]) {
    if (!senha || senha.length < 8 || senha.length > 72) {
      throw new Error(`Defina ${variavel} no arquivo .env com 8 a 72 caracteres.`);
    }
  }

  const agora = new Date();
  const usuarios = [
    {
      nome: 'Administrador',
      email: 'admin@meunegocio360.com.br',
      perfil: PERFIS.ADMIN,
      senha: adminSenha,
    },
    {
      nome: 'Operador Comercial',
      email: 'comercial@meunegocio360.com.br',
      perfil: PERFIS.OPERADOR_COMERCIAL,
      senha: usuarioSenha,
    },
    {
      nome: 'Operador Financeiro',
      email: 'financeiro@meunegocio360.com.br',
      perfil: PERFIS.OPERADOR_FINANCEIRO,
      senha: financeiroSenha,
    },
  ];

  // Usuário fictício do RF-BE-001, substituído por comercial@ e financeiro@.
  const EMAILS_LEGADOS = ['usuario@meunegocio360.com.br'];

  const linhas = await Promise.all(
    usuarios.map(async ({ senha, ...usuario }) => ({
      id: uuidParaBinario(randomUUID()),
      ...usuario,
      senha_hash: await bcrypt.hash(senha, 12),
      ativo: true,
      tentativas_falhas: 0,
      criado_em: agora,
      atualizado_em: agora,
      versao: 0,
    })),
  );

  // Recria apenas os usuários fictícios (e suas sessões), sem tocar em outros registros.
  const emails = [...usuarios.map((usuario) => usuario.email), ...EMAILS_LEGADOS];
  await knex.transaction(async (trx) => {
    await trx('refresh_token')
      .whereIn('usuario_id', trx('usuario').select('id').whereIn('email', emails))
      .del();
    await trx('usuario').whereIn('email', emails).del();
    await trx('usuario').insert(linhas);
  });
}
