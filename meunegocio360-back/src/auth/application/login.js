import { randomUUID } from 'node:crypto';
import { mascararEmail } from '../../shared/logging/logger.js';
import {
  atingiuLimiteDeTentativas,
  estaBloqueado,
  segundosAteDesbloqueio,
  somarMinutos,
} from '../domain/regras.js';
import { erroContaBloqueada, erroCredenciaisInvalidas } from './erros.js';

// Caso de uso: POST /auth/login (RN-01 a RN-06, RN-12 e RN-13).
export function makeLoginUseCase({
  transacao,
  usuarioRepository,
  refreshTokenRepository,
  passwordHasher,
  emitirSessao,
  clock,
  logger,
  maxTentativas,
  bloqueioMinutos,
}) {
  return async function login({ email, senha }) {
    // As falhas são devolvidas como resultado (e não lançadas) dentro da transação, para que
    // o incremento do contador e o bloqueio sejam confirmados (commit) antes do erro HTTP.
    const resultado = await transacao(async (trx) => {
      const agora = clock.now();
      // RN-04: FOR UPDATE serializa logins simultâneos do mesmo usuário.
      const usuario = await usuarioRepository.buscarPorEmail(email, { trx, bloquear: true });

      if (!usuario) {
        // RN-03: mesmo custo de bcrypt de uma senha incorreta.
        await passwordHasher.compararComHashFicticio(senha);
        return { falha: 'CREDENCIAIS_INVALIDAS', motivo: 'email_inexistente' };
      }

      if (estaBloqueado(usuario, agora)) {
        return {
          falha: 'BLOQUEADO',
          usuarioId: usuario.id,
          segundos: segundosAteDesbloqueio(usuario, agora),
        };
      }

      const senhaConfere = await passwordHasher.comparar(senha, usuario.senhaHash);

      // RN-02: usuário inativo recebe a mesma resposta genérica e não acumula falhas.
      if (!usuario.ativo) {
        return { falha: 'CREDENCIAIS_INVALIDAS', motivo: 'usuario_inativo', usuarioId: usuario.id };
      }

      if (!senhaConfere) {
        await usuarioRepository.registrarFalha(usuario.id, agora, trx);
        const tentativas = usuario.tentativasFalhas + 1; // seguro: a linha está travada
        if (atingiuLimiteDeTentativas(tentativas, maxTentativas)) {
          await usuarioRepository.bloquear(
            usuario.id,
            somarMinutos(agora, bloqueioMinutos),
            agora,
            trx,
          );
          // RN-13: bloquear o usuário revoga as suas sessões ativas.
          await refreshTokenRepository.revogarTodosDoUsuario(usuario.id, agora, trx);
          return {
            falha: 'CREDENCIAIS_INVALIDAS',
            motivo: 'conta_bloqueada',
            usuarioId: usuario.id,
          };
        }
        return { falha: 'CREDENCIAIS_INVALIDAS', motivo: 'senha_incorreta', usuarioId: usuario.id };
      }

      await usuarioRepository.registrarLoginComSucesso(usuario.id, agora, trx);
      return { sessao: await emitirSessao({ usuario, familiaId: randomUUID(), agora, trx }) };
    });

    // Eventos de segurança sem senha, token ou e-mail completo (RNF-BE-44).
    const emailMascarado = mascararEmail(email);

    if (resultado.falha === 'BLOQUEADO') {
      logger.warn(
        { evento: 'LOGIN_BLOQUEADO', usuarioId: resultado.usuarioId, email: emailMascarado },
        'Tentativa de login em conta bloqueada',
      );
      throw erroContaBloqueada(resultado.segundos);
    }

    if (resultado.falha) {
      logger.warn(
        {
          evento: resultado.motivo === 'conta_bloqueada' ? 'CONTA_BLOQUEADA' : 'LOGIN_FALHA',
          motivo: resultado.motivo,
          usuarioId: resultado.usuarioId,
          email: emailMascarado,
        },
        'Falha de login',
      );
      throw erroCredenciaisInvalidas();
    }

    logger.info(
      { evento: 'LOGIN_SUCESSO', usuarioId: resultado.sessao.usuario.id, email: emailMascarado },
      'Login realizado',
    );
    return resultado.sessao;
  };
}
