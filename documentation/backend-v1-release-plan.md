# Plano de publicação do backend GoLeve V1

Data: 2026-11-03. Preparação somente de leitura. Não foram executados
`git add`, commit, push, merge, branch ou tag.

## 1. Estado Git e escopo

O plano [repository-cleanup-plan.md](repository-cleanup-plan.md) foi cruzado
com o estado atual:

- 643 ficheiros rastreados.
- 104 ficheiros não rastreados não ignorados.
- 96 ficheiros modificados localmente no início da preparação.
- Todas as alterações locais foram preservadas.
- `.env`, `.secrets/`, `.local/`, `protected-backups/`, volumes e contentores
  não foram alterados.

O worktree mistura alterações de backend, Gateway, frontend, documentação e
infraestrutura. Não é seguro publicar o estado inteiro com `git add .` ou
`git add -A`.

## 2. Candidatos ao próximo commit backend

Os seguintes grupos são candidatos funcionais, sujeitos a revisão final de
diff antes do staging. Os comandos abaixo são deliberadamente seletivos:

### Backend, Gateway e dependências

```text
backend/package.json
backend/package-lock.json
backend/api-gateway/
backend/services/
backend/runtime/
```

Incluir somente ficheiros-fonte, testes e Dockerfiles efetivamente relacionados
à versão backend. Em particular, a revisão deve abranger as alterações de
autorização, local-demo, Payment e geração Swagger antes de adicionar.

Adições backend não rastreadas identificadas e candidatas, com caminho exato:

```text
backend/api-gateway/src/local-demo.ts
backend/runtime/fixtures.cjs
backend/runtime/local-demo.cjs
backend/runtime/local-demo.test.cjs
backend/runtime/seed-runner.cjs
backend/services/agenda-service/src/local-demo.ts
backend/services/ai-coach-service/src/local-demo.ts
backend/services/auth-service/src/local-demo.routes.ts
backend/services/auth-service/src/local-demo.ts
backend/services/hydration-service/src/local-demo.ts
backend/services/management-service/src/local-demo-grants.ts
backend/services/management-service/src/local-demo.ts
backend/services/notification-service/src/local-demo.ts
backend/services/payment-service/scripts/migrate-confirmation-index.cjs
backend/services/payment-service/src/local-demo.ts
backend/services/payment-service/tests/confirmation-index.integration.test.cjs
backend/services/performance-service/src/local-demo.ts
backend/services/professional-service/src/local-demo-fixtures.ts
backend/services/professional-service/src/local-demo.ts
backend/services/training-service/src/local-demo.ts
backend/services/user-service/src/local-demo.ts
```

Cada adição deve ser revista contra os imports, Dockerfiles, `package.json`,
testes e documentação antes do staging. As alterações rastreadas devem ser
selecionadas com `git diff --name-only` e nunca incluídas por diretório inteiro
sem revisão.

### Docker e infraestrutura

```text
compose.yaml
compose.demo.yaml
compose.integration.yaml
compose.mongodb-replica-test.yaml
compose.mongodb-restore-test.yaml
infrastructure/
.env.example
integration.env.example
```

`compose.yaml` é a stack oficial; os restantes Compose suportam ambientes
isolados documentados e não devem ser tratados como duplicados.

### Scripts operacionais e migrações

```text
scripts/mongodb/
scripts/lib/
scripts/payment-index-official.cjs
scripts/payment-index-http.cjs
scripts/local-demo.cjs
scripts/local-demo-http.cjs
scripts/local-demo-audit.cjs
scripts/local-demo-redelivery.cjs
scripts/local-demo-resilience.cjs
scripts/local-runtime.cjs
scripts/tests/
scripts/release-contracts.cjs
scripts/gateway-swagger.cjs
```

Adicionar cada script apenas se estiver referenciado por documentação,
`package.json`, Compose ou procedimento de recuperação. Os relatórios
`.local/` correspondentes não entram no commit.

### Swagger/OpenAPI e documentação essencial

```text
documentation/api/
documentation/architecture/
documentation/release-v1/
documentation/backend-completion-plan.md
documentation/swagger-audit-v1.md
documentation/consolidation-v1.md
documentation/repository-cleanup-plan.md
documentation/backend-v1-release-plan.md
README.md
```

Os documentos de frontend e planos de produto permanecem fora deste commit
backend, salvo se forem necessários para a instalação ou contrato partilhado.

### Testes automatizados backend

```text
backend/**/tests/
tests/
```

Adicionar testes relevantes ao backend e à recuperação. Não adicionar logs,
snapshots locais ou outputs `dist/`.

## 3. Ficheiros a excluir deste commit

### Segredos, dados e evidências locais — nunca adicionar

```text
.env
.secrets/
.local/
.demo/
.integration/
protected-backups/
docker-inventory-before-cleanup.csv
```

