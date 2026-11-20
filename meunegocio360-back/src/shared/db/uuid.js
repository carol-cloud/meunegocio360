// Conversão UUID <-> BINARY(16), concentrada aqui (RNF-BE-22).
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ehUuid(valor) {
  return typeof valor === 'string' && FORMATO_UUID.test(valor);
}

export function uuidParaBinario(uuid) {
  if (!ehUuid(uuid)) {
    throw new TypeError('UUID inválido');
  }
  return Buffer.from(uuid.replaceAll('-', ''), 'hex');
}

export function binarioParaUuid(binario) {
  const hex = Buffer.from(binario).toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}
