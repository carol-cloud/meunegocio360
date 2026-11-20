# MeuNegocio360 — Requisitos do Backend (Node.js)

| | |
| --- | --- |
| **Versão** | 1.0 |
| **Atualizado em** | 12/11/2026 |
| **Projeto** | `meunegocio360-back` (e futuros serviços `meunegocio360-*`) |
| **Herda de** | [`requisitos-gerais.md`](./requisitos-gerais.md) (todos os requisitos gerais se aplicam; aqui só há o que é específico do backend) |
| **Origem** | Adaptação para Node.js do `requisitos-be.md` (versão 2.1) do projeto de referência, conforme o [ADR 0001](./adr/0001-backend-em-nodejs.md). Os IDs (`RNF-BE-xx`, `RF-BE-xxx`, `RN-xx`) foram mantidos para rastreabilidade. |

As palavras **DEVE**, **NÃO DEVE**, **DEVERIA** e **PODE** seguem a RFC 2119: *DEVE* é obrigatório, *DEVERIA* é fortemente recomendado (desvios exigem justificativa no PR) e *PODE* é opcional. Estrutura de pastas, comandos, variáveis de ambiente e implantação estão no [`README.md`](../README.md).

## 0. Stack e padrão de projeto

| Item | Definição |
| --- | --- |
| Plataforma | Node.js 24 LTS (mínimo 20) |
| Linguagem | JavaScript com ES Modules (`"type": "module"`), sem TypeScript |
| Framework HTTP | Express 5 |
| Banco de dados | MySQL 8.x, um banco por serviço, acessado com Knex + mysql2 |
| Validação e contratos | Zod (entrada) e OpenAPI com swagger-jsdoc + swagger-ui-express |
| Arquitetura | API REST *stateless*, versionada em `/api/v1` |
| Padrão de projeto | **MVC** dentro de cada serviço e **microsserviços** entre os módulos de negócio |

**Como o MVC se organiza no código.** Cada serviço é dividido por funcionalidade (`src/<feature>/`) e, dentro dela, as responsabilidades do MVC ficam em camadas:

| Papel no MVC | Onde fica | O que faz |
| --- | --- | --- |
| **Controller** | `api/` (rotas e controllers) | Recebe a requisição HTTP, valida com Zod, chama o caso de uso e devolve a resposta. |
| **Model** | `domain/` (regras de negócio) e `infra/` (repositórios Knex) | Regras de negócio e acesso aos dados. |
| **View** | `api/` (funções mapeadoras de saída) | A "visão" de uma API REST é a representação JSON: os mapeadores escolhem quais campos saem na resposta. |
| *(intermediário)* | `application/` (casos de uso) | Orquestra o Model e define as transações, para que o Controller continue fino. |

**Microsserviços.** Cada módulo (Núcleo, Serviços, Suprimentos) é um serviço com código, `package.json`, banco e implantação próprios. Um serviço nunca acessa o banco de outro; a comunicação é pela API. O Núcleo é o único emissor de tokens.

## 1. Arquitetura (dentro de cada serviço)

| ID | Requisito |
| --- | --- |
| RNF-BE-01 | Controllers DEVEM ser finos: validam a entrada com o *schema* Zod, chamam o caso de uso e devolvem o DTO. Regra de negócio NÃO DEVE ficar em controller, em middleware nem em repositório. |
| RNF-BE-02 | Linhas do banco NUNCA DEVEM ser devolvidas diretamente na API (`res.json(row)` é proibido). A saída é montada por funções mapeadoras (ex.: `toUsuarioResponse(usuario)`), que escolhem campo a campo e nunca incluem `senhaHash`, `tokenHash` ou similares. |
| RNF-BE-03 | Injeção de dependências DEVE ser explícita, por *factory functions* que recebem as dependências como parâmetro (ex.: `makeLoginUseCase({ usuarioRepository, passwordHasher, tokenService, clock })`). A composição acontece em `app.js`. Casos de uso e controllers NÃO DEVEM importar a instância do Knex nem outros *singletons* diretamente; somente `infra/` conhece o Knex. |
| RNF-BE-04 | Fronteiras transacionais (`knex.transaction(async (trx) => { ... })`) ficam na camada `application`. O caso de uso abre a transação e passa o `trx` aos repositórios, que aceitam um executor opcional (`repo.buscarPorEmail(email, trx)`). |
| RNF-BE-05 | Uma feature NÃO DEVE importar arquivos internos (`infra/`, `domain/`) de outra feature. A comunicação é pelo `index.js` público da feature. |

