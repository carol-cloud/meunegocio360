# ADR 0001 — Backend em Node.js (Express 5 + Knex, JavaScript)

| | |
| --- | --- |
| **Status** | Aceito |
| **Data** | 12/11/2026 |

## Contexto

O projeto de referência do MeuNegocio360 define o backend em Java 17 com Spring Boot 4, Spring Data JPA, Flyway e Maven. Este repositório adota Node.js no backend, conforme [`docs/requisitos-back.md`](../requisitos-back.md), mantendo MySQL, API REST, arquitetura de microsserviços e as mesmas regras de negócio, contratos de API e critérios de aceite.

## Decisão

- **Runtime:** Node.js 24 LTS (mínimo 20).
- **Framework HTTP:** Express 5.
- **Linguagem:** JavaScript com ES Modules, sem TypeScript, igual ao frontend. Contratos documentados por OpenAPI (swagger-jsdoc + swagger-ui-express) e *schemas* Zod.
- **Acesso a dados:** Knex + mysql2, com migrations e seeds do Knex. Sem ORM e sem sincronização automática de schema.
- **Organização:** por funcionalidade (`src/<feature>/{api,application,domain,infra}`), com injeção de dependências por *factory functions*.
- **Qualidade:** ESLint e Prettier; na fase de testes, Vitest, Supertest e Testcontainers.
- **Implantação:** imagem Docker `node:24-alpine` no Render, *health check* em `/health`.

As regras não funcionais do backend (RNF-BE-01 a 46) mantêm os IDs originais e estão reescritas para Node.js no [`README.md`, seção 8](../../README.md#8-regras-do-backend-nodejs), junto com a tabela de equivalências Java → Node.js no apêndice.

## Alternativas consideradas

- **Fastify:** validação e OpenAPI integrados, porém menos material didático e menos familiar para a turma.
- **NestJS:** estrutura parecida com a do Spring, mas na prática exige TypeScript.
- **Sequelize / Prisma:** ORMs com mais abstração; dão menos controle explícito sobre transações, `SELECT ... FOR UPDATE` e colunas `BINARY(16)`, que o RF-BE-001 exige.
- **TypeScript:** contrariaria a decisão de usar JavaScript em todo o projeto e acrescentaria uma etapa de build.

## Consequências

- Itens do projeto de referência que são específicos de Spring (por exemplo, `@Transactional`, `@RestControllerAdvice`, Actuator, Spotless, JaCoCo, ArchUnit) passam a ter equivalentes em Node.js, documentados no README.
- O hash de senha usa o formato padrão do `bcrypt` (`$2b$...`, `VARCHAR(60)`), sem o prefixo `{bcrypt}` do Spring.
- Migrations seguem o nome padrão do Knex (`<timestamp>_<descricao>.js`).
- A documentação da API fica em `/api-docs`, e o *health check* em `/health`.
- O rollback de código não desfaz migrations; mudanças destrutivas de schema são feitas em duas etapas.
