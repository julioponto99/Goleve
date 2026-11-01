# Plano de migração do MongoDB para replica set

## 1. Objetivo e limites

Este documento prepara a futura migração do MongoDB do ambiente principal
para um replica set de nó único, por exemplo `rs0`. O objetivo é habilitar
transações MongoDB para reservas profissionais e outbox transacional, sem
alterar nesta etapa o Compose, código, dados, volumes ou estado operacional.

As regras funcionais da Agenda Profissional permanecem na
[arquitetura da Agenda Profissional](./professional-agenda.md). Este documento
trata apenas da infraestrutura necessária e dos riscos da migração.

Nenhum comando de backup, `rs.initiate()`, alteração de configuração,
reinício, `down`, remoção de volume ou restore foi executado para produzir
este plano.

## 2. Estado real auditado

### Compose principal

O [compose.yaml](../../compose.yaml) define 14 serviços:

1. `mongodb`
2. `rabbitmq`
3. `auth-service`
4. `professional-service`
5. `management-service`
6. `notification-service`
7. `payment-service`
8. `performance-service`
9. `hydration-service`
10. `training-service`
11. `user-service`
12. `agenda-service`
13. `ai-coach-service`
14. `api-gateway`

O MongoDB principal está configurado como:

- imagem `mongo:7`;
- porta do contentor `27017`, publicada por defeito apenas em
  `127.0.0.1:27019`;
- volume nomeado `goleve_mongo_data` montado em `/data/db`;
- healthcheck baseado em `db.adminCommand({ ping: 1 })`;
- sem `command` com `--replSet`;
- sem `--auth`, `keyFile`, utilizador Mongo ou credenciais Mongo declaradas
  no Compose;
- rede Docker `goleve_backend`.

O digest observado para a imagem local `mongo:7` foi:

```text
mongo@sha256:8bb4442761a63a8dda452744082cdac9644b429807eb977b42324a63cef59ca4
```

O `mongod` em execução foi lido como `7.0.45`, com git version
`a52313e13ab55c9bddf7c3ff91dab286fa381796`, `ubuntu2204` e `x86_64`.

O tag `mongo:7` não é, por si só, uma política de pinning suficiente. A
imagem e o digest devem ser confirmados novamente na janela de migração.

### Bases e clientes configurados

Os serviços que recebem `MONGO_URI` no Compose principal usam a mesma
instância `mongodb:27017`, mas bases separadas pelo prefixo configurável:

| Serviço | Base por defeito |
|---|---|
| Auth | `goleve_auth` |
| User | `goleve_user` |
| Training | `goleve_training` |
| Agenda | `goleve_agenda` |
| Performance | `goleve_performance` |
| Hydration | `goleve_hydration` |
| Professional | `goleve_professional` |
| Payment | `goleve_payment` |
| Notification | `goleve_notification` |
| AI Coach | `goleve_ai_coach` |

`api-gateway` e `management-service` não recebem `MONGO_URI` no Compose
principal. Os restantes serviços podem criar coleções apenas quando as suas
funcionalidades forem utilizadas; a lista acima é configuração, não um
inventário confirmado do conteúdo atual.

As configurações Mongoose observadas usam `mongoose.connect` ou
`mongoose.createConnection` com timeouts e heartbeat, mas não especificam
`replicaSet`, `readConcern`, `writeConcern`, `retryWrites` ou sessões
transacionais. Não há implementação atual de outbox ou de transações
multi-documento nos serviços auditados.

### Volumes, contentores e isolamento

O contentor do Compose principal monta:

- `goleve_mongo_data` em `/data/db`;
- um volume anónimo em `/data/configdb`, criado pela imagem Mongo;
- `goleve_rabbitmq_data` apenas no RabbitMQ.

O volume `goleve_mongo_data` é o único volume persistente Mongo declarado pelo
Compose principal. O inventário local também mostra outros volumes Mongo,
incluindo `goleve_mongodb_data_goleve` e `goleve_mongodb_data_volume`; a
pertença e utilização desses volumes não foram assumidas.

