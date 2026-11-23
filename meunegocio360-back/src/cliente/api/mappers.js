// "View" da API (RNF-BE-02): escolhe campo a campo o que sai na resposta (nunca empresa_id).
export function toClienteResponse(cliente) {
  return {
    id: cliente.id,
    tipoPessoa: cliente.tipoPessoa,
    nome: cliente.nome,
    documento: cliente.documento,
    email: cliente.email,
    telefone: cliente.telefone,
    ativo: cliente.ativo,
    criadoEm: cliente.criadoEm.toISOString(),
    atualizadoEm: cliente.atualizadoEm.toISOString(),
    versao: cliente.versao,
  };
}
