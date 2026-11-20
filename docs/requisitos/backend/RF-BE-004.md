# RF-BE-004 — Cadastro de fornecedores

> **Branch:** `feat/rf-be-004-fornecedores`  
> **Funcionalidade:** F04 — Cadastro de Fornecedores  
> **Serviço:** Núcleo (`meunegocio360-back`).  
> **Depende de:** [RF-BE-002](./RF-BE-002.md) (empresa ativa e perfis). Segue o mesmo desenho de [RF-BE-003](./RF-BE-003.md), cujas regras são referenciadas abaixo em vez de repetidas.  
> **Consumido por:** [RF-FE-004](../frontend/RF-FE-004.md) e, futuramente, compras (serviço Suprimentos) e contas a pagar.

## História de usuário

Como **administrador ou operador financeiro**, quero **cadastrar, consultar, editar e inativar fornecedores (nome, documento e contato)**, para **utilizá-los nas compras e nas contas a pagar**.

## Atores e precondições

- **Atores:** `ADMIN` e `OPERADOR_FINANCEIRO`.
- **Precondição:** empresa ativa cadastrada ([RF-BE-002](./RF-BE-002.md)); sem ela, a criação retorna `422` `COMPANY_NOT_ACTIVE`.

## Escopo

**Dentro do escopo (obrigatório):** feature `src/fornecedor/` com tabela e API de fornecedores (listagem com busca por nome ou documento, consulta, cadastro, edição, inativação/reativação e exclusão condicionada), validação de CPF/CNPJ, unicidade do documento por empresa e o ponto de extensão que bloqueia a exclusão de fornecedor com histórico.

**Fora do escopo:** condições de pagamento, dados bancários, múltiplos contatos, avaliação de fornecedores, vínculos reais com pedidos de compra e contas a pagar (criados pelos requisitos que os implementarem).

## Dependências introduzidas

Nenhuma biblioteca nova (RNF-015). Reutiliza o validador de CPF/CNPJ de `src/shared/validation/documento.js` (RNF-BE-27), `exigirPerfil` (RNF-BE-47), a função de empresa ativa de `src/empresa/index.js`, os erros de negócio (RNF-BE-15) e o *schema* de paginação e busca de `src/shared/` (RNF-BE-13, RNF-BE-16).

## Estrutura no código

