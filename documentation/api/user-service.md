# User Service — fase 1

Implementação baseada na leitura integral de [user-profiles](../architecture/user-profiles.md), [professional-profiles](../architecture/professional-profiles.md), [profile-relationships](../architecture/profile-relationships.md) e [profile-permissions](../architecture/profile-permissions.md). Estes quatro documentos não foram alterados.

## Âmbito e aprovação

A aprovação recebida abrange **apenas desenvolvimento local com dados fictícios**. Nenhum destes contratos autoriza recolha real, utilização clínica, partilha com profissionais ou tratamento por IA. Não foram implementados o Professional Service, consentimentos de IA, acessos administrativos ou eventos RabbitMQ.

`USER_DATA_MODE` aceita apenas `disabled` (por defeito) e `synthetic`. Com `disabled`, os endpoints de dados autenticados devolvem 503 `USER_DATA_DISABLED`. Valores como `real` e `production` são rejeitados no arranque. O modo `synthetic` identifica o âmbito autorizado; não consegue determinar automaticamente se um valor introduzido por uma pessoa é fictício. Não introduzir dados reais.

## Modelos e separação de responsabilidades

Todos os modelos pertencem à base exclusiva `goleve_user` (prefixo configurável). Os cinco modelos de negócio têm datas de criação/atualização, versão de esquema e versão de registo; a auditoria tem a sua própria data de ocorrência. As consultas de negócio filtram sempre `authUserId` proveniente do Auth, independentemente do papel da conta.

| Modelo / coleção | Dados implementados |
|---|---|
| `UserProfile` / `user_profiles` | Referência única ao Auth, nome de apresentação, nascimento, género opcional, contacto, país/localização aproximada; estado `draft` e versão de onboarding controlados pelo servidor |
| `UserPreferences` / `user_preferences` | Idioma, fuso horário explicitamente escolhido, tema, unidades, preferências de canais/categorias de notificações e horário de silêncio |
| `HabitProfile` / `habit_profiles` | Sono, dias de exercício, atividade, janelas preferidas de treino e hábito de hidratação; payload cifrado e declaração datada |
| `BodyMeasurement` / `body_measurements` | Uma observação por registo, tipo, valor cifrado, unidade, data observada, data de registo e proveniência atribuída pelo servidor |
| `UserGoal` / `user_goals` | Tipo e estado; título, descrição, alvo quantitativo opcional, datas e referência basal num payload cifrado |
| `AuditAccessRecord` / `audit_access_records` | Metadados técnicos de operação, ator/titular, recurso, decisão, data e identificador de pedido; sem conteúdos, tokens ou valores das medições |

Não se guardam passwords, hashes, JWT, papéis ou cópias do email de login. `contactEmail` é um contacto opcional distinto; alterá-lo não altera o Auth. `GET /users/me` acrescenta a identidade atual obtida do Auth à resposta, sem a persistir no perfil. A criação de uma conta no Auth não cria automaticamente um perfil.

Valores sensíveis de hábitos, medições e objetivos usam AES-256-GCM com IV aleatório e contexto autenticado que inclui coleção, titular, ID e versão. As chaves de cifra e de impressão de idempotência são derivadas separadamente. Campos cifrados são excluídos das consultas por defeito; as respostas usam DTOs explícitos. Isto não cifra todos os metadados nem substitui gestão de chaves e controlos aprovados para produção.

## Configuração e arranque local

Na raiz, executar uma vez (não requer instalação npm):

~~~sh
node backend/services/user-service/scripts/init-local-key.cjs
~~~

O script cria `.secrets/user-data-key.key` com 32 bytes aleatórios codificados em hexadecimal, nunca imprime a chave e nunca substitui um ficheiro existente. O `.gitignore` exclui `.env` e `.secrets/`. Preservar a chave enquanto se pretender ler os dados cifrados; não a substituir como tentativa de corrigir erros de arranque.

No `.env` local, para este desenvolvimento fictício aprovado:

~~~dotenv
USER_DATA_MODE=synthetic
USER_DATA_KEY_PATH=./.secrets/user-data-key.key
~~~

O Compose fornece ao User Service:

