import { ehCnpjValido, ehCpfValido } from '../../shared/validation/documento.js';

// Regras de negócio puras do RF-BE-004 (sem Express nem Knex, RNF-010).

export const TIPOS_PESSOA = Object.freeze(['FISICA', 'JURIDICA']);

export const SITUACOES_FORNECEDOR = Object.freeze(['ATIVO', 'INATIVO', 'TODOS']);

// RN-01 (RN-02 do RF-BE-003): FISICA exige CPF (11 dígitos) e JURIDICA exige CNPJ (14 dígitos), ambos válidos.
export function documentoCompativel(tipoPessoa, documento) {
  if (tipoPessoa === 'FISICA') return ehCpfValido(documento);
  if (tipoPessoa === 'JURIDICA') return ehCnpjValido(documento);
  return false;
}