O CSV é um inventário histórico não rastreado e não é requisito de
reconstrução. Backups e evidências permanecem preservados localmente, fora do
commit.

### Outputs regeneráveis

```text
**/dist/
frontend/.cache/
frontend/test-results/
frontend/mobile/dist/
frontend/web/dist/
*.log
```

As regras atuais do `.gitignore` já cobrem estes caminhos.

### Alterações frontend não relacionadas

As alterações em `frontend/`, incluindo Web, Mobile, assets, Playwright e
testes de UI, devem ficar fora do commit backend e ser publicadas numa entrega
separada, depois de revisão própria.

### Documentação provisória ou de produto

Os documentos em `documentation/frontend/` e planos de UI não entram na
versão backend salvo decisão explícita de produto. Não devem ser apagados:
apenas ficam fora do staging backend.

## 4. Segurança

Resultados da análise:

- Nenhum ficheiro operacional `.env`, `.secrets/`, backup protegido ou estado
  local está rastreado.
- A varredura de 765 ficheiros candidatos não encontrou chaves privadas,
  tokens GitHub ou tokens Slack.
- O único marcador de chave privada encontrado foi um valor literal de teste
  em `backend/services/ai-coach-service/tests/unit.test.cjs`, usado para
  verificar rejeição de texto sensível; não é uma credencial.
- `.env.example` contém apenas placeholders/documentação local, incluindo
  password de desenvolvimento explicitamente marcada como exemplo; não contém
  valores do `.env` operacional.
- Antes do commit, executar novamente um scanner de segredos sobre o staging,
  não sobre todo o worktree sujo.

## 5. Dependências e instalação nova

Uma instalação nova precisa de:

1. Node/npm compatíveis e `backend/package-lock.json`.
2. `npm ci` no workspace `backend`.
3. Docker/Compose e as imagens definidas em `compose.yaml`.
4. `.env` criado a partir de `.env.example`, com valores locais novos.
5. `.secrets/` inicializado pelos procedimentos documentados.
6. Volumes novos, nunca volumes exportados deste ambiente.
7. Inicialização MongoDB/replica set pelos scripts documentados.
8. RabbitMQ e credenciais locais configurados pelo Compose.
9. Geração/verificação Swagger através dos scripts do Gateway.

Não copiar `.env`, chaves, backups, `node_modules`, `dist` ou dados desta
máquina para a instalação nova.

## 6. Validações executadas

| Validação | Resultado |
|---|---|
| Build de todos os 11 workspaces backend e Gateway | Passou |
| `docker compose -f compose.yaml -p goleve config --quiet` | Passou |
| `node scripts/gateway-swagger.cjs` | Passou: 215 operações, 170 caminhos |
| Testes Swagger/API docs | Passou: 12/12 |
| Build Web | Passou |
| Typecheck Mobile | Passou |
| Contentores oficiais | Passou: 14/14 healthy |
| MongoDB | Passou: `goleveV1`, PRIMARY |
| Scan de marcadores de segredos | Passou; apenas fixture negativo intencional |

### Pendências da suite agregada backend

`npm run test --workspaces --if-present` terminou com falha em testes que não
representam uma regressão funcional confirmada, mas impedem declarar a suite
verde:

1. `auth-service/tests/administration.integration.test.cjs`: a configuração
   local forneceu uma origem `http:` onde o teste exige uma URI `mongodb:`.
2. `notification-service/tests/readiness.test.cjs`: execução fora do Compose
   tentou ler `/run/secrets/local_demo_identities`, que só existe dentro do
   contentor.

Estes testes devem ser repetidos num ambiente de teste isolado com as variáveis
e secrets de teste corretos antes da tag. Não devem ser resolvidos copiando
segredos reais ou alterando o ambiente oficial.

## 7. Proposta de commit e tag

Proposta de commit, após revisão e staging seletivo:

```text
release(backend): prepare GoLeve V1 stable backend
```

Proposta de tag anotada:

```text
backend-v1.0.0
```

A tag só deve ser criada depois de a suite backend agregada passar no ambiente
isolado, do scanner verificar o índice staged e da confirmação de que o
Swagger/OpenAPI gerado não tem drift.

## 8. Sequência segura para publicação

1. Guardar o estado local e confirmar `git status --short`.
2. Rever cada diff existente; não usar reset, checkout, clean ou stash destrutivo.
3. Criar uma lista de paths aprovada para backend.
4. Executar `git add -- <paths-aprovados>` explicitamente, nunca `git add .`.
5. Rever `git diff --cached --stat` e `git diff --cached`.
6. Executar scanner de segredos no índice staged.
7. Reexecutar build, Compose, Swagger e suite backend isolada.
8. Obter confirmação para commit.
9. Criar o commit com o trailer de coautoria exigido pelo projeto.
10. Obter confirmação separada para tag, push e eventual Pull Request.

