import { z } from 'zod';
import { ehUuid } from '../../shared/db/uuid.js';
import { criarSchemaDePaginacao } from '../../shared/validation/paginacao.js';
import { SITUACOES, TIPOS_ITEM } from '../domain/regras.js';

const obrigatorio = (iss) => (iss.input === undefined ? 'é obrigatório' : 'deve ser um texto');
// RN-01, RN-07: campo desconhecido (como empresaId ou estoqueMinimo) é rejeitado com mensagem própria.
const CORPO_OBJETO = {
  error: (iss) =>
    iss.code === 'unrecognized_keys'
      ? `campo não permitido: ${iss.keys.join(', ')}`
      : 'o corpo da requisição deve ser um objeto JSON',
};

// Campo opcional: ausente ou null vira null (no PUT, omitir o campo limpa o valor).
const opcional = (schema) => schema.nullish().transform((valor) => valor ?? null);

// Texto opcional: espaços nas pontas são removidos e texto vazio vira null.
const textoOpcional = (max) =>
  opcional(
    z
      .string({ error: 'deve ser um texto' })
      .trim()
      .transform((valor) => valor || null)
      .pipe(z.string().max(max, `deve ter no máximo ${max} caracteres`).nullable()),
  );

const uuid = z.string({ error: obrigatorio }).refine(ehUuid, 'deve ser um UUID válido');

const versao = z
  .number({ error: (iss) => (iss.input === undefined ? 'é obrigatório' : 'deve ser um número') })
  .int('deve ser um número inteiro')
  .min(0, 'deve ser maior ou igual a 0');

const situacaoDaQuery = z
  .enum(SITUACOES, { error: `deve ser um dos valores: ${SITUACOES.join(', ')}` })
  .default('ATIVO');

const q = z
  .string({ error: 'deve ser um texto' })
  .trim()
  .max(150, 'deve ter no máximo 150 caracteres')
  .optional();

// ---------- Itens de catálogo ----------

// RN-02 a RN-05. Os schemas são estritos: estoqueMinimo e empresaId no corpo dão 400.
const camposItem = {
  // RN-02: sem transformar a caixa; "produto" é rejeitado.
  tipo: z.enum(TIPOS_ITEM, { error: `deve ser um dos valores: ${TIPOS_ITEM.join(', ')}` }),
  codigo: textoOpcional(40),
  nome: z
    .string({ error: obrigatorio })
    .trim()
    .min(2, 'deve ter no mínimo 2 caracteres')
    .max(150, 'deve ter no máximo 150 caracteres'),
  descricao: textoOpcional(500),
  // RN-04: convertida para maiúsculas; vazia ou ausente vira null e o domínio aplica o padrão.
  unidade: opcional(
    z
      .string({ error: 'deve ser um texto' })
      .trim()
      .toUpperCase()
      .transform((valor) => valor || null)
      .pipe(
        z
          .string()
          .regex(/^[A-Z0-9]{1,6}$/, 'deve ter de 1 a 6 letras ou números')
          .nullable(),
      ),
  ),
  // RN-03, RNF-033: decimal em string, sem sinal, vírgula ou notação científica; nunca Number.
  preco: z
    .string({ error: obrigatorio })
    .regex(
      /^\d{1,10}(\.\d{1,2})?$/,
      'deve ser um decimal não negativo em texto, com ponto e até 2 casas (ex.: "89.90")',
    ),
  categoriaId: opcional(
    z.string({ error: 'deve ser um texto' }).refine(ehUuid, 'deve ser um UUID válido'),
  ),
};

// Entrada de POST /itens-catalogo.
export const itemCatalogoSchema = z.strictObject(camposItem, CORPO_OBJETO);

// Entrada de PUT /itens-catalogo/{id} (RNF-BE-28).
export const editarItemCatalogoSchema = z.strictObject({ ...camposItem, versao }, CORPO_OBJETO);

// Query de GET /itens-catalogo (RN-08, RN-10, RNF-BE-13, RNF-BE-16).
export const listarItensCatalogoQuerySchema = z.object({
  q,
  tipo: z
    .enum(TIPOS_ITEM, { error: `deve ser um dos valores: ${TIPOS_ITEM.join(', ')}` })
    .optional(),
  categoriaId: uuid.optional(),
  situacao: situacaoDaQuery,
  ...criarSchemaDePaginacao({
    camposOrdenaveis: ['nome', 'preco', 'criadoEm'],
    ordenacaoPadrao: 'nome',
  }),
});

// ---------- Categorias ----------

const nomeCategoria = z
  .string({ error: obrigatorio })
  .trim()
  .min(2, 'deve ter no mínimo 2 caracteres')
  .max(80, 'deve ter no máximo 80 caracteres');

// Entrada de POST /categorias (RN-06).
export const categoriaSchema = z.strictObject({ nome: nomeCategoria }, CORPO_OBJETO);

// Entrada de PUT /categorias/{id} (RN-06, RNF-BE-28).
export const editarCategoriaSchema = z.strictObject({ nome: nomeCategoria, versao }, CORPO_OBJETO);

// Query de GET /categorias.
export const listarCategoriasQuerySchema = z.object({
  q,
  situacao: situacaoDaQuery,
  ...criarSchemaDePaginacao({ camposOrdenaveis: ['nome'], ordenacaoPadrao: 'nome' }),
});

// ---------- Comuns ----------

// Entrada de PATCH .../situacao.
export const situacaoSchema = z.strictObject(
  {
    ativo: z.boolean({
      error: (iss) => (iss.input === undefined ? 'é obrigatório' : 'deve ser true ou false'),
    }),
    versao,
  },
  CORPO_OBJETO,
);

// Parâmetro {id}: UUID malformado responde 400 VALIDATION_ERROR.
export const idParamSchema = z.object({ id: uuid });
