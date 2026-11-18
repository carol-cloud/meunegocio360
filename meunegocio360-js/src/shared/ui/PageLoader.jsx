import Spinner from 'react-bootstrap/Spinner';

// Indicador de carregamento acessível (RNF-FE-05, RNF-062).
export default function PageLoader({ mensagem = 'Carregando…' }) {
  return (
    <div className="d-flex min-vh-100 align-items-center justify-content-center">
      <Spinner animation="border" role="status" variant="primary">
        <span className="visually-hidden">{mensagem}</span>
      </Spinner>
    </div>
  );
}
