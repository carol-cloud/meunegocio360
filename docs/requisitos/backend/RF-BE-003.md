# RF-BE-003 — Cadastro de clientes

> **Branch:** `feat/rf-be-003-clientes`  
> **Funcionalidade:** F03 — Cadastro de Clientes  
> **Serviço:** Núcleo (`meunegocio360-back`).  
> **Depende de:** [RF-BE-002](./RF-BE-002.md) (empresa ativa e perfis).  
> **Consumido por:** [RF-FE-003](../frontend/RF-FE-003.md) e, futuramente, vendas, equipamentos e ordens de serviço (esta última no serviço Serviços, que consulta o cliente por API e guarda apenas o seu `id`, RNF-090).

## História de usuário

Como **administrador ou operador comercial**, quero **cadastrar, consultar, editar e inativar clientes (nome, documento e contato)**, para **reutilizá-los nas vendas e, futuramente, nos equipamentos e nas ordens de serviço**.

## Atores e precondições

- **Atores:** `ADMIN` e `OPERADOR_COMERCIAL`.
- **Precondição:** empresa ativa cadastrada ([RF-BE-002](./RF-BE-002.md)). Sem ela, a criação retorna `422` `COMPANY_NOT_ACTIVE` (RNF-096).

## Escopo

**Dentro do escopo (obrigatório):** feature `src/cliente/` com tabela e API de clientes (listagem com busca por nome ou documento, consulta, cadastro, edição, inativação/reativação e exclusão condicionada), validação de CPF/CNPJ, unicidade do documento por empresa e o **ponto de extensão** que bloqueia a exclusão de cliente com histórico.

**Fora do escopo:** endereços e múltiplos contatos, importação em lote, histórico de compras do cliente, mesclagem de duplicados, vínculos reais com vendas e OS (criados pelos requisitos que as implementarem).

## Dependências introduzidas

Nenhuma biblioteca nova (RNF-015). Reutiliza `express`, `knex`, `zod` e `swagger-jsdoc`, o validador de documentos de `src/shared/validation/documento.js` (RNF-BE-27; este requisito acrescenta `ehCpfValido` ao lado do `ehCnpjValido` criado no RF-BE-002), `exigirPerfil` (RNF-BE-47), a função de empresa ativa de `src/empresa/index.js` e a estrutura de erros de negócio (RNF-BE-15).

Se ainda não existirem, o *schema* Zod de paginação (`page`, `size`, `sort`) e o montador da resposta paginada (RNF-BE-13) são criados em `src/shared/` neste requisito, para serem reutilizados por RF-BE-004 e RF-BE-005.

## Estrutura no código

| Onde | O quê |
| --- | --- |
| `src/cliente/api/` | `routes.js` (`exigirPerfil(PERFIS.ADMIN, PERFIS.OPERADOR_COMERCIAL)` em todas as rotas, anotações `@openapi`), `controller.js`, `schemas.js` (Zod), `mappers.js` (`toClienteResponse`). |
| `src/cliente/application/` | Casos de uso (listar, consultar, cadastrar, editar, alterar situação, excluir) e `erros.js`. |
| `src/cliente/domain/` | Regras puras (compatibilidade `tipoPessoa` × documento, RN-05). |
| `src/cliente/infra/cliente-repository.js` | Knex, sempre filtrando por `empresa_id`; tradução de `ER_DUP_ENTRY` (RNF-BE-15). |
| `src/cliente/index.js` | `criarModuloCliente({ knex, clock, obterEmpresaAtivaId, verificadoresDeVinculo })`. |
| `src/app.js` | Compõe o módulo, injetando `obterEmpresaAtivaId` do módulo `empresa` e `verificadoresDeVinculo: []`. |

## Regras de negócio

