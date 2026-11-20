// "View" da API (RNF-BE-02): escolhe campo a campo o que sai na resposta (nunca a linha do banco).
export function toEmpresaResponse(empresa) {
  return {
    id: empresa.id,
    razaoSocial: empresa.razaoSocial,
    nomeFantasia: empresa.nomeFantasia,
    cnpj: empresa.cnpj,
    email: empresa.email,
    telefone: empresa.telefone,
    fusoHorario: empresa.fusoHorario,
    moeda: empresa.moeda,
    ativa: empresa.ativa,
    criadoEm: empresa.criadoEm.toISOString(),
    atualizadoEm: empresa.atualizadoEm.toISOString(),
    versao: empresa.versao,
  };
}
