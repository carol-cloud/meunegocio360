// RF-BE-002 — RN-07: perfis ADMIN, OPERADOR_COMERCIAL e OPERADOR_FINANCEIRO.
// O CHECK ck_usuario_perfil (RF-BE-001) só aceita ADMIN/USUARIO: ele é removido ANTES do
// UPDATE (senão o MySQL rejeita com ER_CHECK_CONSTRAINT_VIOLATED) e recriado depois.
const PERFIS_NOVOS = "'ADMIN', 'OPERADOR_COMERCIAL', 'OPERADOR_FINANCEIRO'";
const PERFIS_ANTIGOS = "'ADMIN', 'USUARIO'";

async function recriarCheck(knex, perfis) {
  await knex.raw('ALTER TABLE usuario DROP CHECK ck_usuario_perfil');
  return async () => {
    await knex.raw(
      `ALTER TABLE usuario ADD CONSTRAINT ck_usuario_perfil CHECK (perfil IN (${perfis}))`,
    );
  };
}

export async function up(knex) {
  const recriar = await recriarCheck(knex, PERFIS_NOVOS);
  await knex('usuario').where({ perfil: 'USUARIO' }).update({ perfil: 'OPERADOR_COMERCIAL' });
  await recriar();
}

export async function down(knex) {
  const financeiro = await knex('usuario').where({ perfil: 'OPERADOR_FINANCEIRO' }).first('id');
  if (financeiro) {
    throw new Error(
      'Rollback recusado: existem usuários OPERADOR_FINANCEIRO, perfil sem equivalente antes do RF-BE-002.',
    );
  }
  const recriar = await recriarCheck(knex, PERFIS_ANTIGOS);
  await knex('usuario').where({ perfil: 'OPERADOR_COMERCIAL' }).update({ perfil: 'USUARIO' });
  await recriar();
}