| ID | Regra | Como implementar em Node |
| --- | --- | --- |
| RN-01 | Todo cliente pertence à empresa ativa (`empresa_id`, RNF-096). O cliente NUNCA informa a empresa. | Os casos de uso obtêm o `empresaId` com `obterEmpresaAtivaId(trx)` (injetado). Os *schemas* Zod são `z.object` estritos (`z.strictObject`), que rejeitam `empresaId` no corpo. |
| RN-02 | `tipoPessoa` é `FISICA` (documento = CPF, 11 dígitos) ou `JURIDICA` (documento = CNPJ, 14 dígitos). O documento é armazenado só com dígitos e validado pelos dígitos verificadores (RNF-BE-27). | `tipoPessoa: z.enum(['FISICA', 'JURIDICA'])`; `documento` com `.transform(somenteDigitos)`; a compatibilidade com o tipo em um `.superRefine` do objeto, apontando o erro no campo `documento`. |
| RN-03 | O documento é **único por empresa**, considerando clientes ativos **e inativos**. Duplicidade retorna `409` `CUSTOMER_DOCUMENT_DUPLICATE`; o `detail` informa que o cliente já existe e pode estar inativo. | Índice `uk_cliente_empresa_documento`; o repositório traduz `ER_DUP_ENTRY` nesse índice para o `AppError`. |
| RN-04 | Nome obrigatório (2 a 150). `email` (opcional, até 160, formato válido) e `telefone` (opcional, 10 ou 11 dígitos) formam o contato. Textos sofrem *trim*. | `z.string().trim().min(2).max(150)`; `telefone` com `transform(somenteDigitos)`. |
| RN-05 | Um cliente com **vínculo** (venda ou OS) NÃO PODE ser excluído, apenas **inativado** (RNF-097). A tentativa de exclusão retorna `422` `CUSTOMER_HAS_HISTORY`, com `detail` em português claro (ex.: "O cliente possui vendas ou ordens de serviço vinculadas e não pode ser excluído. Inative o cliente."). | O caso de uso de exclusão consulta os verificadores (RN-06) antes do `DELETE`, na mesma transação. |
| RN-06 | A verificação de vínculos é um **ponto de extensão**: a feature `cliente` recebe uma lista de verificadores de vínculo e a exclusão consulta todos. Nesta fase a lista é vazia; cada requisito que criar um vínculo (vendas, OS) acrescenta o seu verificador, **sem alterar o código da feature `cliente`**. Para OS, que pertence a outro serviço, o verificador consulta a API do serviço (RNF-092). | Cada verificador é uma função `async ({ clienteId, empresaId, trx }) => boolean` (`true` = possui vínculo). A *factory* do caso de uso recebe `verificadoresDeVinculo` (array) e o `app.js` monta essa lista a partir do `index.js` das features que criam vínculos. O contrato é documentado em JSDoc no `src/cliente/index.js`. |
| RN-07 | Cliente **inativo** não aparece nas seleções de outras telas por padrão (`situacao=ATIVO`), mas continua consultável e vinculado ao histórico. Inativar e reativar são idempotentes. | — |
| RN-08 | A busca (`q`) procura por **nome** (contém, sem distinguir maiúsculas e acentos, RNF-BE-26) **ou por documento** (a partir dos dígitos informados, ignorando a máscara). | `where((qb) => qb.where('nome', 'like', termo).orWhere('documento', 'like', digitos))`, com *bindings* e `%`/`_` escapados (RNF-BE-16); o termo do documento é `somenteDigitos(q)` e só entra se tiver dígitos. A insensibilidade a acento vem da *collation* da coluna `nome`. |
| RN-09 | A atualização exige `versao` (RNF-BE-28). O `tipoPessoa` e o documento PODEM ser corrigidos, respeitando as RN-02 e RN-03. | — |

## Matriz de autorização

| Operação | `ADMIN` | `OPERADOR_COMERCIAL` | `OPERADOR_FINANCEIRO` |
| --- | :---: | :---: | :---: |
| Listar, consultar, cadastrar, editar, inativar/reativar e excluir | ✔ | ✔ | ✘ (`403`) |

