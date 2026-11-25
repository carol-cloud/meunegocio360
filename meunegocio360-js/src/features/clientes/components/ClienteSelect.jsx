import { useId, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue.js';
import { formatarDocumento } from '../../../shared/lib/documentos.js';
import { useBuscaClientes } from '../hooks/useBuscaClientes.js';

const MINIMO_CARACTERES = 2;
const TAMANHO_SUGESTOES = 10;

// Seletor reutilizável de cliente (RF-FE-003, "Seletor ClienteSelect"): padrão combobox ARIA,
// busca por nome ou documento com debounce de 400 ms a partir de 2 caracteres, somente clientes
// ativos. Usa a mesma busca da lista (useBuscaClientes); telas futuras reutilizam este componente.
// onChange recebe { id, nome, documento } ou null quando o texto selecionado é apagado/alterado.
export default function ClienteSelect({
  value = null,
  onChange,
  invalid = false,
  disabled = false,
  label = 'Cliente',
}) {
  const id = useId();
  const idLista = `${id}-lista`;
  const [texto, setTexto] = useState(value?.nome ?? '');
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);

  // O valor mudou por fora (ex.: formulário recarregado): o campo acompanha.
  const [valorAnterior, setValorAnterior] = useState(value);
  if (value?.id !== valorAnterior?.id) {
    setValorAnterior(value);
    setTexto(value?.nome ?? '');
  }

  const termo = useDebouncedValue(texto.trim());
  const buscar = aberto && termo.length >= MINIMO_CARACTERES;
  const busca = useBuscaClientes(
    { q: termo, situacao: 'ATIVO', page: 0, size: TAMANHO_SUGESTOES },
    { enabled: buscar },
  );
  const opcoes = buscar && !busca.isError ? (busca.data?.content ?? []) : [];
  const aguardando = aberto && texto.trim() !== termo;
  const listaVisivel = aberto && opcoes.length > 0;

  let status = '';
  if (aberto && texto.trim().length < MINIMO_CARACTERES) {
    status = `Digite ao menos ${MINIMO_CARACTERES} caracteres para buscar.`;
  } else if (aberto && (aguardando || busca.isFetching)) status = 'Buscando…';
  else if (buscar && busca.isError) status = 'Erro ao buscar.';
  else if (buscar && busca.isSuccess && opcoes.length === 0) status = 'Nenhum cliente encontrado';
  else if (listaVisivel) {
    status = `${opcoes.length} ${opcoes.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}.`;
  }

  const selecionar = (cliente) => {
    onChange({ id: cliente.id, nome: cliente.nome, documento: cliente.documento });
    setTexto(cliente.nome);
    setAberto(false);
    setAtivo(-1);
  };

  const digitar = (evento) => {
    setTexto(evento.target.value);
    setAberto(true);
    setAtivo(-1);
    if (value) onChange(null);
  };

  const teclar = (evento) => {
    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault();
        if (!aberto) setAberto(true);
        else if (opcoes.length) setAtivo((atual) => Math.min(atual + 1, opcoes.length - 1));
        break;
      case 'ArrowUp':
        evento.preventDefault();
        if (opcoes.length) setAtivo((atual) => Math.max(atual - 1, 0));
        break;
      case 'Enter':
        if (listaVisivel && ativo >= 0) {
          evento.preventDefault();
          selecionar(opcoes[ativo]);
        }
        break;
      case 'Escape':
        if (aberto) {
          evento.preventDefault();
          setAberto(false);
          setAtivo(-1);
        }
        break;
      case 'Tab':
        setAberto(false);
        break;
      default:
    }
  };

  const idOpcao = (indice) => `${id}-opcao-${indice}`;

  return (
    <Form.Group className="mb-3 position-relative" controlId={`${id}-campo`}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type="text"
        role="combobox"
        autoComplete="off"
        placeholder="Buscar por nome ou documento"
        aria-autocomplete="list"
        aria-expanded={listaVisivel}
        aria-controls={idLista}
        aria-activedescendant={listaVisivel && ativo >= 0 ? idOpcao(ativo) : undefined}
        aria-describedby={`${id}-status`}
        aria-invalid={invalid}
        isInvalid={invalid}
        disabled={disabled}
        value={texto}
        onChange={digitar}
        onKeyDown={teclar}
        onBlur={() => setAberto(false)}
      />

      <ul
        id={idLista}
        role="listbox"
        aria-label={`Sugestões de ${label.toLowerCase()}`}
        className="list-group position-absolute w-100 z-3 shadow"
        hidden={!listaVisivel}
      >
        {opcoes.map((cliente, indice) => (
          <li
            key={cliente.id}
            id={idOpcao(indice)}
            role="option"
            aria-selected={indice === ativo}
            className={`list-group-item list-group-item-action${indice === ativo ? ' active' : ''}`}
            // mousedown evita o blur do campo antes do clique selecionar a opção.
            onMouseDown={(evento) => evento.preventDefault()}
            onClick={() => selecionar(cliente)}
          >
            <span className="fw-semibold">{cliente.nome}</span>{' '}
            <small>{formatarDocumento(cliente.documento, cliente.tipoPessoa)}</small>
          </li>
        ))}
      </ul>

      <div id={`${id}-status`} aria-live="polite" className="form-text">
        {status}
        {buscar && busca.isError && (
          <Button
            variant="link"
            size="sm"
            className="p-0 ms-1 align-baseline"
            onMouseDown={(evento) => evento.preventDefault()}
            onClick={() => busca.refetch()}
          >
            Tentar novamente
          </Button>
        )}
      </div>
    </Form.Group>
  );
}
