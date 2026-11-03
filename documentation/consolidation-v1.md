# Consolidação GoLeve V1 — registo operacional

Data: 2026-11-03. Repositório oficial `GitHub/Goleve`, branch preservada
`integration/frontend-v1`. Trabalho local anterior preservado. Sem operações Git
de publicação ou alteração de branch. A instalação antiga não é utilizada.

## Mongo Express opcional — 2026-11-03

- Foi adicionado ao `compose.yaml` apenas no perfil `tools`, com a imagem
  `mongo-express:1.0.2-20`.
- A ligação usa exclusivamente `mongodb:27017/?replicaSet=goleveV1` na rede
  externa `goleve_backend`; não há MongoDB adicional, volume ou alteração de
  dados.
- A interface está publicada apenas em `127.0.0.1:8081` e exige autenticação
  Web cujas credenciais estão no `.env` local ignorado pelo Git.
- `docker compose ... config --quiet` passou. A porta estava livre antes da
  ativação; a autenticação HTTP respondeu 200 e a interface apresentou as 10
  bases esperadas: `goleve_auth`, `goleve_user`, `goleve_training`,
  `goleve_hydration`, `goleve_performance`, `goleve_agenda`,
  `goleve_professional`, `goleve_management`, `goleve_payment` e
  `goleve_notification`.
- O Mongo Express está operacional em `goleve-mongo-express-1`; MongoDB e os
  14 contentores oficiais permaneceram `healthy` (14/14). Não foram alterados
  replica set, índices, bases, volumes ou RabbitMQ.
- Na primeira ativação, o Compose reportou uma colisão com um contentor legado
  chamado `mongo-express-goleve` e reconciliou esse recurso ao criar o serviço
  do perfil. O contentor legado não existe no inventário atual; nenhum volume
  foi montado. Para evitar nova colisão com ambientes antigos, os comandos
  documentados usam o projeto separado `goleve-tools` e nunca `--remove-orphans`.

## Recuperação RabbitMQ controlada — 2026-11-03

- Pré-validações aprovadas: MongoDB `goleveV1` PRIMARY, Payment healthy, zero
  operações críticas, zero eventos outbox pendentes, configuração
  exclusivamente local-demo/MockBank, volume `goleve_rabbitmq_data` associado
  ao contentor oficial e evidências de backup/restauro disponíveis.
- Snapshot anterior preservado em `.local/rabbitmq-recovery-state.json`. A
  topologia tinha 4 filas, 11 exchanges e 9 bindings. A fila
  `goleve.agenda.professional.events` tinha 4 mensagens persistentes ready,
  zero unacked e zero consumidores.
- Foi parado e iniciado apenas `goleve-rabbitmq-1`, sem recriação, purge,
  ACK manual, alteração de volumes ou alteração de configuração. Durante a
  indisponibilidade, foi criada uma única intenção fictícia MockBank e
  confirmada uma única vez. O correlation ID foi
  `rabbit-recovery-…8601`; o identificador do pagamento não é publicado.
- A intenção persistiu como `approved`, com uma aprovação, um único evento de
  outbox `payment.simulated.approved.v1` inicialmente `pending`. Após o
  restauro do broker, passou a `published`; a notificação correspondente e o
  registo de processamento existem exatamente uma vez cada.
- A Management API voltou a responder HTTP 200. A fila de retenção manteve
  exatamente 4 mensagens persistentes, zero unacked, zero consumidores e a
  mesma topologia. As filas de notificação ficaram sem backlog inesperado.
- Resultado final: RabbitMQ healthy, MongoDB healthy/PRIMARY, Payment healthy
  e os 14 contentores oficiais healthy. Não foram observadas cobranças reais,
  duplicações, alterações indevidas de dados ou pendências.

## Auditoria Swagger/OpenAPI — 2026-11-03

A auditoria de documentação pública foi concluída sem alterações de contratos
ou infraestrutura. O resultado detalhado está em
[documentation/swagger-audit-v1.md](swagger-audit-v1.md): 215/215 operações
públicas documentadas, 170 caminhos, zero rotas públicas em falta ou
inexistentes, validação OpenAPI/generation aprovada e Swagger UI operacional em
`http://127.0.0.1:3000/api-docs`. O teste browser opcional foi apenas
ignorado por ausência de executável configurado.

## Diagnóstico confirmado

- O Compose oficial declara 14 componentes, mas usa configurações antigas:
  MongoDB standalone, Node em produção, Payment exclusivamente de demonstração
  e Management sem base/credenciais técnicas. Os contratos atuais exigem mais
  configuração do que esse Compose fornece.
- Inventário inicial: 38 contentores, todos parados; 14 pertencem ao caminho
  oficial `compose.yaml`. Dois contentores antigos também usam o projeto
  `goleve`, mas outro caminho Compose; não são componentes oficiais.
- Volumes protegidos: `goleve_mongo_data`, `goleve_rabbitmq_data`. Os outros
  ambientes e volumes permanecem preservados; nenhum é removido automaticamente.
- Bases de aplicação existentes: `goleve_auth`, `goleve_user`, `goleve_agenda`,
  `goleve_professional`. São preservados os nomes singulares efetivos; os nomes
  plurais da proposta não justificam migração. Os outros serviços só tornam as
  suas bases visíveis quando coleções/índices forem inicializados.
- MFA administrativo depende de sessões, step-up, quórum e contratos internos.
  Não existe uma flag global segura `MFA_ENABLED=false`. A política autorizada
  é uma autoridade separada `local-demo` para cinco identidades fictícias, sem
  declarar `mfa=true` e sem substituir aprovação independente.
- Elegibilidade sintética e pagamento integrado ainda exigem bases isoladas
  e URI loopback. Não basta trocar uma variável para ativá-los no Docker.

## Configuração local, sem valores secretos

`node scripts/local-runtime.cjs prepare` cria os `.env` efetivos em cada um dos
11 serviços, Gateway, Web e Mobile, acrescentando apenas variáveis ausentes.
Não lê `.env.example`, não arranca Docker, não cria contas ou bases. Conserva
valores existentes, recusa JWT inseguro e ficheiros sensíveis já versionados.
Chaves ausentes são geradas em `.secrets/local-runtime/`; a chave User existente
não é substituída. Os nomes operacionais são sempre `.env`.

`node scripts/local-runtime.cjs env-audit` lista apenas caminhos e nomes de
variáveis; `docker-audit` grava inventário sem valores de ambiente em
`.local/runtime-audit.json`. Não publicar estes artefactos locais.

## MongoDB: preparação, backup e recuperação

Autorização recebida: conversão de um membro apenas depois de inventário,
backup completo cifrado e restauro isolado validado. Antes da operação:

- Disco Windows: aproximadamente 11,8 GiB livres; filesystem Docker com mais
  de 900 GiB disponíveis (disco virtual dinâmico limitado também pelo host).
- Memória Docker/WSL disponível: aproximadamente 6,6 GiB; total 7,7 GiB.
- Origem `mongo:7`, versão 7.0.45, volume `goleve_mongo_data`, sem escritores
  da aplicação ativos. Inicializado apenas o contentor Mongo oficial existente.
- As 11 ligações usam Mongoose/driver com suporte a replica set. Preservar
  host interno `mongodb`, portas e nomes das bases; acrescentar `replicaSet`
  às URIs após a conversão, sem renomear dados. AI desativado não abre ligação.
- Recuperação: parar os escritores antes de qualquer intervenção; preservar
  volume e configuração anterior em `.local/compose-before-consolidation.yaml`.
  Se a conversão falhar, não iniciar os serviços nem tentar restaurar por cima
  dos dados. Diagnosticar o estado de `mongod` e decidir, numa janela aprovada,
  o regresso à configuração standalone com a mesma imagem/volume. O arquivo
  cifrado e a chave própria permitem recuperação posterior em destino vazio;
  um restauro sobre o volume oficial requer nova autorização.

O comando `node scripts/mongodb/consolidation-backup.cjs backup` faz streaming
binário de `mongodump --archive --gzip` para AES-256-GCM. Não grava arquivo
decifrado em disco nem imprime conteúdo. SHA-256, nonce, tag, imagem de origem,
contagens, hashes dos documentos e definições de índices ficam num manifest
local; a chave independente permanece em `.secrets/local-runtime/`.

Backup executado em `protected-backups/local-runtime/2026-11-03T00-49-57-716Z-f6f66cb0`:
restauro completo validado num único Mongo temporário, sem portas, com rede
interna própria, `/data/db` e `/data/configdb` em tmpfs e limite de 512 MiB.
Cinco bases comparadas (incluindo `admin`), sete documentos, coleções, conteúdo
EJSON e índices coincidentes. `local` e sessões voláteis de `config` não fazem
parte da comparação de dados da aplicação. O contentor e a rede temporários
foram removidos após validação; nenhum volume existente foi alterado.

Guardar juntos o manifest e o arquivo cifrado e preservar a chave separadamente.
Não mover a única cópia da chave nem do backup durante a consolidação.

## Estado da execução

