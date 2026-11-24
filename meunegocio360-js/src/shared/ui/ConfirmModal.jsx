import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';

// Confirmação de ações sensíveis (RNF-FE-09). O Modal do react-bootstrap prende o foco
// enquanto aberto e o devolve ao botão de origem ao fechar (restoreFocus, RF-FE-002).
export default function ConfirmModal({
  show,
  titulo,
  children,
  rotuloConfirmar = 'Confirmar',
  variantConfirmar = 'primary',
  processando = false,
  onConfirmar,
  onCancelar,
}) {
  return (
    <Modal
      show={show}
      onHide={processando ? undefined : onCancelar}
      centered
      restoreFocus
      aria-labelledby="confirm-modal-titulo"
    >
      <Modal.Header closeButton={!processando} closeLabel="Fechar">
        <Modal.Title as="h2" className="h4" id="confirm-modal-titulo">
          {titulo}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-dark" onClick={onCancelar} disabled={processando}>
          Cancelar
        </Button>
        <Button variant={variantConfirmar} onClick={onConfirmar} disabled={processando}>
          {processando && (
            <Spinner as="span" animation="border" size="sm" aria-hidden="true" className="me-2" />
          )}
          {rotuloConfirmar}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
