# Revisão final da autenticação

Revisão de 31 de outubro de 2026, limitada ao auth-service, API Gateway e configuração necessária à autenticação.

## Problemas encontrados e corrigidos

1. O segredo JWT local tinha menos de 32 bytes e a aplicação aceitava o fallback de desenvolvimento mesmo em produção. O auth-service agora exige a variável no Compose e rejeita em produção valores curtos, placeholders conhecidos, baixa diversidade, espaços exteriores e padrões repetidos. O segredo do `.env` local foi substituído por 32 bytes aleatórios representados em hexadecimal, sem o escrever em logs nem ficheiros versionáveis. A rotação invalida os tokens anteriores.
2. Os logs de erros MongoDB e de arranque reproduziam mensagens externas que podiam conter credenciais, URIs ou dados de documentos. Passaram a usar mensagens estáticas. Os erros inesperados HTTP também não imprimem nomes ou mensagens arbitrárias. Foram acrescentadas regressões com marcadores de dados sensíveis.
3. Registo e login não tinham limite de tentativas. O gateway passou a limitar os dois endpoints a uma quota conjunta de 30 POST por IP em 15 minutos, devolvendo JSON `429`, `Retry-After` e `Cache-Control: no-store`. Os cabeçalhos de IP enviados pelo cliente não são considerados para a quota.

## Controlos revistos

- Validação por lista de campos permitidos, tipos, dimensões e formato; rejeição de objetos de query MongoDB, campos adicionais e passwords que excedam 72 bytes UTF-8.
- Bcrypt assíncrono com custo 12 e salts distintos; hash excluído das consultas por defeito e das respostas públicas.
- JWT HS256, assinatura, issuer, audience, subject ObjectId e expiração obrigatória; validade emitida de uma hora.
- `/auth/me` exige Bearer válido e confirma a existência do utilizador. O papel é lido do MongoDB.
- Email normalizado com índice único inicializado antes de abrir HTTP; colisões concorrentes devolvem `409`.
- Registo público atribui exclusivamente `utilizador` e rejeita qualquer papel fornecido pelo cliente.
- Respostas sem passwords, hashes ou chave JWT; credenciais de login incorretas usam mensagens genéricas.
- Proxy preserva caminhos, corpo, Authorization e códigos HTTP, com erro controlado `502` quando o auth-service está indisponível.
- O ficheiro `.env` permanece ignorado e não deve integrar o commit.

As decisões de limitação e de exclusão de segredos dos logs seguem as recomendações da [OWASP para autenticação](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) e [logs](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html).

## Validação

- 85 testes aprovados, sem falhas nem testes ignorados, com MongoDB temporário em memória.
- Compilação TypeScript aprovada localmente e nos builds Docker do auth-service e gateway.
- `npm audit --omit=dev`: código de saída 0, nenhuma vulnerabilidade reportada nas dependências de execução.
- 14/14 serviços Docker saudáveis. Apenas auth-service e gateway foram recriados; os outros identificadores de contentor permaneceram iguais.
- A imagem de produção rejeitou o segredo de desenvolvimento; o Compose recusou a ausência de `JWT_SECRET`.
- Nos logs atuais do auth-service e gateway não foram encontrados a chave JWT local, tokens JWT, hashes bcrypt ou URIs MongoDB com credenciais. Nos ficheiros candidatos ao commit não foram encontrados a chave local, tokens JWT literais ou chaves privadas PEM.
- Mantém-se um aviso não bloqueante de depreciação de `util._extend` numa dependência transitiva do proxy.

Conclusão: sem bloqueios identificados nesta revisão para fazer o commit da etapa. O `.env` continua excluído e nenhum ficheiro foi preparado no index.

O limiter usa memória por processo; a configuração atual cobre uma instância de gateway diretamente exposta em localhost. Estes resultados avaliam a versão para commit, sem certificar uma futura instalação pública com outras configurações de rede ou múltiplas réplicas.

## Ficheiros candidatos ao commit

Esta lista inclui a implementação de autenticação ainda pendente, a ligação MongoDB da etapa anterior e as correções desta revisão. Não foram executados `git add`, commit ou push.

- `.env.example`
- `README.md`
- `backend/api-gateway/package.json`
- `backend/api-gateway/src/app.ts`
- `backend/api-gateway/src/middlewares/auth-rate-limit.middleware.ts`
- `backend/api-gateway/src/routes/auth.routes.ts`
- `backend/api-gateway/src/server.ts`
- `backend/api-gateway/src/services/auth-proxy.service.ts`
- `backend/package-lock.json`
- `backend/services/auth-service/package.json`
- `backend/services/auth-service/src/app.ts`
- `backend/services/auth-service/src/config/database.ts`
- `backend/services/auth-service/src/config/errors.ts`
- `backend/services/auth-service/src/config/token.ts`
- `backend/services/auth-service/src/config/validation.ts`
- `backend/services/auth-service/src/controllers/auth.controller.ts`
- `backend/services/auth-service/src/middlewares/auth.middleware.ts`
- `backend/services/auth-service/src/middlewares/database.middleware.ts`
- `backend/services/auth-service/src/middlewares/error.middleware.ts`
- `backend/services/auth-service/src/models/auth-user.model.ts`
- `backend/services/auth-service/src/routes/auth.routes.ts`
- `backend/services/auth-service/src/server.ts`
- `backend/services/auth-service/src/services/auth.service.ts`
- `backend/services/auth-service/tests/integration.test.cjs`
- `backend/services/auth-service/tests/security.test.cjs`
- `backend/services/auth-service/tests/token.test.cjs`
- `backend/services/auth-service/tests/validation.test.cjs`
- `compose.yaml`
- `documentation/api/authentication-security-review.md`
- `documentation/api/authentication.md`

O `.env` local foi alterado apenas para a rotação do segredo, mas está excluído do Git e desta lista. Não incluir credenciais reais, `node_modules`, `dist` ou logs.

Verificacao final: 30 ficheiros candidatos ao commit, nenhum preparado no index; .env ignorado e sem o segredo local nos candidatos. Os 14 servicos mantiveram-se saudaveis e os contentores de infraestrutura foram preservados.