Além do Compose principal, existem contentores Mongo externos ao projeto,
incluindo contentores com imagens `mongo:latest` e `mongo`, e contentores
`mongo-express`. Estes contentores publicam portas do host diferentes e não
foram tratados como parte da instância `goleve-mongodb`. A sua existência
significa que clientes externos, ferramentas de administração ou projetos
antigos podem continuar ligados a outras instâncias. É necessário identificá-
los e obter aprovação antes da janela de migração; não devem ser parados ou
alterados como parte deste plano.

### Ambiente demo

O [compose.demo.yaml](../../compose.demo.yaml) é independente:

- usa um serviço Mongo `mongo:7` separado;
- usa bases `goleve_demo_<instance>_<service>`;
- monta `/data/db` e `/data/configdb` em `tmpfs`;
- não usa o volume `goleve_mongo_data`;
- não publica a porta Mongo;
- usa rede `demo` interna e rede `gateway` apenas no Gateway;
- recebe secrets próprios gerados pela CLI de demonstração.

A demo atualmente não é uma migração do ambiente principal e não deve ser
reiniciada ou modificada nesta etapa. Um ensaio futuro deve usar uma instância
descartável própria, nunca o volume persistente principal.

## 3. Conclusão da auditoria

O MongoDB do Compose principal está efetivamente em **standalone**: não há
`--replSet`, `replicaSet` no URI ou configuração de cluster observável no
Compose. A imagem suporta replica sets, mas a capacidade da versão não
substitui a configuração e inicialização de uma topologia.

Os dez serviços com URI Mongo partilham a instância, embora usem bases
separadas. O Gateway e o Management comunicam com serviços, não diretamente
com MongoDB. O estado atual do `docker compose ps` mostrou os 14 serviços
principais saudáveis; também mostrou a demo isolada e contentores Mongo
externos, que não fazem parte dessa contagem.

## 4. Riscos classificados

| Gravidade | Risco | Consequência | Mitigação |
|---|---|---|---|
| 🔴 Crítica | Migração sem backup restaurado e ensaiado | Perda ou indisponibilidade de dados | Backup protegido, checksum, restore isolado e aprovação formal |
| 🔴 Crítica | Alterar `/data/db` ou iniciar com topologia incorreta | Instância não inicia ou dados ficam inacessíveis | Janela de manutenção, snapshot/backup verificado e plano de rollback |
| 🔴 Crítica | Ativar autenticação sem credenciais coordenadas | Todos os microserviços deixam de ligar | Inventário de clientes, credenciais protegidas e ensaio completo |
| 🟠 Alta | Hostname anunciado não resolúvel | Cliente não consegue descobrir o PRIMARY | Nome Docker estável, teste de resolução dentro e fora da rede |
| 🟠 Alta | Dois contentores Mongo confundidos | Backup, restore ou URI apontam para dados errados | Identificação por projeto, rede, volume, porta e base; proibir inferências por tag |
| 🟠 Alta | Ficheiro de configuração não persistente | Replica set deixa de arrancar após recriação | Persistir apenas o que for aprovado e validar `/data/configdb` |
| 🟠 Alta | Confundir índice normal com exclusão de intervalos | Reservas profissionais sobrepostas | Slots/locks ou transação com modelo de ocupação discreta |
| 🟡 Média | Retry duplicar operação | Eventos ou reservas duplicados | Chaves idempotentes, versões e outbox com consumidor idempotente |
| 🟡 Média | Nó único indisponível | Não há failover nem disponibilidade durante manutenção | Aceitar explicitamente o RTO/RPO e planear réplica futura |
| 🟡 Média | `mongo:7` flutuar entre builds | Diferenças não controladas na migração | Registar e aprovar digest |
| ⚪ Baixa | Healthcheck apenas testa ping | Não prova autenticação, PRIMARY ou transações | Healthchecks e testes funcionais adicionais após a migração |

## 5. Backup e recuperação propostos

Não é permitido executar estes comandos nesta etapa. Os caminhos devem ser
locais protegidos, com permissões restritas e retenção aprovada; nunca devem
ser colocados no repositório, enviados para serviços externos ou impressos em
logs.

### 5.1 Inventário sem exposição de dados

