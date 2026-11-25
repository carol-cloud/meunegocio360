import Badge from 'react-bootstrap/Badge';

// Selo de situação de um registro mestre. A situação é dita em texto, não só pela cor
// (RNF-FE, seção 2.2).
export default function StatusBadge({ ativo, rotuloAtivo = 'Ativo', rotuloInativo = 'Inativo' }) {
  return ativo ? (
    <Badge bg="success">{rotuloAtivo}</Badge>
  ) : (
    <Badge bg="secondary">{rotuloInativo}</Badge>
  );
}
