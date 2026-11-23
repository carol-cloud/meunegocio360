import { randomUUID } from 'node:crypto';
import { erroDocumentoDuplicado } from './erros.js';

// Caso de uso: POST /clientes (RN-01 a RN-04). O cliente nasce ativo na empresa ativa. A
// verificação prévia dá a resposta certa; o índice uk_cliente_empresa_documento garante a
// unicidade em caso de corrida (traduzido pelo repositório).
export function makeCadastrarClienteUseCase({
  transacao,
  clienteRepository,
  obterEmpresaAtivaId,
  clock,
}) {
  return async function cadastrarCliente(dados) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      if (await clienteRepository.existeDocumento(empresaId, dados.documento, { trx })) {
        throw erroDocumentoDuplicado();
      }
      const id = randomUUID();
      await clienteRepository.inserir(
        empresaId,
        { ...dados, id, ativo: true, agora: clock.now() },
        trx,
      );
      return clienteRepository.buscarPorId(empresaId, id, { trx });
    });
  };
}