Mesma organização de `src/cliente/` ([RF-BE-003](./RF-BE-003.md#estrutura-no-código)), em `src/fornecedor/` (`api/`, `application/`, `domain/`, `infra/fornecedor-repository.js`, `index.js`), com `criarModuloFornecedor({ knex, clock, obterEmpresaAtivaId, verificadoresDeVinculo })` composto em `src/app.js`. As rotas usam `exigirPerfil(PERFIS.ADMIN, PERFIS.OPERADOR_FINANCEIRO)`.

O que for **genérico** (validador de documento, paginação, escape do termo de busca) fica em `src/shared/` e é reutilizado; o que é **do domínio** (schemas, erros `SUPPLIER_*`, repositório, mapeador `toFornecedorResponse`) fica em `src/fornecedor/`. A feature `fornecedor` NÃO importa nada de `src/cliente/` (RNF-BE-05).

## Regras de negócio

| ID | Regra |
| --- | --- |
| RN-01 | Aplicam-se aos fornecedores, **sem alteração**, as regras de [RF-BE-003](./RF-BE-003.md#regras-de-negócio) RN-01 (empresa resolvida no servidor), RN-02 (tipo de pessoa e documento validado), RN-04 (nome e contato), RN-07 (inativos fora das seleções por padrão), RN-08 (busca por nome ou documento) e RN-09 (controle de versão), inclusive na forma de implementar. |
| RN-02 | O documento é **único por empresa**, entre fornecedores ativos e inativos. Duplicidade retorna `409` `SUPPLIER_DOCUMENT_DUPLICATE` (o repositório traduz `ER_DUP_ENTRY` no índice `uk_fornecedor_empresa_documento`). A unicidade vale **por entidade**: o mesmo CNPJ PODE existir como cliente e como fornecedor. |
| RN-03 | Um fornecedor com **vínculo** (pedido de compra ou conta a pagar) NÃO PODE ser excluído, apenas **inativado** (RNF-097). A tentativa retorna `422` `SUPPLIER_HAS_HISTORY`, com `detail` claro (ex.: "O fornecedor possui pedidos de compra ou contas a pagar vinculados e não pode ser excluído. Inative o fornecedor."). |
| RN-04 | A verificação de vínculos usa uma lista de verificadores `async ({ fornecedorId, empresaId, trx }) => boolean`, injetada na *factory* do caso de uso de exclusão, nos mesmos moldes de [RF-BE-003 (RN-06)](./RF-BE-003.md#regras-de-negócio): lista vazia nesta fase; compras (serviço Suprimentos, por API com `fetch` e *timeout*, RNF-092) e contas a pagar acrescentam o seu em `app.js`. |
| RN-05 | Somente `ADMIN` e `OPERADOR_FINANCEIRO` acessam fornecedores; `OPERADOR_COMERCIAL` recebe `403`. |

## Matriz de autorização

| Operação | `ADMIN` | `OPERADOR_COMERCIAL` | `OPERADOR_FINANCEIRO` |
| --- | :---: | :---: | :---: |
| Listar, consultar, cadastrar, editar, inativar/reativar e excluir | ✔ | ✘ (`403`) | ✔ |

## Contrato da API

Caminhos sob `/api/v1`, autenticados. Estrutura idêntica à de clientes ([RF-BE-003](./RF-BE-003.md#contrato-da-api)), no recurso `/fornecedores`:

| Método e caminho | Descrição |
| --- | --- |
| `GET /fornecedores` | Listagem paginada. Parâmetros: `q` (nome ou documento), `situacao` (`ATIVO`, `INATIVO`, `TODOS`; padrão `ATIVO`), `page`, `size`, `sort` (`nome`, `criadoEm`). |
| `POST /fornecedores` | Cadastro. Corpo: `tipoPessoa`, `nome`, `documento`, `email`, `telefone`. `201` com `Location`. |
| `GET /fornecedores/{id}` | Consulta. `404` `SUPPLIER_NOT_FOUND`. |
| `PUT /fornecedores/{id}` | Edição completa, com `versao`. |
| `PATCH /fornecedores/{id}/situacao` | Corpo `{ "ativo": false, "versao": 2 }`. |
| `DELETE /fornecedores/{id}` | `204` sem vínculos; `422` `SUPPLIER_HAS_HISTORY` com vínculos. |

Objeto retornado: o mesmo de cliente (`id`, `tipoPessoa`, `nome`, `documento`, `email`, `telefone`, `ativo`, `criadoEm`, `atualizadoEm`, `versao`), montado por `toFornecedorResponse`. O `{id}` segue a mesma validação de UUID de clientes.

### Erros (`application/problem+json`)

| Situação | Status | `code` |
| --- | --- | --- |
| Campo inválido | `400` | `VALIDATION_ERROR` |
| Sem empresa ativa | `422` | `COMPANY_NOT_ACTIVE` |
| Documento já cadastrado na empresa | `409` | `SUPPLIER_DOCUMENT_DUPLICATE` |
| Fornecedor com histórico não pode ser excluído | `422` | `SUPPLIER_HAS_HISTORY` |
| Fornecedor inexistente | `404` | `SUPPLIER_NOT_FOUND` |
| `versao` desatualizada | `409` | `VERSION_CONFLICT` |
| Perfil sem permissão | `403` | `ACCESS_DENIED` |

## Modelo de dados

Migration Knex `<timestamp>_criar_tabela_fornecedor.js` (RNF-BE-20): tabela `fornecedor` com as **mesmas colunas** e a mesma declaração Knex de `cliente` ([RF-BE-003](./RF-BE-003.md#modelo-de-dados)), com `fk_fornecedor_empresa`, `ck_fornecedor_tipo_pessoa`, `UNIQUE (empresa_id, documento)` (`uk_fornecedor_empresa_documento`), `INDEX (empresa_id, nome)` (`idx_fornecedor_empresa_nome`) e `INDEX (empresa_id, ativo)` (`idx_fornecedor_empresa_ativo`). Não há chave estrangeira entre `cliente` e `fornecedor`: são cadastros independentes.

## Critérios de aceite

```gherkin
Cenário: Cadastro de fornecedor
  Dado que estou autenticado como OPERADOR_FINANCEIRO e existe empresa ativa
  Quando envio POST /api/v1/fornecedores com tipoPessoa JURIDICA, nome "Distribuidora Alfa Ltda" e documento "11.222.333/0001-81"
  Então recebo 201 com Location e o documento armazenado como "11222333000181"

Cenário: Documento inválido
  Quando envio um documento com dígito verificador errado ou incompatível com o tipoPessoa
  Então recebo 400 com code VALIDATION_ERROR e um erro no campo documento

Cenário: Documento duplicado
  Dado que existe um fornecedor (ativo ou inativo) com documento "11222333000181"
  Quando tento cadastrar outro fornecedor com o mesmo documento
  Então recebo 409 com code SUPPLIER_DOCUMENT_DUPLICATE

Cenário: Mesmo documento como cliente e como fornecedor
  Dado que existe um cliente com documento "11222333000181"
  Quando cadastro um fornecedor com o mesmo documento
  Então recebo 201

Cenário: Busca por nome ou documento
  Dado o fornecedor "Distribuidora Álfa Ltda"
  Quando envio GET /api/v1/fornecedores?q=distribuidora alfa ou q=11.222
  Então o fornecedor está na resposta

Cenário: Edição com controle de versão
  Dado um fornecedor com versao 0
  Quando envio PUT com versao 0 e depois, novamente, com versao 0
  Então o primeiro retorna 200 com versao 1 e o segundo 409 com code VERSION_CONFLICT

Cenário: Inativação e reativação
  Quando envio PATCH /api/v1/fornecedores/{id}/situacao com ativo false
  Então o fornecedor sai da listagem padrão e continua consultável por id

Cenário: Exclusão de fornecedor sem vínculos
  Dado um fornecedor sem pedidos de compra nem contas a pagar
  Quando envio DELETE /api/v1/fornecedores/{id}
  Então recebo 204

Cenário: Exclusão de fornecedor com histórico
  Dado um fornecedor com pedido de compra ou conta a pagar vinculado
  Quando envio DELETE /api/v1/fornecedores/{id}
  Então recebo 422 com code SUPPLIER_HAS_HISTORY e detail claro em português
  E o fornecedor continua cadastrado
  # Verificável de ponta a ponta quando existir o primeiro vínculo (compras ou contas a pagar).
  # Até lá, verificado com um verificador de vínculo falso injetado na factory.

Cenário: Sem empresa ativa
  Dado que não existe empresa ativa
  Quando tento cadastrar um fornecedor
  Então recebo 422 com code COMPANY_NOT_ACTIVE

Cenário: Perfil comercial não acessa fornecedores
  Dado que estou autenticado como OPERADOR_COMERCIAL
  Quando envio GET /api/v1/fornecedores
  Então recebo 403 com code ACCESS_DENIED
```

## Requisitos não funcionais com destaque neste requisito

RNF-096, RNF-097, RNF-054, RNF-025, RNF-BE-05, RNF-BE-15, RNF-BE-16, RNF-BE-26, RNF-BE-27, RNF-BE-28, RNF-BE-47.

## Testes previstos

Implementados na fase de testes (RNF-016). Até lá, os critérios de aceite são verificados manualmente na Swagger UI (`/api-docs`) e com `curl`/Insomnia.

- **Unitários** (Vitest): RN-02 a RN-04 com verificador de vínculo falso passado à *factory*.
- **HTTP** (Supertest sobre o `app`): matriz de perfis (inclusive a inversão em relação a clientes), erros e status.
- **Integração** (Testcontainers MySQL + migrations Knex): unicidade por empresa, independência entre `cliente` e `fornecedor`, busca e paginação.
- **Arquitetura** (dependency-cruiser): `src/fornecedor/` não importa `src/cliente/`.

## Pontos de atenção ao revisar código gerado por IA

- Todos os pontos de [RF-BE-003](./RF-BE-003.md#pontos-de-atenção-ao-revisar-código-gerado-por-ia).
- **Copiar e colar** o cliente trocando o nome: reutilize o validador, a paginação, o escape da busca e o tratamento de erros em `src/shared/` em vez de duplicar; mas NÃO una as duas entidades em uma só tabela "parceiro", nem faça `src/fornecedor/` importar arquivos de `src/cliente/`.
- Perfis copiados de clientes sem inverter a matriz (`exigirPerfil` com `OPERADOR_COMERCIAL` nas rotas de fornecedores).
- Unicidade do documento verificada entre `cliente` e `fornecedor` (não é a regra).
- Código de erro de cliente (`CUSTOMER_*`) reaproveitado em fornecedores, ou tradução de `ER_DUP_ENTRY` checando o nome do índice de cliente.

## Extensões opcionais (desafios)

1. Dados bancários e condições de pagamento do fornecedor.
2. Vários contatos por fornecedor, com função de cada um.
3. Importação de fornecedores por CSV, com relatório de linhas rejeitadas.
