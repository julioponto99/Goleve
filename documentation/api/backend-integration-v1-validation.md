# Valida??o da integra??o de desenvolvimento ? Fase 5.12

Execu??o em 2026-11-02 na branch `feat/backend-integration-v1`.
[Runbook/frontend](backend-integration-v1.md),
[arquitetura e bloqueios](../architecture/backend-integration-v1.md),
[OpenAPI](backend-integration-v1.openapi.json).

## Resultado

| Verifica??o | Resultado |
|---|---|
| Workspaces TypeScript / imagens de aplica??o | 12 compilados, Gateway + 11 servi?os; imagens pr?prias constru?das |
| Testes Node direcionados | **60 aprovados**, zero falhas/ignorados |
| Etapas Docker/HTTP reais | **39 aprovadas**, zero falhas |
| Testes administrativos no MongoDB isolado | **12 aprovados**, zero falhas |
| CLI stop/start completa | Aprovada; sess?o, perfil, dados e credenciais preservados |
| Stack paralela | 14 componentes saud?veis; inicializador tempor?rio removido |
| Ambiente principal | 14 componentes saud?veis; 31 contentores preexistentes preservados |
| Migra??es, backups, contas reais, Git | Nenhum backup/migra??o/provisionamento real/commit/push/merge |

Uma das 39 etapas coordena a execu??o da suite administrativa; os seus 12 casos
s?o apresentados separadamente, sem os contar novamente como uma segunda suite.
N?o se executou regress?o completa de todos os m?dulos nem valida??o produtiva.

## Ambiente real utilizado

Projeto independente `goleve-integration-v1-ad8ea9a1719b5a21`, Gateway apenas em
`127.0.0.1:64344`. MongoDB replica set autenticado `goleveIntegrationV1`,
utilizador e base exclusivos por servi?o, tr?s volumes novos (dados/config Mongo
e dados RabbitMQ), rede privada e segredos pr?prios ignorados pelo Git.
Nenhuma porta Mongo/Rabbit ou API de dom?nio publicada.

O teste negativo de acesso entre bases foi aprovado nos dez servi?os com
persist?ncia ativa. Coach est? desligado e n?o abre conex?o Mongo; n?o se afirma
ter testado persist?ncia IA nesta stack. Os utilizadores Mongo das aplica??es
n?o t?m permiss?es para ler bases alheias. Administradores fict?cios existem
somente na base de testes separada; Auth de desenvolvimento continua com zero
Administradores. N?o foram criados profissionais aprovados no desenvolvimento.

As verifica??es de preserva??o comparam IDs, imagens, instante de arranque,
montagens e redes preexistentes, e confirmam sa?de dos 14 principais. Paragens,
rein?cios e substitui??o de imagem ocorreram exclusivamente nos recursos novos.
Nenhum volume, rede ou contentor preexistente foi removido; nenhum dado principal
foi copiado para esta stack. Os novos dados/segredos permanecem dispon?veis para
continuar o desenvolvimento, e `stop` preserva-os.

## Testes reproduz?veis

Na raiz: `node scripts/integration.cjs init`, `up`, `test`, `status`.
Depois de inicializado n?o repetir `init`; os secrets n?o s?o regenerados.
A prova adicional de ciclo de vida usou `stop`/`start` reais, seguida de
consulta autenticada do perfil e da sess?o fict?cios anteriores.

Com as depend?ncias locais existentes, em `backend`, executar:

~~~powershell
$env:DOTENV_CONFIG_PATH='.no-private-env'
$env:NODE_ENV='test'
npm.cmd run build --workspaces --if-present
node --test --test-concurrency=1 api-gateway/tests/integration-boundary.test.cjs services/training-service/tests/outbox-publishing.test.cjs services/auth-service/tests/token.test.cjs services/auth-service/tests/administration.unit.test.cjs services/notification-service/tests/readiness.test.cjs services/payment-service/tests/payment.test.cjs services/management-service/tests/management.unit.test.cjs
~~~

N?o s?o necess?rias depend?ncias instaladas no host para a CLI Docker; os builds
instalam os workspaces existentes com npm ci, sem atualizar o lockfile.

### Etapas efetivamente aprovadas na stack