Preparação `.env` e backup/restauro concluídos. O Compose combinado foi validado
e apenas o MongoDB oficial foi recriado com o mesmo volume, para ativar
`--replSet goleveV1`. O primeiro comando de inicialização falhou antes de
`replSetInitiate`: `mongosh` lança `NotYetInitialized` (94), em vez de devolver
um resultado com esse código. O comando tratava apenas o segundo caso.
Nenhum dado da aplicação foi alterado; `hello` confirma configuração ainda
ausente e o mesmo volume. Execução de infraestrutura suspensa e solicitada
autorização para retomar com tratamento explícito da exceção esperada. O novo
inicializador tem testes para estado inicial, idempotência e recusa de estados
inesperados. A configuração das 11 URIs já inclui o nome previsto do replica
set, conservando bases e credenciais. Os outros 13 oficiais continuam parados.

Validação offline: **12 testes aprovados**, incluindo preservação de valores,
idempotência, ficheiros vazios, duplicados, auditoria sem valores, recusa de
caminhos sensíveis e inicialização do replica set com a exceção esperada.
Segunda execução do preparador: zero variáveis alteradas em todos os 14 `.env`
por serviço/frontend. `git diff --check` sem erros; nenhum `.env`, `.key` ou
ficheiro `.secrets/` está versionado.

Política local-demo, seeds funcionais, validação dos 14 componentes e testes de APIs ainda precisam
de execução e resultados concretos. Este registo será atualizado sem apagar
falhas. Não representa prontidão para produção pública.

## Retoma autorizada e validação do replica set

A retoma foi explicitamente autorizada pelo utilizador em 2026-11-03.
Antes de executar: backup cifrado presente, SHA-256 coincidente, manifest com
restauro validado, chave preservada, imagem original e volume
`goleve_mongo_data` confirmados. Apenas MongoDB estava ativo. O hostname
`mongodb` resolveu para o IP do próprio membro em `goleve_backend`.

O inicializador tratou `NotYetInitialized` (94), executou `replSetInitiate`
**uma única vez** e aguardou PRIMARY. Resultado:

| Verificação | Resultado |
|---|---|
| Replica set | `goleveV1` |
| Membro | `mongodb:27017`, único, PRIMARY, health 1 |
| Contentor | `273df6d8f17d`, mesmo volume de dados e imagem MongoDB |
| Bases e coleções originais | Preservadas, hashes de conteúdo e índices coincidentes |
| Dados originais | Quatro bases de aplicação, seis documentos; `admin` tinha um documento |
| URIs dos 11 serviços | Todas ligaram na rede Docker com `replicaSet=goleveV1` |
| Transação real de leitura snapshot | Commit confirmado pelo servidor, delta +1 |
| Segunda transação de leitura snapshot | Abort confirmado pelo servidor, delta +1 |
| Escritas da aplicação e documentos de teste | Zero |
| Outros serviços iniciados | Zero |

A comparação estrita inicial assinalou a nova coleção `admin.system.keys`
(dois documentos). A execução foi pausada para diagnóstico: todas as coleções
anteriores, incluindo `admin.system.version`, mantinham conteúdo e índices.
Trata-se apenas dos metadados de assinatura interna criados pelo replica set.
O verificador de conversão aceita exclusivamente essa adição; não relaxa a
comparação do backup/restauro nem ignora alterações a dados existentes.

O teste transacional foi **de leitura**, com snapshot, commit e abort, sem
inserir documentos em coleções funcionais ou criar uma base de teste. Não
substitui testes de escrita, concorrência ou transações dos serviços de domínio.
Foram consultados Auth e Agenda através de uma sessão administrativa de teste;
o código dos microserviços não passou a aceder às bases de outros proprietários.

`scripts/mongodb/validate-official-replica.cjs` torna a validação repetível
enquanto apenas MongoDB estiver ativo. Recusa identidade, volume ou diferenças
inesperadas. Executado com o diretório do backup como argumento. Evidência local
sem valores de credenciais em `.local/mongo-replica-validation.json`.

As onze URIs foram testadas através do driver do mongosh dentro da rede Docker;
os processos Node.js dos serviços não foram iniciados. Um ping a uma base vazia
não a cria nem comprova coleções ou índices ainda não inicializados. O AI Coach
continua desativado. A operação não validou HTTP, MFA local-demo, contas, seeds,
RabbitMQ, Web ou Mobile, que permanecem trabalho pendente da consolidação.

Fecho da verificação: MongoDB **healthy**; apenas esse contentor está em execução.
Os outros 37 contentores do inventário, incluindo os 13 oficiais restantes,
conservam IDs, imagens, estados e mounts. Compose validado novamente sem erros.
Suite offline atualizada: **15 testes aprovados**, incluindo preservação da
ordem dos campos de índices compostos e deteção de diferenças inesperadas.
`git diff --check` sem erros. Backup, chave e evidências locais continuam
ignorados pelo Git; nenhuma credencial é apresentada neste relatório.

## Consolidação seguinte — 2026-11-03

Esta secção atualiza o estado acima, preservando a sequência histórica. O replica
set **não foi novamente inicializado**. Os 14 componentes oficiais estão agora
`running / healthy`, identificados pelo caminho do Compose deste repositório.
Gateway: `http://127.0.0.1:3000`. Apenas estes 14 contentores estão ativos; os
24 contentores antigos conservam IDs, imagens, estados e mounts do inventário.
Não foram efetuados commit, push, merge, migrações de dados ou limpezas Docker.

### Configuração operacional e arranque

O `compose.yaml` oficial declara `name: goleve`, os 11 serviços independentes,
Gateway e infraestrutura. Cada processo Node recebe explicitamente o seu `.env`
por `env_file`; o `.env` da raiz serve a interpolação do Compose. Os Dockerfiles
mantêm os npm workspaces, compilação por proprietário e utilizador não root.
O módulo de política em `backend/runtime/` é copiado para cada imagem: não
introduz um serviço central adicional nem partilha coleções entre proprietários.

`scripts/local-runtime.cjs prepare` cria apenas configuração ausente, conserva
valores existentes e exige caminhos ignorados pelo Git. Não lê templates em
execução, não arranca Docker e não faz seed. Não cria novos `.env.example`.
Os valores existentes do broker foram preservados; uma URI antiga na raiz não
é considerada prova das credenciais do volume persistente. Foi corrigida uma
divergência entre a configuração inicialmente preparada e a do broker oficial,
sem alterar a conta ou password persistente do RabbitMQ.

```powershell
node scripts/local-runtime.cjs prepare
node scripts/local-runtime.cjs env-audit
# Preparação explícita local-demo; preserva a instância e o cofre existentes.
node scripts/local-demo.cjs plan
docker compose -f compose.yaml -p goleve config --quiet
docker compose -f compose.yaml -p goleve up -d
docker compose -f compose.yaml -p goleve ps
```

Não repetir `plan` para tentar corrigir um manifesto expirado: a validade é
verificada e não se prolonga automaticamente a autorização. A preparação desta
instância tem validade de 30 dias. Uma renovação exige decisão explícita e
revalidação dos dados. Construir somente imagens cujo código/configuração de
imagem mudou, por exemplo `docker compose -f compose.yaml -p goleve build auth-service`.
Para aplicar uma imagem já construída de um serviço: `up -d --no-deps --no-build
<serviço>`. Não usar `--remove-orphans`: há contentores antigos com etiquetas do
mesmo projeto. MongoDB e RabbitMQ usam os volumes externos originais e a rede
`goleve_backend`; volumes ausentes provocam erro em vez de uma instalação vazia.
Não executar `rs.initiate()` nesta instalação já inicializada.

As 12 imagens Node foram construídas explicitamente porque receberam a política
partilhada; posteriormente só foram reconstruídos os serviços com correções.
MongoDB conservou o contentor `273df6d8f17d`, a imagem e o volume original. Foi
observado parado com exit 0, sem OOM, antes do arranque desta etapa; a origem
dessa paragem não foi atribuída ao Codex. Foi iniciado o mesmo contentor,
confirmando PRIMARY, sem nova inicialização do replica set.

### Política local-demo e cinco identidades

| Identidade fictícia | Papel global | Capacidade/âmbito |
|---|---|---|
| `utilizador@demo.goleve.test` | utilizador | Dados pessoais próprios |
| `pt@demo.goleve.test` | profissional | Personal Trainer sintético |
| `nutricionista@demo.goleve.test` | profissional | Nutricionista sintético |
| `gestor@demo.goleve.test` | gestor | Apenas os dois serviços canónicos das fixtures |
| `admin@demo.goleve.test` | administrador | Supervisão limitada às cinco identidades |

As cinco contas existem no Auth, com bcrypt, IDs estáveis e marcador imutável de
instância. Passwords aleatórias não são impressas nem versionadas: ficam num
cofre AES-256-GCM, com chave separada, em `.secrets/local-runtime/`. A consulta
manual num terminal Windows interativo copia apenas a password selecionada:

```powershell
node scripts/local-demo.cjs credentials utilizador@demo.goleve.test
# Depois de utilizar a credencial, limpar a área de transferência:
Set-Clipboard -Value ''
```

O agente não executou essa consulta interativa. Os testes leem o cofre apenas
em memória. Não partilhar `.env`, cofre, chaves, manifesto, dados ou backups.
Proteger também o histórico/sincronização da área de transferência do Windows.