Antes do backup, registar de forma controlada:

- nome do contentor e projeto Compose;
- imagem e digest;
- volume e mount points;
- bases e coleções, sem exportar documentos para relatórios;
- versão do servidor;
- utilizadores/roles apenas como nomes e metadados não secretos;
- tamanho, contagem de documentos e índices, se a política de privacidade
  permitir;
- clientes e URIs por serviço, redigindo utilizadores, passwords e tokens.

O inventário deve ser guardado num local protegido e separado do backup de
documentos.

### 5.2 Backup lógico proposto

Exemplo PowerShell, a adaptar depois de confirmar autenticação, versão,
contentor e destino protegido:

```powershell
$backup = 'D:\protegido\goleve-mongo\YYYYMMDD-HHmmss'
New-Item -ItemType Directory -Path $backup -Force

docker exec goleve-mongodb-1 mongodump `
  --host 127.0.0.1:27017 `
  --archive `
  --gzip `
  > (Join-Path $backup 'goleve.archive.gz')

Get-FileHash (Join-Path $backup 'goleve.archive.gz') -Algorithm SHA256 `
  > (Join-Path $backup 'goleve.archive.sha256.txt')
```

Este exemplo não deve ser usado sem confirmar que `goleve-mongodb-1` é o
contentor correto e sem fornecer autenticação através de um mecanismo
protegido. Não passar passwords na linha de comandos. Para um servidor
autenticado, usar um ficheiro de credenciais protegido ou o mecanismo aprovado
pela equipa de operações.

O backup deve incluir metadados de configuração e inventário, mas não deve
expor secrets. O checksum deve ser calculado antes e depois de copiar para o
repositório protegido. A existência do arquivo e do checksum não prova que o
backup é restaurável.

### 5.3 Restore de ensaio

Restaurar apenas numa instância descartável, com volume e rede exclusivos:

```powershell
docker run --rm --name goleve-mongo-restore-test `
  -v goleve-mongo-restore-test:/data/db `
  mongo:7 --bind_ip_all

docker exec -i goleve-mongo-restore-test `
  mongorestore --archive --gzip --drop `
  < D:\protegido\goleve-mongo\YYYYMMDD-HHmmss\goleve.archive.gz
```

Os comandos acima são apenas um esboço e não devem ser executados nesta
etapa. O ensaio real deve usar um contentor temporário aprovisionado sem
portas públicas, uma imagem fixada e um fluxo que não misture volumes. Deve
validar nomes de bases, coleções, contagens, índices, amostras sintéticas de
leitura e a capacidade de iniciar os clientes em modo de teste.

O restore só é aprovado quando:

- o arquivo passa o checksum;
- todas as bases esperadas são restauradas;
- contagens e índices são reconciliados com o inventário;
- documentos críticos passam verificações de integridade;
- a aplicação de teste consegue autenticar e executar leituras;
- o arquivo e o ambiente de ensaio são eliminados segundo a política de
  retenção, sem tocar no ambiente principal.

## 6. Desenho futuro do replica set

### 6.1 Topologia

Recomenda-se um replica set de nó único `rs0` como etapa transitória, não como
arquitetura de alta disponibilidade. O membro deve anunciar um hostname
estável, por exemplo `mongodb`, resolvível por todos os clientes na rede
Docker:

```text
mongodb://mongodb:27017/goleve_<service>?replicaSet=rs0
```

Clientes externos não devem usar automaticamente `mongodb`; devem receber um
hostname publicado que seja resolvível no contexto em que executam. Um
hostname anunciado apenas dentro da rede Docker não é válido para aplicações
no Windows host ou noutra rede.

### 6.2 Alterações futuras ao Compose

Somente após aprovação, backup e ensaio, a alteração deverá:

1. adicionar `--replSet rs0` ao comando do `mongod`;
2. definir um hostname estável para o serviço;
3. manter o volume atual sem o substituir;
4. decidir se `/data/configdb` precisa de persistência controlada;
5. adicionar autenticação com keyFile e/ou credenciais Mongo, conforme o
   desenho de segurança aprovado;
6. atualizar todos os `MONGO_URI` para incluir `replicaSet=rs0` e as opções
   aprovadas;
7. trocar o healthcheck por verificações que distingam PRIMARY saudável de
   simples resposta a ping;
8. documentar explicitamente que a demo permanece separada.

Não se deve combinar esta alteração com upgrades de aplicação, renomeação de
bases ou limpeza de coleções.

### 6.3 Inicialização controlada

O procedimento futuro, nunca executado nesta etapa, deverá iniciar o Mongo
com a configuração aprovada e executar uma única vez:

```powershell
docker exec goleve-mongodb-1 mongosh --quiet --eval `
  'rs.initiate({_id:"rs0",members:[{_id:0,host:"mongodb:27017"}]})'
```