- 14 isolated components ready.
- unauthorized /auth/me.
- unauthorized /users/me.
- unauthorized /training/plans.
- unauthorized /hydration/goal.
- unauthorized /performance/goals.
- unauthorized /agenda/activities.
- unauthorized /professionals/me.
- unauthorized /management/me.
- unauthorized /payments.
- unauthorized /notifications.
- unauthorized /ai-coach/capabilities.
- real registration, login and session claims through gateway.
- public registration rejects administrative role injection.
- profile creation, concurrency ETag and owner isolation.
- personal agenda works without professional and denies another owner.
- hydration transaction delivers its event through real RabbitMQ.
- training completion atomically produces an internal notification.
- performance API is authenticated and independently persisted.
- mock payment is idempotent and delivers a clearly simulated result.
- professional catalogue is reachable without conferring eligibility.
- coach remains explicitly disabled and internal contracts are not public.
- real RabbitMQ redelivery creates no duplicate notifications.
- invalid event retries reach the isolated DLQ.
- auth has its own database credentials and cannot read another database.
- user has its own database credentials and cannot read another database.
- training has its own database credentials and cannot read another database.
- agenda has its own database credentials and cannot read another database.
- performance has its own database credentials and cannot read another database.
- hydration has its own database credentials and cannot read another database.
- professional has its own database credentials and cannot read another database.
- management has its own database credentials and cannot read another database.
- payment has its own database credentials and cannot read another database.
- notification has its own database credentials and cannot read another database.
- test-only administration: real MFA, sessions, step-up and concurrent governance.
- RabbitMQ failure degrades readiness, preserves liveness and recovers outbox.
- MongoDB failure degrades readiness and recovers persisted profile/session.
- logout immediately revokes the bearer in dependent services.
- all preexisting resources and 14 main components preserved.

Os testes administrativos executam Auth/Express, TOTP real, transa??es Mongo,
MFA cifrado, c?digos de recupera??o, qu?rum, step-up/replay/expira??o, sess?es,
aprova??o independente, suspens?o concorrente e auditoria sem segredos.
O rel?gio injetado s? existe num processo de teste e base marcada; n?o altera
rel?gio do driver ou servi?o de desenvolvimento. N?o h? MFA simulado.

## Falhas encontradas e resolvidas

- Inicializador Mongo tratava `NotYetInitialized` como falha gen?rica: agora
  inicializa uma vez e reconhece a inst?ncia configurada, sem substituir usu?rios.
- Declara??o TypeScript de lease do Hydration alinhada com o schema e recompilada.
- Teste inicial assumia `/agenda/me/activities`; corrigido para o contrato
  efetivamente existente `/agenda/activities`, sem alterar a Agenda.
- CORS permite tamb?m If-None-Match para criar perfis e exp?e os cabe?alhos de
  concorr?ncia/idempot?ncia usados pelo frontend.
- Training/Hydration n?o confirmavam roteamento nem vinculavam o lease final:
  corrigidos mandatory/rota dur?vel/messageId/CAS, timeouts e cleanup, com testes
  simulados de falha e entrega real antes/depois da recupera??o do broker.

Avisos existentes observados: `util._extend` no proxy e op??o `new` de
findOneAndUpdate no Mongoose. N?o houve atualiza??o de bibliotecas/refatora??o
para os ocultar. N?o houve falha no resultado final.

## Bloqueios preservados

O utilizador recusou alterar validadores de loopback. Payment+Agenda e Coach
ativo em DNS Docker n?o foram desbloqueados nem apresentados como aprovados.
Pagamentos testados s?o o MockBank independente com fixtures backend, n?o uma
cobran?a de reserva aceite. N?o houve fluxo profissional positivo no Docker,
aprova??o de credenciais, pagamentos/reembolsos reais ou chamadas a fornecedor IA.

Management e rotas administrativas negam acesso sem pap?is/?mbitos/MFA v?lidos.
A suite isolada testa a seguran?a Auth; n?o se declara que todos os workflows
administrativos entre os sete servi?os tenham sido exercitados de ponta a ponta.
Depend?ncias produtivas est?o na arquitetura: autoridade profissional real,
contratos bloqueados, recupera??o/rota??o, TLS/ACL, HA, opera??o de DLQ/outboxes,
gest?o de segredos e revis?o integrada de seguran?a/implanta??o.

## Ficheiros alterados (30)

- `.gitignore`
- `README.md`
- `backend/api-gateway/src/app.ts`
- `backend/api-gateway/src/middlewares/integration.middleware.ts`
- `backend/api-gateway/tests/integration-boundary.test.cjs`
- `backend/services/hydration-service/src/events/outbox.ts`
- `backend/services/hydration-service/src/models/outbox.model.ts`
- `backend/services/hydration-service/src/server.ts`
- `backend/services/training-service/src/events/outbox.ts`
- `backend/services/training-service/src/models/outbox.model.ts`
- `backend/services/training-service/src/server.ts`
- `backend/services/training-service/tests/outbox-publishing.test.cjs`
- `compose.integration.yaml`
- `documentation/api/backend-integration-v1-validation.md`
- `documentation/api/backend-integration-v1.md`
- `documentation/api/backend-integration-v1.openapi.json`
- `documentation/architecture/README.md`
- `documentation/architecture/backend-integration-v1.md`
- `documentation/architecture/mongodb-backup-restore.md`
- `documentation/architecture/mongodb-replica-set-migration.md`
- `documentation/backend-completion-plan.md`
- `documentation/events/README.md`
- `documentation/events/agenda-payment-notifications.md`
- `integration.env.example`
- `scripts/integration.cjs`
- `scripts/integration/auth-security.cjs`
- `scripts/integration/mongodb-entrypoint.sh`
- `scripts/integration/mongodb-init.js`
- `scripts/integration/probe.cjs`
- `scripts/integration/smoke.cjs`
