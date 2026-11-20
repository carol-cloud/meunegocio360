// Regras de negócio puras do RF-BE-002 (sem Express nem Knex, RNF-010).

// RN-05: parâmetros de exibição padrão.
export const PADROES_EMPRESA = Object.freeze({
  fusoHorario: 'America/Sao_Paulo',
  moeda: 'BRL',
});

export const MOEDAS_ACEITAS = Object.freeze(['BRL']);

// RN-02: uma empresa só pode ficar ativa se não houver outra ativa.
export function podeAtivar(empresa, empresaAtiva) {
  return !empresaAtiva || empresaAtiva.id === empresa.id;
}