O comando exato depende do hostname resolvível e da autenticação. Em
particular, `rs.initiate()` não deve ser executado enquanto o servidor estiver
em standalone ativo sem janela e sem plano de retorno. Validar:

```powershell
docker exec goleve-mongodb-1 mongosh --quiet --eval 'rs.status()'
docker exec goleve-mongodb-1 mongosh --quiet --eval 'db.adminCommand({replSetGetStatus:1})'
```

Critérios: `setName` igual a `rs0`, exatamente um membro, estado `PRIMARY`,
hostname correto, `optimes` a avançar e clientes capazes de reconectar.

## 7. Transações, Mongoose e outbox

Após o replica set, cada operação que altere reserva e outbox deve usar uma
sessão Mongoose e uma transação explícita:

```ts
const session = await connection.startSession();
try {
  await session.withTransaction(async () => {
    // reserva, ocupação, histórico e outbox
  }, {
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' },
  });
} finally {
  await session.endSession();
}
```

O código real ainda precisa definir limites de tempo, `maxCommitTimeMS`,
classificação de erros transitórios, retry seguro do commit e chaves
idempotentes. Uma transação não deve repetir uma operação de negócio sem uma
idempotency key.

Com um único nó, `w: "majority"` só fornece a maioria disponível desse único
membro; não fornece cópia independente. Perda do nó, volume corrompido,
host indisponível ou falha de disco continua a causar indisponibilidade e
possível perda desde o último backup. Não há failover real nem proteção
contra perda do host.

### Outbox

A reserva, a ocupação do intervalo, a mudança de estado, o histórico e o
evento outbox devem ser gravados na mesma transação quando o modelo exigir
atomicidade multi-documento. O publicador RabbitMQ deve:

- ler apenas eventos persistidos;
- marcar/publicar de forma idempotente;
- repetir falhas transitórias com backoff;
- não apagar eventos antes de confirmação da política de entrega;
- tolerar duplicados no consumidor;
- expor métricas para backlog, idade e falhas.

O outbox não resolve por si só a exclusão de intervalos arbitrários. Um índice
MongoDB normal não impede dois documentos cujos intervalos se sobrepõem. A
Agenda Profissional deve escolher uma destas estratégias antes da
implementação:

1. slots discretos com índice único por profissional e slot;
2. lock lógico por profissional/janela, com expiração e recuperação;
3. modelo de ocupação serializado numa transação com uma autoridade única.

Para a primeira implementação, slots discretos são a alternativa mais
verificável, desde que a granularidade, buffers, durações e DST sejam
aprovados. Reagendamento deve criar a nova reserva e só libertar a antiga
quando a nova ocupação estiver confirmada, dentro da garantia de consistência
escolhida.

## 8. Procedimento futuro por etapas

### Etapa A — Inventário e pré-requisitos

- **Comandos propostos:** `docker compose config`, `docker compose ps`,
  `docker inspect`, `docker volume inspect`, `mongosh` apenas para metadados
  redigidos.
- **Objetivo:** confirmar contentor, volume, versão, bases, clientes e
  dependências.
- **Pré-condições:** janela proposta, acesso protegido e proprietário dos
  dados identificado.
- **Riscos:** confundir uma instância externa ou expor secrets.
- **Resultado:** inventário assinado e lista de clientes aprovada.
- **Aprovação:** nenhum cliente desconhecido relevante e volume correto
  confirmado.
