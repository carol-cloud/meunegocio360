import { PERFIS, TODOS_OS_PERFIS } from '../shared/lib/perfis.js';

// Itens do menu por perfil (RF-FE-002, "Perfis e acesso"; RNF-FE-16). Cada RF seguinte
// (RF-FE-003 a 005) acrescenta o seu item aqui.
export const ITENS_MENU = Object.freeze([
  { rotulo: 'Início', para: '/', perfis: TODOS_OS_PERFIS, exato: true },
  { rotulo: 'Empresa', para: '/empresa', perfis: TODOS_OS_PERFIS },
  { rotulo: 'Clientes', para: '/clientes', perfis: [PERFIS.ADMIN, PERFIS.OPERADOR_COMERCIAL] },
]);

export function itensDoPerfil(perfil) {
  return ITENS_MENU.filter((item) => item.perfis.includes(perfil));
}
