import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { formatarCnpj, formatarTelefone } from '../../../shared/lib/documentos.js';
import { PERFIS } from '../../../shared/lib/perfis.js';
import ConfirmModal from '../../../shared/ui/ConfirmModal.jsx';
import ErrorAlert from '../../../shared/ui/ErrorAlert.jsx';
import { useAuth } from '../../auth/index.js';
import { empresaApi } from '../api/empresa-api.js';
import EmpresaForm from '../components/EmpresaForm.jsx';
import { EMPRESA_QUERY_KEY } from '../context/empresa-context.js';
import { FUSOS_HORARIOS } from '../fusos.js';
import { useEmpresa } from '../hooks/useEmpresa.js';
import { useAlterarSituacaoEmpresa, useEditarEmpresa } from '../hooks/useMutacoesEmpresa.js';

const MSG_INATIVACAO =
  'Ao inativar a empresa, não será possível cadastrar clientes, fornecedores, produtos nem vendas até que uma empresa seja ativada.';

const MSG_ERRO_SITUACAO = {
  VERSION_CONFLICT: 'Os dados da empresa foram alterados por outra pessoa. Recarregue a página.',
  ACCESS_DENIED: 'Você não tem permissão para alterar os dados da empresa.',
};

function rotuloFuso(valor) {
  return FUSOS_HORARIOS.find((fuso) => fuso.valor === valor)?.rotulo ?? valor;
}

function Dado({ termo, children }) {
  return (
    <div className="col-12 col-md-6 mb-3">
      <dt className="fw-semibold">{termo}</dt>
      <dd className="mb-0">
        {children || <span className="text-body-secondary">Não informado</span>}
      </dd>
    </div>
  );
}

// Dados da empresa ativa (RF-FE-002, rota /empresa). Só ADMIN edita e inativa (RN-03 do RF-BE-002);
// os demais perfis veem os dados em leitura, sem os botões.
export default function EmpresaPage() {
  const { usuario } = useAuth();
  const { empresa, atualizarEmpresa } = useEmpresa();
  const queryClient = useQueryClient();
  const editar = useEditarEmpresa();
  const alterarSituacao = useAlterarSituacaoEmpresa();
  const [editando, setEditando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [erroSituacao, setErroSituacao] = useState(null);
  const avisoRef = useRef(null);

  const ehAdmin = usuario?.perfil === PERFIS.ADMIN;
  if (!empresa) return null;

  const salvar = async (dados) => {
    await editar.mutateAsync({ id: empresa.id, dados: { ...dados, versao: empresa.versao } });
    setEditando(false);
    setAviso('Dados da empresa atualizados.');
    requestAnimationFrame(() => avisoRef.current?.focus());
  };

  // VERSION_CONFLICT: busca a versão atual no servidor e atualiza o provider.
  const recarregar = async () => {
    const atual = await queryClient.fetchQuery({
      queryKey: EMPRESA_QUERY_KEY,
      queryFn: empresaApi.obter,
      staleTime: 0,
    });
    atualizarEmpresa(atual);
    return atual;
  };

  const inativar = () => {
    setErroSituacao(null);
    alterarSituacao.mutate(
      { id: empresa.id, ativa: false, versao: empresa.versao },
      {
        onSettled: () => setConfirmando(false),
        onError: (falha) => setErroSituacao(falha.code),
      },
    );
  };

  return (
    <div className="py-4">
      <title>Empresa | MeuNegócio360</title>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h1 className="mb-0">Empresa</h1>
        {ehAdmin && !editando && (
          <div className="d-flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => {
                setAviso(null);
                setEditando(true);
              }}
            >
              Editar
            </Button>
            <Button variant="outline-dark" onClick={() => setConfirmando(true)}>
              Inativar
            </Button>
          </div>
        )}
      </div>

      <div aria-live="polite">
        {aviso && (
          <Alert
            variant="success"
            ref={avisoRef}
            tabIndex={-1}
            dismissible
            closeLabel="Fechar aviso"
            onClose={() => setAviso(null)}
          >
            {aviso}
          </Alert>
        )}
      </div>

      {erroSituacao && (
        <ErrorAlert key={erroSituacao}>
          {MSG_ERRO_SITUACAO[erroSituacao] ??
            'Não foi possível alterar a situação da empresa. Verifique sua conexão e tente novamente.'}
        </ErrorAlert>
      )}

      <Card>
        <Card.Body className="p-4">
          {editando ? (
            <>
              <h2 className="h4 mb-3">Editar dados da empresa</h2>
              <EmpresaForm
                empresa={empresa}
                onSalvar={salvar}
                onCancelar={() => setEditando(false)}
                onRecarregar={recarregar}
              />
            </>
          ) : (
            <dl className="row mb-0">
              <Dado termo="Razão social">{empresa.razaoSocial}</Dado>
              <Dado termo="Nome fantasia">{empresa.nomeFantasia}</Dado>
              <Dado termo="CNPJ">{formatarCnpj(empresa.cnpj)}</Dado>
              <Dado termo="E-mail">{empresa.email}</Dado>
              <Dado termo="Telefone">{empresa.telefone && formatarTelefone(empresa.telefone)}</Dado>
              <Dado termo="Fuso horário">{rotuloFuso(empresa.fusoHorario)}</Dado>
              <Dado termo="Moeda">{empresa.moeda}</Dado>
              <Dado termo="Situação">{empresa.ativa ? 'Ativa' : 'Inativa'}</Dado>
            </dl>
          )}
        </Card.Body>
      </Card>

      {ehAdmin && (
        <ConfirmModal
          show={confirmando}
          titulo="Inativar a empresa?"
          rotuloConfirmar="Inativar"
          processando={alterarSituacao.isPending}
          onConfirmar={inativar}
          onCancelar={() => setConfirmando(false)}
        >
          {MSG_INATIVACAO}
        </ConfirmModal>
      )}
    </div>
  );
}
