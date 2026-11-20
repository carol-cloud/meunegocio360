import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <main className="container py-5 text-center">
      <title>Página não encontrada | MeuNegócio360</title>
      <h1>Página não encontrada</h1>
      <p className="text-body-secondary">O endereço acessado não existe.</p>
      <Link to="/">Ir para a página inicial</Link>
    </main>
  );
}
