# Plano de auditoria e limpeza do repositório GoLeve V1

Data: 2026-11-03. Esta execução foi somente de leitura. Nenhum ficheiro foi
apagado ou movido, nenhum contentor foi alterado e nenhum volume/base de dados
foi tocado.

## 1. Estado atual

Raiz auditada:

`C:\Users\juanp\OneDrive\Documents\GitHub\Goleve`

Estrutura funcional principal:

```text
backend/             11 microserviços, API Gateway, runtime, dependências
frontend/            Web, Mobile, partilhado e testes
infrastructure/      configurações de infraestrutura
scripts/             demonstração, integração, backup, restauro e manutenção
documentation/       arquitetura, APIs, operação e validações
tests/               testes de raiz
compose.yaml         stack oficial dos 14 contentores
compose.*.yaml       ambientes demo, integração e testes isolados
.env                 configuração local real; preservar
.secrets/             segredos locais; preservar
.local/              evidências e resultados locais; revisar individualmente
.demo/               artefactos ignorados do ambiente demo; revisar
.integration/        artefactos ignorados de integração; revisar
protected-backups/   backup/evidências protegidos; preservar
```

Estado Git observado:

| Categoria | Quantidade | Decisão |
|---|---:|---|
| Ficheiros rastreados | 643 | Preservar e rever apenas mudanças solicitadas |
| Ficheiros não rastreados não ignorados | 104 | Não apagar; separar código/documentação de artefactos |
| Ficheiros modificados localmente | 96 | Preservar; não usar reset/checkout |

O worktree contém alterações locais anteriores de código, Compose,
documentação e geração OpenAPI. A limpeza não deve misturar essas alterações
com uma futura remoção.

## 2. Classificação de candidatos

Os caminhos abaixo são relativos à raiz do repositório. O caminho absoluto
correspondente é sempre
`C:\Users\juanp\OneDrive\Documents\GitHub\Goleve\` seguido do caminho indicado.

| Caminho | Tipo/finalidade | Referências/dependências | Classificação | Justificação e impacto |
|---|---|---|---|---|
| `docker-inventory-before-cleanup.csv` | CSV de inventário operacional | Não há referências textuais; não rastreado | **REMOVER, após autorização** | Snapshot histórico sem uso automatizado. Impacto: perde-se esse inventário bruto, mas os resultados consolidados permanecem na documentação. Preservar uma cópia externa se for necessário para auditoria. |
| `frontend/.cache/` | Logs e caches de builds/testes | Ignorado pelo Git; regenerável pelos scripts frontend | **REMOVER, após validação** | Não é código nem fixture. Impacto: apenas perda de logs/caches locais. |
| `frontend/test-results/` | Artefactos Playwright, screenshots e `.last-run.json` | Ignorado pelo Git; produzido pelos testes | **REMOVER, após validação** | Resultados regeneráveis; não são fixtures. Impacto: desaparecem evidências visuais locais não arquivadas. |
| `frontend/mobile/dist/` | Export/build Mobile gerado | Não é fonte; regenerável pelo package do Mobile | **REMOVER, após build** | Evita artefactos binários no worktree. Impacto: exige novo export para demonstração distribuída. |
| `frontend/web/dist/` | Build Web gerado | Não é fonte; regenerável pelo package Web | **REMOVER, após build** | Evita duplicar o output compilado. Impacto: exige novo build para servir a aplicação. |
| `.demo/` | Estado, logs e resultados de execução demo | Ignorado; relacionado a `scripts/demo.cjs` e `compose.demo.yaml` | **REVER** | O ambiente demo é operacionalmente documentado. Não remover a pasta inteira sem confirmar que não há fixtures/evidências necessárias; remover apenas logs/resultados antigos depois. |
| `.integration/` | Instâncias geradas de integração | Ignorado; criado por `scripts/integration.cjs` e `compose.integration.yaml` | **REVER** | Pode conter estado de uma integração ainda reproduzível. Confirmar que não há execução ativa e preservar qualquer evidência necessária antes de remover instâncias antigas. |
| `.local/` | Evidências de backup, Payment, RabbitMQ e testes | Ignorado; referenciado por `documentation/consolidation-v1.md` e scripts | **MANTER / REVER individualmente** | Contém `payment-index-recovery.json`, `rabbitmq-recovery-state.json`, manifestos e históricos usados na consolidação. Não remover em bloco. Logs repetidos podem ser arquivados somente após mapear a evidência canónica. |
| `protected-backups/` | Backup cifrado, manifestos e verificação de restauro | Guardrail operacional e documentação de restauro | **MANTER** | Backup validado e evidências essenciais. Remoção proibida nesta fase. |
| `.secrets/` | Chaves e credenciais locais | Montado por Compose/scripts; ignorado | **MANTER** | Necessário ao ambiente local. Nunca apagar ou versionar. |
| `compose.demo.yaml` | Stack demo isolada | Referenciada por `scripts/demo.cjs` e documentação | **MANTER** | Necessária para demonstrações fictícias e separada da stack oficial. |
| `compose.integration.yaml` | Stack de integração isolada | Referenciada por `scripts/integration.cjs` e documentação | **MANTER** | Necessária aos testes de integração; não é duplicado da stack oficial. |
| `compose.mongodb-replica-test.yaml` | MongoDB temporário para testes de replica set | Referenciada pela documentação de arquitetura | **MANTER** | Teste isolado de infraestrutura, sem volumes oficiais. |
| `compose.mongodb-restore-test.yaml` | MongoDB temporário de restauro | Referenciada por `Invoke-MongoRestoreValidation.ps1` e documentação | **MANTER** | Procedimento de validação de backup/restauro. |
| `integration.env.example` | Template do CLI de integração | Referenciada em documentação e pelo fluxo de integração | **MANTER** | Não duplica o `.env.example`; descreve variáveis do projeto isolado gerado. |
| `backend/api-gateway/.env.example` | Template Swagger local | Referenciado em `documentation/api/swagger-ui.md` | **MANTER** | Necessário para a interface Swagger local sem credenciais de serviço. |
| `backend/services/ai-coach-service/.env.example` | Template do serviço opcional | Configuração específica do serviço | **MANTER** | Documenta modo desativado, provider e chaves por ficheiro sem segredos. |
| `frontend/mobile/.env.example` | Origem pública para Mobile | Usado na configuração de build Mobile | **MANTER** | Configuração específica de emulador/dispositivo. |
| `frontend/web/.env.example` | Origem pública para Web | Usado na configuração de build Web | **MANTER** | Configuração específica do frontend Web. |
| `.env.example` | Defaults Compose e modo local | Referenciado pelo Compose/README | **MANTER** | Template raiz necessário; não contém credenciais reais. |

## 3. Ficheiros que não devem ser removidos

- `.env` real, `.secrets/`, volumes Docker e quaisquer bases de dados.
- `compose.yaml`, Dockerfiles, scripts de migração, backup, restauro e
  recuperação.
- `documentation/api/`, `documentation/architecture/`,
  `documentation/swagger-audit-v1.md` e documentação de instalação.
- OpenAPI canónico e artefacto gerado do Gateway.
- Testes de Gateway, Payment, restauro, retenção, integração e frontend.
- Código não rastreado que implementa o modo local-demo e foi preparado para a
  execução atual; deve ser revisto como código, não tratado como lixo.
- `protected-backups/` e evidências de `restoreValidated=true`.

## 4. `.gitignore`

O `.gitignore` já cobre `node_modules/`, `dist/`, `.env` (mantendo
`.env.example`), `.local/`, `.secrets/`, `.demo/`, `.integration/`,
`protected-backups/`, `*.log` e artefactos de chaves/backup. Não é necessário
adicionar regras para os candidatos já cobertos.

Recomendação antes da próxima limpeza: confirmar se os runners usam
`frontend/test-results/` ou `frontend/.cache/` como artefactos exportados.
Se não usarem, manter as regras existentes e remover apenas os outputs locais
regeneráveis. Não adicionar uma regra ampla que esconda novas evidências
operacionais sem revisão.

## 5. Estrutura final proposta

```text
backend/ frontend/ infrastructure/ scripts/ tests/
documentation/ compose.yaml compose.demo.yaml compose.integration.yaml
compose.mongodb-replica-test.yaml compose.mongodb-restore-test.yaml
.env.example integration.env.example

