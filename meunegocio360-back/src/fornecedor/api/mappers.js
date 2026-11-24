// "View" da API (RNF-BE-02): escolhe campo a campo o que sai na resposta (nunca empresa_id).
export function toFornecedorResponse(fornecedor) {
  return {
    id: fornecedor.id,
    tipoPessoa: fornecedor.tipoPessoa,
    nome: fornecedor.nome,
    documento: fornecedor.documento,
    email: fornecedor.email,
    telefone: fornecedor.telefone,
    ativo: fornecedor.ativo,
    criadoEm: fornecedor.criadoEm.toISOString(),
    atualizadoEm: fornecedor.atualizadoEm.toISOString(),
    versao: fornecedor.versao,
  };
}