A ativação exige cumulativamente `NODE_ENV=development|test`,
`GOLEVE_RUNTIME_MODE=local-demo`, `GOLEVE_LOCAL_DEMO_ENABLED=true`, instância
explícita, Gateway loopback e manifesto válido das cinco identidades exatas.
`LOCAL_DEMO_OWNER` identifica o proprietário; `LOCAL_DEMO_IDENTITIES_FILE`
aponta para o secret montado. Produção recusa a ativação, mesmo com a flag ligada.
Cada serviço reconhece explicitamente a autoridade; ID/email/papel/instância
incoerentes, manifesto expirado ou autoridade sintética fora do modo são negados.

Sessões e JWT identificam `authority=local-demo` e a instância. **Nunca indicam
MFA verificado**: as sessões destas contas têm `mfa=false`. Administradores reais
continuam sujeitos a TOTP/MFA. Não se alterou a política global para tornar MFA
opcional. O step-up local usa password, expira em cinco minutos e mantém vínculo
à sessão, ação, alvo e parâmetros, com consumo único atómico. Apenas suspensão,
reativação e revogação de sessões de outras contas fictícias não administrativas
são elegíveis. Alterações de papel, convites administrativos, bootstrap e
aprovações independentes não têm bypass de demonstração.

O contrato Auth–Professional usa credencial técnica própria, audiência, prazo
curto, assinatura do corpo e proteção de replay. Só devolve identidade/papel
atual de fixtures ativas. Nunca usa a chave JWT para autenticação entre serviços,
não altera identidades e não é exposto pelo Gateway.

As candidaturas profissionais continuam `pending`, sem publicação real e sem
credenciais oficialmente verificadas. Entitlements separados identificam a
elegibilidade como **synthetic**, com origem CLI, instância e validade. O Gestor
tem um grant sintético separado das atribuições administrativas reais, limitado
aos IDs de serviços validados no Professional. Alterações de papel/estado,
expiração e revogação continuam verificadas no backend em cada operação.

Foi encontrado e corrigido acesso indevido à listagem de grants sintéticos por
utilizador/profissional: agora exige Gestor/Administrador e devolve 403 aos
restantes perfis. A correção foi reconstruída e validada por HTTP real.

### Seeds, bases e preservação

O seed é manual e executado dentro de cada serviço, usando apenas os seus
modelos e a sua base. Não existe acesso direto entre bases no código de domínio.
Exemplo, após revisão da configuração local-demo:

```powershell
docker compose -f compose.yaml -p goleve exec -T -e LOCAL_DEMO_SEED_ACK=explicit-fictional-preparation auth-service node /app/runtime/seed-runner.cjs
```

Repetir para User, Training, Hydration, Performance, Agenda, Professional,
Management e Notification, pela mesma ordem; Professional deve preceder
Management porque os serviços canónicos são confirmados por API. Payment não
recebe aprovações inseridas por seed: os pagamentos são criados pelas APIs reais
do MockBank. AI Coach não recebe respostas ou históricos artificiais.

Cada escrita de seed e a sua proveniência são guardadas na mesma transação
MongoDB. O journal impede duplicações e o seed recusa colisões com registos
existentes ou falta de proveniência; não substitui edições legítimas. A primeira
execução criou **79 documentos**. A segunda criou **zero**, reconhecendo os 79.
Foi corrigida a seleção da versão Mongoose por workspace: o runner carrega a
dependência do proprietário, evitando misturar ligações Mongoose 8 e 9.

| Base efetiva | Proprietário | Coleções verificadas | Documentos no inventário final* |
|---|---|---:|---:|
| goleve_auth | Auth | 14 | 63 |
| goleve_user | User | 7 | 28 |
| goleve_training | Training | 5 | 14 |
| goleve_hydration | Hydration | 5 | 44 |
| goleve_performance | Performance | 5 | 18 |
| goleve_agenda | Agenda | 14 | 102 |
| goleve_professional | Professional | 14 | 138 |
| goleve_management | Management | 8 | 61 |
| goleve_payment | Payment | 4 | 6 |
| goleve_notification | Notification | 4 | 28 |
| goleve_ai_coach | AI Coach | — | Desativado; base funcional não inicializada |

*Incluem journals, auditorias, sessões e eventos; não são contagens de clientes.
Coleções TTL podem variar. Nomes singulares preexistentes foram preservados;
não foram renomeados para os nomes indicativos da proposta inicial. O inventário
local contém a definição de todos os índices, incluindo unicidade e TTL.

`scripts/local-demo-audit.cjs` confirmou **todos os documentos originais e índices
anteriores** por comparação com o backup verificado. Só separa os novos dados
cujo titular é uma das cinco fixtures e, nas duas coleções de auditoria, registos
cujo ator pertence a essas identidades. A comparação inicial sinalizou esses
novos registos; não existia alteração aos dados antigos. Os três utilizadores
Auth e as três atividades Agenda anteriores permanecem preservados. Não foram
apagados documentos, históricos, coleções ou índices.

### Integração real e testes

| Verificação executada | Resultado |
|---|---|
| Builds TypeScript dos 12 workspaces Node / imagens por proprietário | Aprovados |
| Suite backend/configuração/fixtures, sem DB principal | 131 aprovados |
| Testes unitários frontend | 107 aprovados |
| Regressão Playwright com respostas simuladas | 98 aprovados |
| Chrome, cinco contas, API real no Gateway oficial | 5 aprovados |
| Sonda HTTP real local-demo | 55 aprovados, zero falhas |
| Reentrega real de evento de pagamento já publicado | Delivery/ACK confirmados; uma única notificação |
| Expo export Android e iOS | Ambos aprovados; não é execução em dispositivo |
| OpenAPI e Swagger gerado | 215 operações, 170 caminhos, 11 serviços |
| Seeds repetidos | 0 criações, 79 reconhecidos |
| Inventário final | 14 oficiais healthy; 24 antigos preservados |
| Outbox pendente / pagamentos em processamento ou unknown | 0 / 0 |

As verificações HTTP cobrem login dos cinco perfis sem MFA, marcação explícita
da autoridade, sessões persistidas/revogação, dados pessoais, treino, hidratação,
medições, agenda pessoal, catálogo sintético, âmbitos e indicadores com supressão
de contagens. Cobrem também preços exclusivamente do backend, reservas aceites
manualmente, conflito de pedidos simultâneos, confirmação concorrente de pagamento,
estados MockBank aprovado/recusado/cancelado/pendente, entrega de notificação por
RabbitMQ, negação de acesso de terceiros, proteção de endpoints internos, CORS e
step-up vinculado/consumido uma única vez. Não são pagamentos bancários reais.

Os testes Chrome reais fazem login e consultam ecrãs por menus da aplicação, sem
identidades simuladas no produto. Traces/vídeos estão desativados para evitar
captura de credenciais. Existem cinco capturas posteriores ao login em
`frontend/.cache/local-demo-browser/`, apenas com dados fictícios. Dois percursos
falharam inicialmente porque o teste fazia recarregamento completo por `goto`,
perdendo o token Web deliberadamente mantido em memória. Corrigiu-se a navegação
do teste para os links SPA reais; a aplicação não passou a persistir o JWT.

Web usa `.env` com `VITE_API_BASE_URL=http://127.0.0.1:3000` e abre com `cd frontend;
npm run dev:web`. Tokens Web continuam em memória; um recarregamento completo
pode exigir novo login. Mobile mantém SecureStore e recebe
`EXPO_PUBLIC_API_BASE_URL` do seu `.env`; o Android Emulator usa `10.0.2.2:3000`.
Não se afirma teste em Android/iPhone físico. O Gateway só publica em loopback:
dispositivos físicos exigem encaminhamento de desenvolvimento explicitamente
autorizado (por exemplo, adb reverse no Android), não exposição MongoDB/RabbitMQ.

O erro de sandbox `uv_os_get_passwd ENOMEM` foi contornado executando o mesmo
teste autorizado fora do sandbox, sem instalar dependências. A verificação
estrita CRLF/LF foi corrigida na normalização dos geradores, e os artefactos
foram regenerados a partir dos contratos reais; não se alteraram hashes à mão.
Hash Swagger atual: `0063f6facdcd0b5b32fb1531bd135df3aeaf845488938f4b4d43cfb21d3d0608`.
Um novo teste unitário de grants referia `status` em vez da propriedade real
`statusCode`; foi corrigido para exigir ambos HTTP 403 e `MANAGER_REQUIRED`.
O registo da primeira execução com essa falha não representa uma falha de acesso
do serviço, cuja resposta 403 já tinha passado a validação HTTP.

### Recuperação autorizada — bloqueada antes de qualquer paragem

O utilizador autorizou stop/start separado do MongoDB e RabbitMQ oficiais,
com um único pagamento MockBank durante a indisponibilidade do broker. O script
`scripts/local-demo-resilience.cjs` exige ACK explícito, verifica backup cifrado
e restauro, identidade/volumes, ausência de operações críticas e filas vazias.
Inclui reposição da dependência em caso de erro e não recria recursos.

