import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { Controller, useForm } from 'react-hook-form';
import { formatarCnpj, formatarTelefone } from '../../../shared/lib/documentos.js';
import ErrorAlert from '../../../shared/ui/ErrorAlert.jsx';
import { FUSO_PADRAO, FUSOS_HORARIOS } from '../fusos.js';
import { CAMPOS_EMPRESA, empresaSchema } from '../schemas.js';

const VAZIO = {
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  email: '',
  telefone: '',
  fusoHorario: FUSO_PADRAO,
  moeda: 'BRL',
};

function valoresDoFormulario(empresa) {
  if (!empresa) return VAZIO;
  return {
    razaoSocial: empresa.razaoSocial ?? '',
    nomeFantasia: empresa.nomeFantasia ?? '',
    cnpj: formatarCnpj(empresa.cnpj),
    email: empresa.email ?? '',
    telefone: formatarTelefone(empresa.telefone),
    fusoHorario: empresa.fusoHorario ?? FUSO_PADRAO,
    moeda: empresa.moeda ?? 'BRL',
  };
}

// Mensagens por code (RNF-FE-14, RNF-FE-29), conforme "Comportamentos e mensagens" do RF-FE-002.
const MENSAGENS = {
  COMPANY_ALREADY_ACTIVE:
    'Já existe uma empresa ativa. Inative-a antes de cadastrar ou reativar outra.',
  VERSION_CONFLICT:
    'Os dados da empresa foram alterados por outra pessoa. Recarregue os dados para continuar.',
  ACCESS_DENIED: 'Você não tem permissão para alterar os dados da empresa.',
  FALHA: 'Não foi possível salvar os dados da empresa. Verifique sua conexão e tente novamente.',
};

function Campo({ id, rotulo, erro, children }) {
  return (
    <Form.Group className="mb-3" controlId={id}>
      <Form.Label>{rotulo}</Form.Label>
      {children}
      <Form.Control.Feedback type="invalid" id={`${id}-erro`}>
        {erro}
      </Form.Control.Feedback>
    </Form.Group>
  );
}

