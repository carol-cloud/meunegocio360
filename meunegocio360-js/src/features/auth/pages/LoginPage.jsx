import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import logo from '../../../assets/logo-meunegocio360.png';
import LoginForm from '../components/LoginForm.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function LoginPage() {
  const { sessaoExpirada } = useAuth();

  return (
    <main className="min-vh-100 d-flex align-items-center py-4">
      <title>Entrar | MeuNegócio360</title>
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={7} lg={5} xl={4}>
            <Card className="shadow-sm">
              <Card.Body className="p-4">
                <img
                  src={logo}
                  alt="MeuNegócio360"
                  width={2400}
                  height={1792}
                  className="d-block mx-auto w-50 h-auto mb-3"
                />
                <h1 className="h2 text-center mb-4">Entrar</h1>
                <LoginForm aviso={sessaoExpirada ? 'Sua sessão expirou. Entre novamente.' : null} />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
