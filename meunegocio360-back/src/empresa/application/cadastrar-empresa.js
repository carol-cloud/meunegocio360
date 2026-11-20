import { randomUUID } from 'node:crypto';
import { erroCnpjDuplicado, erroEmpresaJaAtiva } from './erros.js';

// Caso de uso: POST /empresa (RN-01, RN-02). A empresa nasce ativa. As verificações prévias
// dão a resposta certa (CNPJ duplicado tem precedência); os índices uk_empresa_cnpj e
// uk_empresa_ativa_unica garantem as regras em caso de corrida.
export function makeCadastrarEmpresaUseCase({ transacao, empresaRepository, clock }) {
  return async function cadastrarEmpresa(dados) {
    return transacao(async (trx) => {
      if (await empresaRepository.existeCnpj(dados.cnpj, { trx })) throw erroCnpjDuplicado();
      if (await empresaRepository.buscarAtiva({ trx, bloquear: true })) {
        throw erroEmpresaJaAtiva();
      }
      const id = randomUUID();
      await empresaRepository.inserir({ ...dados, id, ativa: true, agora: clock.now() }, trx);
      return empresaRepository.buscarPorId(id, { trx });
    });
  };
}