Nesta fase não foi feito staging nem commit. O próximo passo seguro é corrigir
o ambiente de teste isolado das duas pendências acima e só depois pedir
autorização para staging seletivo.

## 9. Atualização após correção dos testes

As duas falhas de configuração foram corrigidas sem alterar a lógica de
produção nem o ambiente Docker oficial:

1. `auth-service/tests/administration.integration.test.cjs` agora só executa
   a suite de integração quando `ADMINISTRATION511_TEST_MONGO_URI` está
   explicitamente configurada. Sem uma MongoDB de teste isolada, a suite é
   marcada como `skip`, em vez de converter a ausência da variável num URL
   `http:` inválido. Nenhuma credencial ou base oficial é utilizada.
2. `notification-service/tests/readiness.test.cjs` desativa explicitamente o
   modo local-demo antes de importar o servidor. Assim, os testes com mocks
   não tentam ler `/run/secrets/local_demo_identities`; a política de
   local-demo em produção permanece inalterada.

### Validação final

| Validação | Resultado |
|---|---|
| Testes Auth individuais | 9 aprovados; integração corretamente omitida sem MongoDB de teste |
| Testes Notification individuais | 14 aprovados |
| Suite agregada backend | 214/214 aprovados; 0 falhas |
| Build dos workspaces backend e Gateway | Passou |
| Swagger/OpenAPI e testes API docs | Passou: 215 operações, 170 caminhos, 20/20 testes |
| Contentores oficiais | Passou: 14/14 healthy |
| MongoDB oficial | Passou: `goleveV1`, PRIMARY |

Não foram executadas operações de staging, commit, push, merge, branches ou
tags. Não foram reiniciados contentores nem modificados dados, volumes ou
segredos oficiais. A integração Auth continua dependente de uma MongoDB de
teste isolada para ser exercitada; isso não bloqueia a suite local agregada,
mas deve ser coberto no pipeline de release antes de declarar cobertura de
integração completa.

## 10. Validação final da integração Auth e release

Foi criado um MongoDB temporário exclusivo para testes, com replica set
`administration511`, apenas em loopback, sem portas públicas, sem mounts e
com `tmpfs`. Foram usados somente uma base de dados sintética por execução,
uma credencial de instalação sintética e uma chave MFA sintética, fornecidas
por ficheiros temporários no processo de teste.

| Validação | Resultado |
|---|---|
| Auth unit + integration com MongoDB isolado | **47/47 aprovados, 0 falhas, 0 omitidos** |
| Auth integration sem `ADMINISTRATION511_TEST_MONGO_URI` | Skip seguro confirmado; 0 testes executados |
| Suite agregada backend | **214/214 aprovados, 0 falhas, 0 omitidos** |
| Builds dos 11 serviços e Gateway | Passou |
| Swagger/OpenAPI | Passou: 215 operações, 170 caminhos |
| Testes Swagger/API docs | **20/20 aprovados** |
| Contentores oficiais | **14/14 healthy** |
| MongoDB oficial | `goleveV1`, PRIMARY |

O contentor temporário e os ficheiros sintéticos foram removidos. Não foram
alterados `.env`, backups, volumes, bases de dados, mensagens RabbitMQ ou
contentores oficiais.

### Lista final para staging seletivo

Sem executar staging, a lista funcional permanece limitada a:

- `backend/` — código, testes, Dockerfiles, runtime e dependências do backend;
- `compose.yaml` e templates de configuração não secretos;
- `scripts/` — apenas scripts referenciados por instalação, migração,
  recuperação ou validação;
- `documentation/api/`, `documentation/architecture/`,
  `documentation/consolidation-v1.md`, `documentation/swagger-audit-v1.md`,
  `documentation/backend-v1-release-plan.md` e `README.md`.

Ficam fora: `.env`, `.secrets/`, `.local/`, `.demo/`, `.integration/`,
`protected-backups/`, logs, `dist/`, caches, resultados Playwright, dados
locais, backups, e todas as alterações de Web/Mobile. A lista deve continuar
a ser adicionada por caminhos explícitos, nunca por `git add .`.

O scan final dos candidatos não encontrou credenciais operacionais, chaves
privadas, tokens GitHub/Slack, dados MongoDB ou ficheiros `.env` reais. O
único marcador sensível conhecido continua a ser uma fixture negativa
intencional já documentada. A instalação nova permanece reprodutível através
de `backend/package-lock.json`, Compose, `.env.example`, scripts de
inicialização e documentação; segredos e volumes devem ser gerados no destino.

O backend está preparado tecnicamente para a tag proposta `backend-v1.0.0`,
mas nenhuma operação Git de publicação foi executada. Continua necessária
autorização explícita para staging seletivo, revisão do índice staged, commit,
tag e push.
