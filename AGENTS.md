# AGENTS.md — MeuNegocio360

Instruções para assistentes de IA (Copilot, Gemini Code Assist, Continue, Claude Code e similares) que trabalham neste repositório. Este arquivo **não repete** o conteúdo dos demais documentos: ele aponta para eles e acrescenta apenas regras de comportamento para a IA.

## Onde encontrar cada informação

| Preciso de… | Consulte |
| --- | --- |
| Arquitetura, stack, estrutura de pastas, comandos, variáveis de ambiente, fluxo de contribuição, convenções de branch/commit/PR e implantação | [`README.md`](./README.md) |
| Regras do backend em Node.js (RNF-BE) e o requisito RF-BE-001 (contrato, regras de negócio, critérios de aceite, pontos de atenção) | [`README.md`, seção 8](./README.md#8-regras-do-backend-nodejs) e [`docs/requisitos-back.md`](./docs/requisitos-back.md) |
| Requisitos do frontend (paleta, fontes, telas) | [`docs/requisitos-front.md`](./docs/requisitos-front.md) |
| Visão geral e regras válidas para todo o projeto | [`docs/requisitos-gerais.md`](./docs/requisitos-gerais.md) |
| Decisões de arquitetura já tomadas | [`docs/adr/`](./docs/adr) |

## Regras de comportamento para a IA

1. **Leia antes de gerar.** Identifique o requisito (`RF-BE-xxx` / `RF-FE-xxx`) e leia a seção inteira, mais os RNFs que ela destaca. Cite o ID do requisito em commits e PRs.
2. **Planeje antes de codar.** Proponha um plano em passos pequenos e verificáveis e aguarde a revisão antes de executá-lo.
3. **Pergunte quando houver ambiguidade ou conflito** entre documentos ou com o código existente. Não presuma.
4. **Faça só o que o requisito pede.** Não crie funcionalidades, refatorações nem arquivos extras. Respeite o que está "fora do escopo".
5. **Não adicione dependências por conta própria.** Use apenas as listadas em "Dependências introduzidas" do requisito em andamento. Confira que a biblioteca existe e use a versão do `package.json`.
6. **Não invente APIs.** Na dúvida sobre uma biblioteca ou sobre uma versão (Express 5, Knex, Zod 4 etc.), consulte a documentação oficial da versão instalada e diga o que não pôde confirmar.
7. **Backend em JavaScript, sem TypeScript.** ES Modules (`import`/`export`), Express 5 e Knex, conforme o [ADR 0001](./docs/adr/0001-backend-em-nodejs.md). Não introduza TypeScript, ORMs nem pacotes `@types/*`.
8. **Segredos e dados sensíveis:** nunca os escreva no código, em arquivos versionados ou em logs, nem os peça ao usuário em texto claro. Use variáveis de ambiente.
9. **Seja explícito sobre o que gerou.** Ao entregar, informe o que foi criado/alterado e o que não foi verificado, para que o autor registre no PR o que aceitou, ajustou ou rejeitou.
10. **Fase de testes:** não gere testes automatizados fora da fase de testes do projeto, a menos que seja pedido.
