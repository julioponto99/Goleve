# Autenticação inicial

Os três endpoints são disponibilizados pelo API Gateway em `http://localhost:3000`. O gateway preserva o caminho, o corpo JSON, o cabeçalho `Authorization` e o código de resposta do auth-service.

## Registo

`POST /auth/register`, com `Content-Type: application/json`:

```json
{
  "name": "Ana Silva",
  "email": "ana@example.com",
  "password": "uma-password-segura"
}
```

O nome é normalizado com trim e deve ter entre 2 e 100 caracteres. O email é normalizado com trim e minúsculas e tem índice único no MongoDB. A password é preservada exatamente, deve ter pelo menos 8 caracteres e no máximo 72 bytes UTF-8; não aceita NUL nem apenas espaços. O limite em bytes evita a truncagem descrita na [documentação do bcrypt](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns).

Só são aceites os campos `name`, `email` e `password`. Campos adicionais, incluindo `userType`, `role` e `passwordHash`, produzem `400`. O serviço atribui sempre `userType: "utilizador"`. O modelo reconhece `utilizador`, `profissional`, `gestor` e `administrador`, mas não existem endpoints públicos para atribuir os três últimos tipos.

Resposta `201`:

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Ana Silva",
    "email": "ana@example.com",
    "userType": "utilizador",
    "createdAt": "2026-10-31T12:00:00.000Z",
    "updatedAt": "2026-10-31T12:00:00.000Z"
  },
  "accessToken": "<JWT>",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

A coleção `auth_users` armazena um ObjectId, nome, email, hash bcrypt com custo 12, tipo e timestamps. O índice único fica pronto antes de o servidor aceitar pedidos, incluindo registos concorrentes. As respostas usam uma lista explícita de campos públicos; os hashes também estão excluídos das consultas por defeito e da serialização JSON do modelo.

## Login

`POST /auth/login`:

```json
{
  "email": "ana@example.com",
  "password": "uma-password-segura"
}
```

Resposta `200`, com a mesma estrutura de sessão do registo. Um email desconhecido e uma password incorreta devolvem a mesma resposta genérica `401`.

## Utilizador autenticado

`GET /auth/me`, com `Authorization: Bearer <accessToken>`.

Resposta `200` com `{ "user": { ... } }`, usando os mesmos campos públicos. O JWT é verificado com HS256, assinatura `JWT_SECRET`, issuer `goleve-auth`, audience `goleve-api`, expiração e subject ObjectId. A validade dos tokens emitidos é de uma hora. O perfil e o tipo de utilizador são lidos do MongoDB; não são aceites papéis declarados pelo cliente ou por claims adicionais no JWT.

O auth-service usa `MONGO_URI` e `JWT_SECRET`; o gateway usa `AUTH_SERVICE_URL`. A revisão final tornou `JWT_SECRET` obrigatório no Compose para o auth-service. Com `NODE_ENV=production`, valores inferiores a 32 bytes, placeholders conhecidos, baixa diversidade e padrões repetidos são rejeitados antes de abrir HTTP. Gerar a chave com um gerador criptográfico e guardá-la no `.env` ignorado pelo Git. A revisão rodou apenas essa chave local; tokens anteriores ficam inválidos. Esta etapa não inclui refresh tokens, recuperação de passwords nem validação de email.

O gateway aplica uma quota de 30 pedidos POST por IP em cada janela de 15 minutos, partilhada entre `/auth/register` e `/auth/login`. Usa o endereço da ligação e ignora cabeçalhos de IP fornecidos pelo cliente; `X-Forwarded-For` e `Forwarded` não permitem contornar a quota. `/health` e `/auth/me` não consomem esta quota. O contador é mantido em memória por processo e reinicia com o gateway; múltiplas réplicas exigem um armazenamento partilhado. A configuração atual corresponde ao gateway diretamente exposto em localhost; colocar outro proxy à frente requer configurar explicitamente a confiança nesse proxy.

## Erros

Todas as respostas de erro do auth-service têm a forma `{ "error": { "code": "...", "message": "..." } }`.

| HTTP | Situação |
|---|---|
| 400 | Dados inválidos, campos adicionais ou JSON malformado |
| 401 | Credenciais incorretas, token ausente/inválido/expirado ou utilizador inexistente |
| 404 | Endpoint de autenticação desconhecido |
| 409 | Email já registado, incluindo pedidos concorrentes |
| 413 | Corpo JSON superior a 16 KiB |
| 429 | Limite de tentativas de autenticação excedido; consultar `Retry-After` |
| 502 | Gateway sem acesso ao auth-service |
| 503 | Base de dados de autenticação indisponível |

Os endpoints de autenticação devolvem `Cache-Control: no-store`. O `/health` existente mantém a verificação MongoDB e os estados `200`/`503`.

