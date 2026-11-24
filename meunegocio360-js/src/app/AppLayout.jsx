import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link, NavLink, Outlet } from 'react-router';
import logo from '../assets/logo-meunegocio360-branca.png';
import { useAuth, useLogout } from '../features/auth/index.js';
import { useEmpresa } from '../features/empresa/index.js';
import { itensDoPerfil } from './navegacao.js';

// Lupa em SVG inline: o projeto não tem biblioteca de ícones (RNF-015). Herda a cor do texto.
function IconePesquisar() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
    </svg>
  );
}

// Layout das rotas protegidas (RF-FE-002): barra de navegação laranja com texto Preto
// (RNF-FE, seção 2.2), menu por perfil, nome da empresa, usuário e Sair; HTML semântico
// com header, nav, main e footer (RNF-FE-24).
//
// Disposição da barra (Bootstrap order-* e mx-auto, mobile-first, RNF-FE-26):
// - abaixo de lg: [hambúrguer] [logo centralizado] [pesquisar];
// - a partir de lg: [logo] [itens do menu] ... [empresa | usuário | Sair].
export default function AppLayout() {
  const { usuario } = useAuth();
  const { nomeExibicao } = useEmpresa();
  const logout = useLogout();
  const itens = itensDoPerfil(usuario?.perfil);

  return (
    <div className="d-flex flex-column min-vh-100">
      <header>
        <Navbar bg="primary" expand="lg" collapseOnSelect>
          {/* fluid: a barra ocupa toda a largura, com o logo junto à margem esquerda. */}
          <Container fluid>
            <Navbar.Toggle
              aria-controls="menu-principal"
              aria-label="Abrir menu"
              className="order-0"
            />

            <Navbar.Brand as={Link} to="/" className="order-1 mx-auto mx-lg-0 me-lg-4 ps-lg-3">
              <img
                src={logo}
                alt="MeuNegócio360"
                width={457}
                height={96}
                className="mn-brand-logo"
              />
            </Navbar.Brand>

            {/* Reservado para a busca global, ainda sem requisito: desabilitado por decisão de escopo. */}
            <Button
              variant="link"
              className="mn-navbar-icone order-2 d-lg-none text-body"
              disabled
              aria-label="Pesquisar (em breve)"
              title="Pesquisar (em breve)"
            >
              <IconePesquisar />
            </Button>

            <Navbar.Collapse id="menu-principal" className="order-3 order-lg-2">
              <Nav as="nav" aria-label="Menu principal" className="me-auto">
                {itens.map((item) => (
                  <Nav.Link
                    key={item.para}
                    as={NavLink}
                    to={item.para}
                    end={item.exato}
                    eventKey={item.para}
                  >
                    {item.rotulo}
                  </Nav.Link>
                ))}
              </Nav>

              <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 gap-lg-3 py-2 py-lg-0 pe-lg-3 border-top border-dark border-lg-0">
                {nomeExibicao && (
                  <span className="fw-semibold text-break">
                    <span className="visually-hidden">Empresa: </span>
                    {nomeExibicao}
                  </span>
                )}
                {usuario && (
                  <span className="text-break">
                    <span className="visually-hidden">Usuário: </span>
                    {usuario.nome}
                  </span>
                )}
                <Button
                  variant="outline-dark"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="align-self-start align-self-lg-auto"
                >
                  {logout.isPending ? 'Saindo…' : 'Sair'}
                </Button>
              </div>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>

      <main className="container flex-grow-1">
        <Outlet />
      </main>

      <footer className="bg-footer py-3 text-center">
        <Container>
          <small>MeuNegócio360</small>
        </Container>
      </footer>
    </div>
  );
}