- `MONGO_URI=mongodb://mongodb:27017/goleve_user` com o prefixo existente configurável;
- `AUTH_SERVICE_URL=http://auth-service:3001`;
- `USER_DATA_KEY_FILE=/run/secrets/user_data_key`, montado apenas em leitura;
- `USER_DATA_MODE` e `PORT=3002`.

O User Service não recebe `JWT_SECRET` nem credenciais RabbitMQ. A chave de cifra é independente da chave JWT. O gateway usa `USER_SERVICE_URL=http://user-service:3002`; só o gateway publica a porta HTTP. Nenhum Dockerfile precisou de alteração: os builds existentes instalam pelo lockfile central e compilam os workspaces.

~~~sh
docker compose up -d --build
docker compose ps
~~~

Para atualizar apenas esta fase com as dependências já saudáveis:

~~~sh
docker compose up -d --no-deps --build --wait --wait-timeout 180 user-service api-gateway
~~~

O arranque liga ao MongoDB e inicializa os índices antes de abrir HTTP. `/health` é público e verifica a ligação com um ping: 200 quando disponível, 503 quando indisponível. Também indica o modo de dados. O bloqueio intencional de recolha em modo `disabled` não representa uma falha de saúde do processo. Não foram alterados os volumes existentes nem usadas operações de remoção.

## Autenticação e autorização

Todos os endpoints `/users/*` exigem `Authorization: Bearer <JWT>`, incluindo acesso direto ao serviço na rede interna. O middleware consulta o `/auth/me` existente em cada pedido, sem cache de identidade ou acesso à base do Auth. A validação de assinatura, expiração e conta permanece no Auth. Falha de autenticação dá 401; Auth indisponível ou resposta inválida dá 503; não há alternativa que aceite o token sem validação.

Não existem rotas públicas de perfil por ID de utilizador. IDs de titular, papéis, estados administrativos, proveniência e campos de outros serviços são rejeitados no corpo. IDs de medições/objetivos de outro titular devolvem 404. Perfis `restricted`/`deletion_pending` bloqueiam os acessos de perfil. O servidor não confia em cabeçalhos de identidade fornecidos pelo cliente. Respostas do User Service incluem `Cache-Control: no-store` e `X-User-Data-Mode`.

## Endpoints

Base pelo gateway local: `http://127.0.0.1:3000`. Todas as respostas de sucesso de dados usam `{ "data": ... }`.

| Método | Caminho | Operação |
|---|---|---|
| GET | `/users/me` | Perfil pessoal com identidade atual |
| PUT | `/users/me` | Criar perfil, sem substituir um existente |
| PATCH | `/users/me` | Atualizar os dados pessoais |
| GET / PUT / PATCH | `/users/me/preferences` | Consultar / criar / atualizar preferências |
| GET / PUT / PATCH | `/users/me/habits` | Consultar / criar / atualizar hábitos |
| GET | `/users/me/physical-data` | Última medição válida de cada tipo, ou `null` se ausente |
| GET | `/users/me/weight-history` | Histórico de peso paginado |
| GET / POST | `/users/me/measurements` | Listar / adicionar observações |
| GET | `/users/me/measurements/:measurementId` | Consultar uma observação própria |
| GET / POST | `/users/me/goals` | Listar / criar objetivos pessoais |
| GET / PATCH | `/users/me/goals/:goalId` | Consultar / atualizar um objetivo próprio |

Criar primeiro o perfil. As restantes operações exigem esse perfil. GET não cria recursos implicitamente. PUT de perfil, preferências e hábitos exige `If-None-Match: *`; se já existir, devolve 412. POST cria medições/objetivos. A criação devolve 201.

GET e alterações de recursos individuais devolvem um ETag forte, por exemplo `"507f1f77bcf86cd799439011:1"`. PATCH exige esse valor no cabeçalho `If-Match`. A versão é comparada e incrementada na atualização atómica do documento: versões antigas ou de outro recurso dão 412; ausência de precondição dá 428. Não se aceitam atualizações sem controlo de concorrência.

Campos opcionais de perfil, hábitos e objetivo que suportam remoção aceitam `null`; não existe eliminação de perfil/histórico nesta fase. Objetos aninhados são validados por lista explícita de campos. `notifications` faz merge dos booleanos enviados; `target`, janelas e localização são substituídos como unidade.