## Contrato da API

Caminhos sob `/api/v1`, autenticados.

### `GET /clientes`

Parâmetros: `q` (nome ou documento), `situacao` (`ATIVO`, `INATIVO` ou `TODOS`; padrão `ATIVO`), `page`, `size` e `sort` (`nome`, `criadoEm`; padrão `nome`), conforme RNF-BE-13 e RNF-BE-16. Resposta `200` paginada de objetos como o abaixo.

### `POST /clientes`

Corpo: `tipoPessoa`, `nome`, `documento`, `email` e `telefone`. Resposta `201` com `Location` e o cliente (ativo):

```json
{
  "id": "6c1f0a52-3b7e-4f0e-9a3e-2f7a1d5b8c90",
  "tipoPessoa": "FISICA",
  "nome": "Maria da Silva",
  "documento": "52998224725",
  "email": "maria@exemplo.com.br",
  "telefone": "11987654321",
  "ativo": true,
  "criadoEm": "2026-11-18T14:30:00Z",
  "atualizadoEm": "2026-11-18T14:30:00Z",
  "versao": 0
}
```

### `GET /clientes/{id}`, `PUT /clientes/{id}`

Consulta e edição (o `PUT` leva todos os campos e a `versao`). `404` `CUSTOMER_NOT_FOUND` quando o cliente não existe na empresa ativa (inclusive quando pertence a outra empresa). O `{id}` é validado como UUID no *schema* Zod de parâmetros (`ehUuid` de `src/shared/db/uuid.js`): UUID malformado responde `400` `VALIDATION_ERROR`, nunca `500` (o `uuidParaBinario` lança `TypeError`).

### `PATCH /clientes/{id}/situacao`

Corpo `{ "ativo": false, "versao": 2 }`. Inativa ou reativa.

### `DELETE /clientes/{id}`

`204` quando o cliente não tem vínculos; `422` `CUSTOMER_HAS_HISTORY` quando tem (RN-05).

### Erros (`application/problem+json`)

| Situação | Status | `code` |
| --- | --- | --- |
| Campo inválido (documento com dígito errado, tipo incompatível com o tamanho do documento etc.) | `400` | `VALIDATION_ERROR` |
| Sem empresa ativa | `422` | `COMPANY_NOT_ACTIVE` |
| Documento já cadastrado na empresa | `409` | `CUSTOMER_DOCUMENT_DUPLICATE` |
| Cliente com histórico não pode ser excluído | `422` | `CUSTOMER_HAS_HISTORY` |
| Cliente inexistente | `404` | `CUSTOMER_NOT_FOUND` |
| `versao` desatualizada | `409` | `VERSION_CONFLICT` |
| Perfil sem permissão | `403` | `ACCESS_DENIED` |

## Modelo de dados

Migration Knex `<timestamp>_criar_tabela_cliente.js` (RNF-BE-20; nomes de restrições ilustrativos, mas DEVEM ser explícitos):

| Coluna | Tipo | Restrições | No Knex |
| --- | --- | --- | --- |
| `id` | `BINARY(16)` | PK | `table.specificType('id', 'BINARY(16)').notNullable().primary()` |
| `empresa_id` | `BINARY(16)` | `NOT NULL`, FK para `empresa` (`fk_cliente_empresa`) | `table.specificType('empresa_id', 'BINARY(16)').notNullable()` + `table.foreign('empresa_id', 'fk_cliente_empresa').references('id').inTable('empresa')` |
| `tipo_pessoa` | `VARCHAR(10)` | `NOT NULL` (`FISICA`, `JURIDICA`) | `.checkIn(['FISICA', 'JURIDICA'], 'ck_cliente_tipo_pessoa')` |
| `nome` | `VARCHAR(150)` | `NOT NULL`, *collation* `utf8mb4_0900_ai_ci` | `table.string('nome', 150).notNullable().collate('utf8mb4_0900_ai_ci')` |
| `documento` | `VARCHAR(14)` | `NOT NULL` | |
| `email` | `VARCHAR(160)` | `NULL` | |
| `telefone` | `VARCHAR(11)` | `NULL` | |
| `ativo` | `BOOLEAN` | `NOT NULL`, padrão `TRUE` | |
| `criado_em`, `atualizado_em`, `versao` | conforme RNF-BE-22 | `NOT NULL` | |