- **Interrupção:** parar a preparação; não alterar contentores.

### Etapa B — Backup verificado

- **Comandos propostos:** `mongodump`, `Get-FileHash`, cópia para storage
  protegido e leitura do manifesto.
- **Objetivo:** obter uma cópia lógica verificável.
- **Pré-condições:** destino protegido, espaço suficiente, política de
  retenção e credenciais temporárias.
- **Riscos:** backup incompleto, dados expostos ou arquivo não restaurável.
- **Resultado:** arquivo, checksum, manifesto e logs sem secrets.
- **Aprovação:** checksum e validação de leitura concluídos.
- **Interrupção:** preservar o original, remover apenas artefatos temporários
  explicitamente identificados e abortar a migração.

### Etapa C — Restauro de ensaio isolado

- **Comandos propostos:** `docker run` com volume descartável e
  `mongorestore`.
- **Objetivo:** provar restauração e compatibilidade da versão.
- **Pré-condições:** backup aprovado e rede sem acesso acidental ao ambiente
  principal.
- **Riscos:** contaminar dados reais ou testar uma imagem diferente.
- **Resultado:** bases, coleções, índices e leituras reconciliados.
- **Aprovação:** checklist de restore assinado.
- **Interrupção:** eliminar apenas o contentor/volume temporário identificado,
  nunca o volume principal.

### Etapa D — Janela de manutenção

- **Comandos propostos:** comandos operacionais aprovados para pausar tráfego
  de escrita, sem `down -v`.
- **Objetivo:** impedir escritas durante a mudança.
- **Pré-condições:** backup aprovado, rollback disponível, comunicação e
  RTO/RPO aceites.
- **Riscos:** indisponibilidade ou escritas pendentes.
- **Resultado:** todos os clientes em estado controlado.
- **Aprovação:** nenhum escritor ativo e monitorização pronta.
- **Interrupção:** reabrir apenas o tráfego validado sem alterar a topologia.

### Etapa E — Migração controlada

- **Comandos propostos:** alteração aprovada do Compose, recriação controlada
  apenas do Mongo e `rs.initiate()`.
- **Objetivo:** converter a instância existente para `rs0` preservando
  `/data/db`.
- **Pré-condições:** etapas A-D aprovadas.
- **Riscos:** hostname inválido, autenticação quebrada ou corrupção lógica.
- **Resultado:** servidor inicia como membro `PRIMARY`.
- **Aprovação:** `replSetGetStatus`, logs redigidos e conexão autenticada.
- **Interrupção:** não repetir `rs.initiate()` cegamente; voltar ao
  procedimento de rollback aprovado.

### Etapa F — Verificação de transações

- **Comandos propostos:** teste controlado de sessão/transação e rollback de
  uma operação fictícia.
- **Objetivo:** provar commit, abort, retry e idempotência.
- **Pré-condições:** PRIMARY estável e cliente com URI `replicaSet`.
- **Riscos:** declarar sucesso após uma transação parcial ou duplicada.
- **Resultado:** commit e abort observáveis sem perda de histórico.
- **Aprovação:** testes de erro transitório e duplicação aprovados.
- **Interrupção:** desativar novas escritas de teste e investigar sem limpar
  dados automaticamente.

### Etapa G — Testes dos microserviços

- **Comandos propostos:** healthchecks, testes Auth/User/Professional/Agenda,
  Gateway, JWT, concorrência, Agenda Pessoal e outbox.
- **Objetivo:** provar que a alteração não regressa os serviços.
- **Pré-condições:** cada serviço ligado à base correta.
- **Riscos:** testar apenas `/health` e ignorar falhas de autorização ou
  isolamento.
- **Resultado:** todos os fluxos críticos passam com dados fictícios.
- **Aprovação:** testes funcionais e de segurança sem falhas críticas.
- **Interrupção:** retirar tráfego e restaurar a configuração anterior apenas
  conforme o rollback aprovado.

### Etapa H — Rollback

- **Comandos propostos:** parar escritas, preservar logs e estado, restaurar
  configuração anterior ou recuperar o backup numa instância aprovada.