### Exemplos de corpos fictícios

PUT `/users/me` com Bearer e `If-None-Match: *`:

~~~json
{ "displayName": "Perfil fictício", "countryCode": "PT" }
~~~

PUT `/users/me/preferences` com os mesmos cabeçalhos:

~~~json
{ "timeZone": "Europe/Lisbon", "locale": "pt-PT", "theme": "system" }
~~~

PUT `/users/me/habits` com os mesmos cabeçalhos:

~~~json
{ "usualSleepMinutes": 480, "exerciseDaysPerWeek": 3, "activityLevel": "moderate" }
~~~

POST `/users/me/measurements` exige um `Idempotency-Key` de 1–128 caracteres (`A-Z a-z 0-9 . _ -`), por exemplo `synthetic-weight-001`:

~~~json
{ "kind": "weight", "value": 72000, "unit": "g", "measuredAt": "2026-10-01T09:00:00Z" }
~~~

Peso é um inteiro em gramas; altura e perímetros são inteiros em milímetros. Tipos: `weight`, `height`, `waist`, `hip`, `chest`, `upper_arm`, `thigh`, `calf`. Limites técnicos de entrada: peso 1–1000000 g, altura 1–3000 mm, perímetros 1–5000 mm; não são recomendações clínicas. A data deve ser UTC válida, com tolerância de relógio de até cinco minutos no futuro.

Repetir a mesma chave e o mesmo conteúdo para o mesmo titular devolve o registo original (200, `Idempotency-Replayed: true`), mesmo com pedidos concorrentes. Conteúdo diferente para a mesma chave dá 409. A chave é isolada por titular. As medições são observações imutáveis nesta fase; não há PATCH/DELETE. A última observação é escolhida por `measuredAt` e ID, não pela ordem de chegada.

POST `/users/me/goals`:

~~~json
{
  "goalType": "daily_activity",
  "title": "Objetivo fictício de atividade",
  "target": { "metric": "steps", "value": 5000, "unit": "steps", "period": "day" }
}
~~~

Tipos de objetivo: `weight_loss`, `weight_maintenance`, `muscle_gain`, `fitness`, `hydration`, `daily_activity`, `custom`. Estados: `proposed` (por defeito), `active`, `paused`, `achieved`, `archived`; descrevem a intenção do titular e não acionam decisões clínicas. Os alvos são opcionais. As métricas quantitativas aceites são peso (`g`, `once`), volume de água (`ml`, `day`), passos (`steps`, `day`), minutos ativos (`minutes`) e frequência de treino (`sessions_per_week`, `week`), com compatibilidade por tipo. `baselineMeasurementId` só aceita uma medição própria de peso compatível. Não se infere massa muscular a partir do peso; objetivos `muscle_gain`/`custom` ficam descritivos enquanto faltar um catálogo de métricas aprovado.

Listagens aceitam `limit` (1–100, por defeito 20), `cursor` devolvido pela página anterior e filtro `kind` nas medições ou `status` nos objetivos. A resposta contém `data.items` e `data.nextCursor` (`null` no fim). O cursor é validado para titular, coleção e filtro; não é uma credencial. Peso está ordenado por data da observação decrescente; objetivos por criação decrescente.

Erros usam `{ "error": { "code": "...", "message": "..." } }`. Campos inesperados, tipos inválidos, datas impossíveis e relações incompatíveis dão 400; JSON inválido dá 400; corpo acima de 16 KiB dá 413. Não são devolvidos detalhes internos de MongoDB, erros de cifra, tokens ou hashes.

## Auditoria e limites transacionais

É guardada uma intenção de auditoria antes da operação e uma conclusão antes de devolver os dados. Se a intenção não puder ser persistida, a operação não prossegue (503). A auditoria regista apenas metadados, sem payloads pessoais. Pedidos rejeitados antes da camada de negócio, como autenticação/validação, não geram estes registos de operação.

O MongoDB atual é standalone. Não existe transação atómica entre documento de negócio e auditoria: uma falha após a escrita pode deixar dados persistidos e uma intenção sem conclusão; falha na auditoria final devolve 503 mesmo que a escrita já tenha ocorrido. Repetições de medições são protegidas pela chave de idempotência e criações singleton pela unicidade por titular. POST de objetivos não tem idempotência automática. Não se afirma entrega garantida de eventos nem auditoria distribuída completa. Não foram introduzidos TTL, eliminações ou retenção arbitrária.

