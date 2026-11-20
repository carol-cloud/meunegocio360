## RF-BE-001 — Autenticação de usuário (login)

> **Serviço:** Núcleo (`meunegocio360-back`), emissor de identidade.  
> **Consumido por:** `RF-FE-001` e por todos os requisitos seguintes (que passam a exigir autenticação).

As **regras de negócio, o contrato da API, o cookie, os erros, o modelo de dados e os critérios de aceite são os mesmos da versão original** do requisito. Mudam apenas as decisões técnicas da implementação, descritas em cada seção.

### História de usuário

Como **usuário cadastrado do sistema**, quero **entrar com meu e-mail e minha senha e continuar autenticado sem precisar entrar de novo a cada recarregamento da página**, para **acessar as funcionalidades protegidas do MeuNegocio360 de forma segura e prática**.

### Escopo

**Dentro do escopo:** tabelas de usuário e de refresh token, *seed* de desenvolvimento, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`, emissão e validação de JWT de acesso, refresh token rotativo com detecção de reuso, proteção *deny-by-default* dos demais endpoints, bloqueio temporário por tentativas falhas, tratamento padronizado de erros, `/health` e Swagger.

**Fora do escopo:** cadastro/edição de usuários, recuperação e troca de senha, MFA, login social, autorização granular por perfil (somente o papel é gravado no token), limitação de requisições por IP, validação dos tokens por outros serviços (RS256/JWKS).

### Dependências introduzidas

O `meunegocio360-back` é criado neste requisito (`npm init`, com `"type": "module"`). As dependências abaixo são as **únicas** permitidas no RF-BE-001 (qualquer outra exige revisão do requisito):

| Dependência | Tipo | Para quê |
| --- | --- | --- |
| `express` | produção | Servidor HTTP e rotas (Express 5) |
| `mysql2` | produção | Driver do MySQL usado pelo Knex |
| `knex` | produção | Migrations, seeds e acesso ao MySQL (RNF-BE-20) |
| `zod` | produção | Validação da entrada e das variáveis de ambiente (RNF-BE-32) |
| `jsonwebtoken` | produção | Emissão e validação do JWT de acesso |
| `bcrypt` | produção | Hash e verificação de senha |
| `cookie-parser` | produção | Leitura do cookie de refresh |
| `cors` | produção | Configuração de CORS (RNF-BE-42) |
| `helmet` | produção | Cabeçalhos de segurança (RNF-BE-41) |
| `dotenv` | produção | Carga do `.env` em desenvolvimento (RNF-BE-31) |
| `pino` e `pino-http` | produção | Logs estruturados e `X-Request-Id` (RNF-BE-43, RNF-BE-44) |
| `swagger-jsdoc` e `swagger-ui-express` | produção | Documentação OpenAPI em `/api-docs` (fora de produção) |
| `eslint`, `@eslint/js`, `globals`, `prettier`, `eslint-config-prettier` | desenvolvimento | Lint e formatação (RNF-BE-45) |
| `pino-pretty` | desenvolvimento (opcional) | Logs legíveis no terminal |

NÃO DEVEM ser usados: TypeScript, `tsx`, pacotes `@types/*`, ORMs (Sequelize, Prisma, TypeORM), `bcryptjs`, `nodemon` (o `node --watch` substitui) nem bibliotecas de UUID (`crypto.randomUUID()` substitui).

Dependências de teste (Vitest, Supertest, Testcontainers, dependency-cruiser) entram na fase de testes.

### Regras de negócio

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

### Contrato da API

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

### Token de acesso (JWT)

| Item | Definição |
| --- | --- |
| Biblioteca | `jsonwebtoken`. |
| Emissão | `jwt.sign({ perfil }, config.jwtSecret, { algorithm: 'HS256', issuer: 'meunegocio360-core', subject: usuario.id, jwtid: crypto.randomUUID(), expiresIn: minutos * 60 })` (o `iat` é incluído automaticamente). |
| Validação | `jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], issuer: 'meunegocio360-core' })`. A lista `algorithms` é **obrigatória**: é ela que rejeita `alg: none` e outros algoritmos. `jwt.decode()` NUNCA é usado para autenticar. |
| Segredo | `JWT_SECRET` com pelo menos 32 bytes, validado na inicialização (RNF-BE-32). |
| Conteúdo | Claims `iss`, `sub`, `iat`, `exp`, `jti` e `perfil`. NÃO DEVE conter senha, *hash* nem dados pessoais além do necessário. |

O middleware de autenticação lê `Authorization: Bearer <token>`, valida e grava `req.usuario = { id, perfil }`. Qualquer falha vira `401 UNAUTHORIZED` com `WWW-Authenticate: Bearer`.

### Modelo de dados

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

### Critérios de aceite

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

### Requisitos não funcionais com destaque neste requisito

RNF-BE-03, RNF-BE-04, RNF-BE-14, RNF-BE-32, RNF-BE-40, RNF-BE-41, RNF-BE-42, RNF-BE-43 e RNF-BE-44, além dos requisitos gerais de segurança e privacidade: *deny-by-default*, nenhum segredo no código, nenhum dado sensível em logs e minimização de dados pessoais.

### Testes previstos

Implementados na fase de testes. Até lá, os critérios de aceite são verificados manualmente.

- **Unitários** (Vitest, sem Express nem banco): casos de uso de login, refresh e logout (sucesso, senha errada, usuário inexistente, inativo, bloqueio e desbloqueio por tempo, rotação, expiração, reuso e revogação de família), com repositórios falsos e `clock` controlado; emissão e validação do JWT (expirado, adulterado, `alg` errado, `alg: none`).
- **HTTP** (Supertest sobre o `app`): contrato de todos os endpoints, atributos do cookie, formato `problem+json`, cabeçalhos `Retry-After`, `WWW-Authenticate` e `X-Request-Id`, verificação de `Origin`.
- **Integração** (Testcontainers MySQL + migrations Knex): migrations aplicam-se do zero, unicidade de e-mail e de `token_hash`, fluxo completo login → `me` → refresh → logout, reuso de token.
- **Segurança:** mesma resposta (corpo e status) para e-mail inexistente e senha incorreta; endpoint arbitrário sem token retorna 401; o refresh token nunca é gravado em claro no banco nem aparece em logs.
- **Concorrência:** duas renovações simultâneas (`Promise.all`) com o mesmo refresh token não podem produzir dois tokens válidos.
- **Arquitetura:** regras de camadas da feature `auth` com `dependency-cruiser`.

### Pontos de atenção ao revisar código gerado por IA

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

### Extensões opcionais (desafios)

1. Tolerância curta (por exemplo, 10 s) para renovações simultâneas legítimas feitas por abas diferentes, sem abrir mão da detecção de reuso.
2. Listagem e revogação de sessões ativas do usuário.
3. Limite de requisições por IP (por exemplo, `express-rate-limit`) em `/auth/login`.
4. Auditoria de eventos de autenticação em tabela própria.
5. Troca do algoritmo para RS256 com publicação de JWKS (`/.well-known/jwks.json`), usando a biblioteca `jose`.
