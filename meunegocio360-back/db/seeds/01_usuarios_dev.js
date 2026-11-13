import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { config } from '../../src/shared/config/env.js';
import { uuidParaBinario } from '../../src/shared/db/uuid.js';

// Seed de desenvolvimento (RF-BE-001, RNF-BE-24). Senhas vêm do .env, nunca do repositório.
export async function seed(knex) {
  if (config.isProduction) {
    throw new Error('Seed recusado: não é permitido executar seeds com NODE_ENV=production.');
  }

  const { adminSenha, usuarioSenha } = config.seed;
  for (const [variavel, senha] of [
    ['SEED_ADMIN_SENHA', adminSenha],
    ['SEED_USUARIO_SENHA', usuarioSenha],
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
      perfil: 'ADMIN',
      senha: adminSenha,
    },
    {
      nome: 'Usuário',
      email: 'usuario@meunegocio360.com.br',
      perfil: 'USUARIO',
      senha: usuarioSenha,
    },
  ];

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
  const emails = usuarios.map((usuario) => usuario.email);
  await knex.transaction(async (trx) => {
    await trx('refresh_token')
      .whereIn('usuario_id', trx('usuario').select('id').whereIn('email', emails))
      .del();
    await trx('usuario').whereIn('email', emails).del();
    await trx('usuario').insert(linhas);
  });
}
