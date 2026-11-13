import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';

const CUSTO_BCRYPT = 12;

// Hash e verificação de senha com bcrypt (RNF-023). Sempre as versões assíncronas (RNF-053).
export function criarPasswordHasher({ custo = CUSTO_BCRYPT } = {}) {
  // RN-03: hash fictício gerado uma única vez, com o mesmo custo, para que o login com e-mail
  // inexistente gaste o mesmo tempo que o de senha incorreta.
  const hashFicticio = bcrypt.hash(randomBytes(32).toString('base64url'), custo);

  return {
    comparar: (senha, senhaHash) => bcrypt.compare(senha, senhaHash),

    async compararComHashFicticio(senha) {
      await bcrypt.compare(senha, await hashFicticio);
      return false;
    },
  };
}