## 2. Convenções da API REST

| ID | Requisito |
| --- | --- |
| RNF-BE-10 | Prefixo `/api/v1` (um `express.Router()` montado em `app.use('/api/v1', router)`). Recursos no plural e em *kebab-case* (`/api/v1/ordens-de-servico`). Verbos HTTP com semântica correta: `GET` (leitura), `POST` (criação/ação), `PUT`/`PATCH` (atualização), `DELETE` (remoção). |
| RNF-BE-11 | JSON em `camelCase` (colunas do banco em `snake_case`; a conversão é feita no repositório). Datas em ISO 8601 UTC. Identificadores públicos são **UUID** (`crypto.randomUUID()`), nunca sequenciais. |
| RNF-BE-12 | Códigos de status: `200` leitura/ação, `201` criação (com `Location`), `204` sem conteúdo, `400` requisição inválida, `401` não autenticado, `403` sem permissão, `404` não encontrado, `409` conflito, `422` regra de negócio violada, `429` limite excedido, `500` erro inesperado. |
| RNF-BE-13 | Paginação com parâmetros `page` (a partir de 0), `size` (padrão 20, máximo 100) e `sort`, validados por Zod. Resposta: `{ "content": [...], "page": 0, "size": 20, "totalElements": 0, "totalPages": 0 }`. |
| RNF-BE-14 | Todos os erros usam `application/problem+json` (RFC 9457) com o formato abaixo, gerados por **um único middleware de erro** (`(err, req, res, next) => {...}`) registrado por último em `app.js`. Erros esperados são lançados como `AppError` (com `status`, `code`, `title`, `detail` e `errors` opcionais); `ZodError` vira `400 VALIDATION_ERROR`; JSON malformado (`entity.parse.failed` do `express.json()`) também vira `400`; rota inexistente passa por um *handler* de 404 em problem+json; qualquer outro erro vira `500 INTERNAL_ERROR` sem *stack trace* na resposta. O Express 5 já encaminha ao middleware as exceções de *handlers* `async`; não use `try/catch` repetido em cada controller. |

Formato padrão de erro:

```json
{
  "type": "https://meunegocio360.com.br/problemas/validacao",
  "title": "Dados inválidos",
  "status": 400,
  "detail": "Um ou mais campos são inválidos.",
  "instance": "/api/v1/auth/login",
  "code": "VALIDATION_ERROR",
  "traceId": "9f1c2e7a-...",
  "errors": [
    { "field": "email", "message": "deve ser um e-mail válido" }
  ]
}
```

O campo `code` é um identificador estável, em `UPPER_SNAKE_CASE`, usado pelo frontend para decidir o comportamento. O texto de `detail` e `message` NÃO DEVE ser usado como lógica pelo cliente.

## 3. Persistência

| ID | Requisito |
| --- | --- |
| RNF-BE-20 | Schema evoluído exclusivamente por migrations Knex em `db/migrations`, criadas com `npm run migrate:make -- <descricao>` (nome gerado: `<timestamp>_<descricao>.js`, em ES Modules, exportando `up` e `down`). Migrations aplicadas NUNCA são editadas: correções entram em uma migration nova. |
| RNF-BE-21 | NADA cria ou altera tabelas fora das migrations: sem `CREATE TABLE` na inicialização da aplicação, sem ferramentas de sincronização automática de schema (como o `sync()` de ORMs). |
| RNF-BE-22 | Tabelas em `snake_case` e no **singular** (ex.: `usuario`). Toda tabela tem `id` (UUID em `BINARY(16)`), `criado_em`, `atualizado_em` (`DATETIME(6)` em UTC) e `versao` (`BIGINT`, controle otimista). A conversão UUID ↔ `BINARY(16)` fica em um helper de `shared/db` (`uuidParaBinario`, `binarioParaUuid`) ou usa `UUID_TO_BIN()`/`BIN_TO_UUID()` do MySQL, nunca espalhada pelo código. Atualizações com controle otimista usam `UPDATE ... SET versao = versao + 1 WHERE id = ? AND versao = ?`; se nenhuma linha for afetada, o caso de uso responde `409`. A conexão do Knex DEVE usar `timezone: 'Z'` (UTC). |
| RNF-BE-23 | Restrições de integridade (`NOT NULL`, `UNIQUE`, chaves estrangeiras, índices em colunas de busca) DEVEM existir no banco (nas migrations), e não apenas na validação Zod. |
| RNF-BE-24 | Dados de seed apenas para desenvolvimento, em `db/seeds`. Todo arquivo de seed DEVE começar recusando a execução quando `NODE_ENV === 'production'`. Nunca em produção. |
| RNF-BE-25 | Na fase de testes, testes de repositório e de integração DEVEM usar MySQL real via Testcontainers (`@testcontainers/mysql`), e não SQLite ou outro banco com dialeto diferente. |

