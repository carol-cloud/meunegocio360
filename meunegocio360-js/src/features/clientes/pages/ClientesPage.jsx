import { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { Link, useLocation } from 'react-router';
import { useUrlFilters } from '../../../shared/hooks/useUrlFilters.js';
import { formatarDocumento, formatarTelefone } from '../../../shared/lib/documentos.js';
import AcessoNegadoPage from '../../../shared/ui/AcessoNegadoPage.jsx';
import ConfirmModal from '../../../shared/ui/ConfirmModal.jsx';
import ErrorAlert from '../../../shared/ui/ErrorAlert.jsx';
import ListToolbar from '../../../shared/ui/ListToolbar.jsx';
import Paginacao from '../../../shared/ui/Paginacao.jsx';
import StatusBadge from '../../../shared/ui/StatusBadge.jsx';
import { useBuscaClientes } from '../hooks/useBuscaClientes.js';
import { useAlterarSituacaoCliente, useExcluirCliente } from '../hooks/useMutacoesCliente.js';
import { SITUACOES } from '../schemas.js';

// Filtros da URL e seus padrões (RNF-FE-27): ?q=&situacao=&page=. Fora do componente para ser estável.
const PADROES = Object.freeze({ q: '', situacao: 'ATIVO' });
const SITUACOES_VALIDAS = SITUACOES.map(({ valor }) => valor);

// Mensagens por code (RNF-FE-14, RNF-FE-29), conforme "Comportamentos e mensagens" do RF-FE-003.
const MSG = {
  CUSTOMER_HAS_HISTORY:
    'Este cliente possui vendas ou ordens de serviço vinculadas e não pode ser excluído. ' +
    'Você pode inativá-lo.',
  CUSTOMER_NOT_FOUND: 'Este cliente não existe mais.',
  VERSION_CONFLICT:
    'O cliente foi alterado por outra pessoa. A lista foi atualizada; tente novamente.',
  FALHA_SITUACAO:
    'Não foi possível alterar a situação do cliente. Verifique sua conexão e tente novamente.',
  FALHA_EXCLUSAO: 'Não foi possível excluir o cliente. Verifique sua conexão e tente novamente.',
};

// Lista de clientes (RF-FE-003, rota /clientes): busca com debounce, filtro de situação e página
// na URL, paginação no servidor e os estados de carregamento, vazio, erro e sucesso (RNF-062).
export default function ClientesPage() {
  const location = useLocation();
  const [aviso, setAviso] = useState(location.state?.aviso ?? null);
  const [erroLista, setErroLista] = useState(null);
  const [acessoNegado, setAcessoNegado] = useState(false);
  // Ação em confirmação: { tipo: 'inativar' | 'excluir', cliente, erro }.
  const [acao, setAcao] = useState(null);

  const { filtros, atualizar, irParaPagina, limpar, temFiltro } = useUrlFilters(PADROES);
  const situacao = SITUACOES_VALIDAS.includes(filtros.situacao) ? filtros.situacao : 'ATIVO';
  const consulta = useBuscaClientes({ q: filtros.q, situacao, page: filtros.page });
  const alterarSituacao = useAlterarSituacaoCliente();
  const excluir = useExcluirCliente();

  const pagina = consulta.data;
  // A página da URL deixou de existir (ex.: último cliente da última página excluído): volta uma.
  const paginaInexistente =
    pagina &&
    !consulta.isPlaceholderData &&
    pagina.totalPages > 0 &&
    filtros.page >= pagina.totalPages;
  useEffect(() => {
    if (paginaInexistente) irParaPagina(pagina.totalPages - 1);
  }, [paginaInexistente, pagina?.totalPages, irParaPagina]);

  if (acessoNegado || consulta.error?.status === 403) return <AcessoNegadoPage />;

  const avisar = (texto) => {
    setErroLista(null);
    setAviso(texto);
  };

  // Erros que fecham o modal e aparecem sobre a lista (o registro mudou ou sumiu).
  const falhaNaLista = (falha, mensagemPadrao) => {
    setAcao(null);
    if (falha?.status === 403) setAcessoNegado(true);
    else {
      // id novo a cada erro: o ErrorAlert remonta e volta a anunciar e focar a mensagem.
      const texto = MSG[falha?.code] ?? mensagemPadrao;
      setErroLista((atual) => ({ id: (atual?.id ?? 0) + 1, texto }));
    }
  };

  const mudarSituacao = (cliente, ativo) => {
    setAviso(null);
    alterarSituacao.mutate(
      { id: cliente.id, ativo, versao: cliente.versao },
      {
        onSuccess: () => {
          setAcao(null);
          avisar(ativo ? 'Cliente reativado.' : 'Cliente inativado.');
        },
        onError: (falha) => falhaNaLista(falha, MSG.FALHA_SITUACAO),
      },
    );
  };

  const confirmarExclusao = () => {
    setAviso(null);
    excluir.mutate(
      { id: acao.cliente.id },
      {
        onSuccess: () => {
          setAcao(null);
          avisar('Cliente excluído.');
        },
        onError: (falha) => {
          if (falha?.code === 'CUSTOMER_HAS_HISTORY') {
            // O modal permanece aberto com o erro de negócio e a opção de inativar (RNF-097).
            setAcao((atual) => ({ ...atual, erro: 'CUSTOMER_HAS_HISTORY' }));
          } else if (falha?.code === 'CUSTOMER_NOT_FOUND' || falha?.status === 403) {
            falhaNaLista(falha, MSG.FALHA_EXCLUSAO);
          } else {
            setAcao((atual) => ({ ...atual, erro: 'FALHA_EXCLUSAO' }));
          }
        },
      },
    );
  };

  const processando = alterarSituacao.isPending || excluir.isPending;
  const comHistorico = acao?.erro === 'CUSTOMER_HAS_HISTORY';

  return (
    <div className="py-4">
      <title>Clientes | MeuNegócio360</title>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h1 className="mb-0">Clientes</h1>
        <Button as={Link} to="/clientes/novo" variant="primary">
          Novo cliente
        </Button>
      </div>

      <div aria-live="polite">
        {aviso && (
          <Alert
            variant="success"
            dismissible
            closeLabel="Fechar aviso"
            onClose={() => setAviso(null)}
          >
            {aviso}
          </Alert>
        )}
      </div>
      {erroLista && <ErrorAlert key={erroLista.id}>{erroLista.texto}</ErrorAlert>}

      <ListToolbar
        id="clientes"
        rotuloBusca="Buscar por nome ou documento"
        busca={filtros.q}
        onBuscar={(q) => atualizar({ q })}
        situacao={situacao}
        situacoes={SITUACOES}
        onSituacao={(valor) => atualizar({ situacao: valor })}
      />

      {consulta.isPending && (
        <div className="d-flex align-items-center gap-2 py-4" role="status">
          <Spinner animation="border" size="sm" aria-hidden="true" />
          Carregando clientes…
        </div>
      )}

      {consulta.isError && !pagina && (
        <ErrorAlert
          acao={{
            rotulo: 'Tentar novamente',
            onClick: () => consulta.refetch(),
            disabled: consulta.isFetching,
          }}
        >
          Não foi possível carregar os clientes. Verifique sua conexão e tente novamente.
        </ErrorAlert>
      )}

      {pagina && pagina.totalElements === 0 && (
        <div className="py-4" role="status">
          {temFiltro ? (
            <>
              <p>Nenhum cliente encontrado para a busca.</p>
              <Button variant="outline-dark" onClick={limpar}>
                Limpar filtros
              </Button>
            </>
          ) : (
            <p>Nenhum cliente cadastrado. Cadastre o primeiro cliente.</p>
          )}
        </div>
      )}

      {pagina && pagina.totalElements > 0 && (
        <>
          {/* Tabela rola dentro do próprio contêiner em telas pequenas (sem rolagem da página). */}
          <Table responsive hover className="align-middle" aria-busy={consulta.isFetching}>
            <caption className="visually-hidden">
              Clientes: {pagina.totalElements} encontrado(s)
            </caption>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Documento</th>
                <th scope="col">Telefone</th>
                <th scope="col">E-mail</th>
                <th scope="col">Situação</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagina.content.map((cliente) => (
                <tr key={cliente.id}>
                  <th scope="row" className="fw-normal">
                    {cliente.nome}
                  </th>
                  <td className="text-nowrap">
                    {formatarDocumento(cliente.documento, cliente.tipoPessoa)}
                  </td>
                  <td className="text-nowrap">{formatarTelefone(cliente.telefone) || '—'}</td>
                  <td className="text-break">{cliente.email || '—'}</td>
                  <td>
                    <StatusBadge ativo={cliente.ativo} />
                  </td>
                  <td>
                    <div className="d-flex flex-nowrap gap-2">
                      <Button
                        as={Link}
                        to={`/clientes/${cliente.id}`}
                        variant="outline-dark"
                        aria-label={`Editar ${cliente.nome}`}
                      >
                        Editar
                      </Button>
                      {cliente.ativo ? (
                        <Button
                          variant="outline-dark"
                          aria-label={`Inativar ${cliente.nome}`}
                          onClick={() => setAcao({ tipo: 'inativar', cliente, erro: null })}
                          disabled={processando}
                        >
                          Inativar
                        </Button>
                      ) : (
                        <Button
                          variant="outline-dark"
                          aria-label={`Reativar ${cliente.nome}`}
                          onClick={() => mudarSituacao(cliente, true)}
                          disabled={processando}
                        >
                          {alterarSituacao.isPending &&
                            alterarSituacao.variables?.id === cliente.id && (
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
                      )}
                      <Button
                        variant="outline-danger"
                        aria-label={`Excluir ${cliente.nome}`}
                        onClick={() => setAcao({ tipo: 'excluir', cliente, erro: null })}
                        disabled={processando}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Paginacao
            rotulo="Páginas de clientes"
            pagina={filtros.page}
            totalPaginas={pagina.totalPages}
            onMudar={irParaPagina}
            desabilitada={consulta.isFetching}
          />
        </>
      )}

      <ConfirmModal
        show={acao?.tipo === 'inativar'}
        titulo="Inativar cliente"
        rotuloConfirmar="Inativar"
        processando={alterarSituacao.isPending}
        onConfirmar={() => mudarSituacao(acao.cliente, false)}
        onCancelar={() => setAcao(null)}
      >
        Inativar o cliente {acao?.cliente.nome}? Ele deixa de aparecer entre os ativos e no seletor
        de clientes, e pode ser reativado depois.
      </ConfirmModal>

      {/* Com CUSTOMER_HAS_HISTORY, o mesmo modal passa a oferecer "Inativar cliente". */}
      <ConfirmModal
        show={acao?.tipo === 'excluir'}
        titulo="Excluir cliente"
        rotuloConfirmar={comHistorico ? 'Inativar cliente' : 'Excluir'}
        variantConfirmar={comHistorico ? 'primary' : 'danger'}
        processando={processando}
        onConfirmar={comHistorico ? () => mudarSituacao(acao.cliente, false) : confirmarExclusao}
        onCancelar={() => setAcao(null)}
      >
        {acao?.erro && (
          <ErrorAlert key={acao.erro}>{MSG[acao.erro] ?? MSG.FALHA_EXCLUSAO}</ErrorAlert>
        )}
        {!comHistorico && (
          <p className="mb-0">
            Excluir o cliente {acao?.cliente.nome}? Esta ação não pode ser desfeita.
          </p>
        )}
      </ConfirmModal>
    </div>
  );
}