// Formulário de cadastro e de edição da empresa (React Hook Form + Zod, RNF-FE-20 a 22 e 25).
// onSalvar recebe os dados já validados (CNPJ e telefone só com dígitos) e devolve uma Promise.
export default function EmpresaForm({
  empresa,
  rotuloSalvar = 'Salvar',
  onSalvar,
  onCancelar,
  onRecarregar,
}) {
  const [erro, setErro] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(empresaSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: valoresDoFormulario(empresa),
  });

  const tratarErro = (falha) => {
    switch (falha?.code) {
      case 'VALIDATION_ERROR': {
        const doFormulario = falha.errors.filter(({ field }) => CAMPOS_EMPRESA.includes(field));
        doFormulario.forEach(({ field, message }, indice) =>
          setError(field, { type: 'server', message }, { shouldFocus: indice === 0 }),
        );
        if (doFormulario.length === 0) setErro({ tipo: 'falha' });
        break;
      }
      case 'COMPANY_CNPJ_DUPLICATE':
        setError(
          'cnpj',
          { type: 'server', message: 'Já existe uma empresa cadastrada com este CNPJ.' },
          { shouldFocus: true },
        );
        break;
      case 'COMPANY_ALREADY_ACTIVE':
      case 'VERSION_CONFLICT':
      case 'ACCESS_DENIED':
        setErro({ tipo: falha.code });
        break;
      default:
        setErro({ tipo: falha?.status === 403 ? 'ACCESS_DENIED' : 'falha' });
    }
  };

  const enviar = handleSubmit(async (dados) => {
    setErro(null);
    try {
      await onSalvar(dados);
    } catch (falha) {
      tratarErro(falha);
    }
  });

  // Recarregar só substitui o que foi digitado quando o usuário escolhe (RF-FE-002, conflito de versão).
  const recarregar = async () => {
    const atual = await onRecarregar?.();
    if (atual) reset(valoresDoFormulario(atual));
    setErro(null);
  };

  const acaoDoErro = () => {
    if (erro.tipo === 'VERSION_CONFLICT' && onRecarregar) {
      return { rotulo: 'Recarregar dados', onClick: recarregar };
    }
    if (erro.tipo === 'falha') {
      return { rotulo: 'Tentar novamente', onClick: enviar, disabled: isSubmitting };
    }
    return undefined;
  };

  const propsDeErro = (campo) => ({
    isInvalid: Boolean(errors[campo]),
    'aria-invalid': Boolean(errors[campo]),
    'aria-describedby': errors[campo] ? `empresa-${campo}-erro` : undefined,
  });

  return (
    <Form noValidate onSubmit={enviar}>
      {erro && (
        <ErrorAlert key={erro.tipo} acao={acaoDoErro()}>
          {MENSAGENS[erro.tipo] ?? MENSAGENS.FALHA}
        </ErrorAlert>
      )}

      <Campo id="empresa-razaoSocial" rotulo="Razão social" erro={errors.razaoSocial?.message}>
        <Form.Control
          type="text"
          autoComplete="organization"
          maxLength={150}
          {...propsDeErro('razaoSocial')}
          {...register('razaoSocial')}
        />
      </Campo>

      <Campo
        id="empresa-nomeFantasia"
        rotulo="Nome fantasia (opcional)"
        erro={errors.nomeFantasia?.message}
      >
        <Form.Control
          type="text"
          autoComplete="off"
          maxLength={150}
          {...propsDeErro('nomeFantasia')}
          {...register('nomeFantasia')}
        />
      </Campo>

      <Campo id="empresa-cnpj" rotulo="CNPJ" erro={errors.cnpj?.message}>
        <Controller
          name="cnpj"
          control={control}
          render={({ field }) => (
            <Form.Control
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="00.000.000/0000-00"
              {...propsDeErro('cnpj')}
              {...field}
              onChange={(evento) => field.onChange(formatarCnpj(evento.target.value))}
            />
          )}
        />
      </Campo>

      <div className="row">
        <div className="col-12 col-md-6">
          <Campo id="empresa-email" rotulo="E-mail (opcional)" erro={errors.email?.message}>
            <Form.Control
              type="email"
              autoComplete="email"
              inputMode="email"
              maxLength={160}
              {...propsDeErro('email')}
              {...register('email')}
            />
          </Campo>
        </div>
        <div className="col-12 col-md-6">
          <Campo id="empresa-telefone" rotulo="Telefone (opcional)" erro={errors.telefone?.message}>
            <Controller
              name="telefone"
              control={control}
              render={({ field }) => (
                <Form.Control
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                  {...propsDeErro('telefone')}
                  {...field}
                  onChange={(evento) => field.onChange(formatarTelefone(evento.target.value))}
                />
              )}
            />
          </Campo>
        </div>
      </div>

      <div className="row">
        <div className="col-12 col-md-6">
          <Campo id="empresa-fusoHorario" rotulo="Fuso horário" erro={errors.fusoHorario?.message}>
            <Form.Select {...propsDeErro('fusoHorario')} {...register('fusoHorario')}>
              {FUSOS_HORARIOS.map(({ valor, rotulo }) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </Form.Select>
          </Campo>
        </div>
        <div className="col-12 col-md-6">
          {/* Somente BRL nesta fase: o campo é exibido desabilitado e enviado pelo valor padrão. */}
          <Campo id="empresa-moeda" rotulo="Moeda">
            <Form.Select disabled value="BRL" onChange={() => {}}>
              <option value="BRL">Real brasileiro (BRL)</option>
            </Form.Select>
          </Campo>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mt-2">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner as="span" animation="border" size="sm" aria-hidden="true" className="me-2" />
              Salvando…
            </>
          ) : (
            rotuloSalvar
          )}
        </Button>
        {onCancelar && (
          <Button variant="outline-dark" onClick={onCancelar} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
      </div>
    </Form>
  );
}