Em 09:23 UTC, memória livre Windows aproximadamente 3,93 GiB e disponível
Docker/WSL 5,60 GiB. A verificação foi **interrompida antes do primeiro stop**:

| Fila | Ready | Unacknowledged | Consumidores |
|---|---:|---:|---:|
| goleve.agenda.professional.events | 4 | 0 | 0 |
| goleve.notification-service.events | 0 | 0 | 1 |
| goleve.notification-service.events.retry | 0 | 0 | 0 |
| goleve.notification-service.events.failed | 0 | 0 | 0 |

A Agenda publica nessa fila durável como parte da outbox existente; não foi
identificado consumidor para esse fluxo de integração. Os eventos de notificação
têm encaminhamento separado e foram efetivamente consumidos. **Não foram
eliminadas, purgadas ou consumidas as quatro mensagens para fazer passar a sonda.**
Não foi criado o pagamento adicional, nem executado o stop/start de qualquer
dependência. A recuperação sob indisponibilidade e a redelivery real permanecem
**não validadas durante indisponibilidade nesta execução**. A autorização não foi tratada como licença
para ignorar a falha preventiva. É necessário decidir o destino/consumidor desse
fluxo conservando as mensagens; só depois retomar o teste controlado. Não se
declara persistência após este stop/start como comprovada.

Separadamente, sem paragens, `scripts/local-demo-redelivery.cjs` reentregou o
evento já publicado de um dos pagamentos fictícios integrados. Foram confirmados
incrementos dos contadores RabbitMQ de delivery e ACK, com fila de notificações
novamente vazia. A base manteve uma notificação e um registo de evento processado.
O teste não chamou APIs de pagamento, não iniciou cobranças e não tocou nas quatro
mensagens Agenda. Resultado em `.local/redelivery-results.json`: aprovado.
Não substitui o cenário outbox durante indisponibilidade, que continua bloqueado.

### Evidências, segurança e pendências

Evidências locais ignoradas: `.local/demo-http-results.json`,
`.local/seed-idempotence.json`, `.local/consolidation-final-audit.json`,
`.local/consolidation-unit-final.log`, `.local/resilience-results.json` e
`frontend/.cache/consolidation-*`. O relatório final de inventário inclui nomes
de coleções e definições de índices, nunca documentos pessoais ou credenciais.

A inspeção dos 189 ficheiros candidatos locais não encontrou os 20 valores
protegidos pesquisados (passwords aleatórias, chaves e segredos), chaves privadas
ou `.env` operacionais. Esta pesquisa é uma verificação direcionada, não prova
formal de ausência de todos os segredos. Nenhum `.env`, chave ou `.secrets/` está
versionado. `git diff --check` passou; os avisos de conversão LF/CRLF do Git
não são erros de whitespace. Não foram preparados nem publicados commits.

Pendências explícitas:

- Resolver o fluxo sem consumidor da fila Agenda e concluir recuperação,
  persistência e deduplicação reais durante falha. Outboxes sem pendências não
  significam que todas as filas RabbitMQ foram consumidas.
- AI Coach mantém processo healthy, mas funcionalidade desativada e sem fornecedor;
  responde indisponibilidade, sem respostas inventadas ou envio de dados reais.
- Mobile físico, conectividade de rede e validação nativa Android/iOS pendentes;
  exportação Expo não substitui esses testes.
- Reagendamento/reembolso e cenários privilegiados não abrangidos pela sonda
  atual não foram novamente certificados ponta a ponta nesta consolidação.
- Os 12 bloqueios históricos E2E mantêm-se documentados. O percurso sintético
  local não resolve elegibilidade real, autoridade administrativa ou pagamentos
  reais de produção.
- Produção exige auditoria de segurança integrada, credenciais próprias/rotação
  das credenciais de desenvolvimento herdadas, gestão de chaves, TLS, políticas
  reais de elegibilidade e MFA administrativo obrigatório. Local-demo nunca é
  uma configuração pública de pré-produção ou produção.

Os critérios relativos aos 14 serviços, cinco logins, dados sintéticos, isolamento
e integração Web foram validados. O encerramento integral fica condicionado às
pendências acima; não se declara GoLeve pronto para produção pública.

## Investigação da fila Agenda — 2026-11-03

Investigação solicitada após o bloqueio preventivo. Foi realizada antes de
alterar código/configuração. Repositório e branch confirmados; apenas o Compose
oficial foi consultado. Não se alterou nenhum microserviço, `.env`, contrato,
binding ou recurso Docker nesta investigação.

### Causa e responsabilidade

**A fila foi deliberadamente criada para retenção de eventos de domínio, sem
consumidor implementado.** Não há consumidor legítimo já definido para ativar.
Isto está explícito em [Agenda Profissional, Outbox e limites](api/professional-agenda.md):
as mensagens são retidas mesmo sem consumidor e os consumidores futuros devem
deduplicar `eventId` e reconciliar versões. A pesquisa de subscrições no código
confirmou a ausência; não é uma falha de password, ligação ou subscrição existente.

| Elemento | Estado confirmado por GET de metadados RabbitMQ |
|---|---|
| Produtor | Agenda Service, `src/professional/outbox.ts` |
| Exchange | `goleve.agenda.events`, topic, durável |
| Fila | `goleve.agenda.professional.events`, durável, sem auto-delete |
| Bindings de domínio | `agenda.professional.#` e `agenda.billing.#` |
| Binding implícito | Exchange por defeito → nome da fila |
| Ready / unacked / consumidores | **4 / 0 / 0** |
| Publicações contabilizadas | 4, sem entregas registadas |
| Consumidor de domínio | Não implementado; responsabilidade futura por definir |
| Outbox Agenda pendente/publishing/dead | 0 |

Notification é consumidor legítimo **das notificações**, não deste envelope de
domínio. Subscreve `goleve.notification-service.events` no exchange
`goleve.notifications`, routing key `event`. Esta fila está vazia, com um
consumidor ativo. A Agenda publica separadamente os snapshots de notificação,
confirmando ambos os encaminhamentos antes de marcar a outbox como publicada.
Os [contratos da Fase 5.9](events/agenda-payment-notifications.md) preservam essa
separação. O ramo de billing não representa uma subscrição Payment: o contrato
Payment atual também não define consumo destes eventos de domínio.

O envelope de domínio contém agregado/versão e referência mínima à reserva;
o contrato Notification exige destinatário, origem e payload fechado, incluindo
o marcador de simulação quando aplicável. Reencaminhar as quatro mensagens
diretamente para Notification seria incompatível e não define uma operação de
negócio válida. Não se implementou um consumidor genérico, ACK sem efeito real,
conversão artificial de contratos ou reexecução de reservas.

### Inspeção sem consumo

Só foram usados GETs de metadados e consultas de leitura MongoDB. **Não foi usado
`basic.get`, `consume`, `ack`, `nack`, purge ou o endpoint de obter mensagens**,
incluindo modos que entregam e depois reencaminham a mensagem. Assim, não houve
inspeção direta dos quatro payloads no broker: não se declara validação dos seus
bytes. A evidência disponível correlaciona as quatro publicações do broker com
os quatro eventos `published` da outbox: dois `requested.v1` e dois `accepted.v1`.
Cada snapshot correspondente tem exatamente um registo processado e uma
notificação persistida no serviço proprietário. Sem payloads pessoais no relatório.

Os `.env` reais de Agenda, Notification e Payment apontam para o broker oficial
com credenciais coincidentes, sem apresentar os valores. As flags de publicação
Agenda e consumo demo Notification estão ativas em `development`. Os logs dos
três serviços nos 90 minutos consultados não contêm `ACCESS_REFUSED`,
`PRECONDITION_FAILED`, `ECONNREFUSED` ou os marcadores pesquisados de falha de
outbox/consumidor. Isto é uma inspeção direcionada, não prova de ausência de todos
os erros possíveis. O log Payment tem mais linhas; não foi reproduzido no relatório.

### Verificações desta investigação

- **16 testes direcionados aprovados**, zero falhas/ignorados: contratos,
  compatibilidade Training/Hydration, mensagens inválidas, retry/DLQ,
  confirmação apenas após processamento e readiness, com dependências simuladas.
- **Cinco logins reais** através do Gateway, autoridade `local-demo` confirmada,
  `/auth/me` válido e logout das cinco sessões de teste. Não se criaram contas.
- Auditoria final: **14 oficiais healthy**, `goleveV1` PRIMARY, documentos/índices
  originais preservados, 24 contentores antigos inalterados, zero pagamentos em
  processamento/unknown e zero outboxes pendentes inesperadas.
- As quatro notificações Agenda já existentes têm contagem unitária; nenhuma
  operação Agenda ou Professional foi repetida nesta investigação.
- A reentrega real de pagamento validada na secção anterior continua como
  evidência histórica; não foi repetida nem atribuída a um consumidor inexistente
  da fila de domínio.

Evidências locais ignoradas: `.local/agenda-queue-outbox-diagnostic.json`,
`.local/agenda-queue-targeted-tests.log`, `.local/agenda-queue-final-audit.log` e
`.local/agenda-queue-logins.json`. Apenas este documento foi editado nesta etapa.