- **Objetivo:** regressar a um estado operacional conhecido sem apagar
  evidência.
- **Pré-condições:** critério de rollback atingido e decisão do responsável.
- **Riscos:** divergência entre escritas após o backup e dados restaurados.
- **Resultado:** serviço funcional com RPO/RTO conhecidos.
- **Aprovação:** reconciliação de dados e testes mínimos concluídos.
- **Interrupção:** congelar novas escritas; não alternar repetidamente entre
  topologias.

O rollback não deve simplesmente remover o volume ou executar
`docker compose down -v`. Se a migração tiver aceite escritas novas, será
necessária uma decisão explícita sobre reconciliação ou perda dentro do RPO.

## 9. Dependências e alterações futuras

### Compose e operações

- comando, hostname e `replicaSet`;
- autenticação Mongo e gestão de keyFile/credenciais;
- URIs com `replicaSet=rs0`;
- healthcheck de PRIMARY e autenticação;
- pinning de imagem por digest;
- runbook para backup, restore, manutenção e monitorização;
- confirmação de que demo e contentores externos não partilham volumes,
  portas ou credenciais.

### Mongoose e aplicações

- propagar `replicaSet` e opções de timeout;
- usar sessões e `withTransaction`;
- definir `readConcern`/`writeConcern`;
- tratar `TransientTransactionError` e `UnknownTransactionCommitResult`;
- aplicar idempotency keys e versões;
- implementar outbox e consumidor idempotente;
- criar modelo de ocupação que impeça sobreposição sob concorrência;
- adicionar testes de abort, retry, expiração, reagendamento e falha do
  PRIMARY.

### Dependências que precisam de correção

1. Não há autenticação Mongo configurada no ambiente principal.
2. Não há configuração de replica set.
3. Os URIs atuais não têm `replicaSet`.
4. Os adaptadores Mongoose não expõem uma política transacional comum.
5. Não existe outbox transacional.
6. Não existe estratégia implementada para exclusão de intervalos arbitrários.
7. O ambiente demo não inclui Agenda Profissional e deve continuar isolado.
8. Existem contentores Mongo externos cuja relação com este projeto ainda não
   está confirmada.

## 10. Critérios de aceitação da futura migração

A migração só será aceite quando todos os pontos forem demonstrados:

- backup lógico restaurado com sucesso num ambiente isolado;
- inventário de bases, coleções e índices reconciliado;
- `rs0` com PRIMARY estável e hostname resolvível;
- autenticação funcional para todos os clientes aprovados;
- transações commit/abort e retries verificados;
- criação de reserva e outbox atómicos;
- concorrência não cria ocupações duplicadas;
- expiração e reagendamento preservam histórico;
- Auth, User, Professional, Agenda, Gateway e JWT sem regressões;
- Agenda Pessoal continua independente;
- demo permanece isolada e com dados fictícios;
- nenhum dado real é perdido;
- RTO, RPO, observabilidade e rollback são aceites pelos responsáveis.

## 11. Decisões ainda necessárias

Antes da execução, é necessário aprovar:

1. Credenciais, autenticação Mongo e rotação de keyFile.
2. Hostname anunciado e clientes que precisam de acesso a partir do Windows
   host.
3. Persistência de `/data/configdb` e política de pinning da imagem.
4. Política de backup, retenção, encriptação, acesso e destruição.
5. RTO/RPO e aceitação das limitações de um nó único.
6. Estratégia de ocupação temporal: slots, lock ou outro modelo.
7. `readConcern`, `writeConcern`, timeouts e política de retry.
8. Contrato e garantias do outbox/RabbitMQ.
9. Critérios exatos de pausa de tráfego e rollback.
10. Identidade e tratamento dos contentores/volumes Mongo externos.
11. Necessidade futura de uma topologia com múltiplos nós.

Sem estas decisões e sem um restore ensaiado, a migração não está pronta para
execução.

O ensaio isolado prévio está especificado em
[mongodb-replica-set-test.md](./mongodb-replica-set-test.md) e usa
[compose.mongodb-replica-test.yaml](../../compose.mongodb-replica-test.yaml).