Restrições e índices: `UNIQUE (empresa_id, documento)` (`uk_cliente_empresa_documento`); `INDEX (empresa_id, nome)` (`idx_cliente_empresa_nome`); `INDEX (empresa_id, ativo)` (`idx_cliente_empresa_ativo`). No Knex: `table.unique([...], { indexName })` e `table.index([...], 'idx_...')`.

## Critérios de aceite

```gherkin
Cenário: Cadastro de cliente pessoa física
  Dado que estou autenticado como OPERADOR_COMERCIAL e existe empresa ativa
  Quando envio POST /api/v1/clientes com tipoPessoa FISICA, nome "Maria da Silva" e documento "529.982.247-25"
  Então recebo 201 com Location e o documento armazenado como "52998224725"
  E ativo é true

Cenário: Cadastro de cliente pessoa jurídica
  Quando envio POST /api/v1/clientes com tipoPessoa JURIDICA, nome "Padaria Pão Quente Ltda" e documento "11222333000181"
  Então recebo 201

Cenário: Documento inválido ou incompatível
  Quando envio tipoPessoa FISICA com documento "11222333000181" ou um CPF com dígito verificador errado
  Então recebo 400 com code VALIDATION_ERROR e um erro no campo documento

Cenário: Documento duplicado na empresa
  Dado que existe um cliente (ativo ou inativo) com documento "52998224725"
  Quando tento cadastrar outro cliente com o mesmo documento, com ou sem máscara
  Então recebo 409 com code CUSTOMER_DOCUMENT_DUPLICATE

Cenário: Busca por nome sem distinção de acento ou caixa
  Dado que existe o cliente "José Antônio"
  Quando envio GET /api/v1/clientes?q=jose antonio
  Então o cliente está na resposta

Cenário: Busca por documento com ou sem máscara
  Quando envio GET /api/v1/clientes?q=529.982 ou q=52998
  Então o cliente com documento "52998224725" está na resposta

Cenário: Listagem paginada e filtro por situação
  Dado que existem clientes ativos e inativos
  Quando envio GET /api/v1/clientes sem parâmetros
  Então recebo somente clientes ativos, ordenados por nome, com page, size, totalElements e totalPages
  E com situacao=TODOS recebo também os inativos

Cenário: Edição com controle de versão
  Dado um cliente com versao 0
  Quando envio PUT com um novo telefone e versao 0
  Então recebo 200 com versao 1
  E um novo PUT com versao 0 retorna 409 com code VERSION_CONFLICT

Cenário: Inativação e reativação
  Quando envio PATCH /api/v1/clientes/{id}/situacao com ativo false
  Então o cliente deixa de aparecer na listagem padrão e continua em GET /api/v1/clientes/{id}
  E com ativo true ele volta à listagem padrão

Cenário: Exclusão de cliente sem vínculos
  Dado um cliente sem vendas nem OS
  Quando envio DELETE /api/v1/clientes/{id}
  Então recebo 204 e GET /api/v1/clientes/{id} retorna 404 com code CUSTOMER_NOT_FOUND

Cenário: Exclusão de cliente com histórico
  Dado um cliente com venda ou OS vinculada
  Quando envio DELETE /api/v1/clientes/{id}
  Então recebo 422 com code CUSTOMER_HAS_HISTORY e detail claro em português
  E o cliente continua cadastrado
  # Verificável de ponta a ponta quando existir o primeiro vínculo (vendas). Até lá, a regra é
  # verificada com um verificador de vínculo falso injetado na factory (ver "Testes previstos").

Cenário: Sem empresa ativa
  Dado que não existe empresa ativa
  Quando tento cadastrar um cliente
  Então recebo 422 com code COMPANY_NOT_ACTIVE

Cenário: Perfil financeiro não acessa clientes
  Dado que estou autenticado como OPERADOR_FINANCEIRO
  Quando envio GET /api/v1/clientes
  Então recebo 403 com code ACCESS_DENIED

Cenário: Cliente de outra empresa não é visível
  Dado um cliente pertencente a uma empresa inativa antiga
  Quando consulto GET /api/v1/clientes/{id} desse cliente com a empresa ativa atual
  Então recebo 404 com code CUSTOMER_NOT_FOUND
```

