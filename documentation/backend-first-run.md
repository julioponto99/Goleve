# Primeiro arranque do backend GoLeve V1

Este guia destina-se a um computador novo. Usa os ficheiros deste clone e gera
segredos locais novos. Não copiar `.env`, `.secrets`, backups ou volumes de outra
máquina. É um ambiente de desenvolvimento, não uma configuração de produção.

## Requisitos

- Git, Node.js 22 e npm; usar o lockfile em `backend/`.
- Docker Desktop/Engine Linux e Docker Compose v2 ou superior.
- Portas loopback livres: Gateway 3000, MongoDB 27019, RabbitMQ 5672/15672.
- Memória e disco suficientes para 14 componentes. Não parar outras stacks para
  compensar falta de capacidade sem autorizacao.

## Escolher o modo antes da instalação

O modo normal de desenvolvimento não cria utilizadores ficticios, administradores,
âmbitos ou aprovações profissionais e mantem MFA administrativo. Para demonstrar
as cinco identidades ficticias, escolher explicitamente `--local-demo` no init e
executar o seed depois do arranque. Ambos os modos mantem pagamentos simulados e
Coach IA desativado. Local-demo continua proibido em produção.

Os templates `.env.example` documentam as variáveis. O percurso recomendado gera
os `.env` reais: não copiar literalmente passwords de exemplo nem um JWT vazio.
Valores personalizados já existentes são preservados e validados; valores
inseguros ou configurações de outra instalação provocam recusa, sem substituicao.

## Instalação normal (PowerShell, raiz do clone)

```powershell
npm.cmd ci --prefix backend --no-audit --no-fund
node scripts/backend-setup.cjs init
docker compose --env-file .env -f compose.yaml -p goleve build
node scripts/backend-setup.cjs up
node scripts/backend-setup.cjs status
```

Para demonstração, usar `init --local-demo` **em vez** de `init` acima e, depois
que todos os servicos estiverem prontos, executar:

```powershell
node scripts/backend-setup.cjs seed
```

O seed é manual e idempotente, utiliza os modelos de cada proprietario e não
substitui dados existentes. Payment não recebe aprovações artificiais: usar as
APIs MockBank. O comando `seed` recusa o modo normal.

As cinco contas usam os emails ficticios utilizador, pt, nutricionista, gestor
 e admin em `demo.goleve.test`. As passwords são geradas uma vez e guardadas em
cofre cifrado. Num terminal Windows interativo, copiar apenas a password escolhida:

```powershell
node scripts/local-demo.cjs credentials utilizador@demo.goleve.test
# Depois da utilização:
Set-Clipboard -Value ''
```

Não colocar essas passwords em tickets, scripts, capturas, logs ou no Git. A CLI
atual de consulta de credenciais usa o clipboard Windows; outro sistema necessita
um procedimento local seguro aprovado. Não se cria uma conta administrativa real.
A preparação de material de fixtures para os mounts não ativa autoridade demo nem
cria contas quando o modo está desligado.

## O que o instalador faz

1. Recusa redes, volumes ou contentores do projeto que já existam sem o seu
   marcador de propriedade. Não tenta adotar volumes antigos nem aplicar migrações.
2. Cria configuração backend em `.env`, chaves novas, rede e volumes exclusivos.
   Os nomes por defeito são goleve_backend, goleve_mongo_data e goleve_rabbitmq_data.
3. Inicia somente o MongoDB novo em standalone para inspecionar que não existem
   bases aplicacionais nem utilizadores/papéis administrativos anteriores.
4. Preserva o volume novo, passa esse MongoDB a replica set e inicializa
   goleveV1 com membro mongodb:27017. Esta passagem aplica-se só a recursos novos
   com propriedade verificada. Os scripts de migração existentes mantem os seus
   requisitos de backup/restauro.
5. Confirma PRIMARY. As URIs geradas usam replicaSet=goleveV1, retryWrites=true
   e w=majority, com uma base lógica por servico.
6. Inicia RabbitMQ, os 11 microservicos e Gateway, verificando health em cada
   etapa. O perfil opcional tools não e ativado automaticamente.

O diretório `/data/configdb`, não utilizado pelo replica set normal, usa tmpfs;
os dados e a configuração de replicação persistem em `/data/db`.

O estado local fica em `.local/backend-installation.json`, ignorado pelo Git.
Repetir init/up na mesma instalação valida propriedade e replica existente;
não reinicializa um replica set nem renova passwords. Não alterar manualmente o
estado para adotar recursos antigos. Após existir dados, não alternar os modos
normal/demo sem revisão explícita.

