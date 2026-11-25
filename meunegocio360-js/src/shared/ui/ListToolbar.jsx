import { useEffect, useEffectEvent, useState } from 'react';
import Form from 'react-bootstrap/Form';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';

// Barra de busca e filtro das listagens (RNF-FE-27). O campo de busca é local enquanto o
// usuário digita e só é repassado (onBuscar) depois do debounce de 400 ms.
// `situacoes` é uma lista de { valor, rotulo }.
export default function ListToolbar({
  id,
  busca,
  onBuscar,
  rotuloBusca = 'Buscar',
  placeholderBusca,
  situacao,
  situacoes,
  onSituacao,
  children,
}) {
  const [texto, setTexto] = useState(busca);
  const atrasado = useDebouncedValue(texto);

  // A URL mudou por fora (ex.: "Limpar filtros" ou voltar no histórico): o campo acompanha.
  const [buscaAnterior, setBuscaAnterior] = useState(busca);
  if (busca !== buscaAnterior) {
    setBuscaAnterior(busca);
    setTexto(busca);
  }

  // Só o valor estabilizado dispara a busca; busca e onBuscar são lidos no momento do disparo.
  const publicar = useEffectEvent((termo) => {
    if (termo !== busca) onBuscar(termo);
  });

  useEffect(() => {
    publicar(atrasado.trim());
  }, [atrasado]);

  return (
    <div className="row g-2 align-items-end mb-3">
      <Form.Group className="col-12 col-md" controlId={`${id}-busca`}>
        <Form.Label>{rotuloBusca}</Form.Label>
        <Form.Control
          type="search"
          autoComplete="off"
          maxLength={150}
          placeholder={placeholderBusca}
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
        />
      </Form.Group>
      {situacoes && (
        <Form.Group className="col-12 col-sm-6 col-md-3" controlId={`${id}-situacao`}>
          <Form.Label>Situação</Form.Label>
          <Form.Select value={situacao} onChange={(evento) => onSituacao(evento.target.value)}>
            {situacoes.map(({ valor, rotulo }) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      )}
      {children && <div className="col-12 col-sm-6 col-md-auto">{children}</div>}
    </div>
  );
}
