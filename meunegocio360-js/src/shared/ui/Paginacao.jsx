import Pagination from 'react-bootstrap/Pagination';

// Paginação de listagens paginadas no servidor (RNF-FE-27). `pagina` começa em 0, como na API.
export default function Paginacao({ pagina, totalPaginas, onMudar, desabilitada = false, rotulo }) {
  if (totalPaginas <= 1) return null;
  const primeira = pagina <= 0;
  const ultima = pagina >= totalPaginas - 1;

  return (
    <nav aria-label={rotulo ?? 'Paginação'} className="d-flex align-items-center gap-3 flex-wrap">
      <Pagination className="mb-0">
        <Pagination.Prev
          onClick={() => onMudar(pagina - 1)}
          disabled={primeira || desabilitada}
          aria-label="Página anterior"
        >
          Anterior
        </Pagination.Prev>
        <Pagination.Next
          onClick={() => onMudar(pagina + 1)}
          disabled={ultima || desabilitada}
          aria-label="Próxima página"
        >
          Próxima
        </Pagination.Next>
      </Pagination>
      <span aria-live="polite">
        Página {pagina + 1} de {totalPaginas}
      </span>
    </nav>
  );
}
