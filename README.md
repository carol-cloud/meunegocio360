# MeuNegócio360

Sistema comercial de gestão de clientes, serviços e suprimentos para pequenas e médias empresas, desenvolvido com uso assistido de IA em todas as etapas do ciclo de desenvolvimento (requisitos, código, testes, revisão e deploy).

Este README descreve **como o projeto é organizado e como trabalhar nele**, com o backend em **Node.js**. O que o sistema deve fazer (requisitos funcionais e não funcionais) está em [`docs/`](./docs). As regras específicas do backend em Node estão na seção [8. Regras do backend](#8-regras-do-backend-nodejs).

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Stack tecnológica](#3-stack-tecnológica)
4. [Estrutura do projeto](#4-estrutura-do-projeto)
5. [Primeiros passos](#5-primeiros-passos)
6. [Contribuições](#6-contribuições)
7. [Implantação](#7-implantação)
8. [Regras do backend (Node.js)](#8-regras-do-backend-nodejs)
9. [Documentação](#9-documentação)
10. [Apêndice: mudanças em relação à versão Java](#apêndice-mudanças-em-relação-à-versão-java)

## 1. Visão geral

O MeuNegocio360 é organizado em três módulos de negócio:

| Módulo | Objetivo | Funcionalidades previstas |
| --- | --- | --- |
| **Núcleo** | Base empresarial | Gestão de usuários, clientes, fornecedores, produtos, serviços, vendas, contas (a pagar e a receber), fluxo de caixa e dashboard. |
| **Serviços** | Operação de serviços | Gestão de técnicos, equipamentos, solicitações, ordens de serviço (OS), execução, evidências, aceite e faturamento da OS. |
| **Suprimentos** | Estoque e compras | Movimentações, estoque mínimo, inventário, compras, reposição, curva ABC, giro e alertas. |

Estado atual: apenas o **Núcleo** (`meunegocio360-back`) e o frontend (`meunegocio360-js`) existem. Serviços e Suprimentos serão implementados futuramente. As funcionalidades entram requisito a requisito, conforme os documentos em [`docs/`](./docs).

## 2. Arquitetura

O sistema segue uma arquitetura de **microsserviços**, consumida por **um único frontend** (SPA):

| Serviço | Pasta | Responsabilidade | Estado |
| --- | --- | --- | --- |
| Núcleo | `meunegocio360-back` | Identidade e autenticação, usuários, clientes, fornecedores, produtos, serviços (catálogo), vendas, contas, fluxo de caixa e dashboard. | Em desenvolvimento |
| Serviços | `meunegocio360-servicos` | Técnicos, equipamentos, solicitações, OS, execução, evidências, aceite e faturamento da OS. | Futuro |
| Suprimentos | `meunegocio360-suprimentos` | Movimentações, estoque mínimo, inventário, compras, reposição, curva ABC, giro e alertas. | Futuro |

Cada serviço tem código, `package.json`, banco de dados e implantação próprios. Um serviço nunca lê o banco de outro: a comunicação é pela API.

### Decisões de arquitetura

| Decisão | Resumo |
| --- | --- |
| Microsserviços | Um serviço por módulo de negócio, no formato monorepo (uma pasta por serviço). Cada serviço é autocontido e pode ser separado em repositório próprio sem mudança de código. |
| API REST *stateless* | Express 5, versionada em `/api/v1`, documentada em OpenAPI (swagger-jsdoc + swagger-ui-express). |
| Autenticação | JWT de acesso de curta duração e refresh token rotativo em cookie `HttpOnly`, emitidos pelo Núcleo. Detalhes em [RF-BE-001](#rf-be-001--autenticação-de-usuário-login-nodejs). |
| JavaScript em todo o projeto | Backend e frontend em JavaScript (ES Modules), **sem TypeScript**. Contratos de dados documentados por OpenAPI e *schemas* Zod (usados nas duas pontas). |
| SQL explícito com Knex | Acesso ao MySQL por *query builder* (Knex + mysql2), com migrations versionadas. Sem ORM com sincronização automática de schema. |
| Estilos com Bootstrap | Toda a interface é construída sobre o Bootstrap 5, com a identidade visual aplicada no tema. Ver [requisitos do frontend](./docs/requisitos-front.md). |
| Mesma origem para a API | O navegador sempre chama a API por caminho relativo (`/api`): em desenvolvimento, o servidor do Vite repassa a chamada ao backend; em produção, o Netlify faz o repasse ao Render. Assim o cookie de refresh permanece *first-party* com `SameSite=Strict`. |
| Implantação | Frontend no Netlify e backend no Render (seção [Implantação](#7-implantação)). |

Decisões novas e relevantes DEVEM ser registradas como ADR em `docs/adr/`. A troca do backend de Java para Node.js é a primeira delas ([ADR 0001](./docs/adr/0001-backend-em-nodejs.md)).

## 3. Stack tecnológica

| Camada | Tecnologia |
| --- | --- |
| Backend (cada serviço) | Node.js 24 LTS, Express 5, JavaScript (ES Modules), Knex + mysql2, Zod, jsonwebtoken, bcrypt, helmet, cors, cookie-parser, pino/pino-http, swagger-jsdoc + swagger-ui-express |
| Qualidade do backend | ESLint (flat config) e Prettier; na fase de testes, Vitest, Supertest e Testcontainers |
| Banco de dados | MySQL 8.x, um banco por serviço |
| Frontend | React 19, Vite, JavaScript, Bootstrap 5 |
| Ambiente local | Docker Compose (MySQL) |
| Implantação | Netlify (frontend) e Render (backend, via Docker) |
| IDE | Visual Studio Code, com extensões de linguagem (ESLint, Prettier) e de assistente de IA |

As versões de cada biblioteca são as do `package.json` de cada pasta. Bibliotecas adicionais são introduzidas por cada requisito que as exige, nunca antecipadamente.

## 4. Estrutura do projeto

```
meunegocio360/
├── docs/                         # requisitos (RF e RNF) e ADRs (docs/adr/)
├── meunegocio360-back/           # microsserviço Núcleo (Node.js + Express)
├── meunegocio360-servicos/       # (futuro) microsserviço Serviços
├── meunegocio360-suprimentos/    # (futuro) microsserviço Suprimentos
├── meunegocio360-js/             # frontend único (React + Vite)
│   └── .env.example              # variáveis públicas do frontend (VITE_*)
├── compose.yaml                  # infraestrutura local (MySQL do Núcleo)
├── .env.example                  # variáveis de ambiente do backend e do compose
├── .gitignore                    # ignora .env, node_modules e arquivos locais
├── AGENTS.md                     # instruções de contexto para assistentes de IA
└── README.md                     # este arquivo
```

### Backend (cada serviço)

Organização por funcionalidade (*package by feature*), em ES Modules (`"type": "module"` no `package.json`):

```
meunegocio360-back/
├── src/
│   ├── <feature>/                # ex.: auth, usuario, cliente, produto
│   │   ├── api/                  # rotas, controllers, schemas Zod de entrada, mapeadores de saída
│   │   ├── application/          # casos de uso; abrem e fecham transações
│   │   ├── domain/               # regras de negócio puras (sem Express nem Knex)
│   │   ├── infra/                # repositórios Knex, adaptadores externos
│   │   └── index.js              # API pública da feature (o que outras features podem usar)
│   ├── shared/
│   │   ├── config/               # leitura e validação das variáveis de ambiente (env.js)
│   │   ├── db/                   # instância do Knex, helpers de UUID/BINARY(16)
│   │   ├── errors/               # AppError e middleware único de erros (problem+json)
│   │   ├── security/             # autenticação JWT, verificação de Origin, CORS, helmet
│   │   └── logging/              # logger pino, X-Request-Id e AsyncLocalStorage
│   ├── app.js                    # monta o Express: middlewares, rotas e injeção de dependências
│   └── server.js                 # ponto de entrada: valida env, sobe o HTTP e os jobs
├── db/
│   ├── migrations/               # migrations Knex (<timestamp>_<descricao>.js)
│   └── seeds/                    # dados de desenvolvimento (nunca em produção)
├── knexfile.js                   # configuração do Knex (lê shared/config/env.js)
├── eslint.config.js
├── .prettierrc
├── Dockerfile
└── package.json
```

### Frontend

```
meunegocio360-js/src
├── app/                        # bootstrap: providers, roteador, layout raiz
├── features/
│   └── <feature>/              # ex.: auth, clientes, produtos
│       ├── api/                # chamadas HTTP da feature
│       ├── components/         # componentes exclusivos da feature
│       ├── hooks/              # hooks da feature (useLogin, useAuth ...)
│       ├── pages/              # telas roteáveis
│       ├── schemas.js          # schemas Zod
│       └── index.js            # API pública da feature
├── shared/
│   ├── ui/                     # componentes compartilhados (sobre react-bootstrap)
│   ├── lib/                    # cliente HTTP, utilitários
│   └── styles/                 # tema do Bootstrap (theme.scss) e estilos globais
└── test/                       # configuração e dados de teste (fase de testes)
```

## 5. Primeiros passos

### Pré-requisitos

Node.js **24 LTS** (mínimo 20: o Express 5 exige 18 ou superior, e o Node 18 já está fora de suporte) com npm, Docker com Docker Compose, Git e Visual Studio Code. Confira com `node --version`; para gerenciar versões, use o `nvm` (`nvm install 24 && nvm use 24`).

### Passo a passo

```bash
# 1. Variáveis de ambiente (preencha as senhas e o JWT_SECRET; o .env nunca é versionado)
cp .env.example .env
cp meunegocio360-js/.env.example meunegocio360-js/.env.local

# 2. Banco de dados do Núcleo (MySQL em contêiner)
docker compose up -d

# 3. Backend (na pasta do serviço)
cd meunegocio360-back
npm install
npm run migrate          # aplica as migrations no banco
npm run seed             # cria os usuários fictícios (somente desenvolvimento)
npm run dev              # sobe a API com recarga automática

# 4. Frontend (em outro terminal)
cd meunegocio360-js
npm install
npm run dev
```

A descrição de cada variável está comentada em [`.env.example`](./.env.example) e em [`meunegocio360-js/.env.example`](./meunegocio360-js/.env.example). Com tudo no ar: backend em `http://localhost:8080` (Swagger UI em `/api-docs`, fora de produção; *health check* em `/health`) e frontend em `http://localhost:5173`. Endpoints e telas existem à medida que os requisitos são implementados.

### Comandos úteis

| Onde | Comando | Para quê |
| --- | --- | --- |
| Raiz | `docker compose up -d` / `docker compose down` | Sobe / para o MySQL (mantém os dados). |
| Raiz | `docker compose down -v` | Para e **apaga** os dados locais do banco. |
| `meunegocio360-back` | `npm run dev` | Sobe a API com `node --watch` (recarrega ao salvar). |
| `meunegocio360-back` | `npm start` | Sobe a API sem recarga (como em produção). |
| `meunegocio360-back` | `npm run migrate` / `npm run migrate:rollback` | Aplica / desfaz o último lote de migrations. |
| `meunegocio360-back` | `npm run migrate:make -- <descricao>` | Cria uma migration nova em `db/migrations`. |
| `meunegocio360-back` | `npm run seed` | Carrega os dados de desenvolvimento (recusa rodar em produção). |
| `meunegocio360-back` | `npm run lint` | Verifica o código com ESLint. |
| `meunegocio360-back` | `npm run format` / `npm run format:check` | Formata / verifica a formatação com Prettier. |
| `meunegocio360-js` | `npm run lint` | Verifica o código com ESLint. |
| `meunegocio360-js` | `npm run build` | Gera o build de produção em `dist/`. |
| `meunegocio360-js` | `npm run format` | Formata com Prettier. |

Scripts de teste serão acrescentados na fase de testes (ver [Contribuições](#6-contribuições)).

### Conceitos de DevOps (introdutórios)

O foco do projeto é o desenvolvimento de software. Os conceitos de DevOps usados aqui são apenas introdutórios e já vêm prontos:

| Conceito | Onde aparece |
| --- | --- |
| Contêineres | `compose.yaml` (banco local) e `Dockerfile` do backend. |
| Configuração por variáveis de ambiente (*12-factor*) | `.env.example` e painéis do Netlify e do Render. |
| Entrega contínua | Netlify e Render publicam automaticamente a cada *push* na branch configurada. |
| *Health check* e *rollback* | `/health` verificado pelo Render; retorno a um deploy anterior pelos painéis. |

Estão **fora de escopo**: pipelines de CI (por exemplo, GitHub Actions), orquestração (Kubernetes), infraestrutura como código e monitoramento avançado.

## 6. Contribuições

Todo trabalho acontece em uma **branch do seu fork** e segue o **fluxo de desenvolvimento assistido por IA**, uma branch por requisito.

### 6.1 Preparar o fork e a branch

```bash
# Fork pelo GitHub e clone do SEU fork
git clone https://github.com/<seu-usuario>/meunegocio360.git
cd meunegocio360
git remote add upstream https://github.com/<repositorio-principal>/meunegocio360.git

# Antes de começar cada requisito: atualizar a main do fork
git fetch upstream
git switch main
git merge --ff-only upstream/main
git push origin main

# Criar a branch do requisito
git switch -c feat/rf-be-001-login
```

### 6.2 Fluxo de desenvolvimento assistido por IA

| Etapa | O que fazer |
| --- | --- |
| **1. Requisitos** | Leia por inteiro o requisito em [`docs/`](./docs) e as [regras do backend](#8-regras-do-backend-nodejs) (regras, contrato, critérios de aceite, pontos de atenção e dependências introduzidas). Se o requisito ainda não existe, escreva-o e peça à IA que aponte ambiguidades e lacunas **antes** de codar. Dúvidas viram perguntas, não suposições. |
| **2. Geração de código** | Peça à IA um plano em passos pequenos e verificáveis, revise-o e implemente em incrementos pequenos, com commits frequentes. Dê à IA o contexto necessário: o requisito, os RNFs aplicáveis e o [`AGENTS.md`](./AGENTS.md), que traz as regras de uso de IA no projeto. Faça só o que o requisito pede. |
| **3. Testes** | Valide cada critério de aceite do requisito. Veja a observação abaixo. |
| **4. Revisão** | Revise linha a linha o que a IA gerou (você responde pelo código), usando a lista de "pontos de atenção" do requisito. Antes de abrir o PR, execute localmente as verificações de qualidade (`npm run lint && npm run format:check` no backend; `npm run lint && npm run build` no frontend). Abra o PR do seu fork para a `main` do repositório principal e atenda aos comentários da revisão. |
| **5. Deploy** | Publique a branch do seu fork nas suas próprias contas do Netlify e do Render para validar o requisito em um ambiente real (ver [Implantação](#7-implantação)). O deploy do ambiente oficial é feito somente a partir da `main` do repositório principal, após o merge. |

> **Observação sobre a etapa de testes:** a fase de testes automatizados será realizada posteriormente, no módulo de Testes do curso. Até lá, cada critério de aceite do requisito é verificado manualmente (Swagger UI, `curl`/Insomnia e navegador) e o resultado é registrado na descrição do PR. As seções "Testes previstos" dos requisitos descrevem o que será automatizado nessa fase.

### 6.3 Convenções

**Branches.** Uma branch curta por requisito, criada a partir da `main` atualizada: `<tipo>/<id-do-requisito>-<resumo>`, por exemplo `feat/rf-be-001-login`, `fix/rf-fe-001-redirecionamento`. A `main` é protegida: nada é enviado diretamente a ela.

**Commits.** [Conventional Commits](https://www.conventionalcommits.org/pt-br) (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`), citando o ID do requisito: `feat(auth): autentica usuário por e-mail e senha [RF-BE-001]`. Nunca versione `.env`, `node_modules/` nem `dist/`.

**Pull requests.** Pequenos e focados em um único requisito. A descrição DEVE informar: o que foi feito e por quê; como foi verificado (critérios de aceite); e o **registro de uso de IA**, com o que foi aceito, ajustado ou rejeitado e por quê. O merge (*squash*) só ocorre **após a aprovação do líder técnico** no GitHub.

**Definição de Pronto.** Marque todos os itens no PR:

- [ ] Todos os critérios de aceite do requisito foram verificados.
- [ ] `npm run lint && npm run format:check` (backend) e/ou `npm run lint && npm run build` (frontend) passam localmente.
- [ ] Nenhum segredo, dado pessoal real ou código morto no *diff*.
- [ ] OpenAPI coerente com a implementação (quando há mudança de API).
- [ ] Acessibilidade verificada (quando há mudança de interface).
- [ ] Este README, a documentação e, se aplicável, um ADR foram atualizados.
- [ ] O código gerado por IA foi revisado linha a linha e o registro de uso de IA está no PR.
- [ ] O requisito foi validado no ambiente publicado a partir do fork.

## 7. Implantação

```
Navegador ──► Netlify (SPA estática + repasse de /api/*) ──► Render (backend em Docker) ──► MySQL
```

Para o ambiente próprio do seu fork, crie os serviços abaixo apontando para o **seu fork** e a branch do requisito.

### 7.1 Backend no Render

O Render tem *runtime* Node nativo, mas o backend é implantado como **Docker** para que a imagem seja a mesma em qualquer ambiente e independa de arquivos fora da pasta do serviço. Crie o arquivo `meunegocio360-back/Dockerfile`:

```dockerfile
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json knexfile.js ./
COPY db db
COPY src src
USER node
EXPOSE 8080
CMD ["node", "src/server.js"]
```

Crie também `meunegocio360-back/.dockerignore` com `node_modules`, `.env*` e `*.log`, para que nada local entre na imagem.

No painel do Render, crie um **Web Service** com *Language* `Docker`, *Root Directory* `meunegocio360-back` e *Health Check Path* `/health`. O Render informa a porta pela variável `PORT` (a aplicação deve usá-la, RNF-BE-31).

**Migrations em produção.** Em instâncias pagas, configure o *Pre-Deploy Command* `npm run migrate`. Em instâncias gratuitas (sem *pre-deploy*), troque o `CMD` por `["sh", "-c", "npx knex migrate:latest && node src/server.js"]`. As migrations são idempotentes: as já aplicadas são ignoradas.

Em *Environment*, configure as mesmas variáveis do `.env.example`, com estes valores específicos de produção:

| Variável | Valor em produção |
| --- | --- |
| `NODE_ENV` | `production` |
| `CORS_ALLOWED_ORIGINS` | URL do site no Netlify (ex.: `https://meunegocio360.netlify.app`) |
| `APP_AUTH_COOKIE_SECURE` | `true` |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Dados do banco de produção (ver abaixo) |
| `JWT_SECRET` | Segredo novo e exclusivo de produção (`openssl rand -base64 48`) |

As variáveis do seed de desenvolvimento (`SEED_*`) NÃO são configuradas em produção.

**Banco de dados.** O Render **não oferece MySQL gerenciado** (apenas PostgreSQL e Key Value). Há duas alternativas para manter o MySQL: (1) um *Private Service* com a imagem Docker do MySQL e disco persistente no `/var/lib/mysql`, seguindo o [guia do Render](https://render.com/docs/deploy-mysql); ou (2) um serviço de MySQL gerenciado de um provedor externo, informando os dados nas variáveis `DB_*`. Instâncias gratuitas do Render não possuem disco persistente nem recebem tráfego de rede privada, portanto a opção (1) exige instância paga.

### 7.2 Frontend no Netlify

No Netlify, importe o repositório (seu fork) e configure *Base directory* `meunegocio360-js`. Crie o arquivo `meunegocio360-js/netlify.toml`, substituindo o endereço do backend:

```toml
[build]
  command = "npm run build"
  publish = "dist"

# Repasse da API para o backend: o navegador continua falando com a mesma origem
[[redirects]]
  from = "/api/*"
  to = "https://<seu-servico>.onrender.com/api/:splat"
  status = 200
  force = true

# Fallback das rotas da SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Em *Environment variables*, defina `VITE_API_BASE_URL=/api/v1`.

### 7.3 Verificações no primeiro deploy

1. `https://<seu-servico>.onrender.com/health` responde `{ "status": "UP" }`.
2. O login pelo site do Netlify funciona e, em *DevTools → Application → Cookies*, o cookie de refresh é gravado para o domínio do **Netlify**, com `HttpOnly`, `Secure` e `SameSite=Strict`. A documentação do Netlify não detalha o repasse de `Set-Cookie` em *rewrites*; se o cookie não for gravado, use um domínio próprio com subdomínios do mesmo site (por exemplo, `app.` e `api.`), mantendo `SameSite=Strict`.
3. Recarregar a página mantém a sessão (restauração por refresh token).

### 7.4 Limitações do plano gratuito e *rollback*

- Um *Web Service* gratuito do Render é suspenso após 15 minutos sem tráfego e leva cerca de 1 minuto para voltar. O repasse do Netlify tem limite de 26 segundos por requisição, então a **primeira requisição após a suspensão pode falhar**. O frontend trata isso com a tela de "Tentar novamente" na restauração de sessão (RF-FE-001); a segunda tentativa encontra o serviço ativo. Para uso contínuo, utilize uma instância paga.
- Para desfazer um deploy com problema, reimplante um deploy anterior pelos painéis do Render e do Netlify. Atenção: o *rollback* do código **não** desfaz migrations; migrations que removem ou renomeiam colunas devem ser feitas em duas etapas (expandir, depois contrair).

## 8. Regras do backend (Node.js)

As regras abaixo valem para todo serviço de backend. Os IDs (`RNF-BE-xx`) são os mesmos da versão original do documento, para manter a rastreabilidade em commits e PRs. As palavras **DEVE**, **NÃO DEVE**, **DEVERIA** e **PODE** seguem a RFC 2119.

### 8.1 Arquitetura (dentro de cada serviço)

| ID | Requisito |
| --- | --- |
| RNF-BE-01 | Controllers DEVEM ser finos: validam a entrada com o *schema* Zod, chamam o caso de uso e devolvem o DTO. Regra de negócio NÃO DEVE ficar em controller, em middleware nem em repositório. |
| RNF-BE-02 | Linhas do banco NUNCA DEVEM ser devolvidas diretamente na API (`res.json(row)` é proibido). A saída é montada por funções mapeadoras (ex.: `toUsuarioResponse(usuario)`), que escolhem campo a campo e nunca incluem `senhaHash`, `tokenHash` ou similares. |
| RNF-BE-03 | Injeção de dependências DEVE ser explícita, por *factory functions* que recebem as dependências como parâmetro (ex.: `makeLoginUseCase({ usuarioRepository, passwordHasher, tokenService, clock })`). A composição acontece em `app.js`. Casos de uso e controllers NÃO DEVEM importar a instância do Knex nem outros *singletons* diretamente; somente `infra/` conhece o Knex. |
| RNF-BE-04 | Fronteiras transacionais (`knex.transaction(async (trx) => { ... })`) ficam na camada `application`. O caso de uso abre a transação e passa o `trx` aos repositórios, que aceitam um executor opcional (`repo.buscarPorEmail(email, trx)`). |
| RNF-BE-05 | Uma feature NÃO DEVE importar arquivos internos (`infra/`, `domain/`) de outra feature. A comunicação é pelo `index.js` público da feature. |

### 8.2 Convenções da API REST

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

### 8.3 Persistência

| ID | Requisito |
| --- | --- |
| RNF-BE-20 | Schema evoluído exclusivamente por migrations Knex em `db/migrations`, criadas com `npm run migrate:make -- <descricao>` (nome gerado: `<timestamp>_<descricao>.js`, em ES Modules, exportando `up` e `down`). Migrations aplicadas NUNCA são editadas: correções entram em uma migration nova. |
| RNF-BE-21 | NADA cria ou altera tabelas fora das migrations: sem `CREATE TABLE` na inicialização da aplicação, sem ferramentas de sincronização automática de schema (como o `sync()` de ORMs). |
| RNF-BE-22 | Tabelas em `snake_case` e no **singular** (ex.: `usuario`). Toda tabela tem `id` (UUID em `BINARY(16)`), `criado_em`, `atualizado_em` (`DATETIME(6)` em UTC) e `versao` (`BIGINT`, controle otimista). A conversão UUID ↔ `BINARY(16)` fica em um helper de `shared/db` (`uuidParaBinario`, `binarioParaUuid`) ou usa `UUID_TO_BIN()`/`BIN_TO_UUID()` do MySQL, nunca espalhada pelo código. Atualizações com controle otimista usam `UPDATE ... SET versao = versao + 1 WHERE id = ? AND versao = ?`; se nenhuma linha for afetada, o caso de uso responde `409`. A conexão do Knex DEVE usar `timezone: 'Z'` (UTC). |
| RNF-BE-23 | Restrições de integridade (`NOT NULL`, `UNIQUE`, chaves estrangeiras, índices em colunas de busca) DEVEM existir no banco (nas migrations), e não apenas na validação Zod. |
| RNF-BE-24 | Dados de seed apenas para desenvolvimento, em `db/seeds`. Todo arquivo de seed DEVE começar recusando a execução quando `NODE_ENV === 'production'`. Nunca em produção. |
| RNF-BE-25 | Na fase de testes, testes de repositório e de integração DEVEM usar MySQL real via Testcontainers (`@testcontainers/mysql`), e não SQLite ou outro banco com dialeto diferente. |

### 8.4 Configuração e ambientes

| ID | Requisito |
| --- | --- |
| RNF-BE-31 | Em desenvolvimento, `shared/config/env.js` carrega o `.env` da raiz do repositório com `dotenv` (`path: '../.env'`), **somente** quando `NODE_ENV !== 'production'`; nos demais ambientes as variáveis vêm do ambiente. As variáveis são as documentadas em `.env.example`. A aplicação DEVE escutar em `process.env.PORT ?? 8080`. Nenhum outro módulo lê `process.env` diretamente: todos importam o objeto de configuração já validado. |
| RNF-BE-32 | A aplicação DEVE falhar na inicialização (*fail fast*) se uma variável obrigatória estiver ausente ou inválida: `env.js` valida `process.env` com um *schema* Zod e, em caso de erro, registra quais variáveis falharam (sem os valores) e encerra com `process.exit(1)`. Exemplo: `JWT_SECRET` com menos de 32 bytes. |

### 8.5 Segurança, observabilidade e qualidade

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

### RF-BE-001 — Autenticação de usuário (login) (Node.js)

> **Serviço:** Núcleo (`meunegocio360-back`), emissor de identidade.  
> **Consumido por:** `RF-FE-001` e por todos os requisitos seguintes (que passam a exigir autenticação).

As **regras de negócio, o contrato da API, o cookie, os erros, o modelo de dados e os critérios de aceite são os mesmos da versão original** do requisito; estão resumidos aqui para que este documento seja autossuficiente. Mudam apenas as decisões técnicas da implementação.

#### História de usuário

Como **usuário cadastrado do sistema**, quero **entrar com meu e-mail e minha senha e continuar autenticado sem precisar entrar de novo a cada recarregamento da página**, para **acessar as funcionalidades protegidas do MeuNegocio360 de forma segura e prática**.

#### Escopo

**Dentro do escopo:** tabelas de usuário e de refresh token, *seed* de desenvolvimento, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`, emissão e validação de JWT de acesso, refresh token rotativo com detecção de reuso, proteção *deny-by-default* dos demais endpoints, bloqueio temporário por tentativas falhas, tratamento padronizado de erros, `/health` e Swagger.

**Fora do escopo:** cadastro/edição de usuários, recuperação e troca de senha, MFA, login social, autorização granular por perfil (somente o papel é gravado no token), limitação de requisições por IP, validação dos tokens por outros serviços (RS256/JWKS).

#### Dependências introduzidas

Base já presente no `package.json`: `express`, `mysql2`, `zod`, `cors`, `jsonwebtoken`, `bcrypt`, `dotenv`, `swagger-jsdoc`, `swagger-ui-express`. Este requisito introduz:

| Dependência | Tipo | Para quê |
| --- | --- | --- |
| `knex` | produção | Migrations, seeds e acesso ao MySQL (RNF-BE-20) |
| `cookie-parser` | produção | Leitura do cookie de refresh |
| `helmet` | produção | Cabeçalhos de segurança (RNF-BE-41) |
| `pino` e `pino-http` | produção | Logs estruturados e `X-Request-Id` (RNF-BE-43, RNF-BE-44) |
| `eslint`, `@eslint/js`, `globals`, `prettier`, `eslint-config-prettier` | desenvolvimento | Lint e formatação (RNF-BE-45) |
| `pino-pretty` | desenvolvimento (opcional) | Logs legíveis no terminal |

Dependências de teste (Vitest, Supertest, Testcontainers, dependency-cruiser) entram na fase de testes.

#### Regras de negócio

| ID | Regra | Como implementar em Node |
| --- | --- | --- |
| RN-01 | Identificação por **e-mail** (único, sem diferenciar maiúsculas/minúsculas, armazenado em minúsculas, com *trim*) e **senha**. | No *schema* Zod: `email: z.string().trim().toLowerCase().pipe(z.email())`. |
| RN-02 | Somente usuários **ativos** autenticam e renovam sessão. | Verificado no caso de uso, não no repositório. |
| RN-03 | Credenciais inválidas (e-mail inexistente, senha incorreta ou usuário inativo) retornam **a mesma resposta** `401`. O tempo de resposta também DEVE ser equivalente. | Para e-mail inexistente, executar `bcrypt.compare(senha, HASH_FICTICIO)`, com um hash gerado uma vez na inicialização e com o mesmo custo. |
| RN-04 | Após **5 falhas consecutivas**, a conta fica **bloqueada por 15 minutos** (`429`, com `Retry-After`). Login bem-sucedido zera o contador. Configurável por `APP_AUTH_MAX_TENTATIVAS` e `APP_AUTH_BLOQUEIO_MINUTOS`. | Incremento atômico no banco (`UPDATE usuario SET tentativas_falhas = tentativas_falhas + 1 ...`) dentro de transação com `.forUpdate()` na leitura do usuário, para evitar condição de corrida. |
| RN-05 | **Token de acesso** JWT assinado, validade padrão de **15 minutos** (`APP_AUTH_JWT_EXPIRACAO_MINUTOS`), devolvido no corpo e **nunca** em cookie. | Ver "Token de acesso" abaixo. |
| RN-06 | **Refresh token** opaco e aleatório (mínimo de 256 bits, Base64 URL-safe), validade padrão de **7 dias** (`APP_AUTH_REFRESH_EXPIRACAO_DIAS`), entregue **somente** em cookie `HttpOnly`. | `crypto.randomBytes(32).toString('base64url')` (módulo nativo `node:crypto`). Nunca `Math.random()`. |
| RN-07 | Refresh token **rotativo**: cada uso válido revoga o token apresentado e emite um novo, na mesma *família* (`familia_id`), junto com um novo token de acesso. | Tudo dentro de **uma** `knex.transaction`, com `SELECT ... FOR UPDATE` (`.forUpdate()`) na linha do token, para que duas renovações simultâneas não gerem dois tokens válidos. |
| RN-08 | **Detecção de reuso:** token já revogado apresentado de novo revoga toda a família e responde `401`. | `UPDATE refresh_token SET revogado_em = ? WHERE familia_id = ? AND revogado_em IS NULL`. |
| RN-09 | No banco, apenas o **hash SHA-256** do refresh token. | `crypto.createHash('sha256').update(token).digest('hex')`. |
| RN-10 | `/auth/logout` revoga a família e limpa o cookie. **Idempotente**: sempre `204`. | `res.clearCookie('mn360_refresh', { ...mesmasOpcoes })` (mesmos `path`, `sameSite`, `secure` e `httpOnly`, sem `maxAge`), senão o navegador não apaga o cookie. |
| RN-11 | Senha no login: mínimo de 8 e máximo de 72 caracteres (limite do BCrypt). | `senha: z.string().min(8).max(72)`. |
| RN-12 | `ultimo_login_em` registrado no login; o refresh NÃO altera esse campo. | — |
| RN-13 | Desativar ou bloquear um usuário revoga as suas famílias ativas e impede novas renovações. | O refresh também verifica `ativo` e `bloqueado_ate` do usuário. |

A hora atual vem sempre de um `clock` injetado (`{ now: () => new Date() }`), nunca de `new Date()`/`Date.now()` espalhados pelo código, para que bloqueio, expiração e limpeza sejam testáveis.

#### Contrato da API

Todos os caminhos são relativos a `/api/v1`.

**`POST /auth/login`** (público). Requisição: `{ "email": "admin@meunegocio360.com.br", "senha": "********" }`. Resposta `200 OK`, com o cookie de refresh em `Set-Cookie`:

```json
{
  "tokenType": "Bearer",
  "accessToken": "eyJhbGciOi...",
  "expiresIn": 900,
  "usuario": {
    "id": "0b6c6a8e-3a1f-4a4b-9a64-2d0f1c3f6b11",
    "nome": "Administrador",
    "email": "admin@meunegocio360.com.br",
    "perfil": "ADMIN"
  }
}
```

**`POST /auth/refresh`** (público, exige o cookie). Sem corpo. Resposta `200 OK` no **mesmo formato do login** e um **novo** cookie.

**`POST /auth/logout`** (público, usa o cookie). Sem corpo. Resposta `204 No Content`, com `Set-Cookie` que expira o cookie.

**`GET /auth/me`** (autenticado, `Authorization: Bearer <accessToken>`). Resposta `200 OK`: o objeto `usuario`.

**Cookie de refresh**, emitido com `res.cookie('mn360_refresh', token, opcoes)`:

| Atributo | Valor | Opção no Express |
| --- | --- | --- |
| Nome | `mn360_refresh` | — |
| `HttpOnly` | Sempre | `httpOnly: true` |
| `Secure` | Sim; `false` apenas em desenvolvimento local em HTTP | `secure: config.auth.cookieSecure` (de `APP_AUTH_COOKIE_SECURE`) |
| `SameSite` | `Strict` | `sameSite: 'strict'` |
| `Path` | `/api/v1/auth` | `path: '/api/v1/auth'` |
| `Max-Age` | Igual à validade do refresh token | `maxAge` em **milissegundos** (`dias * 24 * 60 * 60 * 1000`) |

`/auth/refresh` e `/auth/logout` DEVEM rejeitar com `403` (`code: "ORIGIN_NOT_ALLOWED"`) requisições cujo cabeçalho `Origin` esteja presente e fora de `CORS_ALLOWED_ORIGINS`, **antes** de tocar no banco.

**Erros** (todos em `application/problem+json`):

| Status | `code` | Endpoint | Quando |
| --- | --- | --- | --- |
| 400 | `VALIDATION_ERROR` | login | JSON malformado, e-mail inválido, campo ausente ou fora dos limites (com a lista `errors`). |
| 401 | `INVALID_CREDENTIALS` | login | Credenciais inválidas ou usuário inativo ("E-mail ou senha inválidos."). |
| 401 | `INVALID_REFRESH_TOKEN` | refresh | Cookie ausente, desconhecido, expirado, revogado (reuso), ou usuário inativo/bloqueado. O cookie é limpo na resposta. |
| 401 | `UNAUTHORIZED` | me e demais protegidos | Token de acesso ausente, inválido ou expirado; inclui `WWW-Authenticate: Bearer`. |
| 403 | `ORIGIN_NOT_ALLOWED` | refresh, logout | `Origin` não permitido. |
| 429 | `ACCOUNT_TEMPORARILY_LOCKED` | login | Bloqueio por tentativas excedidas; inclui `Retry-After` em segundos. |
| 500 | `INTERNAL_ERROR` | todos | Erro inesperado, sem detalhes internos. |

#### Token de acesso (JWT)

| Item | Definição |
| --- | --- |
| Biblioteca | `jsonwebtoken`. |
| Emissão | `jwt.sign({ perfil }, config.jwtSecret, { algorithm: 'HS256', issuer: 'meunegocio360-core', subject: usuario.id, jwtid: crypto.randomUUID(), expiresIn: minutos * 60 })` (o `iat` é incluído automaticamente). |
| Validação | `jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], issuer: 'meunegocio360-core' })`. A lista `algorithms` é **obrigatória**: é ela que rejeita `alg: none` e outros algoritmos. `jwt.decode()` NUNCA é usado para autenticar. |
| Segredo | `JWT_SECRET` com pelo menos 32 bytes, validado na inicialização (RNF-BE-32). |
| Conteúdo | Claims `iss`, `sub`, `iat`, `exp`, `jti` e `perfil`. NÃO DEVE conter senha, *hash* nem dados pessoais além do necessário. |

O middleware de autenticação lê `Authorization: Bearer <token>`, valida e grava `req.usuario = { id, perfil }`. Qualquer falha vira `401 UNAUTHORIZED` com `WWW-Authenticate: Bearer`.

#### Modelo de dados

Migration `<timestamp>_criar_tabela_usuario.js`:

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `BINARY(16)` (UUID) | PK |
| `nome` | `VARCHAR(120)` | `NOT NULL` |
| `email` | `VARCHAR(160)` | `NOT NULL`, `UNIQUE` |
| `senha_hash` | `VARCHAR(60)` | `NOT NULL` (BCrypt, formato `$2b$...`, custo ≥ 12) |
| `perfil` | `VARCHAR(20)` | `NOT NULL` (`ADMIN`, `USUARIO`) |
| `ativo` | `BOOLEAN` | `NOT NULL`, padrão `TRUE` |
| `tentativas_falhas` | `INT` | `NOT NULL`, padrão `0` |
| `bloqueado_ate` | `DATETIME(6)` | nulo (UTC) |
| `ultimo_login_em` | `DATETIME(6)` | nulo (UTC) |
| `criado_em`, `atualizado_em` | `DATETIME(6)` | `NOT NULL` (UTC) |
| `versao` | `BIGINT` | `NOT NULL`, padrão `0` (controle otimista) |

Migration `<timestamp>_criar_tabela_refresh_token.js`:

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `BINARY(16)` (UUID) | PK |
| `usuario_id` | `BINARY(16)` | `NOT NULL`, FK para `usuario`, indexada |
| `familia_id` | `BINARY(16)` | `NOT NULL`, indexada |
| `token_hash` | `CHAR(64)` | `NOT NULL`, `UNIQUE` (SHA-256 em hexadecimal) |
| `expira_em` | `DATETIME(6)` | `NOT NULL` (UTC) |
| `revogado_em` | `DATETIME(6)` | nulo (UTC) |
| `criado_em` | `DATETIME(6)` | `NOT NULL` (UTC) |

No Knex, `BINARY(16)` é declarado com `table.binary('id', 16)` e `DATETIME(6)` com `table.datetime('criado_em', { precision: 6 })`.

Tokens expirados ou revogados há mais de 30 dias DEVEM ser removidos por uma rotina periódica: um job em `auth/infra` iniciado por `server.js` com `setInterval(limpar, intervalo).unref()` (o `unref()` não impede o processo de encerrar). Não registrar IP nem *user-agent*.

**Seed de desenvolvimento** (`db/seeds/01_usuarios_dev.js`): um usuário `ADMIN` e um `USUARIO`, com e-mails fictícios e senhas lidas de `SEED_ADMIN_SENHA` e `SEED_USUARIO_SENHA` (hash gerado com `bcrypt.hash` na hora). O seed recusa rodar em produção e falha com mensagem clara se as variáveis estiverem vazias. Senhas de seed NÃO DEVEM ser gravadas em texto no repositório.

#### Critérios de aceite

```gherkin
Cenário: Login com credenciais válidas
  Dado um usuário ativo com e-mail "admin@meunegocio360.com.br" e senha válida
  Quando envia POST /api/v1/auth/login com essas credenciais
  Então recebe 200 com accessToken JWT, tokenType "Bearer" e expiresIn 900
  E o token contém sub, perfil, iss, iat, exp e jti
  E recebe o cookie mn360_refresh com HttpOnly, SameSite=Strict e Path=/api/v1/auth
  E o refresh token não aparece no corpo da resposta
  E o banco guarda apenas o hash do refresh token
  E o contador de tentativas falhas é zerado e ultimo_login_em é atualizado

Cenário: Senha incorreta
  Dado um usuário ativo
  Quando envia a senha errada
  Então recebe 401 com code "INVALID_CREDENTIALS" e a mensagem genérica
  E o contador de tentativas falhas é incrementado
  E nenhum cookie é emitido

Cenário: E-mail inexistente
  Quando envia um e-mail que não existe
  Então recebe exatamente a mesma resposta 401 do cenário de senha incorreta

Cenário: Usuário inativo
  Dado um usuário com ativo = false e senha correta
  Quando tenta autenticar
  Então recebe a mesma resposta 401 genérica

Cenário: Bloqueio por tentativas excessivas
  Dado um usuário com 4 falhas consecutivas
  Quando erra a senha pela quinta vez
  Então a conta é bloqueada por 15 minutos
  E qualquer tentativa seguinte, mesmo com a senha correta, recebe 429 "ACCOUNT_TEMPORARILY_LOCKED" com Retry-After
  E, passado o período de bloqueio, o login com a senha correta volta a funcionar

Cenário: Entrada inválida
  Quando envia e-mail malformado, senha vazia ou corpo ausente
  Então recebe 400 "VALIDATION_ERROR" com a lista de campos inválidos

Cenário: Renovação de sessão
  Dado que fiz login e tenho o cookie de refresh
  Quando envio POST /api/v1/auth/refresh
  Então recebo 200 com novo accessToken, o objeto usuario e um novo cookie
  E o refresh token anterior fica revogado e o novo pertence à mesma família

Cenário: Refresh sem cookie, expirado ou desconhecido
  Quando envio POST /api/v1/auth/refresh sem cookie, com token expirado ou inexistente
  Então recebo 401 "INVALID_REFRESH_TOKEN" e o cookie é limpo

Cenário: Detecção de reuso de refresh token
  Dado um refresh token que já foi rotacionado (revogado)
  Quando ele é apresentado novamente
  Então recebo 401 "INVALID_REFRESH_TOKEN"
  E toda a família é revogada, inclusive o token mais recente

Cenário: Usuário desativado durante a sessão
  Dado um usuário com sessão ativa
  Quando ele é desativado
  Então POST /auth/refresh retorna 401 "INVALID_REFRESH_TOKEN"

Cenário: Logout
  Dado que tenho uma sessão ativa
  Quando envio POST /api/v1/auth/logout com o cookie
  Então recebo 204 e o cookie é expirado
  E o refresh token não pode mais ser usado
  E chamar logout novamente, ou sem cookie, também retorna 204

Cenário: Origem não permitida
  Quando POST /auth/refresh ou /auth/logout chega com Origin fora da lista permitida
  Então recebo 403 "ORIGIN_NOT_ALLOWED" e nenhum token é rotacionado

Cenário: Acesso a endpoint protegido
  Quando chama GET /api/v1/auth/me sem token, com token expirado, adulterado ou assinado por outra chave
  Então recebe 401 em formato problem+json
  E com um token válido recebe 200 com os dados do usuário autenticado

Cenário: Endpoints desconhecidos ou não liberados
  Quando chama qualquer outro endpoint sem token
  Então recebe 401 (deny-by-default)
```

#### Testes previstos

Implementados na fase de testes. Até lá, os critérios de aceite são verificados manualmente.

- **Unitários** (Vitest, sem Express nem banco): casos de uso de login, refresh e logout (sucesso, senha errada, usuário inexistente, inativo, bloqueio e desbloqueio por tempo, rotação, expiração, reuso e revogação de família), com repositórios falsos e `clock` controlado; emissão e validação do JWT (expirado, adulterado, `alg` errado, `alg: none`).
- **HTTP** (Supertest sobre o `app`): contrato de todos os endpoints, atributos do cookie, formato `problem+json`, cabeçalhos `Retry-After`, `WWW-Authenticate` e `X-Request-Id`, verificação de `Origin`.
- **Integração** (Testcontainers MySQL + migrations Knex): migrations aplicam-se do zero, unicidade de e-mail e de `token_hash`, fluxo completo login → `me` → refresh → logout, reuso de token.
- **Segurança:** mesma resposta (corpo e status) para e-mail inexistente e senha incorreta; endpoint arbitrário sem token retorna 401; o refresh token nunca é gravado em claro no banco nem aparece em logs.
- **Concorrência:** duas renovações simultâneas (`Promise.all`) com o mesmo refresh token não podem produzir dois tokens válidos.
- **Arquitetura:** regras de camadas da feature `auth` com `dependency-cruiser`.

#### Pontos de atenção ao revisar código gerado por IA

Assistentes de IA costumam errar justamente aqui. Verifique, um a um:

- Mensagens ou status diferentes para "e-mail não existe" e "senha errada", ou retorno antecipado sem o `bcrypt.compare` fictício (diferença de tempo permite enumeração de usuários).
- `JWT_SECRET` *hardcoded*, fraco, com valor padrão (`process.env.JWT_SECRET || 'segredo'`) ou sem validação de tamanho na inicialização.
- `jwt.verify` sem a opção `algorithms`, sem `issuer`, ou uso de `jwt.decode` para autenticar.
- Refresh token devolvido no corpo, gravado em claro no banco, gerado com `Math.random()`/`uuid`, ou cookie sem `httpOnly`/`sameSite: 'strict'`/`path` restrito; `maxAge` informado em segundos (o Express espera milissegundos).
- `res.clearCookie` sem as mesmas opções de `path`/`sameSite`/`secure` usadas na criação (o cookie não é apagado).
- Refresh token **sem rotação** ou sem detecção de reuso; rotação fora de `knex.transaction` ou sem `.forUpdate()` (dois usos simultâneos gerando dois tokens válidos).
- Logout que apenas apaga o cookie sem revogar no servidor.
- `cors()` sem opções, `origin: '*'` ou `origin: true` junto com `credentials: true`; verificação de `Origin` ausente em `/auth/refresh`.
- `console.log` de `req.body`, de cabeçalhos ou do usuário; logger sem `redact`; e-mail completo nos logs.
- `res.json(usuario)` com a linha do banco (expõe `senha_hash`); `SELECT *` sem mapear a saída.
- Comparação de senha com `===` ou hash com MD5/SHA sem *salt* (SHA-256 só é adequado para o refresh token, que já é aleatório e de alta entropia); uso de `bcryptjs` ou outra biblioteca no lugar da prevista.
- Rotas registradas **antes** do middleware de autenticação ou fora do router protegido; `app.use(authMiddleware)` com exceções por `startsWith('/api')` amplas demais; Swagger exposto em produção.
- Middleware de erro com 3 parâmetros (o Express só o reconhece com 4: `err, req, res, next`) ou registrado antes das rotas; `stack` do erro devolvido ao cliente.
- SQL montado por concatenação de *strings* (``knex.raw(`... ${email}`)``) em vez de *bindings* (`knex.raw('... ?', [email])`).
- Contador de tentativas com condição de corrida (ler, somar em JS e gravar), ou `new Date()` espalhado pelo código.
- Uso de APIs que não existem na versão instalada (por exemplo, sintaxe do Express 4 como `app.del` ou `req.param()`, ou opções inventadas do Knex). Confira na documentação da versão do `package.json`.
- Testes que apenas verificam `status === 200`, sem validar o conteúdo do token, o cookie e os efeitos no banco.

#### Extensões opcionais (desafios)

1. Tolerância curta (por exemplo, 10 s) para renovações simultâneas legítimas feitas por abas diferentes, sem abrir mão da detecção de reuso.
2. Listagem e revogação de sessões ativas do usuário.
3. Limite de requisições por IP (por exemplo, `express-rate-limit`) em `/auth/login`.
4. Auditoria de eventos de autenticação em tabela própria.
5. Troca do algoritmo para RS256 com publicação de JWKS (`/.well-known/jwks.json`), usando a biblioteca `jose`.

## 9. Documentação

| Documento | Conteúdo |
| --- | --- |
| [`docs/requisitos-gerais.md`](./docs/requisitos-gerais.md) | Visão geral e requisitos válidos para todo o projeto. |
| [`docs/requisitos-back.md`](./docs/requisitos-back.md) | Requisitos do backend. As regras detalhadas de Node.js estão na [seção 8](#8-regras-do-backend-nodejs) deste README. |
| [`docs/requisitos-front.md`](./docs/requisitos-front.md) | Requisitos do frontend (paleta, fontes, telas). |
| [`AGENTS.md`](./AGENTS.md) | Instruções para assistentes de IA que trabalham no repositório. |
| [`docs/adr/`](./docs/adr) | Registro das decisões de arquitetura (ADRs). |

---

## Apêndice: mudanças em relação à versão Java

### A.1 Equivalências

| Versão Java (Spring Boot) | Versão Node.js |
| --- | --- |
| Spring MVC (`@RestController`) | Express 5 (`express.Router()`) |
| DTO `record` + Bean Validation | *Schema* Zod (entrada) + função mapeadora (saída) |
| Injeção por construtor (`@Autowired` proibido em campo) | *Factory functions* com dependências por parâmetro, compostas em `app.js` |
| `@Transactional` na camada `application` | `knex.transaction(async (trx) => ...)` na camada `application` |
| Entidade JPA + Spring Data | Repositório com Knex em `infra/` |
| `@Version` | Coluna `versao` + `UPDATE ... WHERE versao = ?` |
| Flyway (`V1__descricao.sql`) | Migrations Knex (`<timestamp>_descricao.js`) |
| `ddl-auto: validate` | Nenhuma criação de schema fora das migrations |
| `@RestControllerAdvice` | Middleware de erro único `(err, req, res, next)` |
| `SecurityFilterChain` + `anyRequest().authenticated()` | Middleware de autenticação aplicado ao router `/api/v1`, com lista explícita de rotas públicas |
| `oauth2-resource-server` / `JwtEncoder` | `jsonwebtoken` (`sign` / `verify` com `algorithms`) |
| `PasswordEncoder` BCrypt (`{bcrypt}...`) | `bcrypt` (`$2b$...`) |
| `SecureRandom` | `crypto.randomBytes` |
| `@Scheduled` | `setInterval(...).unref()` iniciado em `server.js` |
| `Clock` injetável | Objeto `clock` injetado (`{ now: () => new Date() }`) |
| MDC + logs estruturados do Spring Boot | `AsyncLocalStorage` + `pino`/`pino-http` |
| Headers do Spring Security | `helmet` |
| `CorsConfigurationSource` | Pacote `cors`, configurado uma vez |
| Actuator `/actuator/health` | Rota `GET /health` (sem autenticação, sem detalhes) |
| springdoc (`/swagger-ui.html`) | swagger-jsdoc + swagger-ui-express (`/api-docs`, fora de produção) |
| `application-dev.yaml` + `spring.config.import` | `shared/config/env.js` com `dotenv` + validação Zod |
| Perfis `dev`/`prod` (`SPRING_PROFILES_ACTIVE`) | `NODE_ENV` (`development`/`production`/`test`) |
| `./mvnw verify` + Spotless | `npm run lint && npm run format:check` (ESLint + Prettier) |
| JUnit 5, Mockito, MockMvc, Testcontainers, JaCoCo, ArchUnit | Vitest, Supertest, Testcontainers, `@vitest/coverage-v8`, dependency-cruiser |
| Dockerfile `eclipse-temurin` | Dockerfile `node:24-alpine` |

### A.2 Ajustes no `meunegocio360-back/package.json`

O `package.json` atual foi criado com Sequelize e TypeScript, que não fazem parte desta stack.

**Remover:** `sequelize`, `typescript`, `tsx`, `@types/bcrypt`, `@types/cors`, `@types/express`, `@types/jsonwebtoken`, `@types/node`, `@types/swagger-jsdoc`, `@types/swagger-ui-express`.

```bash
cd meunegocio360-back
npm uninstall sequelize typescript tsx @types/bcrypt @types/cors @types/express @types/jsonwebtoken @types/node @types/swagger-jsdoc @types/swagger-ui-express
npm install knex cookie-parser helmet pino pino-http
npm install -D eslint @eslint/js globals prettier eslint-config-prettier pino-pretty
```

**Ajustar campos e scripts:**

```json
{
  "name": "meunegocio360-back",
  "private": true,
  "type": "module",
  "main": "src/server.js",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "migrate": "knex migrate:latest",
    "migrate:rollback": "knex migrate:rollback",
    "migrate:make": "knex migrate:make",
    "seed": "knex seed:run",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

Os comandos `knex` leem o `knexfile.js`, que importa `src/shared/config/env.js`; por isso o `.env` da raiz é carregado também nas migrations e nos seeds. O `knexfile.js` DEVE definir `migrations: { directory: './db/migrations', extension: 'js' }`, `seeds: { directory: './db/seeds' }` e `connection.timezone: 'Z'`.

### A.3 `.env.example` sugerido (raiz do repositório)

```dotenv
# MeuNegocio360 - variáveis de ambiente do backend e do docker compose
# 1. Copie este arquivo:   cp .env.example .env
# 2. Preencha os valores marcados como OBRIGATÓRIO (campos vazios de propósito).
# 3. NUNCA versione o arquivo .env nem cole seu conteúdo em prompts de IA.

# Ambiente: development | production | test
NODE_ENV=development
# Porta HTTP da API (o Render define PORT automaticamente)
PORT=8080
# Nível de log do pino: debug | info | warn | error
LOG_LEVEL=info

# Banco de dados do Núcleo (usado pelo compose.yaml e pela aplicação)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=meunegocio360_core
DB_USER=meunegocio360
# OBRIGATÓRIO: senha do usuário da aplicação
DB_PASSWORD=
# OBRIGATÓRIO: senha do root do MySQL (somente para o contêiner local)
MYSQL_ROOT_PASSWORD=

# Segurança (RF-BE-001)
# OBRIGATÓRIO: segredo do JWT, mínimo de 32 bytes. Gere com: openssl rand -base64 48
JWT_SECRET=
# Origens do frontend permitidas, separadas por vírgula. Nunca use *.
CORS_ALLOWED_ORIGINS=http://localhost:5173
# Cookie do refresh token: "false" somente em desenvolvimento local em HTTP.
APP_AUTH_COOKIE_SECURE=true

# Opcionais, com os padrões do RF-BE-001:
# APP_AUTH_MAX_TENTATIVAS=5
# APP_AUTH_BLOQUEIO_MINUTOS=15
# APP_AUTH_JWT_EXPIRACAO_MINUTOS=15
# APP_AUTH_REFRESH_EXPIRACAO_DIAS=7

# Seed de desenvolvimento (somente NODE_ENV=development; NUNCA em produção)
SEED_ADMIN_SENHA=
SEED_USUARIO_SENHA=
```

O `compose.yaml` do MySQL é o mesmo da versão Java, trocando `CORE_DB_NAME` por `DB_NAME` e `CORE_DB_PORT` por `DB_PORT`. No `.gitignore`, `target/` sai e ficam `node_modules/`, `dist/`, `.env` e `.env.*` (com `!.env.example`).
