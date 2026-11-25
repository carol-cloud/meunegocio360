import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

// Filtros e página de uma listagem refletidos na query string (RNF-FE-27): sobrevivem ao
// recarregamento e podem ser compartilhados por link. `padroes` define os filtros aceitos e os
// valores que não vão para a URL. Mudar um filtro volta para a primeira página.
export function useUrlFilters(padroes) {
  const [params, setParams] = useSearchParams();

  const filtros = useMemo(() => {
    const valores = {};
    for (const [chave, padrao] of Object.entries(padroes)) {
      valores[chave] = params.get(chave) ?? padrao;
    }
    const pagina = Number.parseInt(params.get('page') ?? '0', 10);
    valores.page = Number.isInteger(pagina) && pagina >= 0 ? pagina : 0;
    return valores;
  }, [params, padroes]);

  const atualizar = useCallback(
    (mudancas, { manterPagina = false } = {}) => {
      setParams(
        (atuais) => {
          const proximos = new URLSearchParams(atuais);
          for (const [chave, valor] of Object.entries(mudancas)) {
            const vazio = valor === '' || valor === null || valor === undefined;
            if (vazio || valor === padroes[chave]) proximos.delete(chave);
            else proximos.set(chave, String(valor));
          }
          if (!manterPagina && !('page' in mudancas)) proximos.delete('page');
          if (proximos.get('page') === '0') proximos.delete('page');
          return proximos;
        },
        { replace: true },
      );
    },
    [setParams, padroes],
  );

  const irParaPagina = useCallback((page) => atualizar({ page }), [atualizar]);

  const limpar = useCallback(() => setParams({}, { replace: true }), [setParams]);

  const temFiltro = Object.keys(padroes).some((chave) => filtros[chave] !== padroes[chave]);

  return { filtros, atualizar, irParaPagina, limpar, temFiltro };
}
