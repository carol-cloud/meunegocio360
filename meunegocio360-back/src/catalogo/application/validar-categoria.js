import { erroCategoriaInvalida } from './erros.js';

// RN-05: a categoria associada ao item deve existir na empresa ativa e estar ativa.
export async function garantirCategoriaAtiva({ categoriaRepository, empresaId, categoriaId, trx }) {
  const categoria = await categoriaRepository.buscarPorId(empresaId, categoriaId, { trx });
  if (!categoria?.ativo) throw erroCategoriaInvalida();
}