# Apenas local, ignorado e fora do pacote versionado:
.env .secrets/ .local/ .demo/ .integration/ protected-backups/
```

Os outputs `dist/`, caches Playwright e `test-results/` devem existir apenas
durante builds/testes locais, não como parte do estado mantido do repositório.

## 6. Validação obrigatória após futura limpeza

Executar a partir da raiz, sem operações destrutivas:

```powershell
git status --short
docker compose -f compose.yaml -p goleve ps
docker inspect goleve-mongodb-1 --format '{{.State.Health.Status}}'
docker inspect goleve-rabbitmq-1 --format '{{.State.Health.Status}}'
docker inspect goleve-payment-service-1 --format '{{.State.Health.Status}}'
Invoke-WebRequest http://127.0.0.1:3000/health
Invoke-WebRequest http://127.0.0.1:3000/ready
Invoke-WebRequest http://127.0.0.1:3000/api-docs/openapi.json
node scripts/gateway-swagger.cjs
node --test backend/api-gateway/tests/api-docs.test.cjs
```

Depois, em ambientes apropriados e sem dados oficiais, executar os builds
Web/Mobile e os testes essenciais definidos nos respetivos `package.json`.
Os testes Docker/demo/integration devem usar as suas instâncias isoladas e
nunca o Compose oficial sem autorização explícita.

Critérios: 14/14 contentores oficiais healthy, MongoDB `goleveV1` PRIMARY,
RabbitMQ healthy, Payment healthy, Swagger com 215 operações públicas, builds
Web/Mobile válidos e testes essenciais aprovados.

## 7. Próximo passo condicionado

Esta execução não removeu nada. Antes de qualquer ação futura, é necessária
autorização explícita para cada grupo:

1. `frontend/.cache/` e `frontend/test-results/`;
2. `frontend/mobile/dist/` e `frontend/web/dist/`;
3. `docker-inventory-before-cleanup.csv`;
4. logs antigos selecionados em `.demo/` e `.local/`;
5. instâncias específicas e inativas em `.integration/`.

Não autorizar remoção global de `.local/`, `.demo/`, `.integration/`,
`protected-backups/` ou `.secrets/` sem revisão individual dos ficheiros.
