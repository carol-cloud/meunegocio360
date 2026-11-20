import { z } from 'zod';

const obrigatorio = (iss) => (iss.input === undefined ? 'é obrigatório' : 'deve ser um texto');

// Entrada de POST /auth/login. RN-01: e-mail com trim e em minúsculas. RN-11: senha de 8 a 72.
export const loginSchema = z.object(
  {
    email: z
      .string({ error: obrigatorio })
      .trim()
      .toLowerCase()
      .pipe(
        z
          .email({ error: 'deve ser um e-mail válido' })
          .max(160, 'deve ter no máximo 160 caracteres'),
      ),
    senha: z
      .string({ error: obrigatorio })
      .min(8, 'deve ter no mínimo 8 caracteres')
      .max(72, 'deve ter no máximo 72 caracteres'),
  },
  { error: 'o corpo da requisição deve ser um objeto JSON' },
);
