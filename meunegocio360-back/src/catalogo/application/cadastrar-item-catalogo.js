import { randomUUID } from 'node:crypto';
import { unidadeOuPadrao } from '../domain/regras.js';
import { erroCodigoDuplicado } from './erros.js';
import { garantirCategoriaAtiva } from './validar-categoria.js';

// Caso de uso: POST /itens-catalogo (RN-01 a RN-05). O item nasce ativo; a unidade, se omitida,
// segue o padrão do tipo. O índice uk_item_catalogo_empresa_codigo garante a unicidade em corrida.
export function makeCadastrarItemCatalogoUseCase({
  transacao,
  itemCatalogoRepository,
  categoriaRepository,
  obterEmpresaAtivaId,
  clock,
}) {
  return async function cadastrarItemCatalogo(dados) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      if (dados.categoriaId) {
        await garantirCategoriaAtiva({
          categoriaRepository,
          empresaId,
          categoriaId: dados.categoriaId,
          trx,
        });
      }
      if (
        dados.codigo &&
        (await itemCatalogoRepository.existeCodigo(empresaId, dados.codigo, { trx }))
      ) {
        throw erroCodigoDuplicado();
      }
      const id = randomUUID();
      await itemCatalogoRepository.inserir(
        empresaId,
        {
          ...dados,
          unidade: unidadeOuPadrao(dados.tipo, dados.unidade),
          id,
          ativo: true,
          agora: clock.now(),
        },
        trx,
      );
      return itemCatalogoRepository.buscarPorId(empresaId, id, { trx });
    });
  };
}
