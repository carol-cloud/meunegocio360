import { categoriaMudou, tipoAlterado, unidadeOuPadrao } from '../domain/regras.js';
import {
  erroCodigoDuplicado,
  erroConflitoDeVersao,
  erroItemNaoEncontrado,
  erroTipoImutavel,
} from './erros.js';
import { garantirCategoriaAtiva } from './validar-categoria.js';

// Caso de uso: PUT /itens-catalogo/{id} (RN-02, RN-04, RN-05, RNF-BE-28). O tipo não muda; a
// categoria só é validada quando o item passa a ser associado a outra categoria.
export function makeEditarItemCatalogoUseCase({
  transacao,
  itemCatalogoRepository,
  categoriaRepository,
  obterEmpresaAtivaId,
  clock,
}) {
  return async function editarItemCatalogo(id, { versao, ...dados }) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const atual = await itemCatalogoRepository.buscarPorId(empresaId, id, { trx });
      if (!atual) throw erroItemNaoEncontrado();
      if (tipoAlterado(atual.tipo, dados.tipo)) throw erroTipoImutavel();

      if (categoriaMudou(atual.categoria?.id ?? null, dados.categoriaId)) {
        await garantirCategoriaAtiva({
          categoriaRepository,
          empresaId,
          categoriaId: dados.categoriaId,
          trx,
        });
      }
      if (
        dados.codigo &&
        (await itemCatalogoRepository.existeCodigo(empresaId, dados.codigo, { trx, exceto: id }))
      ) {
        throw erroCodigoDuplicado();
      }

      const linhas = await itemCatalogoRepository.atualizar(
        empresaId,
        id,
        versao,
        { ...dados, unidade: unidadeOuPadrao(dados.tipo, dados.unidade) },
        clock.now(),
        trx,
      );
      if (linhas === 0) throw erroConflitoDeVersao();
      return itemCatalogoRepository.buscarPorId(empresaId, id, { trx });
    });
  };
}
