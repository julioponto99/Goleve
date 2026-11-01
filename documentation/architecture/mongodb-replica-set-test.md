# Ensaio isolado de MongoDB Replica Set

## Objetivo e limites

Este runbook prepara um ensaio descartável de um replica set MongoDB de nó
único (`rs0`) para validar a infraestrutura necessária à Agenda Profissional.
Não copia dados reais, não liga aos serviços GoLeve e não altera o Compose
principal, o Compose demo, os 14 serviços ou os volumes existentes.

O ficheiro [compose.mongodb-replica-test.yaml](../../compose.mongodb-replica-test.yaml)
é uma configuração independente. Não deve ser incluído no comando habitual
`docker compose` nem carregado com `-f compose.yaml`.

O contentor foi executado apenas no ensaio autorizado; nenhum contentor
principal foi iniciado ou alterado nesta etapa.

## Estado observado

A versão exata lida do contentor MongoDB principal foi:

```text
mongod 7.0.45
gitVersion a52313e13ab55c9bddf7c3ff91dab286fa381796
OpenSSL 3.0.2
ubuntu2204 / x86_64
```

O comando de leitura utilizado foi:

```powershell
docker exec goleve-mongodb-1 mongod --version
```

Também foi confirmado com `mongosh` que a versão do servidor é `7.0.45`.

## Isolamento do ensaio

| Recurso | Ensaio | Ambiente existente |
|---|---|---|
| Projeto Compose | `goleve-mongodb-rs-test` | `goleve` / demo |
| Contentor | `goleve-mongodb-rs-test-mongodb-rs-test-1` | contentores atuais |
| Rede | `goleve_mongodb_rs_test` | `goleve_backend`, `demo` e redes externas |
| Volume | `goleve_mongodb_rs_test_data` | `goleve_mongo_data`, tmpfs demo e outros |
| Porta host | `127.0.0.1:27021` | `27019`, `27018`, `27017` |
| Dados | vazio e fictício | nunca utilizado |

O nome do volume é explícito para evitar reutilização acidental. Antes de
qualquer ensaio, confirmar que não existe um volume com esse nome que contenha
dados de outro trabalho. Não executar `docker volume rm` como parte deste
runbook.

## Autenticação e hostname

O Compose de ensaio exige duas variáveis que não têm valores por defeito:

```powershell
$env:MONGO_RS_TEST_ROOT_USERNAME = 'rs_test_root'
$env:MONGO_RS_TEST_ROOT_PASSWORD = '<password-fictícia-fora-do-repositório>'
```

O password deve ser fictício, mantido apenas no ambiente protegido da sessão
e nunca escrito no Compose, Git, histórico de shell, relatório ou linha de
comando partilhada. Para automatização, usar um mecanismo local de secrets
aprovado. Não reutilizar credenciais do ambiente principal, demo ou qualquer
outro contentor.

O serviço arranca com `--auth` e o entrypoint oficial do Mongo cria o
utilizador root apenas na base vazia do volume de ensaio. A autenticação
interna entre membros não é necessária para um único membro neste ensaio; se o
desenho futuro exigir `keyFile`, deve ser validado num ensaio separado com um
ficheiro protegido e permissões compatíveis com o Docker Desktop.

Neste ensaio, MongoDB 7 exigiu um `keyFile` porque `--auth` combinado com
replica set não inicia sem autenticação interna. O Docker Desktop montou o
secret como read-only e com permissões incompatíveis; a configuração de teste
copia-o para `/tmp`, aplica modo `0400`, muda o proprietário para `mongodb` e
inicia o entrypoint oficial. A chave original permanece fora do repositório.

O hostname anunciado aos clientes será:

```text
host.docker.internal:27021
```

Este nome é escolhido porque deve ser alcançável pelo Windows host e por
contentores Docker Desktop através da porta publicada. O endereço anunciado
deve ser o mesmo usado na configuração de `rs.initiate()`:

```javascript
{ _id: 0, host: "host.docker.internal:27021" }
```

Antes de inicializar o replica set, é obrigatório provar que:

1. o contentor resolve `host.docker.internal`;
2. um cliente num contentor da rede do ensaio alcança
   `host.docker.internal:27021`;
3. o Windows host alcança `127.0.0.1:27021`;
4. o driver consegue redescobrir o PRIMARY pelo hostname anunciado.

Se `host.docker.internal` não for resolvível dentro do contentor, o ensaio
deve parar. Não substituir silenciosamente pelo nome `mongodb-rs-test`: esse
nome não é resolvível pelo Windows host e causaria falhas de descoberta do
PRIMARY.

## Comandos propostos — não executar nesta etapa

### 1. Validar a configuração sem iniciar contentores

