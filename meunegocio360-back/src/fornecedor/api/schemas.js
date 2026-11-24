import { z } from 'zod';
import { ehUuid } from '../../shared/db/uuid.js';
import { somenteDigitos } from '../../shared/validation/documento.js';
import { criarSchemaDePaginacao } from '../../shared/validation/paginacao.js';
import { SITUACOES_FORNECEDOR, TIPOS_PESSOA, documentoCompativel } from '../domain/regras.js';

const obrigatorio = (iss) => (iss.input === undefined ? 'é obrigatório' : 'deve ser um texto');
// RN-01: campo desconhecido (como empresaId) é rejeitado com mensagem própria.
const CORPO_OBJETO = {
  error: (iss) =>
    iss.code === 'unrecognized_keys'
      ? `campo não permitido: ${iss.keys.join(', ')}`
      : 'o corpo da requisição deve ser um objeto JSON',
};

// Campo opcional: ausente ou null vira null (no PUT, omitir o campo limpa o valor).
const opcional = (schema) => schema.nullish().transform((valor) => valor ?? null);

// RN-01 (RN-01 a RN-04 do RF-BE-003). Os schemas são estritos: campos desconhecidos, como empresaId, dão 400.
const camposFornecedor = {
  tipoPessoa: z.enum(TIPOS_PESSOA, {
    error: `deve ser um dos valores: ${TIPOS_PESSOA.join(', ')}`,
  }),
  nome: z
    .string({ error: obrigatorio })
    .trim()
    .min(2, 'deve ter no mínimo 2 caracteres')
    .max(150, 'deve ter no máximo 150 caracteres'),
  documento: z.string({ error: obrigatorio }).transform(somenteDigitos),
  email: opcional(
    z
      .string({ error: 'deve ser um texto' })
      .trim()
      .toLowerCase()
      .pipe(
        z
          .email({ error: 'deve ser um e-mail válido' })
          .max(160, 'deve ter no máximo 160 caracteres'),
      ),
  ),
  telefone: opcional(
    z
      .string({ error: 'deve ser um texto' })
      .transform(somenteDigitos)
      .refine((valor) => /^\d{10,11}$/.test(valor), 'deve ter 10 ou 11 dígitos'),
  ),
};

// RN-01 (RN-02 do RF-BE-003): a compatibilidade tipoPessoa × documento é verificada no objeto e o erro vai para
// o campo documento.
function validarDocumento(dados, ctx) {
  if (!documentoCompativel(dados.tipoPessoa, dados.documento)) {
    ctx.addIssue({
      code: 'custom',
      path: ['documento'],
      message:
        dados.tipoPessoa === 'FISICA'
          ? 'deve ser um CPF válido para pessoa física'
          : 'deve ser um CNPJ válido para pessoa jurídica',
    });
  }
}

const versao = z
  .number({ error: (iss) => (iss.input === undefined ? 'é obrigatório' : 'deve ser um número') })
  .int('deve ser um número inteiro')
  .min(0, 'deve ser maior ou igual a 0');

// Entrada de POST /fornecedores.
export const fornecedorSchema = z
  .strictObject(camposFornecedor, CORPO_OBJETO)
  .superRefine(validarDocumento);

// Entrada de PUT /fornecedores/{id} (RN-01, RNF-BE-28).
export const editarFornecedorSchema = z
  .strictObject({ ...camposFornecedor, versao }, CORPO_OBJETO)
  .superRefine(validarDocumento);

// Entrada de PATCH /fornecedores/{id}/situacao.
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
export const idParamSchema = z.object({
  id: z.string().refine(ehUuid, 'deve ser um UUID válido'),
});

// Query de GET /fornecedores (RNF-BE-13, RNF-BE-16, RN-01).
export const listarFornecedoresQuerySchema = z.object({
  q: z
    .string({ error: 'deve ser um texto' })
    .trim()
    .max(150, 'deve ter no máximo 150 caracteres')
    .optional(),
  situacao: z
    .enum(SITUACOES_FORNECEDOR, {
      error: `deve ser um dos valores: ${SITUACOES_FORNECEDOR.join(', ')}`,
    })
    .default('ATIVO'),
  ...criarSchemaDePaginacao({ camposOrdenaveis: ['nome', 'criadoEm'], ordenacaoPadrao: 'nome' }),
});
