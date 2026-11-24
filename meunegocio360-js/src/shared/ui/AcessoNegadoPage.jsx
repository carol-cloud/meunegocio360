import { Link } from 'react-router';

// Exibida pela guarda de perfil (RF-FE-002, guarda 3): não revela nenhum dado.
export default function AcessoNegadoPage() {
  return (
    <div className="py-5 text-center">
      <title>Acesso negado | MeuNegócio360</title>
      <h1>Acesso negado</h1>
      <p className="text-body-secondary">Seu perfil não tem permissão para acessar esta página.</p>
      <Link to="/">Ir para a página inicial</Link>
    </div>
  );
}
