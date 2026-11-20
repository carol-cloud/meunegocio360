import { z } from 'zod';
import { ehUuid } from '../../shared/db/uuid.js';
import { ehCnpjValido, somenteDigitos } from '../../shared/validation/documento.js';
import { MOEDAS_ACEITAS, PADROES_EMPRESA } from '../domain/regras.js';

const obrigatorio = (iss) => (iss.input === undefined ? 'é obrigatório' : 'deve ser um texto');
const FUSOS_IANA = new Set(Intl.supportedValuesOf('timeZone'));

// Campo opcional: ausente ou null vira null (no PUT, omitir o campo limpa o valor).
const opcional = (schema) => schema.nullish().transform((valor) => valor ?? null);

const textoOpcional = (max) =>
  opcional(
    z
      .string({ error: 'deve ser um texto' })
      .trim()
      .max(max, `deve ter no máximo ${max} caracteres`),
  );

// Entrada de POST /empresa (RN-01, RN-05, RN-06). Textos com trim; CNPJ com ou sem máscara.
export const empresaSchema = z.object(
  {
    razaoSocial: z
      .string({ error: obrigatorio })
      .trim()
      .min(3, 'deve ter no mínimo 3 caracteres')
      .max(150, 'deve ter no máximo 150 caracteres'),
    nomeFantasia: textoOpcional(150),
    cnpj: z
      .string({ error: obrigatorio })
      .transform(somenteDigitos)
      .refine(ehCnpjValido, 'CNPJ inválido'),
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
    fusoHorario: z
      .string({ error: 'deve ser um texto' })
      .trim()
      .refine((fuso) => FUSOS_IANA.has(fuso), 'deve ser um fuso horário IANA válido')
      .default(PADROES_EMPRESA.fusoHorario),
    moeda: z
      .enum(MOEDAS_ACEITAS, { error: `deve ser um dos valores: ${MOEDAS_ACEITAS.join(', ')}` })
      .default(PADROES_EMPRESA.moeda),
  },
  { error: 'o corpo da requisição deve ser um objeto JSON' },
);

const versao = z
  .number({ error: (iss) => (iss.input === undefined ? 'é obrigatório' : 'deve ser um número') })
  .int('deve ser um número inteiro')
  .min(0, 'deve ser maior ou igual a 0');

// Entrada de PUT /empresa/{id} (RN-06, RNF-BE-28).
export const editarEmpresaSchema = empresaSchema.extend({ versao });

// Entrada de PATCH /empresa/{id}/situacao.
export const situacaoSchema = z.object(
  {
    ativa: z.boolean({
      error: (iss) => (iss.input === undefined ? 'é obrigatório' : 'deve ser true ou false'),
    }),
    versao,
  },
  { error: 'o corpo da requisição deve ser um objeto JSON' },
);

// Parâmetro {id}: UUID malformado responde 400 VALIDATION_ERROR.
export const idParamSchema = z.object({
  id: z.string().refine(ehUuid, 'deve ser um UUID válido'),
});