### Decisão necessária e recuperação suspensa

**As quatro mensagens continuam protegidas na fila original.** Não existe uma
correção de consumidor fundamentada nos contratos atuais. Por isso, seguindo a
instrução de preservar mensagens sem destino legítimo, não se iniciou o novo
evento nem a sequência de stop/start. MongoDB e RabbitMQ não foram parados ou
reiniciados nesta investigação. Não se declara recuperação validada.

Proposta preferencial, sujeita a aprovação: reconhecer formalmente esta fila
como retenção de domínio para integração futura e adaptar apenas a sonda de
recuperação para distinguir backlog retido de trabalho ativo. A sonda exigiria
outboxes sem trabalho, ausência de operações críticas, `unacked=0` e inventário
estável da fila retida, preservando fila, bindings e mensagens antes/depois.
Não tornaria as quatro mensagens processadas nem simularia um consumidor.
O novo evento MockBank e a sua notificação continuariam a ser testados no
percurso Notification legítimo, com persistência, confirmação e deduplicação.

Se o requisito for consumir estes eventos agora, é necessário primeiro aprovar
o caso de uso, serviço proprietário, efeito persistente, regras de reconciliação
de versões, idempotência e tratamento de eventos incompatíveis. Não se escolhe
Notification, Payment ou Professional arbitrariamente para esvaziar a fila.
Nenhuma das duas alterações foi aplicada sem essa decisão.

## Retenção aprovada e recuperação executada — 2026-11-03

O utilizador aprovou manter `goleve.agenda.professional.events` como retenção
intencional para integrações futuras e adaptar **somente a sonda**, sem criar
consumidor nem alterar Notification. A proposta anterior passa a decisão
aprovada; o diagnóstico histórico permanece acima.

### Garantias antes da primeira paragem

O backup completo cifrado original foi novamente verificado por SHA-256,
marcador de restauro bem-sucedido e presença da chave. É o backup anterior à
criação das fixtures; não se afirma que inclua os novos dados de demonstração.
Os volumes oficiais e o caminho Compose foram conferidos, bem como os 14
componentes healthy, ausência de pagamentos críticos e outboxes pendentes.
Memória livre observada: Windows aproximadamente 4,23 GiB; Docker/WSL disponível
5,55 GiB. Espaço livre: Windows aproximadamente 12,22 GiB; filesystem dos volumes
Docker aproximadamente 938 GiB, conforme os valores anunciados pelo backend WSL.

Foi consultada a API de **metadados**, sem entregar mensagens:

| Propriedade | Antes | Após reposição do RabbitMQ |
|---|---:|---:|
| Mensagens totais / ready | 4 / 4 | 4 / 4 |
| Mensagens persistentes | 4 | 4 |
| Bytes ready / persistentes | 1 226 / 1 226 | 1 226 / 1 226 |
| Unacked / consumidores | 0 / 0 | 0 / 0 |
| Tipo | classic | classic |
| Fila durável / auto-delete / exclusive | true / false / false | iguais |
| Políticas / argumentos de expiração ou overflow | ausentes | ausentes |
| Exchange topic durável, sem auto-delete | confirmado | inalterado |
| Bindings default + professional.# + billing.# | confirmados | inalterados |

Além de a fila ser durável, `messages_persistent=4` e
`message_bytes_persistent=message_bytes_ready=1226` confirmam persistência das
mensagens presentes. O produtor usa mensagens persistentes e publisher confirms;
o volume gravável continua `goleve_rabbitmq_data`. A preservação após stop/start
confirma recuperação neste teste de paragem graciosa, **não** tolerância a falha
de disco/host nem alta disponibilidade. Não foi lido ou calculado hash dos
payloads; a comparação usa contagens, bytes persistentes e topologia, sem consumo.

`scripts/lib/retention-queue.cjs` valida estritamente essa única exceção: exatamente
quatro mensagens persistentes, nenhum consumidor/unacked, bindings exatos e
ausência de TTL/políticas desconhecidas. Qualquer trabalho nas outras filas,
incluindo retry/DLQ, continua a bloquear a paragem. Não se ignora backlog em geral.
As verificações e snapshots são usados em `scripts/local-demo-resilience.cjs`.
`scripts/tests/retention-queue.test.cjs`: **7 testes aprovados**, incluindo recusa
de mensagens não persistentes, perda/duplicação, alteração de bytes, bindings,
TTL, consumidores ativos e trabalho noutras filas.

### MongoDB — aprovado

A execução começou às **09:54:57 UTC/Lisboa**. Apenas o MongoDB oficial
`273df6d8f17d` foi parado e iniciado; não houve recriação nem `rs.initiate()`.
O ciclo observado até PRIMARY/readiness e validação levou **12,201 segundos**.
Foram comparados hashes de documentos funcionais, nomes de coleções e definições
de índices; todos coincidiram. Nas coleções com índices TTL, compararam-se os
índices, excluindo hashes/contagens de documentos sujeitos a expiração. A sessão
Auth criada antes da paragem continuou válida depois. O volume
`goleve_mongo_data` permaneceu o mesmo. Só após recuperação e health do MongoDB
se avançou para o teste RabbitMQ.

### RabbitMQ — retenção preservada; teste outbox interrompido

Foi parado e iniciado apenas o RabbitMQ oficial `b9a3fb0fe341`, usando stop/start
no mesmo contentor e volume. Durante a indisponibilidade, Gateway readiness
devolveu **503**, sem ser alterado o processo HTTP ou consumidor Notification.

A criação do único pagamento fictício previsto foi recusada por `POST /payments`
com **HTTP 409**, antes de obter um ID e antes de qualquer chamada de confirmação.
O script restaurou imediatamente o RabbitMQ, aguardou health e suspendeu os
restantes testes disruptivos. Reposição concluída antes das **09:55:29 UTC**.
Não se atribui um tempo exato de recovery isolado ao broker, pois a execução
terminou pelo caminho de erro. Não houve nova tentativa de cobrança.

Após a reposição, confirmou-se a tabela acima: **as quatro mensagens persistentes
continuam presentes, com os mesmos bytes e bindings**. A fila Notification ficou
vazia, `unacked=0`, com um consumidor ativo. Portanto:

- Recuperação da fila retida e da topologia: **aprovada** neste stop/start.
- Reconexão do consumidor Notification e retorno a ready: **aprovados**.
- Novo evento Payment persistido durante a falha, publicação/consumo e reentrega:
  **bloqueados pelo HTTP 409**, não declarados aprovados.
- A reentrega de pagamento validada anteriormente não foi contada novamente
  como validação deste cenário de indisponibilidade.

### Diagnóstico complementar do Payment — sem alteração de modelo ou índice

A leitura dos índices e do código identificou o índice
`ownerId_1_confirmationKey_1`, composto por `{ownerId:1, confirmationKey:1}`, com
`unique:true, sparse:true`. Já existe um pagamento da conta fictícia sem
`confirmationKey`. Um índice composto sparse inclui o documento quando pelo
menos um dos campos existe: como `ownerId` existe sempre, o segundo pagamento
sem chave de confirmação colide com o mesmo par proprietário/chave ausente.

O código de criação omite a chave de confirmação por desenho; o middleware
traduz erros 11000 em HTTP 409 `IDEMPOTENCY_CONFLICT`. As consultas confirmaram
**zero documentos** com a chave de idempotência e a referência exclusivas desta
execução, um pagamento fictício preexistente sem chave e zero claims bancários
em processamento/unknown. Não se repetiu o POST para reproduzir o problema.
Os testes anteriores criavam e confirmavam pagamentos sequencialmente antes
de deixar uma intenção pendente; por isso não detetaram este caso.

Não foi alterado Payment, não se cancelou a intenção existente e não se removeu
nenhum índice. A sonda passou a recusar esse impedimento conhecido **antes de
qualquer nova paragem**, a registar o código de erro HTTP sem dados sensíveis e
a preservar o ID de um pagamento criado antes de tentar confirmá-lo.

Correção proposta para etapa própria: substituir a definição sparse por um
índice único parcial que inclua apenas `confirmationKey` do tipo string,
mantendo unicidade por proprietário para chaves efetivamente atribuídas.
Exige revisão do modelo, testes de duas intenções pendentes e concorrência,
auditoria prévia dos dados e autorização específica para a substituição
controlada do índice persistente. **Não foi aplicada migração ou remoção**.
Não contornar o problema apagando pagamentos ou usando outra identidade para
forçar o teste a passar.

### Estado final e critérios futuros da retenção

Auditoria após a recuperação: **14 oficiais healthy**, mesmos IDs/imagens/mounts,
`goleveV1` PRIMARY, dados e índices originais preservados, zero pagamentos em
processamento/unknown e zero outboxes pendentes inesperadas. Os 24 contentores
antigos continuam inalterados. Foram repetidos os **cinco logins reais local-demo**,
`/auth/me` e logout, todos aprovados. As políticas MFA/local-demo não foram alteradas.
Não houve build, recriação de contentores, purge, ACK, seed, limpeza ou Git commit/push/merge.

