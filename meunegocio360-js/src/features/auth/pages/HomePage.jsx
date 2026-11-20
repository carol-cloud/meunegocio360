import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Spinner from 'react-bootstrap/Spinner';
import { useLogout } from '../hooks/useLogout.js';
import { useUsuarioAutenticado } from '../hooks/useUsuarioAutenticado.js';

// Página inicial provisória (RF-FE-001); será substituída pelo dashboard.
export default function HomePage() {
  const { data: usuario, isPending, isError } = useUsuarioAutenticado();
  const logout = useLogout();

  return (
    <div className="d-flex flex-column min-vh-100">
      <title>Início | MeuNegócio360</title>
      <header>
        <Navbar bg="primary">
          <Container>
            <Navbar.Brand as="span" className="fw-semibold">
              MeuNegócio360
            </Navbar.Brand>
            <Button
              variant="outline-dark"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              {logout.isPending ? 'Saindo…' : 'Sair'}
            </Button>
          </Container>
        </Navbar>
      </header>

      <main className="container flex-grow-1 py-5">
        {isPending && (
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Carregando seus dados…</span>
          </Spinner>
        )}
        {isError && (
          <Alert variant="danger" role="alert">
            Não foi possível carregar seus dados. Recarregue a página.
          </Alert>
        )}
        {usuario && (
          <>
            <h1>Olá, {usuario.nome}!</h1>
            <p className="text-body-secondary">Perfil: {usuario.perfil}</p>
             <p className="text-body-secondary">E-mail: {usuario.email}</p>
          </>
        )}
      </main>

      <footer className="bg-footer py-3 text-center">
        <Container>
          <small>MeuNegócio360</small>
        </Container>
      </footer>
    </div>
  );
}