## Questões pendentes antes de dados reais / fases seguintes

- Aprovar finalidade, fundamento de tratamento, política de retenção/eliminação, menores e avaliações de privacidade exigidas pela arquitetura. O modo de dados reais continua indisponível.
- Definir gestão e rotação de chaves, KMS, recuperação, TLS e controlos operacionais apropriados ao ambiente real. A chave local não implementa estes processos.
- Definir unicidade/prioridade de objetivos ativos por métrica. Não foi inventada a regra de um único objetivo ativo nem calculado um `targetWeight` singular a partir de objetivos potencialmente múltiplos.
- Aprovar métricas adicionais para objetivos de massa muscular/custom, referências de avatar/armazenamento e declarações de saúde; não implementados nesta fase.
- Correção/eliminação de medições, agregados materializados, retenção de auditoria, eventos/outbox e operações entre documentos exigem desenho de consistência, incluindo eventual replica set. Não foram simulados como transações atómicas.
- Partilha profissional, relações, concessões de acesso, consentimentos específicos de IA e efeitos das preferências no envio de notificações pertencem a fases/serviços próprios. Preferências não substituem consentimento.

## Validação realizada

- Compilação TypeScript do User Service, gateway e Auth concluída.
- **90 testes do User Service aprovados**, sem falhas ou testes ignorados: validação, isolamento entre titulares, JWT inválido/expirado via Auth real, cifra e adulteração, versões concorrentes, idempotência concorrente, paginação, ausência de dados sensíveis, dados físicos por data, objetivos, bloqueio do modo desativado e falhas de Auth/MongoDB/auditoria/gateway.
- **85 testes de regressão do Auth aprovados**, sem falhas ou testes ignorados; código do Auth preservado.
- Integração executada com Auth e gateway reais em processo, bases aleatórias separadas e MongoDB temporário com armazenamento tmpfs; sem usar os dados persistentes do projeto como fixtures.
- Imagens Docker do User Service e gateway reconstruídas; os **14 serviços configurados saudáveis** após a atualização. Os restantes contentores do projeto não foram recriados.

Repetir os testes a partir da raiz, com MongoDB descartável e URI explícita (PowerShell):

~~~powershell
$env:TEST_MONGO_URI = 'mongodb://127.0.0.1:<porta-do-mongo-temporario>'
npm --prefix backend test --workspace=@goleve/user-service
npm --prefix backend test --workspace=@goleve/auth-service
~~~

Sem `TEST_MONGO_URI`, a suite de integração do User é explicitamente ignorada; apenas testes unitários não comprovam a integração. Os testes criam bases de nome aleatório e não apagam bases/volumes existentes. Usar uma instância temporária dedicada e pará-la no fim. O aviso `DEP0060` da dependência de proxy já existente não impediu build nem testes.

## Ficheiros desta implementação

- `backend/services/user-service/src/`: `app.ts`, `server.ts`, `config/{database,encryption,errors,http,settings,validation}.ts`, `models/{common,index,user-profile.model,user-preferences.model,habit-profile.model,body-measurement.model,user-goal.model,audit-access.model}.ts`, `middlewares/{auth.middleware,error.middleware}.ts`, `controllers/user.controller.ts`, `routes/user.routes.ts`, `services/user.service.ts`.
- `backend/services/user-service/scripts/init-local-key.cjs`, `package.json` e `tests/{validation,encryption,integration}.test.cjs`.
- `backend/api-gateway/src/app.ts`, `routes/user.routes.ts` e `services/user-proxy.service.ts`.
- `backend/package-lock.json`, `compose.yaml`, `.env.example`, `.gitignore`, `README.md` e este documento.
- Apenas no ambiente local e ignorados pelo Git: configuração `USER_DATA_MODE=synthetic` em `.env` e nova chave em `.secrets/user-data-key.key` (sem alterar as credenciais existentes).

Os quatro documentos de arquitetura já estavam por adicionar ao Git antes desta implementação; foram lidos e preservados. Não foram executados commit ou push.