O resultado global desta execução fica **parcial**, com a falha preservada:
MongoDB e retenção RabbitMQ aprovados; cenário Payment durante falha por concluir.
Os relatórios por correlação e uma cópia do relatório anterior impedem que uma
nova execução apague a evidência histórica. Artefactos locais ignorados:
`.local/resilience-results.json`, `.local/resilience-local-demo-recovery-*.json`,
`.local/resilience-history-*.json`, `.local/resilience-followup.json`,
`.local/retention-queue-tests.log`, `.local/recovery-final-audit.log` e
`.local/recovery-logins.json`.

Um futuro consumidor desta fila só será implementado após aprovação de:

1. Serviço proprietário e efeito de negócio persistente, sem reexecutar reservas.
2. Contrato versionado, validação de origem/estrutura, política de versões antigas
   e fora de ordem e estratégia de reconciliação do backlog já existente.
3. Deduplicação persistente por evento/operação, com ACK apenas depois do efeito
   de negócio ou deduplicação confirmados.
4. Retry limitado, tratamento de incompatíveis, DLQ e recuperação auditada,
   sem descarte silencioso ou ciclos infinitos.
5. Permissões e minimização de dados, testes de concorrência, reentrega, reinício
   e preservação dos efeitos existentes, antes de ativar o consumo do backlog.

A suite final combinou os sete testes de retenção com os 16 de contratos e
readiness Notification: **23 aprovados, zero falhas/ignorados**. São os mesmos
sete testes já descritos, sem os contar duas vezes. A comparação final com o
inventário pré-teste confirmou IDs, imagens e mounts de todos os 38 contentores,
14 oficiais healthy e 24 antigos inalterados. `git diff --check` passou.

Até essa decisão, a operação esperada é **retenção sem consumidores**, não fila
obrigatoriamente vazia. Monitorizar crescimento, espaço e publicações; não aplicar
TTL, limite destrutivo ou purge para esconder alertas. Uma mudança de contagem
exige nova explicação e baseline aprovado, não aceitação automática pela sonda.

## Correção preparada do índice Payment — aplicação oficial pendente

Etapa de análise, implementação e testes autorizada em 2026-11-03. **Nenhum índice
oficial foi criado, eliminado ou substituído.** Não houve build/reinício de imagens
oficiais, nova tentativa de pagamento oficial ou retoma do teste de interrupção.
A branch continua `integration/frontend-v1`, com todo o trabalho anterior preservado.

### Diagnóstico confirmado e contratos abrangidos

Coleção exata: `goleve_payment.payments`. `getIndexes()` confirmou cinco índices,
incluindo o seguinte índice problemático (a versão interna apresentada é `v:2`):

```json
{
  "name": "ownerId_1_confirmationKey_1",
  "key": { "ownerId": 1, "confirmationKey": 1 },
  "unique": true,
  "sparse": true
}
```

Dados oficiais consultados **apenas por leitura**: uma chave ausente, três chaves
string válidas, zero null explícitos, strings vazias, tipos inválidos ou strings
malformadas; zero grupos duplicados e zero operações críticas. Não se publicam
identificadores de titulares nem valores de chaves. O pedido anteriormente recusado
continua sem documento correspondente. O inventário completo dos índices fica em
`.local/payment-index-before.json`, ignorado pelo Git.

A reprodução no MongoDB 7 temporário confirmou a causa: o primeiro `create()`
legítimo gravou uma intenção sem `confirmationKey`; o segundo, com chave de
**criação diferente**, falhou com MongoDB **11000**, `keyPattern` exatamente
`{ownerId:1,confirmationKey:1}` e chave de confirmação ausente representada como
null no índice. O middleware real traduziu esse erro em HTTP 409
`IDEMPOTENCY_CONFLICT`. Não é rejeição de preço, titularidade ou estado. O campo
`ownerId` sempre presente faz o índice composto sparse incluir a intenção,
mesmo sem chave de confirmação.

`confirmationKey` é um campo interno, alimentado pelo header `Idempotency-Key`
nas operações de confirmação **e cancelamento** de `/payments/:id`. Não é campo
aceite no body de criação nem é exposto no DTO de pagamento. O índice de criação
`(ownerId,idempotencyKey)` mantém-se intacto. As confirmações continuam com claim
atómico, fence persistente, provider key por pagamento e estados incertos sem
repetição automática. `appointment_payments` tem outro modelo/contrato; não se
alteraram os seus índices, reservas, cotações ou referências Agenda.

### Definição proposta e semântica

```json
{
  "name": "ownerId_confirmationKey_valid_unique_v2",
  "key": { "ownerId": 1, "confirmationKey": 1 },
  "unique": true,
  "partialFilterExpression": {
    "confirmationKey": { "$type": "string" }
  }
}
```

O modelo `src/models/payment.model.ts` usa esta definição e valida o formato
`^[A-Za-z0-9._-]{1,128}$` para chaves presentes. Não se usa `syncIndexes()`.

| Valor | Comportamento |
|---|---|
| Ausente | Intenção legítima permitida; não pertence ao índice parcial |
| Null explícito | Rejeitado pela validação do modelo; registo legado bloqueia a migração |
| String vazia ou malformada | Rejeitada pelo modelo; bloqueia a migração se já existir |
| String válida | Unicidade por proprietário, aplicada pelo MongoDB |
| Mesmo pagamento e mesma chave de confirmação | Replay idempotente, sem nova chamada bancária |
| Outro pagamento do mesmo proprietário e mesma chave | Conflito, sem nova cobrança |
| Outro proprietário e mesma chave | Permitido conforme contrato, com pagamento/provider key próprios |

O filtro MongoDB verifica o **tipo**, não o formato completo: uma string vazia
introduzida por escrita nativa seria indexada, e null nativo ficaria fora do filtro.
Por isso existem validação de modelo/API e preflight que recusa dados legados
inválidos. Não se normalizam, apagam ou convertem null/vazios durante a migração.
O body público permanece fechado; as validações de header existentes são mantidas.

### Migração idempotente preparada, ainda não aplicada

Ficheiro: `backend/services/payment-service/scripts/migrate-confirmation-index.cjs`.
O modo padrão é **plan/read-only**. Usa ligação sem autoIndex, não carrega modelos
para inicialização automática e não altera documentos. Identifica estritamente
os índices conhecidos, incluindo a ordem dos campos do índice composto.

O modo de aplicação exige cumulativamente URI do proprietário, opção explícita
de aplicação/ambiente oficial, autorização operacional específica, confirmação
de manutenção sem escritas e backup verificado. Na aplicação oficial, verifica
manifest, SHA-256 do arquivo, restauro validado e presença da chave de recuperação.
É obrigatório indicar um ficheiro protegido de evidências antes da primeira
alteração. Os ACKs do operador não substituem a aprovação humana pendente.

Fluxo preparado:

1. Registar todos os índices e verificar null/tipos/formato, duplicados e operações
   críticas em `payments`/`appointment_payments`; diferenças de definição fazem
   abortar sem alterações.
2. Criar o índice novo **mantendo o antigo**. MongoDB 7 permitiu a coexistência nos
   testes, preservando a proteção das chaves válidas durante toda a transição.
3. Confirmar definição/compatibilidade e persistir checkpoint. Se falhar aqui,
   o índice antigo continua presente.
4. Retirar **somente** `ownerId_1_confirmationKey_1`, depois de confirmar o novo.
   Não remover os índices de criação, pesquisa, outbox ou `_id`.
5. Reauditar; repetir após conclusão não altera nada. Se a execução parar com
   ambos os índices presentes, a retoma reconhece o novo e conclui a mesma etapa.

Executou-se apenas `--plan --official` contra a base oficial. Resultado:
`oldIndexPresent=true`, `newIndexPresent=false`, `incompatible=0`,
`duplicateGroups=0`, `critical=0`, `ready=true`. Este resultado não autoriza nem
executa a aplicação. O backup original cifrado continua íntegro e com restauro
validado, mas antecede os novos pagamentos fictícios; antes da aplicação deve
existir backup atual verificado que cubra também esses dados e configurações.

### Plano operacional proposto para aplicação, sujeito a aprovação

1. Obter autorização específica para a substituição deste índice e para a
   atualização controlada **apenas do Payment Service**. Preparar a imagem com
   o modelo corrigido, sem implantar ainda nem construir dependências.
2. Inventariar IDs/volumes/índices, verificar recursos e backup atual, bloquear
   novas escritas Payment e drenar operações. Confirmar novamente ausência de
   claims ativos ou resultados incertos; só depois entrar na manutenção.
3. Executar a migração explícita com evidências persistidas e backup confirmado.
   Interromper se houver qualquer diferença ou conflito; não corrigir dados
   automaticamente para fazer passar a migração.
4. Retomar somente Payment com o código novo, preservando dados e restantes
   componentes; validar que o índice antigo não reaparece. **Não reiniciar a
   imagem antiga após a migração:** o autoIndex do modelo antigo poderia voltar
   a declarar o índice sparse ou impedir o arranque.
5. Validar os contratos por HTTP e os cinco perfis; depois, mediante confirmação
   das mesmas condições de segurança, retomar a sonda RabbitMQ interrompida.

