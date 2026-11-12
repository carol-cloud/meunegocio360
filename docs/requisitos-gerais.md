# MeuNegocio360 — Requisitos Gerais

| | |
| --- | --- |
| **Versão** | 1.0 |
| **Atualizado em** | 12/11/2026 |
| **Aplica-se a** | Todos os serviços de backend (`meunegocio360-*`, em Node.js) e ao frontend (`meunegocio360-js`) |
| **Documentos relacionados** | [`requisitos-back.md`](./requisitos-back.md) · [`requisitos-front.md`](./requisitos-front.md) |
| **Origem** | Adaptação para Node.js do `requisitos-gerais.md` (versão 2.1) do projeto de referência, conforme o [ADR 0001](./adr/0001-backend-em-nodejs.md). Os IDs foram mantidos para rastreabilidade. |

## 1. Como ler este documento

Este documento reúne a **visão geral do sistema**, os **requisitos não funcionais (RNF) válidos para todo o projeto** e o **índice dos requisitos funcionais (RF)**. Os documentos de backend e frontend herdam tudo o que está aqui e acrescentam apenas o que é específico de cada camada.

Arquitetura detalhada, stack, estrutura do repositório, comandos, fluxo de contribuição e implantação estão no [`README.md`](../README.md) e não são repetidos aqui.

Convenções de leitura:

- As palavras **DEVE**, **NÃO DEVE**, **DEVERIA** e **PODE** seguem o sentido da RFC 2119: *DEVE* é obrigatório, *DEVERIA* é fortemente recomendado (desvios exigem justificativa no *Pull Request* - PR) e *PODE* é opcional.
- Cada requisito tem um identificador estável e rastreável: `RNF-xxx` (não funcionais, válidos em todo o projeto), `RNF-BE-xx` e `RNF-FE-xx` (não funcionais de cada camada), `RF-BE-xxx` (funcional de backend) e `RF-FE-xxx` (funcional de frontend). Commits, PRs e documentação **DEVEM** citar o ID do requisito atendido.
- O `package.json` de cada pasta (`meunegocio360-back`, `meunegocio360-js` e futuros serviços) é a fonte da verdade para versões de bibliotecas.

### 1.1 Visão geral: arquitetura do sistema

| Módulo      | Objetivo             | Funcionalidades                                                                                                                 |
| ----------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Núcleo      | Base empresarial     | Gestão de usuários, clientes, fornecedores, produtos, serviços, vendas, contas a pagar e a receber, fluxo de caixa e dashboard. |
| Serviços    | Operação de serviços | Gestão de técnicos, equipamentos, solicitações, ordens de serviço (OS), execução, evidências, aceite e faturamento das OS.      |
| Suprimentos | Estoque e compras    | Movimentações, estoque mínimo, inventário, compras, reposição, curva ABC, giro e alertas.                                       |

Cada módulo é um microsserviço em Node.js (Express 5 + Knex + MySQL), consumido por um único frontend em React. Hoje existem o Núcleo (`meunegocio360-back`) e o frontend (`meunegocio360-js`).

## 2. Requisitos funcionais

