// Validador único de documentos (RNF-BE-27): funções puras, reutilizadas pelos schemas Zod.

export function somenteDigitos(valor) {
  return typeof valor === 'string' ? valor.replace(/\D/g, '') : valor;
}

function digitoVerificador(digitos, pesos) {
  const soma = pesos.reduce((total, peso, i) => total + Number(digitos[i]) * peso, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

const PESOS_CNPJ_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_CNPJ_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

// CNPJ com 14 dígitos, sem sequência repetida e com os dois dígitos verificadores corretos.
export function ehCnpjValido(cnpj) {
  if (typeof cnpj !== 'string' || !/^\d{14}$/.test(cnpj)) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  return (
    digitoVerificador(cnpj, PESOS_CNPJ_1) === Number(cnpj[12]) &&
    digitoVerificador(cnpj, PESOS_CNPJ_2) === Number(cnpj[13])
  );
}

const PESOS_CPF_1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_CPF_2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

// CPF com 11 dígitos, sem sequência repetida e com os dois dígitos verificadores corretos.
export function ehCpfValido(cpf) {
  if (typeof cpf !== 'string' || !/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  return (
    digitoVerificador(cpf, PESOS_CPF_1) === Number(cpf[9]) &&
    digitoVerificador(cpf, PESOS_CPF_2) === Number(cpf[10])
  );
}
