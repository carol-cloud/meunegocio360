import { erroNaoAutenticado } from '../../shared/security/autenticacao.js';

// Caso de uso: GET /auth/me. RN-02: somente usuários existentes e ativos.
export function makeObterUsuarioAutenticadoUseCase({ usuarioRepository }) {
  return async function obterUsuarioAutenticado(usuarioId) {
    const usuario = await usuarioRepository.buscarPorId(usuarioId);
    if (!usuario || !usuario.ativo) throw erroNaoAutenticado();
    return usuario;
  };
}
