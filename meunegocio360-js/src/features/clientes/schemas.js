import { z } from 'zod';
import {
  ehCnpjValido,
  ehCpfValido,
  ehTelefoneValido,
  somenteDigitos,
  TIPOS_PESSOA,
} from '../../shared/lib/documentos.js';

// Campo opcional vazio vai como null: no PUT, isso limpa o valor (RF-BE-003).
const opcional = (valor) => (valor === '' ? null : valor);

// Espelha o schema do backend (RF-BE-003, RN-02 a RN-04) sem substituí-lo (RNF-020).
// Documento e telefone saem somente com dígitos (RNF-FE-28).
export const clienteSchema = z
  .object({
    tipoPessoa: z.enum(Object.values(TIPOS_PESSOA), 'Selecione o tipo de pessoa.'),
    nome: z
      .string()
      .trim()
      .min(1, 'Informe o nome.')
      .min(2, 'O nome deve ter entre 2 e 150 caracteres.')
      .max(150, 'O nome deve ter entre 2 e 150 caracteres.'),
    documento: z.string().transform(somenteDigitos),
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
  })
  // O documento depende do tipo de pessoa: o erro vai para o campo documento.
  .superRefine(({ tipoPessoa, documento }, ctx) => {
    let mensagem = null;
    if (documento === '') mensagem = 'Informe o documento.';
    else if (tipoPessoa === TIPOS_PESSOA.FISICA && !ehCpfValido(documento)) {
      mensagem = 'CPF inválido.';
    } else if (tipoPessoa === TIPOS_PESSOA.JURIDICA && !ehCnpjValido(documento)) {
      mensagem = 'CNPJ inválido.';
    }
    if (mensagem) ctx.addIssue({ code: 'custom', path: ['documento'], message: mensagem });
  });

export const CAMPOS_CLIENTE = Object.freeze([
  'tipoPessoa',
  'nome',
  'documento',
  'email',
  'telefone',
]);

// Opções do filtro de situação da lista (RF-FE-003; padrão Ativos).
export const SITUACOES = Object.freeze([
  { valor: 'ATIVO', rotulo: 'Ativos' },
  { valor: 'INATIVO', rotulo: 'Inativos' },
  { valor: 'TODOS', rotulo: 'Todos' },
]);