Estes passos são um plano, não autorização assumida. A manutenção/deployment
necessários serão confirmados antes de qualquer operação oficial. Não alterar
as quatro mensagens de retenção nem repetir uma cobrança incerta.

### Recuperação e limites de rollback

Se a construção do novo índice falhar, o antigo permanece: manter Payment sem
escritas, preservar logs e corrigir a causa. Se ambos existirem após interrupção,
retomar a migração idempotente; não apagar documentos nem outros índices.
Se o novo estiver válido e o antigo já tiver sido retirado, conservar a proteção
nova e privilegiar correção para a frente.

Repor o índice antigo só seria admissível após parar escritas e auditar **todos**
os pares legados, incluindo chaves ausentes/null. Quando já existirem múltiplas
intenções sem chave por titular, o antigo deixa de ser recriável. O auditor
reporta `legacyRollbackCollisionGroups`, e o teste confirmou esse impedimento.
Nunca apagar pagamentos ou restaurar uma base inteira sobre dados mais recentes
para viabilizar rollback. Recuperação de backup, se necessária, exige decisão
separada e destino/procedimento previamente aprovados.

### Testes e limpeza executados

Um único MongoDB 7 temporário autorizado: nome exclusivo, rede bridge exclusiva,
porta aleatória apenas em `127.0.0.1`, `/data/db` e `/data/configdb` em tmpfs,
limite de memória 1 GiB e cache WiredTiger 256 MiB. Nenhuma rede, volume,
credencial ou base oficial foi reutilizada. A porta publicada exige uma rede
bridge própria, por isso não se usou `--network none`. Recursos/nome/porta foram
verificados antes da criação; memória disponível observada Windows 2,90 GiB e
Docker/WSL 5,75 GiB. Não foi criado RabbitMQ.

**34 testes distintos aprovados, zero falhas/ignorados na suite final:**

- **15 de integração** no MongoDB temporário: reprodução do 11000/409; migração
  com hashes dos documentos e outros índices preservados; repetição e retoma;
  duas intenções sem chave; chaves válidas/replay/outro titular; null/vazios;
  dados incompatíveis/duplicados/claims críticos; CLI sem efeitos por defeito;
  concorrência de criação/confirmacão entre duas instâncias e ligações MongoDB;
  uma única chamada MockBank/evento; timeout com resultado incerto; outbox com
  publicação confirmada, falha/retry e o mesmo ID de evento.
- **3 testes Payment existentes**, incluindo validação e MockBank/modo demo.
- **16 testes Notification existentes**, contratos, Training/Hydration,
  mensagens inválidas, retry/DLQ e readiness, com dependências simuladas.

O publicador foi exercitado com estado/outbox reais no MongoDB temporário e
RabbitMQ **simulado**; não se declara nova validação HTTP ou RabbitMQ real da
correção no ambiente oficial. O build TypeScript Payment passou localmente;
a imagem oficial não foi reconstruída. `git diff --check` passou.

A primeira execução dos testes novos teve 13/14 aprovados: uma fixture enviava
`unique:undefined`, serializado como null pelo driver, e o MongoDB recusou a
definição inválida antes de testar a migração. Corrigiu-se a construção da fixture
e acrescentaram-se verificações explícitas dos dados incompatíveis; os testes
finais passaram. O log inicial foi preservado. Avisos existentes Mongoose sobre
`new`/`returnDocument` não causaram falhas; não se fez refatoração não relacionada.

Após conferir ID, labels, rede e mounts, foram removidos **somente** o contentor
e a rede temporários desta execução. Não se apagaram bases/coleções oficiais ou
volumes existentes; os dados sintéticos tmpfs terminaram com o recurso autorizado.
Inventário final: **14 oficiais healthy e 24 antigos inalterados**, mesmos IDs,
imagens e mounts. MongoDB oficial PRIMARY, quatro mensagens retidas persistentes,
zero operações críticas e outboxes inesperadas. Índice oficial antigo permanece
exatamente igual; índice novo ausente. Não houve commit, push, merge ou aplicação
de migração oficial.

Ficheiros desta etapa: `src/models/payment.model.ts`, novo script
`scripts/migrate-confirmation-index.cjs` e novo teste
`tests/confirmation-index.integration.test.cjs`, todos dentro do Payment Service,
e este documento. Evidências ignoradas em `.local/payment-index-*.json`/`.log`.
**Aguardar autorização específica antes de aplicar o índice oficial e retomar
o teste de recuperação RabbitMQ.**

## Aplicação oficial autorizada — preparação e bloqueio do restauro

O utilizador autorizou a migração oficial e atualização exclusiva Payment,
condicionadas a backup atualizado/restauro, ausência de operações críticas,
manutenção sem escritas e verificações de dados/índices. Foi autorizada
separadamente uma única instância temporária de restauro, sem portas/volumes
existentes. Esta secção regista a preparação; **não representa migração aplicada**.

Em 2026-11-03 foi construída apenas a imagem `goleve-payment-service`:

- Índice OCI: `sha256:76bacecea4ce0fd524b95d54b2ebf45c58e570d071547feecb9fc15c3570daa5`.
- Manifest linux/amd64: `sha256:2aa5429e059ae38a91cf5ab14e2e60c862004b31b3f90e9d2dda92bbe47d3b15`.
- SHA-256 normalizado do modelo compilado revisto:
  `18a77cf802f25b3079c0ec435893086d8f60216deb3a6f2c4afa4f2e1f679fe7`.

O contentor Payment antigo `b6a094a3727d` continuou ativo/healthy; os índices
oficiais ainda são os antigos. O plano de migração por leitura voltou a confirmar
zero incompatibilidades, duplicados ou operações críticas.

A tentativa de criar uma etiqueta para a imagem anterior a partir de
`Container.Image` foi recusada pelo Docker (`No such image`). Este campo é o
digest da configuração; o image store usa índices/manifests OCI, e a referência
antiga deixou de estar endereçável após atualizar `latest`. A consulta por manifest
antigo também não a encontrou. Não se removeu imagem nem contentor por comando
de limpeza. O filesystem do contentor antigo continua preservado, e foi copiado
apenas o seu `dist/` para `.local/payment-index-previous-dist/`, sem `.env`, mounts
ou segredos. Não se oferece essa cópia como imagem Docker pronta para rollback.
A imagem nova identifica-se por OCI e por SHA do modelo, evitando comparar o
digest de configuração do contentor com o digest do índice multi-plataforma.

Criou-se backup cifrado atualizado em
`protected-backups/local-runtime/2026-11-03T10-31-09-673Z-2411e5d7`.
O backup preserva a chave existente, usa IV novo, SHA-256 e autenticação AES-GCM,
e inclui os seis documentos nas quatro coleções Payment. O inventário da origem
coincidiu antes/depois do dump. O manifesto continua `restoreValidated=false`.

Destino de restauro autorizado: `goleve-consolidation-restore-feb7faf5aa41`,
ID `22c208aeca6c`, rede interna exclusiva, zero portas, zero mounts persistentes,
tmpfs de 512 MiB/32 MiB e memória limitada a 1 GiB. Recursos prévios observados:
Windows livre 3,60 GiB e WSL disponível 5,74 GiB. Não se ligou à rede oficial.

O `mongorestore --stopOnError` terminou, mas a comparação estrita recusou o
resultado. A verificação autorizada `verify-restored`, executada em
2026-11-03, aplicou somente a exceção `admin.system.keys` e comparou
rigorosamente as restantes bases, coleções, documentos, hashes e índices.
Encontrou uma divergência adicional: `goleve_auth.auth_sessions` tem 11
documentos no inventário original e 0 documentos no destino restaurado; os
índices dessa coleção coincidem. Assim, a verificação falhou corretamente,
`restoreValidated` permaneceu `false` e o histórico/diagnóstico anterior foi
preservado. O arquivo passou a verificação de SHA-256 e autenticação AES-GCM
durante a leitura.

