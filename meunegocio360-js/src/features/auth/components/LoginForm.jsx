import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { useForm } from 'react-hook-form';
import { useContagemRegressiva } from '../hooks/useContagemRegressiva.js';
import { useLogin } from '../hooks/useLogin.js';
import { minutosDeEspera } from '../redirect.js';
import { loginSchema } from '../schemas.js';

const MENSAGEM_FALHA_CONEXAO =
  'Não foi possível entrar agora. Verifique sua conexão e tente novamente.';

function mensagemBloqueio(segundos) {
  const minutos = minutosDeEspera(segundos);
  return `Muitas tentativas. Tente novamente em ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`;
}

export default function LoginForm({ aviso }) {
  const login = useLogin();
  const bloqueio = useContagemRegressiva();
  const [alerta, setAlerta] = useState(null);
  const alertaRef = useRef(null);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    resetField,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: { email: '', senha: '' },
  });

  const tratarErro = (erro) => {
    switch (erro.code) {
      case 'VALIDATION_ERROR': {
        const campos = erro.errors.filter(({ field }) => field === 'email' || field === 'senha');
        campos.forEach(({ field, message }, indice) =>
          setError(field, { type: 'server', message }, { shouldFocus: indice === 0 }),
        );
        if (campos.length === 0) {
          setAlerta({ tipo: 'conexao', texto: MENSAGEM_FALHA_CONEXAO });
        }
        break;
      }
      case 'INVALID_CREDENTIALS':
        setAlerta({ tipo: 'credenciais', texto: 'E-mail ou senha inválidos.' });
        resetField('senha');
        requestAnimationFrame(() => setFocus('senha'));
        break;
      case 'ACCOUNT_TEMPORARILY_LOCKED':
        bloqueio.iniciar(erro.retryAfter ?? 60);
        setAlerta({ tipo: 'bloqueio' });
        break;
      default:
        setAlerta({ tipo: 'conexao', texto: MENSAGEM_FALHA_CONEXAO });
    }
  };

  // Leva o foco à mensagem de erro (RNF-FE-22). Em credenciais inválidas o foco vai à senha.
  useEffect(() => {
    if (alerta && alerta.tipo !== 'credenciais') alertaRef.current?.focus();
  }, [alerta]);

  const enviar = handleSubmit(async (dados) => {
    setAlerta(null);
    try {
      await login.mutateAsync(dados);
      reset();
    } catch (erro) {
      tratarErro(erro);
    }
  });

  const bloqueado = bloqueio.restante > 0;
  const alertaVisivel = alerta && (alerta.tipo !== 'bloqueio' || bloqueado);
  const erroEmail = errors.email?.message;
  const erroSenha = errors.senha?.message;

  return (
    <Form noValidate onSubmit={enviar}>
      {aviso && !alertaVisivel && (
        <Alert variant="warning" role="alert">
          {aviso}
        </Alert>
      )}

      {alertaVisivel && (
        <Alert variant="danger" role="alert" ref={alertaRef} tabIndex={-1}>
          {alerta.tipo === 'bloqueio' ? mensagemBloqueio(bloqueio.restante) : alerta.texto}
          {alerta.tipo === 'conexao' && (
            <div className="mt-2">
              <Button variant="outline-dark" size="sm" onClick={enviar} disabled={isSubmitting}>
                Tentar novamente
              </Button>
            </div>
          )}
        </Alert>
      )}

      <Form.Group className="mb-3" controlId="login-email">
        <Form.Label>E-mail</Form.Label>
        <Form.Control
          type="email"
          autoComplete="username"
          inputMode="email"
          isInvalid={Boolean(erroEmail)}
          aria-invalid={Boolean(erroEmail)}
          aria-describedby={erroEmail ? 'login-email-erro' : undefined}
          {...register('email')}
        />
        <Form.Control.Feedback type="invalid" id="login-email-erro">
          {erroEmail}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-4" controlId="login-senha">
        <Form.Label>Senha</Form.Label>
        <Form.Control
          type="password"
          autoComplete="current-password"
          isInvalid={Boolean(erroSenha)}
          aria-invalid={Boolean(erroSenha)}
          aria-describedby={erroSenha ? 'login-senha-erro' : undefined}
          {...register('senha')}
        />
        <Form.Control.Feedback type="invalid" id="login-senha-erro">
          {erroSenha}
        </Form.Control.Feedback>
      </Form.Group>

      <Button
        type="submit"
        variant="primary"
        className="w-100"
        disabled={isSubmitting || bloqueado}
      >
        {isSubmitting ? (
          <>
            <Spinner as="span" animation="border" size="sm" aria-hidden="true" className="me-2" />
            Entrando…
          </>
        ) : (
          'Entrar'
        )}
      </Button>
    </Form>
  );
}
