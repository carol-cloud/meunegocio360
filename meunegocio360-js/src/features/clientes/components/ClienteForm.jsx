import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router';
import {
  formatarDocumento,
  formatarTelefone,
  somenteDigitos,
  TAMANHO_DOCUMENTO,
  TIPOS_PESSOA,
} from '../../../shared/lib/documentos.js';
import DocumentoInput from '../../../shared/ui/DocumentoInput.jsx';
import ErrorAlert from '../../../shared/ui/ErrorAlert.jsx';
import { CAMPOS_CLIENTE, clienteSchema } from '../schemas.js';

const VAZIO = { tipoPessoa: TIPOS_PESSOA.FISICA, nome: '', documento: '', email: '', telefone: '' };

function valoresDoFormulario(cliente) {
  if (!cliente) return VAZIO;
  return {
    tipoPessoa: cliente.tipoPessoa,
    nome: cliente.nome ?? '',
    documento: formatarDocumento(cliente.documento, cliente.tipoPessoa),
    email: cliente.email ?? '',
    telefone: formatarTelefone(cliente.telefone),
  };
}

// Mensagens por code (RNF-FE-14, RNF-FE-29), conforme "Comportamentos e mensagens" do RF-FE-003.
const MSG_DOCUMENTO_DUPLICADO =
  'Já existe um cliente com este documento. Ele pode estar inativo; busque por ele e reative.';