```powershell
$env:MONGO_RS_TEST_ROOT_USERNAME = 'rs_test_root'
$env:MONGO_RS_TEST_ROOT_PASSWORD = '<password-fictícia>'

docker compose -f compose.mongodb-replica-test.yaml config
docker compose -f compose.mongodb-replica-test.yaml config --services
```

O resultado deve conter apenas `mongodb-rs-test`, a rede
`goleve_mongodb_rs_test`, o volume `goleve_mongodb_rs_test_data` e a porta
`127.0.0.1:27021->27017`. O output deve ser revisto para confirmar que não
contém a password antes de ser guardado.

### 2. Iniciar apenas o ensaio

```powershell
docker compose -f compose.mongodb-replica-test.yaml `
  -p goleve-mongodb-rs-test up -d
docker compose -f compose.mongodb-replica-test.yaml `
  -p goleve-mongodb-rs-test ps
```

Não acrescentar `compose.yaml`, `compose.demo.yaml`, `--build`,
`--renew-anon-volumes` ou qualquer volume existente. O ensaio deve ser
iniciado vazio.

### 3. Verificar conectividade antes de `rs.initiate()`

```powershell
docker exec goleve-mongodb-rs-test-mongodb-rs-test-1 `
  mongosh --quiet --host 127.0.0.1:27017 `
  -u $env:MONGO_RS_TEST_ROOT_USERNAME `
  -p $env:MONGO_RS_TEST_ROOT_PASSWORD `
  --authenticationDatabase admin `
  --eval 'db.adminCommand({ping:1})'

docker exec goleve-mongodb-rs-test-mongodb-rs-test-1 `
  mongosh --quiet --eval 'print(EJSON.stringify({host: process.env.HOSTNAME}))'

Test-NetConnection 127.0.0.1 -Port 27021
```

O primeiro comando prova autenticação e conectividade local; o terceiro prova
apenas a porta do host, não a descoberta do PRIMARY.

### 4. Inicializar `rs0` — somente após autorização explícita

```powershell
docker exec goleve-mongodb-rs-test-mongodb-rs-test-1 `
  mongosh --quiet `
  -u $env:MONGO_RS_TEST_ROOT_USERNAME `
  -p $env:MONGO_RS_TEST_ROOT_PASSWORD `
  --authenticationDatabase admin `
  --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"host.docker.internal:27021"}]})'
```

Este comando é propositalmente documentado, mas não foi executado. A
inicialização deve ser feita uma única vez num volume vazio e só depois de
validar as condições do hostname.

### 5. Verificar PRIMARY e descoberta

```powershell
docker exec goleve-mongodb-rs-test-mongodb-rs-test-1 `
  mongosh --quiet `
  -u $env:MONGO_RS_TEST_ROOT_USERNAME `
  -p $env:MONGO_RS_TEST_ROOT_PASSWORD `
  --authenticationDatabase admin `
  --eval 'print(EJSON.stringify(rs.status()))'

docker exec goleve-mongodb-rs-test-mongodb-rs-test-1 `
  mongosh --quiet `
  -u $env:MONGO_RS_TEST_ROOT_USERNAME `
  -p $env:MONGO_RS_TEST_ROOT_PASSWORD `
  --authenticationDatabase admin `
  --eval 'print(EJSON.stringify(db.adminCommand({replSetGetStatus:1})))'
```

Critérios: `setName` `rs0`, um membro, estado `PRIMARY`, host anunciado
exatamente `host.docker.internal:27021` e `ok: 1`. A verificação deve ser
repetida a partir de um cliente Docker e do Windows host.

## Testes funcionais propostos

Os blocos seguintes usam apenas documentos fictícios numa base
`goleve_rs_test`. Não executar antes da autorização do ensaio.

### Transação commit e rollback

```powershell
$uri = 'mongodb://' + $env:MONGO_RS_TEST_ROOT_USERNAME + ':' +
  $env:MONGO_RS_TEST_ROOT_PASSWORD +
  '@host.docker.internal:27021/goleve_rs_test?replicaSet=rs0&authSource=admin'

docker run --rm --network goleve_mongodb_rs_test mongo:7 `
  mongosh $uri --quiet --eval @'
const s = db.getMongo().startSession();
const d = s.getDatabase("goleve_rs_test");
s.startTransaction({readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
d.tx_parent.insertOne({_id:"commit-parent", kind:"synthetic"}, {session:s});
d.tx_outbox.insertOne({_id:"commit-event", type:"synthetic.created"}, {session:s});
s.commitTransaction();
s.endSession();
printjson(d.tx_outbox.findOne({_id:"commit-event"}));
'@
```

Para rollback, iniciar uma transação, escrever em duas coleções, provocar uma
exceção antes do commit e confirmar que nenhuma das duas escritas existe.
Não usar `--drop` nem apagar coleções de outros testes.

### Inserções concorrentes

