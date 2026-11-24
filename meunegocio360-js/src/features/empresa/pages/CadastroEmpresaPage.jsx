import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import { Navigate, useNavigate } from 'react-router';
import { formatarCnpj } from '../../../shared/lib/documentos.js';
import ErrorAlert from '../../../shared/ui/ErrorAlert.jsx';
import PageLoader from '../../../shared/ui/PageLoader.jsx';
import EmpresaForm from '../components/EmpresaForm.jsx';
import { useEmpresa } from '../hooks/useEmpresa.js';
import { useEmpresasInativas } from '../hooks/useEmpresasInativas.js';
import { useAlterarSituacaoEmpresa, useCadastrarEmpresa } from '../hooks/useMutacoesEmpresa.js';

const MSG_REATIVACAO = {
  COMPANY_ALREADY_ACTIVE:
    'Já existe uma empresa ativa. Inative-a antes de cadastrar ou reativar outra.',
  VERSION_CONFLICT: 'Os dados da empresa foram alterados. Recarregue a página e tente novamente.',
};

// Primeiro cadastro (RF-FE-002, rota /empresa/cadastro): somente ADMIN e sem empresa ativa.
export default function CadastroEmpresaPage() {
  const navigate = useNavigate();
  const { status } = useEmpresa();
  const cadastrar = useCadastrarEmpresa();
  const reativar = useAlterarSituacaoEmpresa();
  const [erroReativacao, setErroReativacao] = useState(null);
  const [pagina, setPagina] = useState(0);
  // Inativas vêm do servidor (GET /empresa/inativas): a reativação sobrevive ao recarregar.
  const inativas = useEmpresasInativas({ page: pagina, enabled: status === 'ausente' });

  if (status === 'carregando') return <PageLoader mensagem="Carregando os dados da empresa…" />;
  if (status === 'ativa' && !cadastrar.isSuccess && !reativar.isSuccess) {
    return <Navigate to="/empresa" replace />;
  }

  const salvar = async (dados) => {
    await cadastrar.mutateAsync(dados);
    navigate('/', { replace: true, state: { aviso: 'Empresa cadastrada com sucesso.' } });
  };

  const reativarEmpresa = (empresa) => {
    setErroReativacao(null);
    reativar.mutate(
      { id: empresa.id, ativa: true, versao: empresa.versao },
      {
        onSuccess: () =>
          navigate('/', { replace: true, state: { aviso: 'Empresa reativada com sucesso.' } }),
        onError: (falha) => setErroReativacao(falha.code),
      },
    );
  };

  const paginaInativas = inativas.data;
  const idEmReativacao = reativar.isPending ? reativar.variables?.id : null;

  return (
    <div className="py-4">
      <title>Cadastre sua empresa | MeuNegócio360</title>
      <h1 className="mb-3">Cadastre sua empresa</h1>
      <p className="text-body-secondary">
        O cadastro da empresa é o primeiro passo: todos os módulos do sistema operam no contexto
        dela.
      </p>

      {inativas.isError && (
        <ErrorAlert>
          Não foi possível carregar as empresas inativas.{' '}
          <Button variant="link" className="p-0 align-baseline" onClick={() => inativas.refetch()}>
            Tentar novamente
          </Button>
        </ErrorAlert>
      )}

      {paginaInativas?.totalElements > 0 && (
        <Card className="mb-4">
          <Card.Body>
            <h2 className="h5">Reativar uma empresa inativa</h2>
            <p className="mb-2">
              Você pode reativar uma empresa inativa em vez de cadastrar outra.
            </p>
            {erroReativacao && (
              <ErrorAlert key={erroReativacao}>
                {MSG_REATIVACAO[erroReativacao] ??
                  'Não foi possível reativar a empresa. Verifique sua conexão e tente novamente.'}
              </ErrorAlert>
            )}
            <ListGroup className="mb-2">
              {paginaInativas.content.map((empresa) => (
                <ListGroup.Item
                  key={empresa.id}
                  className="d-flex flex-wrap align-items-center justify-content-between gap-2"
                >
                  <div>
                    <div className="fw-semibold">{empresa.nomeFantasia || empresa.razaoSocial}</div>
                    <small className="text-body-secondary">CNPJ {formatarCnpj(empresa.cnpj)}</small>
                  </div>
                  <Button
                    variant="outline-dark"
                    onClick={() => reativarEmpresa(empresa)}
                    disabled={reativar.isPending}
                  >
                    {idEmReativacao === empresa.id && (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        aria-hidden="true"
                        className="me-2"
                      />
                    )}
                    Reativar
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
            {paginaInativas.totalPages > 1 && (
              <nav
                aria-label="Páginas de empresas inativas"
                className="d-flex align-items-center gap-2"
              >
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setPagina((p) => p - 1)}
                  disabled={pagina === 0 || inativas.isFetching}
                >
                  Anterior
                </Button>
                <span>
                  Página {pagina + 1} de {paginaInativas.totalPages}
                </span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setPagina((p) => p + 1)}
                  disabled={pagina + 1 >= paginaInativas.totalPages || inativas.isFetching}
                >
                  Próxima
                </Button>
              </nav>
            )}
          </Card.Body>
        </Card>
      )}

      <Card>
        <Card.Body className="p-4">
          <EmpresaForm rotuloSalvar="Cadastrar empresa" onSalvar={salvar} />
        </Card.Body>
      </Card>
    </div>
  );
}
