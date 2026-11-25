// Máscaras e validações de documentos e telefones (RNF-FE-28): funções únicas, sem pacote
// externo (RNF-015). Exibição com máscara pt-BR; envio à API somente com dígitos.

export function somenteDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

export function ehCnpjValido(valor) {
  const cnpj = somenteDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const digitoVerificador = (base) => {
    const pesos =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((total, peso, i) => total + Number(base[i]) * peso, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiro = digitoVerificador(cnpj.slice(0, 12));
  const segundo = digitoVerificador(cnpj.slice(0, 12) + primeiro);
  return cnpj.endsWith(`${primeiro}${segundo}`);
}

export function ehCpfValido(valor) {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digitoVerificador = (base) => {
    const pesoInicial = base.length + 1;
    const soma = [...base].reduce(
      (total, digito, i) => total + Number(digito) * (pesoInicial - i),
      0,
    );
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const primeiro = digitoVerificador(cpf.slice(0, 9));
  const segundo = digitoVerificador(cpf.slice(0, 9) + primeiro);
  return cpf.endsWith(`${primeiro}${segundo}`);
}

// Formata progressivamente enquanto o usuário digita: 000.000.000-00.
export function formatarCpf(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// Formata progressivamente enquanto o usuário digita: 00.000.000/0000-00.
export function formatarCnpj(valor) {
  const d = somenteDigitos(valor).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function ehTelefoneValido(valor) {
  const tamanho = somenteDigitos(valor).length;
  return tamanho === 10 || tamanho === 11;
}

// (00) 0000-0000 ou (00) 00000-0000, conforme a quantidade de dígitos.
export function formatarTelefone(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const meio = d.length === 11 ? 7 : 6;
  if (d.length <= meio) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, meio)}-${d.slice(meio)}`;
}

// Tipos de pessoa do contrato (RF-BE-003): CPF para física, CNPJ para jurídica.
export const TIPOS_PESSOA = Object.freeze({ FISICA: 'FISICA', JURIDICA: 'JURIDICA' });

export const TAMANHO_DOCUMENTO = Object.freeze({ FISICA: 11, JURIDICA: 14 });

export function formatarDocumento(valor, tipoPessoa) {
  if (tipoPessoa === TIPOS_PESSOA.FISICA) return formatarCpf(valor);
  if (tipoPessoa === TIPOS_PESSOA.JURIDICA) return formatarCnpj(valor);
  // Sem tipo informado, decide pelo tamanho (exibição de documentos já gravados).
  return somenteDigitos(valor).length <= 11 ? formatarCpf(valor) : formatarCnpj(valor);
}
