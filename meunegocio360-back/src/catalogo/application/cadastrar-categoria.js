import { randomUUID } from 'node:crypto';
import { erroNomeDeCategoriaDuplicado } from './erros.js';

// Caso de uso: POST /categorias (RN-01, RN-06). A verificação prévia dá a resposta certa; o índice
// uk_categoria_empresa_nome garante a unicidade em caso de corrida (traduzido pelo repositório).
export function makeCadastrarCategoriaUseCase({
  transacao,
  categoriaRepository,
  obterEmpresaAtivaId,
  clock,
}) {
  return async function cadastrarCategoria({ nome }) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      if (await categoriaRepository.existeNome(empresaId, nome, { trx })) {
        throw erroNomeDeCategoriaDuplicado();
      }
      const id = randomUUID();
      await categoriaRepository.inserir(
        empresaId,
        { id, nome, ativo: true, agora: clock.now() },
        trx,
      );
      return categoriaRepository.buscarPorId(empresaId, id, { trx });
    });
  };
}
