// "View" da API (RNF-BE-02): escolhe campo a campo o que sai na resposta. Nunca devolve
// empresa_id nem estoque_minimo (RN-07); o preço segue como string (RNF-033).
export function toItemCatalogoResponse(item) {
  return {
    id: item.id,
    tipo: item.tipo,
    codigo: item.codigo,
    nome: item.nome,
    descricao: item.descricao,
    unidade: item.unidade,
    preco: item.preco,
    categoria: item.categoria ? { id: item.categoria.id, nome: item.categoria.nome } : null,
    ativo: item.ativo,
    criadoEm: item.criadoEm.toISOString(),
    atualizadoEm: item.atualizadoEm.toISOString(),
    versao: item.versao,
  };
}

export function toCategoriaResponse(categoria) {
  return {
    id: categoria.id,
    nome: categoria.nome,
    ativo: categoria.ativo,
    criadoEm: categoria.criadoEm.toISOString(),
    atualizadoEm: categoria.atualizadoEm.toISOString(),
    versao: categoria.versao,
  };
}
