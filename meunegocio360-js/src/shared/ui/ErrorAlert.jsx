import { useEffect, useRef } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';

// Mensagem de erro anunciada a leitores de tela e com foco programático (RNF-FE-22).
// O erro é indicado por texto ("Erro:"), não só pela cor (RNF-FE, seção 2.2).
// O foco vai à mensagem ao montar; para anunciar um novo erro, use uma key diferente.
export default function ErrorAlert({ children, acao, className }) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <Alert variant="danger" role="alert" ref={ref} tabIndex={-1} className={className}>
      <span className="fw-semibold">Erro: </span>
      {children}
      {acao && (
        <div className="mt-2">
          <Button variant="outline-dark" size="sm" onClick={acao.onClick} disabled={acao.disabled}>
            {acao.rotulo}
          </Button>
        </div>
      )}
    </Alert>
  );
}
