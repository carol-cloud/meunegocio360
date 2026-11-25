import { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import { Link, useNavigate, useParams } from 'react-router';
import AcessoNegadoPage from '../../../shared/ui/AcessoNegadoPage.jsx';
import ErrorAlert from '../../../shared/ui/ErrorAlert.jsx';
import ClienteForm from '../components/ClienteForm.jsx';
import { useCliente } from '../hooks/useCliente.js';
import { useCadastrarCliente, useEditarCliente } from '../hooks/useMutacoesCliente.js';

function ClienteNaoEncontrado() {
  return (
    <div className="py-5">
      <title>Cliente não encontrado | MeuNegócio360</title>
      <h1>Cliente não encontrado</h1>
      <p className="text-body-secondary">O cliente informado não existe ou foi excluído.</p>
      <Link to="/clientes">Voltar para a lista de clientes</Link>
    </div>
  );
}

// Cadastro (/clientes/novo) e edição (/clientes/:id) de cliente (RF-FE-003).
export default function ClienteFormPage() {
  const { id } = useParams();
  const edicao = Boolean(id);
  const navigate = useNavigate();
  const [acessoNegado, setAcessoNegado] = useState(false);
  const consulta = useCliente(id);
  const cadastrar = useCadastrarCliente();
  const editar = useEditarCliente();

  const titulo = edicao ? 'Editar cliente' : 'Novo cliente';
  const voltar = (aviso) => navigate('/clientes', aviso ? { state: { aviso } } : undefined);

  if (acessoNegado || consulta.error?.status === 403) return <AcessoNegadoPage />;
  // UUID malformado (400) ou inexistente (404 CUSTOMER_NOT_FOUND): mesma página.
  if (consulta.error?.code === 'CUSTOMER_NOT_FOUND' || consulta.error?.status === 400) {
    return <ClienteNaoEncontrado />;
  }

  const salvar = async (dados, { versao }) => {
    if (edicao) {
      await editar.mutateAsync({ id, dados: { ...dados, versao } });
      voltar('Cliente atualizado com sucesso.');
    } else {
      await cadastrar.mutateAsync(dados);
      voltar('Cliente cadastrado com sucesso.');
    }
  };

  // VERSION_CONFLICT: busca a versão atual no servidor só quando o usuário pede.
  const recarregar = async () => (await consulta.refetch()).data;

  return (
    <div className="py-4">
      <title>{`${titulo} | MeuNegócio360`}</title>
      <h1 className="mb-3">{titulo}</h1>

      {edicao && consulta.isPending && (
        <div className="d-flex align-items-center gap-2 py-4" role="status">
          <Spinner animation="border" size="sm" aria-hidden="true" />
          Carregando o cliente…
        </div>
      )}

      {edicao && consulta.isError && (
        <ErrorAlert
          acao={{
            rotulo: 'Tentar novamente',
            onClick: () => consulta.refetch(),
            disabled: consulta.isFetching,
          }}
        >
          Não foi possível carregar o cliente. Verifique sua conexão e tente novamente.
        </ErrorAlert>
      )}

      {(!edicao || consulta.data) && (
        <Card>
          <Card.Body className="p-4">
            <ClienteForm
              key={id ?? 'novo'}
              cliente={consulta.data}
              rotuloSalvar={edicao ? 'Salvar alterações' : 'Cadastrar cliente'}
              onSalvar={salvar}
              onCancelar={() => voltar()}
              onRecarregar={edicao ? recarregar : undefined}
              onAcessoNegado={() => setAcessoNegado(true)}
            />
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
