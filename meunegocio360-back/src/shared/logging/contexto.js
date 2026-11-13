import { AsyncLocalStorage } from 'node:async_hooks';

// Contexto da requisição (X-Request-Id) disponível em qualquer ponto do fluxo assíncrono
// (RNF-BE-43), inclusive nos logs emitidos pelos casos de uso.
const armazenamento = new AsyncLocalStorage();

export function obterRequestId() {
  return armazenamento.getStore()?.requestId;
}

// Executa o restante da cadeia de middlewares dentro do contexto da requisição.
export function contextoDaRequisicao(req, _res, next) {
  armazenamento.run({ requestId: req.id }, next);
}