## Requisitos não funcionais com destaque neste requisito

RNF-096, RNF-097, RNF-054, RNF-024, RNF-025, RNF-BE-02, RNF-BE-03, RNF-BE-05, RNF-BE-15, RNF-BE-16, RNF-BE-23, RNF-BE-26, RNF-BE-27, RNF-BE-28, RNF-BE-47.

## Testes previstos

Implementados na fase de testes (RNF-016). Até lá, os critérios de aceite são verificados manualmente na Swagger UI (`/api-docs`) e com `curl`/Insomnia.

- **Unitários** (Vitest): validação por `tipoPessoa`, normalização de documento, `ehCpfValido`, RN-05 e RN-06 com um verificador de vínculo **falso** passado à *factory* (cobre o cenário de histórico enquanto não há vendas).
- **HTTP** (Supertest sobre o `app`): matriz de perfis, formato dos erros e códigos de status.
- **Integração** (Testcontainers MySQL + migrations Knex): unicidade por empresa, busca sem distinção de acento/caixa e paginação.
- **Arquitetura** (dependency-cruiser): a feature `cliente` não depende de outras features, exceto da API pública de `src/empresa/index.js` (recebida por injeção).

## Pontos de atenção ao revisar código gerado por IA

- `res.json(row)` ou `SELECT *` devolvido sem mapeador (expõe `empresa_id` e `id` em `Buffer`); `empresa_id` recebido do cliente; consulta ou `UPDATE`/`DELETE` sem filtro por `empresa_id` (vazamento entre empresas).
- Unicidade verificada só com "consultar e depois inserir" (corrida) sem a restrição no banco; `ER_DUP_ENTRY` chegando ao cliente como `500`.
- Busca com `LIKE` montado por concatenação de texto (``knex.raw(`... '%${q}%'`)``, injeção de SQL), sem escapar `%`/`_`, ou sem normalizar a máscara do documento.
- `DELETE` apagando sem consultar os verificadores, ou apagando em cascata; ou o bloqueio implementado com uma consulta direta às tabelas de vendas a partir de `src/cliente/`, acoplando as *features* (RNF-BE-05) e, no caso de OS, quebrando o banco por serviço (RNF-090).
- Ponto de extensão implementado como `import` direto dos verificadores dentro da feature `cliente` (exige alterar o código a cada novo vínculo), em vez de lista injetada pelo `app.js`.
- Mensagem de erro técnica ("Duplicate entry ... for key ...") no lugar do erro de negócio.
- Documento armazenado com máscara, ou validado só pelo tamanho; validador de CPF duplicado fora de `src/shared/validation/`.
- Dados pessoais (CPF, e-mail, telefone) escritos em logs (RNF-025), inclusive em `req.log.info({ body: req.body })`.
- `sort` aceitando qualquer campo digitado pelo cliente (`orderBy(req.query.sort)`).

## Extensões opcionais (desafios)

1. Endereços do cliente com busca por CEP.
2. Exportação da listagem em CSV, respeitando a LGPD.
3. Detecção de possíveis duplicados por nome semelhante.
