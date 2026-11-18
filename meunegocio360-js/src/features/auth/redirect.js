// Evita redirecionamento aberto: só caminhos internos que começam com "/" (e não "//").
export function destinoSeguro(from) {
  if (typeof from !== 'string' || !from.startsWith('/')) return '/';
  if (from.startsWith('//') || from.startsWith('/\\')) return '/';
  return from;
}

export function minutosDeEspera(segundos) {
  return Math.max(1, Math.ceil(segundos / 60));
}
