import { z } from 'zod';

// Espelha a validação do servidor (RF-BE-001), sem substituí-la (RNF-020).
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe seu e-mail.')
    .max(160, 'Informe um e-mail válido.')
    .pipe(z.email('Informe um e-mail válido.')),
  senha: z
    .string()
    .min(1, 'Informe sua senha.')
    .min(8, 'A senha deve ter entre 8 e 72 caracteres.')
    .max(72, 'A senha deve ter entre 8 e 72 caracteres.'),
});