## Testes

Na pasta `backend`, executar `npm.cmd test --workspace=@goleve/auth-service` no PowerShell, ou `npm test --workspace=@goleve/auth-service` noutros shells. O comando compila os dois workspaces e executa os testes com `node:test`.

Sem `TEST_MONGO_URI`, correm os testes unitários de validação, modelo e JWT; a suite de integração é explicitamente marcada como ignorada. Para executar também os testes HTTP com MongoDB real, usar um contentor temporário com armazenamento em memória:

```powershell
$testName = 'goleve-auth-tests-' + [guid]::NewGuid().ToString('N')
docker run -d --rm --name $testName --tmpfs /data/db --tmpfs /data/configdb -p '127.0.0.1::27017' mongo:7
try {
    $testReady = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        docker exec $testName mongosh --quiet --eval 'quit(db.adminCommand({ping:1}).ok?0:1)' > $null 2>&1
        if ($LASTEXITCODE -eq 0) { $testReady = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $testReady) { throw 'MongoDB temporário indisponível' }
    $testInfo = docker inspect $testName | ConvertFrom-Json
    $testPort = $testInfo[0].NetworkSettings.Ports.'27017/tcp'[0].HostPort
    $env:TEST_MONGO_URI = "mongodb://127.0.0.1:$testPort"
    npm.cmd test --workspace=@goleve/auth-service
} finally {
    docker stop $testName
    Remove-Item Env:TEST_MONGO_URI -ErrorAction SilentlyContinue
}
```

A suite cria uma base com nome aleatório nesse MongoDB, inicia o auth-service e o gateway compilados em portas aleatórias e faz os pedidos através do gateway. Não usa nem elimina bases ou volumes do projeto. O contentor temporário é removido automaticamente após parar; os seus dados existem apenas em memória.

Para reconstruir apenas os dois serviços envolvidos:

```sh
docker compose up -d --no-deps --build --wait auth-service api-gateway
docker compose ps
```

## Resultado da verificação

Verificação realizada em 31 de outubro de 2026:

- Compilação TypeScript do auth-service e gateway: passou localmente e durante os builds Docker.
- Testes automatizados após a revisão final: **85 aprovados, 0 falhas, 0 ignorados**; inclui os 69 testes anteriores e 16 regressões de segurança. Os testes HTTP usam um MongoDB temporário em memória.
- Cobertura: registo, login, perfil autenticado, hashes e salts bcrypt, validação, duplicados concorrentes, papéis privilegiados, injeção de queries, JWT e respostas de erro, indisponibilidade da base de dados e falha do upstream.
- Verificação nos contentores reais: registo privilegiado rejeitado com `400` sem criar conta, login inexistente com `401`, perfil sem token com `401`.
- Estado final: **14/14 serviços saudáveis**; apenas auth-service e gateway foram recriados. MongoDB, RabbitMQ e restantes microserviços conservaram os seus contentores.
- Nenhum dado ou volume do projeto foi eliminado; o MongoDB temporário dos testes foi parado após a execução. Não foram realizados commits nem push.

A dependência de proxy emitiu um aviso não bloqueante do Node.js sobre `util._extend`; não houve falhas de compilação nem de execução na verificação final.

## Ficheiros desta etapa

Na raiz do repositório:

- `README.md`
- `backend/package-lock.json`
- `documentation/api/authentication.md`

No API Gateway, em `backend/api-gateway/`:

- `package.json`
- `src/app.ts`
- `src/server.ts`
- `src/routes/auth.routes.ts`
- `src/services/auth-proxy.service.ts`
- `src/middlewares/auth-rate-limit.middleware.ts`

No auth-service, em `backend/services/auth-service/`:

- `package.json`
- `src/app.ts`
- `src/server.ts`
- `src/config/errors.ts`
- `src/config/token.ts`
- `src/config/validation.ts`
- `src/models/auth-user.model.ts`
- `src/controllers/auth.controller.ts`
- `src/routes/auth.routes.ts`
- `src/services/auth.service.ts`
- `src/middlewares/auth.middleware.ts`
- `src/middlewares/database.middleware.ts`
- `src/middlewares/error.middleware.ts`
- `tests/validation.test.cjs`
- `tests/token.test.cjs`
- `tests/integration.test.cjs`
- `tests/security.test.cjs`

Na revisão final, `src/config/database.ts` recebeu logs sem mensagens externas e o Compose passou a exigir a chave JWT no auth-service. O `.env.example` passou a documentar a geração da chave, e apenas o segredo no `.env` local foi rodado. Os Dockerfiles e restantes microserviços não foram alterados. Consultar a [revisão final de segurança](authentication-security-review.md) para os resultados e a lista completa dos candidatos ao commit.
