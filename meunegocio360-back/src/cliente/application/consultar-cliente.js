import { erroClienteNaoEncontrado } from './erros.js';

// Caso de uso: GET /clientes/{id}. Cliente de outra empresa responde 404 (RN-01).
export function makeConsultarClienteUseCase({ transacao, clienteRepository, obterEmpresaAtivaId }) {
  return async function consultarCliente(id) {
    return transacao(async (trx) => {
      const empresaId = await obterEmpresaAtivaId(trx);
      const cliente = await clienteRepository.buscarPorId(empresaId, id, { trx });
      if (!cliente) throw erroClienteNaoEncontrado();
      return cliente;
    });
  };
}
