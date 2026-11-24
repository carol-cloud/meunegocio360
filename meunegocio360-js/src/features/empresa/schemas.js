import { z } from 'zod';
import { ehCnpjValido, ehTelefoneValido, somenteDigitos } from '../../shared/lib/documentos.js';
import { FUSOS_HORARIOS } from './fusos.js';

// Campo opcional vazio vai como null: no PUT, isso limpa o valor (RF-BE-002, RN-06).
const opcional = (valor) => (valor === '' ? null : valor);

// Espelha o schema do backend (RF-BE-002, RN-01, RN-05 e RN-06) sem substituí-lo (RNF-020).
// CNPJ e telefone saem somente com dígitos (RNF-FE-28).
export const empresaSchema = z.object({
  razaoSocial: z
    .string()
    .trim()
    .min(1, 'Informe a razão social.')
    .min(3, 'A razão social deve ter entre 3 e 150 caracteres.')
    .max(150, 'A razão social deve ter entre 3 e 150 caracteres.'),
  nomeFantasia: z
    .string()
    .trim()
    .max(150, 'O nome fantasia deve ter até 150 caracteres.')
    .transform(opcional),
  cnpj: z
    .string()
    .transform(somenteDigitos)
    .refine((cnpj) => cnpj.length > 0, 'Informe o CNPJ.')
    .refine((cnpj) => cnpj.length === 0 || ehCnpjValido(cnpj), 'CNPJ inválido.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(160, 'Informe um e-mail válido.')
    .refine(
      (email) => email === '' || z.email().safeParse(email).success,
      'Informe um e-mail válido.',
    )
    .transform(opcional),
  telefone: z
    .string()
    .transform(somenteDigitos)
    .refine((tel) => tel === '' || ehTelefoneValido(tel), 'Informe um telefone válido com DDD.')
    .transform(opcional),
  fusoHorario: z.enum(
    FUSOS_HORARIOS.map(({ valor }) => valor),
    'Selecione um fuso horário.',
  ),
  moeda: z.literal('BRL'),
});

export const CAMPOS_EMPRESA = Object.freeze(Object.keys(empresaSchema.shape));