Executar dois clientes fictícios em paralelo, ambos a tentar inserir a mesma
chave única numa coleção de ocupação. Espera-se um único sucesso, um erro de
duplicação controlado e nenhuma reserva parcial. Repetir com uma transação
abortada e uma tentativa posterior.

O teste de concorrência deve registar request IDs sintéticos, não dados reais,
e verificar que retries não criam eventos duplicados.

### Outbox transacional

Na mesma transação, inserir uma reserva sintética e o seu evento outbox.
Provocar abort antes do commit e confirmar que nenhum documento fica
persistido. Num commit bem-sucedido, publicar posteriormente o evento com um
worker idempotente simulado e confirmar:

- um evento persistido;
- nenhum evento publicado antes do commit;
- retries não duplicam o efeito;
- o estado `publishedAt`/equivalente é consistente.

Este ensaio valida a capacidade MongoDB, não substitui a futura implementação
do outbox GoLeve nem o contrato RabbitMQ.

### Reinício e recuperação

```powershell
docker compose -f compose.mongodb-replica-test.yaml `
  -p goleve-mongodb-rs-test restart mongodb-rs-test
docker compose -f compose.mongodb-replica-test.yaml `
  -p goleve-mongodb-rs-test ps
```

Após o reinício, verificar novamente `rs.status()`, autenticação, descoberta
do host anunciado, leitura dos documentos sintéticos e uma transação nova.
Num nó único, isto valida recuperação do processo, não failover.

## Terminação do ensaio

Só depois de guardar o relatório de resultados e obter autorização:

```powershell
docker compose -f compose.mongodb-replica-test.yaml `
  -p goleve-mongodb-rs-test down
```

Este comando não remove o volume do ensaio. A eliminação posterior de
`goleve_mongodb_rs_test_data` exige uma autorização separada, confirmação do
nome exato e verificação de que o volume contém apenas dados sintéticos do
ensaio. Nunca usar `down -v` neste procedimento.

## Riscos restantes

- `host.docker.internal` pode não ser resolvível ou pode anunciar um endpoint
  que não funciona em todos os modos de rede.
- O volume de um ensaio anterior pode ser reutilizado por engano.
- A password pode ficar exposta em variáveis, processos ou histórico se o
  operador não usar um mecanismo protegido.
- `--auth` sem um desenho de keyFile não representa a autenticação de um
  futuro replica set multi-nó.
- Um nó único não fornece failover, cópia independente nem proteção contra
  perda do host.
- O teste de índice único não prova exclusão de intervalos arbitrários.
- O `mongo:7` do ensaio deve ser fixado ao mesmo digest aprovado, ou a
  diferença deve ser explicitamente aceite.

## Critérios para autorizar o ensaio

O ensaio só pode iniciar quando:

1. o Compose exclusivo passa `docker compose config`;
2. as variáveis de credenciais são fictícias e protegidas;
3. `goleve_mongodb_rs_test_data` não existe ou está formalmente vazio;
4. porta `27021` e rede `goleve_mongodb_rs_test` estão livres;
5. não há referência a `goleve_mongo_data`, `goleve_backend` ou
   `compose.demo.yaml`;
6. o digest da imagem foi registado e aprovado;
7. foi aprovado o hostname `host.docker.internal:27021`;
8. existe um plano de recolha de resultados sem dados reais;
9. os responsáveis aceitaram a limitação de nó único;
10. está explícito que `rs.initiate()` só será executado após as verificações
    de conectividade.

## Estado desta preparação

- Configuração exclusiva preparada e executada apenas no ambiente isolado.
- Runbook e testes preparados; resultados registados abaixo.
- Nenhum dado real copiado.
- Nenhum volume, contentor, rede ou serviço existente alterado.
- Nenhum Compose principal ou demo alterado.
- Nenhum commit ou push efetuado.

## Registo da execução autorizada

Execução realizada apenas com o Compose isolado, usando MongoDB `7.0.45` e
dados sintéticos:

- `rs0` inicializado com um membro `PRIMARY`.
- Autenticação root e `replSetGetStatus` aprovados.
- `host.docker.internal:27021` resolvido pelo contentor e porta publicada
  alcançável pelo Windows host.
- Commit multi-documento reserva + outbox aprovado.
- Rollback confirmou que nenhuma das duas escritas ficou persistida.
- Falha sintética seguida de nova transação aprovada.
- Chave de idempotência duplicada rejeitada.
- Dois pedidos concorrentes produziram uma criação e um conflito; ocupação
  final igual a 1.
- Após reinício do contentor isolado, `PRIMARY`, autenticação, persistência e
  nova transação foram aprovados.

Os primeiros arranques falharam apenas por requisitos do `keyFile` e foram
corrigidos no Compose de ensaio. Não houve alteração no ambiente principal.