const MENSAGENS = {
  VERSION_CONFLICT:
    'Os dados do cliente foram alterados por outra pessoa. Recarregue os dados para continuar.',
  FALHA: 'Não foi possível salvar o cliente. Verifique sua conexão e tente novamente.',
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

// Formulário de cadastro e de edição do cliente (React Hook Form + Zod, RNF-FE-20 a 22 e 25).
// onSalvar(dados, { versao }) recebe os dados validados (documento e telefone só com dígitos) e a
// versão em que o formulário foi carregado (RNF-BE-28), e devolve uma Promise.
export default function ClienteForm({
  cliente,
  rotuloSalvar = 'Salvar',
  onSalvar,
  onCancelar,
  onRecarregar,
  onAcessoNegado,
}) {
  const [erro, setErro] = useState(null);
  const [avisoDocumento, setAvisoDocumento] = useState(null);
  // Versão dos dados exibidos: só muda quando o usuário escolhe recarregar (conflito de versão).
  const [versao, setVersao] = useState(cliente?.versao);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    trigger,
    reset,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm({
    resolver: zodResolver(clienteSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: valoresDoFormulario(cliente),
  });

  const tipoPessoa = useWatch({ control, name: 'tipoPessoa' });

  // Ao trocar o tipo de pessoa, o documento é remascarado e revalidado; se o tamanho não cabe no
  // novo tipo, é limpo com aviso (RF-FE-003, "Formulário").
  const trocarTipo = (novoTipo) => {
    setValue('tipoPessoa', novoTipo);
    const digitos = somenteDigitos(getValues('documento'));
    if (digitos.length > 0 && digitos.length !== TAMANHO_DOCUMENTO[novoTipo]) {
      setValue('documento', '');
      setAvisoDocumento(
        novoTipo === TIPOS_PESSOA.FISICA
          ? 'O documento foi limpo: informe um CPF para pessoa física.'
          : 'O documento foi limpo: informe um CNPJ para pessoa jurídica.',
      );
    } else {
      setValue('documento', formatarDocumento(digitos, novoTipo));
      setAvisoDocumento(null);
    }
    if (isSubmitted) trigger('documento');
  };

  const tratarErro = (falha) => {
    switch (falha?.code) {
      case 'VALIDATION_ERROR': {
        const doFormulario = falha.errors.filter(({ field }) => CAMPOS_CLIENTE.includes(field));
        doFormulario.forEach(({ field, message }, indice) =>
          setError(field, { type: 'server', message }, { shouldFocus: indice === 0 }),
        );
        if (doFormulario.length === 0) setErro({ tipo: 'FALHA' });
        break;
      }
      case 'CUSTOMER_DOCUMENT_DUPLICATE':
        setError(
          'documento',
          { type: 'server', message: MSG_DOCUMENTO_DUPLICADO },
          { shouldFocus: true },
        );
        break;
      case 'VERSION_CONFLICT':
      case 'COMPANY_NOT_ACTIVE':
        setErro({ tipo: falha.code });
        break;
      default:
        if (falha?.status === 403 && onAcessoNegado) onAcessoNegado();
        else setErro({ tipo: 'FALHA' });
    }
  };

  const enviar = handleSubmit(async (dados) => {
    setErro(null);
    try {
      await onSalvar(dados, { versao });
    } catch (falha) {
      tratarErro(falha);
    }
  });

  // Recarregar só substitui o que foi digitado quando o usuário escolhe (RNF-FE-29).
  const recarregar = async () => {
    const atual = await onRecarregar?.();
    if (atual) {
      reset(valoresDoFormulario(atual));
      setVersao(atual.versao);
    }
    setErro(null);
  };

  const acaoDoErro = () => {
    if (erro.tipo === 'VERSION_CONFLICT' && onRecarregar) {
      return { rotulo: 'Recarregar dados', onClick: recarregar };
    }
    if (erro.tipo === 'FALHA') {
      return { rotulo: 'Tentar novamente', onClick: enviar, disabled: isSubmitting };
    }
    return undefined;
  };

  const propsDeErro = (campo) => ({
    isInvalid: Boolean(errors[campo]),
    'aria-invalid': Boolean(errors[campo]),
    'aria-describedby': errors[campo] ? `cliente-${campo}-erro` : undefined,
  });

  const fisica = tipoPessoa === TIPOS_PESSOA.FISICA;

  return (
    <Form noValidate onSubmit={enviar}>
      {erro && (
        <ErrorAlert key={erro.tipo} acao={acaoDoErro()}>
          {erro.tipo === 'COMPANY_NOT_ACTIVE' ? (
            <>
              Cadastre ou ative a empresa para continuar. <Link to="/empresa">Ir para Empresa</Link>
            </>
          ) : (
            (MENSAGENS[erro.tipo] ?? MENSAGENS.FALHA)
          )}
        </ErrorAlert>
      )}

      <fieldset className="mb-3">
        <legend className="form-label fs-6 mb-2">Tipo de pessoa</legend>
        {[
          { valor: TIPOS_PESSOA.FISICA, rotulo: 'Pessoa física' },
          { valor: TIPOS_PESSOA.JURIDICA, rotulo: 'Pessoa jurídica' },
        ].map(({ valor, rotulo }) => (
          <Form.Check
            key={valor}
            inline
            type="radio"
            id={`cliente-tipoPessoa-${valor}`}
            name="tipoPessoa"
            label={rotulo}
            value={valor}
            checked={tipoPessoa === valor}
            onChange={() => trocarTipo(valor)}
            isInvalid={Boolean(errors.tipoPessoa)}
          />
        ))}
        {errors.tipoPessoa && (
          <div className="invalid-feedback d-block" id="cliente-tipoPessoa-erro">
            {errors.tipoPessoa.message}
          </div>
        )}
      </fieldset>

      <Campo
        id="cliente-nome"
        rotulo={fisica ? 'Nome' : 'Razão social'}
        erro={errors.nome?.message}
      >
        <Form.Control
          type="text"
          autoComplete={fisica ? 'name' : 'organization'}
          maxLength={150}
          {...propsDeErro('nome')}
          {...register('nome')}
        />
      </Campo>

      <Campo
        id="cliente-documento"
        rotulo={fisica ? 'CPF' : 'CNPJ'}
        erro={errors.documento?.message}
      >
        <Controller
          name="documento"
          control={control}
          render={({ field }) => (
            <DocumentoInput
              tipoPessoa={tipoPessoa}
              {...propsDeErro('documento')}
              {...field}
              onChange={(valor) => {
                setAvisoDocumento(null);
                field.onChange(valor);
              }}
            />
          )}
        />
        <div aria-live="polite">
          {avisoDocumento && <Form.Text className="d-block">{avisoDocumento}</Form.Text>}
        </div>
      </Campo>

      <div className="row">
        <div className="col-12 col-md-6">
          <Campo id="cliente-email" rotulo="E-mail (opcional)" erro={errors.email?.message}>
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
          <Campo id="cliente-telefone" rotulo="Telefone (opcional)" erro={errors.telefone?.message}>
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
