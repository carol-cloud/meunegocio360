import { z } from 'zod';

const TAMANHO_PADRAO = 20;
const TAMANHO_MAXIMO = 100;

const inteiroDaQuery = (minimo, maximo) =>
  z.coerce
    .number({ error: 'deve ser um número' })
    .int('deve ser um número inteiro')
    .min(minimo, `deve ser maior ou igual a ${minimo}`)
    .max(maximo, `deve ser menor ou igual a ${maximo}`);

// Parâmetros de paginação (RNF-BE-13, RNF-BE-16): page a partir de 0, size de 1 a 100 e sort
// restrito a uma lista permitida. Devolve o "shape" para compor o schema da query de cada listagem.
export function criarSchemaDePaginacao({ camposOrdenaveis, ordenacaoPadrao }) {
  return {
    page: inteiroDaQuery(0, Number.MAX_SAFE_INTEGER).default(0),
    size: inteiroDaQuery(1, TAMANHO_MAXIMO).default(TAMANHO_PADRAO),
    sort: z
      .enum(camposOrdenaveis, {
        error: `deve ser um dos valores: ${camposOrdenaveis.join(', ')}`,
      })
      .default(ordenacaoPadrao),
  };
}

// Resposta paginada padrão (RNF-BE-13).
export function montarPagina({ conteudo, page, size, totalElements }) {
  return {
    content: conteudo,
    page,
    size,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
  };
}

// Escapa os curingas do LIKE (\, % e _) para que o termo seja buscado literalmente (RNF-BE-16).
export function escaparLike(termo) {
  return termo.replace(/[\\%_]/g, (caractere) => `\\${caractere}`);
}
