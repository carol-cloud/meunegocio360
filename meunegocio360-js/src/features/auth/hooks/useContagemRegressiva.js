import { useCallback, useEffect, useState } from 'react';

// Contagem regressiva em segundos (bloqueio por tentativas, 429 + Retry-After).
export function useContagemRegressiva() {
  const [fimEm, setFimEm] = useState(null);
  const [agora, setAgora] = useState(0);

  useEffect(() => {
    if (fimEm === null) return undefined;
    const intervalo = setInterval(() => {
      const instante = Date.now();
      setAgora(instante);
      if (instante >= fimEm) setFimEm(null);
    }, 1000);
    return () => clearInterval(intervalo);
  }, [fimEm]);

  const iniciar = useCallback((segundos) => {
    const instante = Date.now();
    setAgora(instante);
    setFimEm(instante + segundos * 1000);
  }, []);

  const restante = fimEm === null ? 0 : Math.max(0, Math.ceil((fimEm - agora) / 1000));
  return { restante, iniciar };
}