## 4. Configuração e ambientes

| ID | Requisito |
| --- | --- |
| RNF-BE-31 | Em desenvolvimento, `shared/config/env.js` carrega o `.env` da raiz do repositório com `dotenv` (`path: '../.env'`), **somente** quando `NODE_ENV !== 'production'`; nos demais ambientes as variáveis vêm do ambiente. As variáveis são as documentadas em `.env.example`. A aplicação DEVE escutar em `process.env.PORT ?? 8080`. Nenhum outro módulo lê `process.env` diretamente: todos importam o objeto de configuração já validado. |
| RNF-BE-32 | A aplicação DEVE falhar na inicialização (*fail fast*) se uma variável obrigatória estiver ausente ou inválida: `env.js` valida `process.env` com um *schema* Zod e, em caso de erro, registra quais variáveis falharam (sem os valores) e encerra com `process.exit(1)`. Exemplo: `JWT_SECRET` com menos de 32 bytes. |

## 5. Segurança, observabilidade e qualidade

| ID | Requisito |
| --- | --- |
| RNF-BE-40 | Autenticação *deny-by-default*: o middleware que valida o JWT é aplicado a **todo** o router `/api/v1`, e as rotas públicas ficam numa lista explícita e documentada (hoje: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`; além de `/health` e, fora de produção, `/api-docs`). Rota nova é protegida por padrão; liberar exige entrar na lista. Não há proteção CSRF por *token* porque as APIs se autenticam pelo cabeçalho `Authorization`; os dois únicos endpoints que usam cookie (`/auth/refresh` e `/auth/logout`) DEVEM ser protegidos por `SameSite=Strict`, cookie restrito ao seu caminho e um middleware `verificarOrigin`, que compara o cabeçalho `Origin` com a lista de origens permitidas. O cookie é lido com `cookie-parser`. |
| RNF-BE-41 | Cabeçalhos de segurança com `helmet` (inclui `X-Content-Type-Options`), `app.disable('x-powered-by')`, `Cache-Control: no-store` em respostas autenticadas e HSTS ligado somente em produção. Limite de tamanho do corpo em `express.json({ limit: '100kb' })`. |
| RNF-BE-42 | CORS configurado **uma única vez** com o pacote `cors`, lendo as origens permitidas de `CORS_ALLOWED_ORIGINS` (a mesma lista usada em `verificarOrigin`), com `credentials: true` e, portanto, **sem** `origin: '*'` nem `origin: true`, jamais em produção. O frontend usa a mesma origem; o CORS atende a chamadas diretas de outras origens. |
| RNF-BE-43 | Um middleware DEVE ler ou gerar `X-Request-Id` (`crypto.randomUUID()`), guardá-lo em `AsyncLocalStorage` e no logger da requisição (`pino-http`, opção `genReqId`), e devolvê-lo no cabeçalho da resposta e no campo `traceId` dos erros. |
| RNF-BE-44 | Logs estruturados em JSON com `pino`/`pino-http` (em desenvolvimento PODE usar `pino-pretty` como *devDependency*). Proibido `console.log` no código da aplicação. O logger DEVE usar `redact` para `req.headers.authorization`, `req.headers.cookie`, `res.headers["set-cookie"]` e campos `senha`/`token`. Eventos de segurança (login com sucesso, falha, bloqueio) DEVEM ser registrados **sem** senha, token ou e-mail completo (mascarar: `a***@dominio.com`). |
| RNF-BE-45 | `npm run lint && npm run format:check` DEVE passar antes de cada PR. A partir da fase de testes, `npm test` (testes, regras de arquitetura e cobertura) também entra nessa verificação. |
| RNF-BE-46 | Na fase de testes: Vitest; Supertest para a camada HTTP (sobre o `app` exportado por `app.js`, sem subir o servidor); Testcontainers MySQL para persistência e integração; cobertura com `@vitest/coverage-v8`; regras de camadas com `dependency-cruiser`. Dependências externas são substituídas nos testes unitários graças à injeção por *factory* (RNF-BE-03), sem bibliotecas de *mock* de módulos. |

---

