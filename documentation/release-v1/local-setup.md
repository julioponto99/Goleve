# Instalação local independente

Executar estes passos na máquina do novo programador, numa cópia própria do código
e apenas quando o arranque de infraestrutura estiver autorizado. Não são comandos
executados durante a auditoria da Fase 5.14. Ver a [entrega](README.md).

## Pré-requisitos

- Git, Node.js 22+, Docker Engine/Desktop com contentores Linux e Compose v2+.
- Docker com pelo menos 6 GiB atribuídos; preflight histórico exige 4 GiB livres em
  disco e 1,2 GiB de memória livre no host. Estes são mínimos preventivos, não garantia
  de capacidade. Verificar separadamente `MemAvailable`/pressão no Linux/WSL.
- Porta loopback livre, por defeito 64344; escolher outra se estiver ocupada.
- Acesso aos registos npm/imagens para o primeiro build. Lockfile está em `backend/`;
  `npm ci` e TypeScript correm nos Dockerfiles respeitando os workspaces existentes.
  Não é preciso instalar dependências no host para arrancar a stack.

Docker Desktop tem de poder ler este diretório. Em Linux, os ficheiros de secrets
gerados devem ser legíveis pelo UID 1000 do runtime Node, através de permissões/ACL
restritas adequadas ao host. Não usar permissões públicas nas chaves nem executar
rotinas de alteração de propriedade fora da instância própria.

## Gerar configuração e segredos próprios

Na raiz do checkout, na branch de entrega disponibilizada pelo responsável:

```powershell
node scripts/integration.cjs init 64344
```

`init` cria uma instância aleatória e `.integration/active.json`, nunca substitui
estado existente. Se já houver esse ficheiro, inspecionar a própria instância;
não o apagar/rodar secrets para tentar corrigir dados cifrados. O exemplo
[`integration.env.example`](../../integration.env.example) é explicativo, não um
ficheiro para copiar credenciais.

| Ficheiro local gerado | Função |
|---|---|
| `compose.env` | Projeto/instância/porta e diretório absoluto próprios |
| `mongo.env`, `replica.key`, `databases.json` | Instalação MongoDB, chave de replica set e catálogo isolado por serviço |
| `rabbit.env`, `events.env` | RabbitMQ e credencial de eventos próprios |
| `*-service.env`, `auth-test.env` | URI autenticado da base do serviço; JWT secreto apenas no Auth; base de teste Auth separada |
| `mfa.key`, `user_key.key`, `agenda_key.key` | Cifragem específica, mantida fora do Git |
| `management_*.key` | Identidade técnica por par/destino |

São gerados valores aleatórios; não se usam `.env` ou `.secrets` do autor. Não
mostrar `docker compose config` expandido nem copiar envs/logs para tickets.
Conservar estes ficheiros junto dos volumes próprios: perder chaves pode tornar
dados cifrados irrecuperáveis. Nunca partilhar o catálogo ou as passwords com o frontend.

## Configurar e arrancar o projeto próprio

Usa-se a função Compose existente, que carrega/valida o estado e fixa explicitamente
`--env-file`, `--project-directory`, `-p`, `-f` e as variáveis da instância. Os comandos
Node seguintes são iguais em PowerShell e shells POSIX e não invocam a main.

Validação de configuração, sem arrancar recursos:

```powershell
node -e "const t=require('./scripts/integration.cjs'),s=t.load();t.compose(s,['config','--quiet']);"
```

Primeiro arranque, apenas na nova instalação autorizada:

Repetir imediatamente antes a verificação de memória/disco e porta feita por `init`
se houver intervalo entre preparação e arranque. O comando Compose direto abaixo
não executa o preflight histórico da CLI. No Windows, distinguir a RAM livre do host
de `MemAvailable` e da pressão em `/proc/pressure/memory` no Docker/WSL; não contar
cache/reclaimable como memória garantida. Não iniciar se os mínimos deixarem de ser
cumpridos ou houver pressão sustentada. A capacidade para 14 componentes deve ser
avaliada na máquina destinatária.

```powershell
node -e "const t=require('./scripts/integration.cjs'),s=t.load();t.compose(s,['up','-d','--build','--wait','--wait-timeout','300'],true);"
```

Este `up` constrói os 12 processos Node da instalação nova e pode criar todos os
recursos próprios. Não é um comando de atualização pontual numa instalação alheia.
Não usar `docker compose up` sem os argumentos do projeto gerado; isso escolheria
o Compose principal legado. Não usar `integration.cjs up/status` como condição de
sucesso de uma máquina nova: a verificação histórica assume 14 principais preexistentes.
Nenhum validador histórico foi alterado para contornar essa condição.

Consultar só o projeto próprio:

```powershell
node -e "const t=require('./scripts/integration.cjs'),s=t.load();console.log(t.compose(s,['ps','--all']));"
```

Devem existir 14 componentes em execução e saudáveis. `mongo-init` pode aparecer
como 15.º contentor, terminado com código 0; é inicializador, não serviço HTTP.
Não é necessário removê-lo. Nunca reutilizar volumes de outro projeto.

## MongoDB e RabbitMQ