## Recursos existentes e migração

Se init detetar recursos preexistentes, parar o procedimento: inventariar,
confirmar backups e restauro, avaliar compatibilidade e obter autorizacao para a
migração. Não executar purge, down -v, rs.initiate ou remover volumes para fazer o
instalador passar. Não utilizar o ACK de backup/restauro para uma instalação nova;
o inicializador novo tem guardas próprias de vazio e propriedade.

## Nomes e portas personalizados

Exemplo para uma instalação separada, sem reutilizar dados ou credenciais:

```powershell
node scripts/backend-setup.cjs init --project goleve-colega --local-demo --gateway-port 3015 --mongo-port 27025 --rabbit-port 5685 --rabbit-management-port 15685
docker compose --env-file .env -f compose.yaml -p goleve-colega build
node scripts/backend-setup.cjs up
```

O ficheiro .env regista os nomes efetivos GOLEVE_NETWORK_NAME,
GOLEVE_MONGO_VOLUME_NAME e GOLEVE_RABBIT_VOLUME_NAME. Servicos resolvem-se pelo
nome dentro da rede privada; os portas internos permanecem iguais. Os testes
locais de manutencao anteriores que fixam projeto, porta ou evidências desta
máquina não são verificadores genericos de um clone novo.

## Consultar e parar

- Gateway: http://127.0.0.1:3000/health e /ready.
- Swagger: http://127.0.0.1:3000/api-docs e /api-docs/openapi.json; leitura,
  Try it out desativado, documentacao indisponivel em produção.
- Interfaces administrativas de infraestrutura não são APIs do frontend.
- Android/iPhone fisicos precisam de encaminhamento autorizado; localhost do
  dispositivo não representa o computador do backend. Não expor MongoDB/RabbitMQ.

Para parar uma instalação criada neste clone, usar o projeto indicado no estado:
`docker compose --env-file .env -f compose.yaml -p goleve stop`. Para retomar,
`node scripts/backend-setup.cjs up`. Não remover os volumes para reiniciar.
O comando up inicia primeiro MongoDB, aguarda PRIMARY de goleveV1 sem executar
rs.initiate e depois aguarda RabbitMQ, os 11 microserviços e o Gateway.
Recursos ausentes ou de outro proprietário são recusados; up não cria volumes.

## Validação

```powershell
npm.cmd run build --prefix backend --workspaces --if-present
npm.cmd run test --prefix backend --workspaces --if-present
node --test scripts/tests/new-install.test.cjs scripts/tests/local-runtime.test.cjs
node scripts/release-contracts.cjs
node scripts/gateway-swagger.cjs
```

O teste direcionado `scripts/tests/new-install.restart.cjs` exige uma instalação
fictícia já inicializada em `.local/restart-fixture-*`, com recursos próprios e
14 contentores existentes. Requer `GOLEVE_RESTART_TEST_ROOT`, o nome exato em
`GOLEVE_RESTART_TEST_PROJECT` e
`GOLEVE_RESTART_TEST_ACK=isolated-fictional-installation`. Não cria infraestrutura,
não executa init nem seeds. Guarda snapshots JSON e resultados apenas na pasta
ignorada `.local` da fixture, antes e depois de stop/up e do segundo up.

A comparação inclui bases aplicacionais e admin, coleções, hashes dos documentos,
índices, opções, configuração estrutural integral do replica set, volumes,
montagens, contentores e filas/bindings RabbitMQ. Apenas `config.term` é separado
da configuração estrutural; termo de eleição, ID de eleição, tempos de atividade,
timestamps operacionais e startedAt do instalador ficam na telemetria. As bases
internas local/config (oplog e metadados operacionais MongoDB) não pertencem ao
inventário aplicacional. Não há exclusão de coleções aplicacionais ou tolerância
para diferenças nos seus hashes. Se TTL alterar documentos, o teste falha até
existir prova específica da expiração; não elimina diferenças automaticamente.
No fim para apenas a stack temporária e preserva contentores, volumes e snapshots.

Integracoes que exigem MongoDB/RabbitMQ de teste devem receber somente recursos
isolados explicitamente autorizados. Ausencia de variáveis de integracao não e
prova desses percursos. Não executar sondas antigas de resiliencia sobre a stack
oficial apenas para testar conectividade. Os 12 bloqueios de produção documentados
na entrega V1 não são resolvidos por este instalador.