| ID | Camada | Título | Documento |
| --- | --- | --- | --- |
| RF-BE-001 | Backend (Núcleo) | Autenticação de usuário (login) e sessão com refresh token | [`requisitos-back.md`](./requisitos-back.md#rf-be-001--autenticação-de-usuário-login) |
| RF-FE-001 | Frontend | Fluxo de login do usuário, com persistência de sessão | [`requisitos-front.md`](./requisitos-front.md#rf-fe-001--fluxo-de-login-do-usuário) |

Novos requisitos DEVEM ser acrescentados a esta tabela e ao documento de sua camada.

### 2.1 Escopo de um requisito funcional

Cada RF é entregue de ponta a ponta (especificação, implementação, verificação dos critérios de aceite) e DEVE explicitar o que está **dentro** e **fora** de seu escopo, as dependências que introduz (RNF-015) e as regras de negócio aplicáveis.

### 2.2 Template de requisito

Todo novo requisito DEVE usar esta estrutura, para que a IA e as pessoas recebam a mesma informação:

```markdown
## RF-<BE|FE>-NNN — <Título curto>

**História de usuário:** Como <perfil>, quero <ação>, para <benefício>.

**Contexto e dependências:** <o que já existe; requisitos dos quais depende>

**Escopo:** <dentro do escopo / fora do escopo>

**Regras de negócio:** RN-01 …, RN-02 …

**Contrato / Interface:** <endpoints e payloads (BE) ou telas e fluxos (FE)>

**Modelo de dados / Estado:** <tabelas e migrations Knex (BE) ou estado e rotas (FE)>

**Critérios de aceite (Gherkin):**
Cenário: …
  Dado …
  Quando …
  Então …

**Dependências introduzidas:** <pacotes npm e ferramentas que este requisito traz>

**Requisitos não funcionais com destaque:** RNF-0xx, RNF-0yy

**Testes previstos:** <lista objetiva, implementada na fase de testes>

**Pontos de atenção ao revisar código gerado por IA:** <armadilhas conhecidas>

**Extensões opcionais:** <desafios que NÃO fazem parte do requisito>
```

## 3. Requisitos não funcionais (válidos para todo o projeto)

Os requisitos desta seção são **aplicados progressivamente**: valem desde o início, exceto os que dependem de ferramentas ainda não introduzidas (RNF-016).

### 3.1 Arquitetura e qualidade de código

| ID | Requisito | Como verificar |
| --- | --- | --- |
| RNF-010 | O código DEVE seguir arquitetura em camadas com **regra de dependência única**: `api → application → domain`, e `infra` implementa os contratos que o domínio e os casos de uso esperam (por exemplo, um repositório com as funções que o caso de uso recebe por injeção). Nenhuma camada interna importa uma externa: `domain/` não conhece Express nem Knex. | Revisão de PR (e regra do `dependency-cruiser`, na fase de testes). |
| RNF-011 | Cada funcionalidade DEVE ser agrupada em sua própria pasta (*package by feature*, ex.: `src/auth/`, `src/clientes/`), e não por tipo técnico global (`controllers/`, `models/`). | Revisão de PR. |
| RNF-012 | Código DEVE seguir princípios SOLID e *Clean Code*: nomes em português de domínio ou inglês técnico, de forma consistente; funções curtas; sem duplicação relevante; sem código comentado; sem `console.log` esquecido. | ESLint e revisão. |
| RNF-013 | Todo código gerado por IA DEVE ser **lido, entendido e revisado** por quem o submete. O autor do PR responde pelo código, independentemente de quem o escreveu. | Checklist do PR. |
| RNF-014 | Dependências novas DEVEM ser justificadas no PR (necessidade, licença, manutenção ativa, número de *downloads* e dependências transitivas no npm). A IA NÃO DEVE ser aceita como única justificativa. | Revisão de PR. |

### 3.2 Microsserviços

| ID | Requisito |
| --- | --- |
| RNF-090 | **Um banco de dados por serviço** (*database per service*). Nenhum serviço lê ou escreve nas tabelas de outro, nem existem chaves estrangeiras entre bancos de serviços diferentes. Referências a dados de outro serviço são feitas por identificador (UUID) e consultadas por API. |
| RNF-091 | A comunicação entre serviços é por **contrato versionado**: REST síncrono (OpenAPI) ou eventos assíncronos. A escolha de *broker* e do formato de eventos será registrada em ADR quando surgir a primeira necessidade. |
| RNF-092 | Chamadas a outro serviço (com `fetch` nativo do Node) DEVEM ter *timeout* (`AbortSignal.timeout(...)`), tratamento de falha (e, quando fizer sentido, *retry* com *backoff* e *circuit breaker*) e propagar `X-Request-Id`. Um serviço NÃO DEVE ficar indisponível só porque outro está. |
| RNF-093 | Cada serviço DEVE ser construído, testado e implantado de forma independente (`package.json`, configuração e variáveis próprios) e NÃO DEVE compartilhar código de negócio com outro. Pacotes compartilhados se limitam a contratos (*schemas* Zod/OpenAPI) e utilitários técnicos sem regra de negócio. |
| RNF-094 | O Núcleo é o único serviço que autentica usuários e emite tokens. Os demais serviços apenas **validam** o token de acesso (assinatura via JWKS, emissor, expiração e `perfil`) e nunca recebem nem armazenam senhas. Antes de o primeiro serviço adicional validar tokens, a assinatura DEVE migrar de segredo compartilhado (HS256) para chaves assimétricas (RS256) com publicação de JWKS. |
| RNF-095 | Cada serviço DEVE publicar o próprio OpenAPI, *health check* e logs com o mesmo formato e identificador de correlação (RNF-030, RNF-050, RNF-051). |

### 3.3 Dependências

| ID | Requisito |
| --- | --- |
| RNF-015 | Pacotes e ferramentas são acrescentados ao `package.json` de cada pasta **no requisito que os exige**, e não antecipadamente. O frontend parte da base gerada pelo Vite; o backend parte de um `package.json` vazio (`npm init`), criado no RF-BE-001. Cada requisito lista, em "Dependências introduzidas", o que traz consigo. O `package-lock.json` DEVE ser versionado. |
| RNF-016 | Requisitos não funcionais que dependem de uma ferramenta ainda não introduzida (por exemplo, testes automatizados, cobertura ou verificação automática de acessibilidade) passam a ser exigíveis **a partir do requisito ou da fase que introduz a ferramenta**. Os demais valem desde o início. |

### 3.4 Segurança e privacidade

Referência: **OWASP ASVS nível 1** e **OWASP Top 10**.

| ID | Requisito | Como verificar |
| --- | --- | --- |
| RNF-005 | O repositório NÃO DEVE conter segredos, credenciais, dumps de dados reais, `node_modules/` nem `dist/`. O `.gitignore` DEVE cobrir esses itens e todo arquivo `.env*`, exceto `.env.example`. | Revisão do *diff*. |
| RNF-020 | Toda entrada externa DEVE ser validada no servidor (tipo, tamanho, formato), com *schemas* Zod. Validação no frontend é apenas experiência de uso. | Verificação dos critérios de aceite. |
| RNF-021 | Endpoints DEVEM ser **negados por padrão**; só são públicos os explicitamente liberados. | Verificação dos critérios de aceite. |
| RNF-022 | Segredos (chaves JWT, senhas de banco, tokens) DEVEM vir de variáveis de ambiente ou dos painéis do provedor de implantação. NUNCA do código, de arquivos versionados ou de prompts enviados à IA. | Revisão do *diff*. |
| RNF-023 | Senhas DEVEM ser armazenadas apenas como *hash* adaptativo com *salt* (pacote `bcrypt`, custo ≥ 12). NÃO DEVEM aparecer em logs, respostas, erros ou testes versionados com valores reais. | Revisão. |
| RNF-024 | Mensagens de erro NÃO DEVEM vazar detalhes internos (*stack trace*, SQL, mensagens do driver MySQL, caminhos de arquivo) nem permitir enumeração de usuários. | Verificação dos critérios de aceite. |
| RNF-025 | Dados pessoais seguem a **LGPD**: coletar o mínimo necessário, não registrar dados pessoais em logs e permitir, no futuro, exclusão/anonimização. | Revisão de modelo de dados e logs. |
| RNF-026 | Dependências DEVEM ser auditadas antes de cada PR com `npm audit`, no backend e no frontend. Vulnerabilidades críticas conhecidas bloqueiam o merge. | Revisão de PR. |

### 3.5 Contrato de API e integração

| ID | Requisito | Como verificar |
| --- | --- | --- |
| RNF-030 | Toda API DEVE ser documentada em OpenAPI (swagger-jsdoc + swagger-ui-express), com exemplos de sucesso e de erro, e disponível em `/api-docs` fora de produção. | Revisão; abertura da UI. |
| RNF-032 | Mudanças incompatíveis no contrato DEVEM gerar nova versão de caminho (`/api/v2`). Mudanças compatíveis (campos opcionais novos) não. | Revisão. |
| RNF-033 | Datas e horas trafegam em **ISO 8601 UTC** (ex.: `2026-11-11T14:30:00Z`, como gera `Date.prototype.toISOString()`); valores monetários como inteiros em centavos ou decimais em *string*, nunca `Number` com casas decimais (o `Number` do JavaScript é ponto flutuante). | Revisão; testes de serialização. |

O formato de erros, a paginação e demais convenções REST estão em [`requisitos-back.md`](./requisitos-back.md#2-convenções-da-api-rest).

### 3.6 Testes e qualidade contínua

Os requisitos de testes automatizados são exigíveis a partir da **fase de testes** do projeto (RNF-016; ver [Contribuições](../README.md#6-contribuições)). Até lá, os critérios de aceite de cada RF são verificados manualmente (Swagger UI, `curl`/Insomnia e navegador) e o resultado é registrado no PR.

| ID | Requisito | Como verificar |
| --- | --- | --- |
| RNF-040 | Todo requisito DEVE ter testes automatizados que cubram seus critérios de aceite. Teste que "só passa" sem validar a regra de negócio NÃO conta. | Revisão de PR. |
| RNF-041 | Seguir a **pirâmide de testes**: muitos unitários, alguns de integração (com MySQL real via Testcontainers no backend e API simulada no frontend), poucos de ponta a ponta. | Estrutura de testes. |
| RNF-042 | Cobertura de linhas do **código novo** DEVERIA ser ≥ 80%. A cobertura é indicador, não objetivo: a qualidade das asserções prevalece. | Relatórios de cobertura (`@vitest/coverage-v8`). |
| RNF-043 | Testes DEVEM ser determinísticos, independentes entre si e executáveis offline (sem depender de serviços externos reais). | Execução local. |

### 3.7 Observabilidade, operação e desempenho

| ID | Requisito | Como verificar |
| --- | --- | --- |
| RNF-050 | Logs DEVERIAM ser estruturados (JSON, com `pino`) fora do ambiente de desenvolvimento, com nível adequado e **identificador de correlação** (`X-Request-Id`) propagado entre frontend e backend. | Inspeção de logs. |
| RNF-051 | O backend DEVE expor *health check* em `GET /health`, sem detalhes sensíveis (apenas `{ "status": "UP" }`). | Verificação manual. |
| RNF-052 | A configuração DEVE seguir *12-factor*: mesmo artefato (imagem Docker) para todos os ambientes, diferenças apenas por variáveis de ambiente, com `NODE_ENV` indicando o ambiente (`development`, `test`, `production`). As variáveis são lidas e validadas em um único módulo de configuração por serviço. | Revisão. |
| RNF-053 | Endpoints de leitura DEVERIAM responder em p95 ≤ 500 ms e o login em p95 ≤ 800 ms (excluindo o custo intencional do hash de senha) em ambiente local com dados de teste. Operações pesadas de CPU NÃO DEVEM bloquear o *event loop* (usar as versões assíncronas, como `bcrypt.hash`/`bcrypt.compare`, nunca as `*Sync`). | Medição manual. |
| RNF-054 | Listagens DEVEM ser **paginadas** no servidor; nunca retornar coleções ilimitadas. | Verificação dos critérios de aceite. |

### 3.8 Usabilidade e acessibilidade

| ID | Requisito | Como verificar |
| --- | --- | --- |
| RNF-060 | A interface DEVE atender **WCAG 2.2 nível AA**: contraste, foco visível, navegação por teclado, rótulos e mensagens associados a campos, alvos de toque adequados. | Auditoria com axe DevTools ou Lighthouse e roteiro manual (automatizada na fase de testes). |
| RNF-061 | A interface DEVE ser responsiva (a partir de 360 px de largura, sem rolagem horizontal) e em **português do Brasil**. | Revisão visual. |
| RNF-062 | Toda tela com dados remotos DEVE tratar explicitamente os estados de **carregamento, vazio, erro e sucesso**. | Verificação dos critérios de aceite. |

### 3.9 Documentação

| ID | Requisito | Como verificar |
| --- | --- | --- |
| RNF-070 | Decisões arquiteturais relevantes DEVEM ser registradas como ADR curto em `docs/adr/NNNN-titulo.md` (contexto, decisão, consequências). | Revisão de PR. |
| RNF-071 | Cada requisito entregue DEVE atualizar o README e o OpenAPI quando alterar como rodar ou como consumir o sistema. | Revisão de PR. |
| RNF-072 | O `README.md` DEVE permitir que um novo desenvolvedor suba o ambiente completo (banco, backend e frontend) em menos de 15 minutos. | Execução do passo a passo. |

### 3.10 Ambiente de desenvolvimento

| ID | Requisito |
| --- | --- |
| RNF-080 | IDE padrão: VS Code, com as extensões ESLint e Prettier e uma de assistente de IA. Versão do Node.js: 24 LTS (mínimo 20), declarada em `engines` no `package.json`. |
| RNF-081 | O ambiente local DEVE subir com `docker compose up -d` (MySQL do Núcleo; cada novo serviço acrescenta seu próprio banco) e variáveis definidas a partir do `.env.example`. O arquivo `.env` NUNCA é versionado. |
| RNF-082 | Formatação automática obrigatória: Prettier + ESLint no backend e no frontend (introduzidos por `RF-BE-001` e `RF-FE-001`, conforme RNF-015). |
| RNF-083 | O arquivo `AGENTS.md` na raiz DEVE orientar os assistentes de IA sobre como trabalhar no projeto e apontar para o README e para estes requisitos, sem repeti-los. |

### 3.11 Implantação

Frontend no Netlify e backend no Render (passo a passo no [`README.md`](../README.md#7-implantação)).

| ID | Requisito |
| --- | --- |
| RNF-100 | Cada serviço de backend DEVE ter um `Dockerfile` *multi-stage* na própria pasta (imagem `node:24-alpine`, dependências instaladas com `npm ci --omit=dev`, execução como usuário `node`, sem privilégios de *root*), que gera a imagem executável sem depender de arquivos fora dela. Um `.dockerignore` DEVE excluir `node_modules` e arquivos `.env*`. |
| RNF-101 | A aplicação DEVE escutar na porta informada pela variável `PORT` (padrão 8080 em desenvolvimento). |
| RNF-102 | Toda configuração de produção DEVE vir de variáveis de ambiente configuradas nos painéis do Netlify e do Render (RNF-022, RNF-052), com `NODE_ENV=production`. Valores de desenvolvimento (como o *seed*) NUNCA são habilitados em produção. As migrations são aplicadas a cada deploy (`knex migrate:latest`), antes de a nova versão receber tráfego. |
| RNF-103 | O frontend DEVE ser um build estático (`npm run build`, saída `dist/`) servido com *fallback* para as rotas da SPA e DEVE chamar a API **sempre por caminho relativo** (`/api/...`, mesma origem do frontend): em desenvolvimento, pelo `server.proxy` do Vite; em produção, por regra de *rewrite* do Netlify para o Render. O cookie de refresh NUNCA DEVE exigir `SameSite=None`. |
| RNF-104 | O backend DEVE responder a `GET /health` sem autenticação e sem detalhes (RNF-051), para o *health check* do Render. |
| RNF-105 | O ambiente oficial só DEVE ser implantado a partir da `main` do repositório principal. Branches de forks são implantadas apenas nas contas de seus autores. |