`mongodump`/`mongorestore` instalados: versão **100.20.0**. O
[código oficial do mongodump](https://raw.githubusercontent.com/mongodb/mongo-tools/master/mongodump/prepare.go)
exclui `admin.system.keys` na seleção de namespaces de sistema. A diferença
observada é coerente com esse comportamento: o inventário genérico deste projeto
incluiu a coleção de chaves internas do replica set, embora o dump não a exporte.
Não se alterou o hash, o arquivo, o inventário original ou os dados restaurados
para fazer a comparação passar. O commit exato informado pelo binário não ficou
acessível pela consulta web; a referência é o código oficial consultado, sem
alegar confirmação do conteúdo desse commit específico.

### Investigação de `auth_sessions` (leitura, 2026-11-03)

Foi inspecionada a coleção no destino temporário e no MongoDB oficial, sem
expor documentos, tokens ou credenciais. Ambos mantêm os mesmos índices
relevantes: `_id_`, `userId_1` e `expiresAt_1`, sendo este último TTL com
`expireAfterSeconds: 0`. O campo de expiração é `expiresAt`; não foram
apresentados valores de sessão.

O arquivo cifrado foi decifrado apenas em memória e o seu formato de archive
foi inspecionado sem escrita. A secção `goleve_auth.auth_sessions` contém
**11 documentos**. Os limites anonimizados de `expiresAt` são
2026-11-03 10:46:11.070Z a 10:58:34.240Z. Os logs existentes do destino
confirmam a importação: a construção dos índices registou
`totalRecords: 11` e `keysInserted: 11` para `expiresAt_1`; não há evidência
de falha de backup ou de restauro dessa coleção.

O destino foi criado às 10:39:13Z e a coleção foi criada às 10:39:25Z. A
leitura posterior encontrou zero documentos e o servidor registou atividade do
TTL monitor (`deletedDocuments`), depois de todos os instantes de expiração.
Isto determina que a divergência resulta de **expiração automática legítima
após um restauro correto**, não de perda no arquivo nem de falha de importação.
`restoreValidated` permanece `false`, porque a comparação atual já não pode
ser satisfeita com a coleção esvaziada.

Validação segura proposta, sem enfraquecer a comparação: criar um novo destino
temporário autorizado, sem volumes persistentes nem portas, restaurar o mesmo
arquivo e executar imediatamente uma sonda read-only antes de o TTL poder
expirar, registando apenas a contagem, os hashes agregados e os índices de
`auth_sessions`. Em seguida, comparar estritamente todas as bases e coleções,
aplicando somente `admin.system.keys-only`. Esta proposta requer autorização
separada e foi executada num único destino novo, sem reutilizar nem modificar
o destino anterior.

O novo MongoDB 7 temporário usou rede `internal` exclusiva, sem portas, sem
volumes, `tmpfs` de 512 MiB/32 MiB, limite de memória de 1 GiB e
`ttlMonitorEnabled=false` desde o arranque. O hash SHA-256 do arquivo foi
confirmado antes do stream cifrado. A validação read-only terminou às
11:26:09Z: `auth_sessions` manteve **11 documentos**, com os índices `_id_`,
`userId_1` e `expiresAt_1` (`expireAfterSeconds: 0`) coincidentes; todas as
restantes bases, coleções, documentos, hashes, opções e índices coincidiram.
`admin.system.keys` foi a única exclusão autorizada. O procedimento oficial
gravou `restore-verification.json` e atualizou o manifesto para
`restoreValidated=true`, preservando o hash do arquivo e o hash do inventário
original.

Após preservar as evidências, foram removidos exclusivamente o contentor e a
rede desta execução, confirmando previamente o nome, label e ID do contentor e
o nome/ID da rede. O contentor temporário anterior, os volumes oficiais, o
MongoDB oficial, RabbitMQ e os serviços não foram removidos nem reiniciados.

Posteriormente, a limpeza autorizada do destino temporário anterior
`goleve-consolidation-restore-feb7faf5aa41` confirmou o ID completo
`22c208aeca6caa8263ef059c97d7df7d4b15932532a7681b28fc634f75f38432`, labels de
restauro isolado, ausência de mounts e ausência de processos de validação
ativos. O contentor foi parado e removido exclusivamente, sem `-v`; a rede
dedicada foi preservada. O inventário regressou a **38 contentores**, com os
**14 oficiais healthy**. O backup, hash, manifesto e `restore-verification.json`
continuam preservados e `restoreValidated=true`.

Após a limpeza, o plano read-only `--plan --official` do índice Payment foi
reexecutado. Resultado: índice antigo
`ownerId_1_confirmationKey_1` presente e `sparse`, índice novo ausente,
`incompatible=0`, `duplicateGroups=0`, `critical=0`, `ready=true` e
`alreadyApplied=false`. Nenhum índice, documento, serviço, volume ou mensagem
RabbitMQ foi alterado. A migração oficial continua a aguardar confirmação
operacional para a janela de manutenção.

### Execução oficial do índice Payment — interrompida na verificação final

Em 2026-11-03T11:32Z foram confirmadas novamente a identidade do MongoDB
oficial (`goleveV1`, PRIMARY), a integridade do backup validado e o plano
read-only. A execução autorizada iniciou a janela de manutenção, drenou e
parou apenas o Payment e aplicou a substituição controlada no MongoDB.

Índice antes:
`ownerId_1_confirmationKey_1`, chave `(ownerId: 1, confirmationKey: 1)`,
`unique=true`, `sparse=true`.

Índice depois:
`ownerId_confirmationKey_valid_unique_v2`, a mesma chave composta,
`unique=true`, `partialFilterExpression.confirmationKey.$type="string"`.
O índice antigo não está presente. A reauditoria read-only confirmou
`incompatible=0`, `duplicateGroups=0`, `critical=0`, `ready=true` e
`alreadyApplied=true`. Os documentos, opções das coleções e restantes índices
Payment foram preservados; não foi feito rollback automático.

A recriação exclusiva do contentor Payment ocorreu, mas a verificação final
falhou ao consultar o RabbitMQ Management API (`fetch failed`). O guardrail
deixou o Payment parado para impedir novas escritas: o contentor novo terminou
com código 0, mas não ficou healthy; os outros 13 contentores oficiais
continuaram healthy. O RabbitMQ broker permaneceu healthy e a leitura
read-only posterior confirmou as quatro mensagens persistentes de retenção,
quatro prontas, zero unacknowledged, zero consumidores e 1226 bytes
persistentes. Nenhuma mensagem foi consumida.

Não foram executados os testes MockBank nem os testes de intenções/idempotência
porque o Payment não atingiu a condição healthy. Não foi feita nova tentativa,
reinício, rollback de índice ou operação disruptiva RabbitMQ. O registo
`.local/payment-index-deployment-before.json` conserva
`writesSuspended=true`, `passed=false` e a falha `fetch failed`. A migração
ficou parcialmente aplicada e requer diagnóstico/autorização específica para
retomar apenas a disponibilização segura do Payment.

### Recuperação controlada do Payment — concluída

O diagnóstico posterior confirmou que a falha `fetch failed` foi transitória
na chamada HTTP ao RabbitMQ Management API durante a verificação final: as
rotas de filas, bindings e exchange respondem com a mesma porta, hostname,
credenciais e autenticação usados pelo script; o broker AMQP também responde a
`rabbitmq-diagnostics ping`. Não foi comprovada indisponibilidade do RabbitMQ
nem foi necessário alterar a chamada, filas ou exchanges. O histórico da
falha permanece preservado; não se repetiu a migração nem se fez rollback.

Foi iniciado exclusivamente o contentor Payment já recriado com a imagem
corrigida. O contentor ficou healthy, com o modelo cujo SHA-256 é
`18a77cf802f25b3079c0ec435893086d8f60216deb3a6f2c4afa4f2e1f679fe7`, e a
definição compilada declara apenas
`ownerId_confirmationKey_valid_unique_v2` para a nova proteção parcial.

Os testes fictícios autorizados passaram: **7 verificações** cobrindo duas
intenções legítimas sem chave, criação concorrente/replay, confirmação
concorrente, replay idempotente, reutilização inválida de chave, uma única
reivindicação MockBank, outbox/notificação e readiness. Não foram criadas
cobranças reais. A auditoria Mongo read-only confirmou PRIMARY em `goleveV1`,
zero operações críticas, zero grupos duplicados de chaves string e seis
documentos Payment preservados; o grupo de colisão de rollback legado
(`legacyRollbackCollisionGroups=1`) corresponde às intenções sem chave e não
impede o índice v2.

Estado final verificado: **38 contentores**, **14 oficiais healthy**, Payment
healthy, índice v2 presente e antigo ausente. RabbitMQ mantém quatro mensagens
persistentes de retenção, quatro prontas, zero unacknowledged, zero
consumidores e 1226 bytes persistentes. `goleve_mongo_data`,
`goleve_rabbitmq_data`, documentos e restantes índices foram preservados.
Não foram executados testes disruptivos de stop/start RabbitMQ, nem commit,
push ou merge. A evidência não secreta da recuperação está em
`.local/payment-index-recovery.json`.

**Migração suspensa** conforme a condição de falha do restauro. Nenhum Payment
foi parado, nenhum índice foi alterado, nenhum serviço foi reiniciado e nenhuma
mensagem RabbitMQ foi consumida ou alterada. O destino temporário permanece
existente e as evidências ficam preservadas para análise. A exceção limitada
`admin.system.keys-only` foi usada apenas na comparação read-only; não isenta
`goleve_auth.auth_sessions` nem qualquer outra coleção. É necessária uma
decisão separada sobre a divergência dos 11 documentos antes de qualquer
validação adicional ou migração oficial.

Foram preparados, sem execução oficial, `scripts/payment-index-official.cjs`
(guarda backup validado, drena e para apenas Payment, migra, compara hashes e
índices, atualiza apenas essa imagem e confere os demais contentores) e
`scripts/payment-index-http.cjs` (validação fictícia de criação, replay,
concorrência, outbox e deduplicação). Não executam cobranças reais. A aplicação
continua condicionada ao backup/restauro validado, não apenas à existência desses
scripts. Evidências locais: `.local/payment-index-deployment-before.json`,
`.local/payment-index-new-backup.json`, `.local/payment-index-restore-resource.json`,
`.local/payment-index-restore-results.log` e `.local/payment-index-restore-diagnostic.json`.
