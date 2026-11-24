import { randomUUID } from 'node:crypto';
import { erroDocumentoDuplicado } from './erros.js';

// Caso de uso: POST /fornecedores (RN-01, RN-02). O fornecedor nasce ativo na empresa ativa. A
// verificação prévia dá a resposta certa; o índice uk_fornecedor_empresa_documento garante a
// unicidade em caso de corrida (traduzido pelo repositório).
export function makeCadastrarFornecedorUseCase({
  transacao,
  fornecedorRepository,
  obterEmpresaAtivaId,
  clock,
}) {
  return async function cadastrarFornecedor(dados) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      if (await fornecedorRepository.existeDocumento(empresaId, dados.documento, { trx })) {
        throw erroDocumentoDuplicado();
      }
      const id = randomUUID();
      await fornecedorRepository.inserir(
        empresaId,
        { ...dados, id, ativo: true, agora: clock.now() },
        trx,
      );
      return fornecedorRepository.buscarPorId(empresaId, id, { trx });
    });
  };
}