MongoDB usa os volumes exclusivos `mongo_data`/`mongo_config` do projeto e replica
set autenticado `goleveIntegrationV1`, com membro `mongodb:27017` na rede privada.
O entrypoint copia a chave para tmpfs com proprietário/modo próprios; os dados não
ficam em tmpfs. `mongo-init` valida a instância, recusa outro replica set e cria
apenas identidades próprias com `readWrite` na base respetiva. Não copia dados,
promove contas da aplicação ou altera passwords já existentes.

Bases por serviço e base administrativa de testes são distintas, com namespace
aleatório. A inicialização de uma instalação nova é diferente de migrar uma base
existente: não a usar sobre volumes principais. Ver os runbooks históricos de
[migração](../architecture/mongodb-replica-set-migration.md) e
[backup/restore](../architecture/mongodb-backup-restore.md), que exigem operações
autorizadas separadas e não são executados por este guia.

RabbitMQ usa o volume próprio `rabbit_data`, credenciais geradas e rede privada.
Não publica consola de gestão nem porta AMQP no host. Serviços declaram as topologias
de eventos existentes, publisher confirms, retry/DLQ e deduplicação; ver
[contratos de eventos](../events/agenda-payment-notifications.md). Não apagar filas
ou consumir mensagens manualmente para diagnosticar conectividade.

Só o Gateway publica uma porta em `127.0.0.1`. A rede backend é interna; Gateway
liga também à rede edge. Os serviços usam HTTP privado com autorização por contrato
e não expõem APIs técnicas ao cliente. Coach desativado continua com processo saudável.

## Verificar conectividade sem criar contas

Com a porta escolhida (substituir 64344 se diferente):

```powershell
node -e "fetch('http://127.0.0.1:64344/health').then(async r=>{console.log(r.status,await r.json());if(r.status!==200)process.exitCode=1;})"
node -e "fetch('http://127.0.0.1:64344/ready').then(async r=>{console.log(r.status,await r.json());if(r.status!==200)process.exitCode=1;})"
node -e "fetch('http://127.0.0.1:64344/auth/me').then(async r=>{console.log(r.status);if(r.status!==401)process.exitCode=1;})"
```

`/health` verifica processo; `/ready` agrega os onze destinos, usando readiness
própria do Notification/Management e health dos restantes. Não demonstra que uma
funcionalidade bloqueada esteja ativa. Com Bearer válido, Coach devolve 503 enquanto
desativado; sem Bearer, 401 é esperado.

Os exemplos fictícios do [contrato central](../api/backend-release-v1.md) podem ser
executados explicitamente pelo programador para criar a sua conta e dados próprios.
Não há seed automático, administradores predefinidos ou fixture profissional aprovada.
Não executar `integration.cjs test`: esse roteiro inclui paragens de dependências.
O E2E histórico exige a branch `feat/backend-e2e-v1`; não é o verificador desta entrega.

## Parar e retomar preservando dados

Os comandos seguintes afetam apenas os 14 componentes da instância própria,
excluindo o inicializador. Não fazem `down`, não removem volumes nem substituem secrets.

```powershell
node -e "const fs=require('fs'),t=require('./scripts/integration.cjs'),s=t.load(),names=Object.keys(JSON.parse(fs.readFileSync('compose.integration.yaml')).services).filter(n=>n!=='mongo-init');names.forEach(n=>t.own(s,n));t.compose(s,['stop',...names],true);"
node -e "const fs=require('fs'),t=require('./scripts/integration.cjs'),s=t.load(),names=Object.keys(JSON.parse(fs.readFileSync('compose.integration.yaml')).services).filter(n=>n!=='mongo-init');names.forEach(n=>t.own(s,n));t.compose(s,['start',...names],true);"
```

`start` pressupõe contentores já criados; não é primeiro arranque nem aplica imagens
novas. Aguardar readiness e repetir as sondas GET. Atualizações/recriações requerem
plano/autoridade próprios, drenagem e preservação do estado, especialmente Payment.
Não fazer rollback para código que ignore claims persistidos.

## Diagnóstico

| Situação | Verificação segura |
|---|---|
| Porta ocupada | Escolher outra antes de `init`; não parar serviços alheios |
| Memória insuficiente | Medir Windows e Linux/WSL separadamente e pressão; não baixar limites para mascarar falta de recursos |
| `mongo-init` falha | Consultar logs mínimos desse serviço; confirmar instância/chave/base corretas; não alterar volumes ou passwords |
| `EACCES` em secret | Rever ACL/UID e mount próprios; não publicar a chave ou usar chmod global |
| `/ready` 503 | Ler os nomes das dependências e consultar `ps`/logs do serviço, sem expor configuração expandida |
| 401 | Sessão expirada/revogada, token antigo ou base errada; novo login |
| 403 web | Origin não autorizado ou permissão; CORS não é corrigido no browser ignorando segurança |
| 503 de dados/Coach/review | Consultar a matriz; pode ser bloqueio deliberado, não falha de arranque |
| Payment+Agenda em Docker | Guardas loopback/namespace impedem ativação; não alterar validadores para fingir isolamento |
| Inventário histórico divergiu | Registar evidência; não substituir silenciosamente baselines ou recriar recursos removidos |

Uma instalação totalmente nova noutro host não foi arrancada nesta fase. A entrega
fornece procedimento verificável estaticamente; a confirmação desse primeiro arranque
fica sujeita à autorização e aos testes de aceitação da máquina destinatária.
