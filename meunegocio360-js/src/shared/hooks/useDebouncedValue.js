import { useEffect, useState } from 'react';

// Atraso padrão das buscas (RNF-FE-27).
export const DEBOUNCE_BUSCA_MS = 400;

// Devolve o valor só depois de ele ficar parado por `atraso` ms: evita uma requisição por tecla.
export function useDebouncedValue(valor, atraso = DEBOUNCE_BUSCA_MS) {
  const [atrasado, setAtrasado] = useState(valor);

  useEffect(() => {
    const timer = setTimeout(() => setAtrasado(valor), atraso);
    return () => clearTimeout(timer);
  }, [valor, atraso]);

  return atrasado;
}
