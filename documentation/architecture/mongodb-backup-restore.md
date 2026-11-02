# Preparação de backup e restauro do MongoDB

> Fase 5.12: a [integração paralela](backend-integration-v1.md) não lê, copia ou
> restaura dados principais. Não foram executados backups/restauros/migrações
> nesta fase. Este procedimento continua sujeito a autorização operacional
> separada. Atualizar o inventário antes da execução: Auth/Management/Agenda,
> sessões/MFA/auditoria e outboxes acrescentaram coleções e requisitos. Definir
> consistência do dump standalone (janela sem escritas), cifragem/ACL, retenção,
> hashes, verificação de restauro/índices e custódia separada das chaves antes
> de migrar. Preservar a origem e impedir escritas concorrentes no cutover;
> rollback de topologia/dados deve ser ensaiado e aprovado, nunca improvisado.

## Objetivo e limites

Este documento prepara, mas não executa, o backup e o restauro do MongoDB
principal antes da futura migração para replica set. Não executar nesta etapa:

- `mongodump`;
- `mongorestore`;
- criação do ambiente de restauro;
- alterações ao Compose principal ou demo;
- reinícios, `down`, remoção de volumes ou alterações ao
  `goleve_mongo_data`.

O procedimento aplica-se ao MongoDB standalone principal (`mongo:7`,
`mongod 7.0.45`) e deve ser usado apenas após aprovação operacional explícita.
O ensaio `rs0` concluído anteriormente não é uma fonte de dados nem um destino
de backup. Consultar também o [plano de migração](./mongodb-replica-set-migration.md)
e o [runbook do ensaio replica set](./mongodb-replica-set-test.md).

## Ficheiros preparados

- [Invoke-MongoInventory.ps1](../../scripts/mongodb/Invoke-MongoInventory.ps1)
  — inventário redigido de bases, coleções, contagens e índices.
- [Invoke-MongoBackup.ps1](../../scripts/mongodb/Invoke-MongoBackup.ps1) —
  preparação de backup comprimido, manifesto e SHA-256; não contém credenciais.
- [Invoke-MongoRestoreValidation.ps1](../../scripts/mongodb/Invoke-MongoRestoreValidation.ps1)
  — valida hash e imprime apenas comandos propostos de restauro.
- [compose.mongodb-restore-test.yaml](../../compose.mongodb-restore-test.yaml)
  — destino isolado, sem portas, rede `internal` e volume exclusivo.

Os diretórios por defeito dos scripts ficam fora de `Git` (`session-artifacts`
e `protected-backups`). Em execução real, indicar explicitamente um caminho
protegido fora do repositório, com ACL restrita, encriptação e retenção
aprovadas. Não guardar arquivos, manifests com informação operacional ou
credenciais no Git.

## Inventário de leitura

O inventário deve registar apenas metadados:

- versão de servidor e build;
- nomes das bases;
- nomes de coleções;
- contagens;
- índices, chaves, unicidade e TTL;
- contentor, imagem, digest, mounts e volume;
- estado de autenticação e nomes de roles, sem credenciais.

Não imprimir documentos, emails, hashes de campos pessoais, tokens ou
passwords. O script produz JSON com metadados e não deve ser executado com
redirecionamento de logs que contenha a linha de comando com secrets.

Comando proposto, não executado:

```powershell
$env:MONGO_USERNAME = '<utilizador fornecido por mecanismo protegido>'
$env:MONGO_PASSWORD = '<password fornecido por mecanismo protegido>'
$env:MONGO_AUTH_DATABASE = 'admin'
& .\scripts\mongodb\Invoke-MongoInventory.ps1 `
  -ContainerName 'goleve-mongodb-1' `
  -OutputDirectory 'D:\protegido\goleve\mongo-inventory'
```

O ambiente principal atual não declara autenticação Mongo no Compose. Se
continuar sem autenticação, o inventário deve usar uma ligação local controlada
sem adicionar credenciais ao script. Se a autenticação for ativada antes deste
procedimento, o contrato de credenciais deve ser confirmado primeiro.

## Consistência do backup

`mongodump` num MongoDB standalone não é automaticamente um snapshot atómico
entre todas as bases e coleções. Enquanto Auth, User, Professional, Agenda e
outros serviços escrevem, o arquivo pode refletir momentos diferentes e
relações entre documentos podem não corresponder ao mesmo instante.

A opção recomendada para o ambiente local é uma janela controlada:

1. identificar todos os escritores e jobs;
2. impedir novas escritas de forma aprovada;
3. confirmar que pedidos ativos terminaram ou foram rejeitados;
4. executar o inventário;
5. executar o backup;
6. calcular e verificar SHA-256;
7. só então reabrir as escritas.

Não simular uma pausa parando contentores sem aprovar dependências e sem saber
se existem clientes externos. Uma alternativa exige uma capacidade de snapshot
consistente suportada pela infraestrutura e um teste formal; `mongodump`
sozinho não fornece essa garantia.

## Backup proposto

O script exige `MONGO_BACKUP_URI` por mecanismo protegido e verifica espaço
livre antes de criar o arquivo. Não embute username, password, token ou URI no
código. O destino deve ser local e protegido, por exemplo
`D:\protegido\goleve\mongo-backups`.

Comando de preparação, não executar agora:

```powershell
$env:MONGO_BACKUP_URI = '<URI fornecido por mecanismo protegido>'
& .\scripts\mongodb\Invoke-MongoBackup.ps1 `
  -ContainerName 'goleve-mongodb-1' `
  -BackupRoot 'D:\protegido\goleve\mongo-backups' `
  -MinimumFreeSpaceGb 5 `
  -WhatIf
```

Na execução aprovada, remover `-WhatIf`. O resultado esperado é:

```text
backup-YYYYMMDD-HHmmss/
  mongodb.archive.gz
  mongodb.archive.gz.sha256
  manifest.json
```

O manifesto inclui timestamp UTC, contentor e nota de consistência, mas
redige a URI. O SHA-256 deve ser recalculado após qualquer cópia. O arquivo
deve ser encriptado em repouso, ter permissões restritas e ser retido segundo
uma política aprovada. Falta de espaço, código de saída diferente de zero ou
arquivo vazio fazem o procedimento falhar; não se deve continuar para restore.
O script transmite a URI ao `mongodump` por stdin do `docker exec`, em vez de a
colocar nos argumentos do processo. Ainda assim, a URI pode existir na
memória do processo PowerShell e o mecanismo de credenciais do operador deve
ser aprovado; nunca usar histórico de shell ou logs partilhados.

## Restauro isolado proposto

O [Compose de restauro](../../compose.mongodb-restore-test.yaml):

- usa MongoDB separado;
- usa rede `goleve_mongodb_restore_test` marcada como `internal`;
- usa volume novo `goleve_mongodb_restore_test_data`;
- não publica portas;
- não liga a `goleve_backend`, demo, Gateway ou microserviços;
- não monta `goleve_mongo_data`;
- não deve ser combinado com outro ficheiro Compose.

Nenhum restore deve usar volumes existentes. O volume novo deve ser confirmado
formalmente como vazio ou inexistente antes de iniciar. Não usar `down -v`,
`docker volume rm` ou limpeza automática como parte deste procedimento.

Validação do hash e comandos propostos, não executados:

```powershell
& .\scripts\mongodb\Invoke-MongoRestoreValidation.ps1 `
  -BackupDirectory 'D:\protegido\goleve\mongo-backups\backup-YYYYMMDD-HHmmss'
```

O script só valida o SHA-256 e imprime o procedimento; não inicia contentor,
não copia arquivo e não executa `mongorestore`.
Os nomes do projeto e contentor têm `ValidateSet` e não podem ser apontados
para os recursos principais. `BackupDirectory` tem de ser absoluto e rejeita
referências ao volume principal ou aos Compose principais. A comparação de
contagens e índices é uma etapa pós-restore explícita; o script de preparação
não se liga a MongoDB.

## Validação pós-restauro

Após aprovação e restauro, validar sem imprimir documentos:

1. SHA-256 do arquivo antes do restore.
2. Versão e build esperados.
3. Bases e coleções esperadas.
4. Contagens reconciliadas com o inventário.
5. Nomes, chaves, unicidade, TTL e opções dos índices.
6. Integridade de referências através de contagens/agregações não sensíveis.
7. Amostras selecionadas por identificadores técnicos fictícios ou por hashes
   calculados localmente e não reversíveis; nunca exportar documentos.
8. Ligação autenticada ao Mongo restaurado.
9. Leitura de documentos sintéticos de controlo.
10. Ausência de ligação aos serviços principais e ao Gateway.

As amostras por hash só são aceitáveis com uma política de campos definida:
hashes de documentos completos podem revelar igualdade e não substituem
privacidade. Não incluir valores pessoais no relatório.

## Rollback, interrupção e recuperação

O procedimento pode ser interrompido antes do restore removendo apenas o
contentor temporário, conforme aprovação. Nunca tocar no volume principal.

Se o restore isolado falhar:

- parar novas ações no ambiente de restore;
- preservar logs e manifesto para diagnóstico;
- não tentar corrigir o arquivo original;
- comparar SHA-256 novamente;
- eliminar o ambiente temporário apenas com aprovação;
- repetir em novo volume, se autorizado.

Se o backup real falhar durante a janela:

- registar o código de saída;
- manter o arquivo parcial marcado como inválido;
- não o usar para restore;
- decidir se a janela deve ser prolongada ou cancelada;
- reabrir escritas apenas após decisão operacional.

Este plano não define rollback da futura migração do MongoDB. A migração
exigirá um backup aprovado, restore ensaiado e runbook próprio de RPO/RTO.

## Tempos e critérios propostos

Para a migração planeada, propor inicialmente:

- **RPO:** 0, condicionado à suspensão efetiva de todas as escritas durante a
  captura ou a um snapshot consistente aprovado.
- **RTO do restore isolado:** alvo de 60 minutos, a medir no primeiro ensaio.
- **Critério de sucesso:** hash válido, inventário reconciliado, índices
  presentes, ligação funcional e zero ligação aos serviços principais.
- **Critério de falha:** hash divergente, arquivo vazio/incompleto, contagens
  incompatíveis sem explicação, erro de índice, segredo exposto ou qualquer
  risco para `goleve_mongo_data`.

Os valores de RPO/RTO são propostas e precisam de aprovação; não são garantias
do MongoDB standalone nem do Docker Desktop.

## Dependências e riscos restantes

- É necessário identificar todos os escritores, incluindo clientes externos e
  ferramentas Mongo.
- No Compose principal, `auth-service`, `user-service`, `professional-service`
  e `agenda-service` têm operações de escrita explícitas. Os restantes
  serviços com `MONGO_URI` estão configurados como clientes da instância e
  devem ser confirmados individualmente antes da janela; o Gateway e
  `management-service` não têm `MONGO_URI`.
- A pesquisa estática não encontrou workers agendados ou consumidores
  RabbitMQ de produção nos serviços atuais, mas contentores externos e
  processos manuais continuam fora dessa garantia.
- A janela deve suspender as rotas de escrita de Auth/User/Professional/Agenda,
  jobs e clientes externos, e confirmar que não existem operações em curso.
  Parar apenas o API Gateway não é suficiente. O método de suspensão/retoma
  requer aprovação operacional e não é automatizado pelos scripts.
- A autenticação Mongo principal não está configurada no Compose atual.
- Um URI no processo pode aparecer para administradores do host; usar sempre
  mecanismo protegido e não incluir secrets em logs.
- Sem janela de escrita, não há garantia de consistência transversal.
- A disponibilidade e espaço no destino protegido ainda precisam de ser
  medidos na execução autorizada.
- O restore valida o arquivo, não substitui testes completos dos 14 serviços.
- O volume de restauro deve ser novo e nunca pode ser confundido com
  `goleve_mongo_data`.

## Checklist operacional GO / NO-GO

## Diagnóstico prévio de armazenamento e clientes

Leitura e preparação realizadas sem `mongodump`, `mongorestore`, alteração de
volumes ou reinício de contentores:

- Só foi observada a unidade Windows `C:`; `D:` não existe.
- `C:` tem aproximadamente `475,54 GB` totais e `16,99 GB` livres após a
  preparação do destino.
- O volume Docker `goleve_mongo_data` ocupa aproximadamente `320,4 MB`.
- As bases observadas são `admin`, `config`, `goleve_agenda`, `goleve_auth`,
  `goleve_professional`, `goleve_user` e `local`.
- As estatísticas Mongo indicam aproximadamente `32 KB` de dados lógicos e
  `~208 KB` de armazenamento WiredTiger/indexes; estes valores não são uma
  previsão segura do tamanho futuro do arquivo.
- Foram observadas 3 atividades na Agenda e 3 utilizadores Auth; os valores
  são metadados de contagem, não foram impressos documentos.
- `mongodump` e `mongorestore` disponíveis no contentor: `100.20.0`;
  servidor: MongoDB `7.0.45`.
- `C:\Users\juanp\GoleveBackups` foi criado, sem ficheiros de backup. O caminho
  é absoluto, está em `C:`, fora do repositório e fora de
  `C:\Users\juanp\OneDrive`.
- A ACL do pai `C:\Users\juanp` não foi alterada. O novo destino não herda ACL
  e concede FullControl apenas à conta atual `Juan\juanp`,
  `NT AUTHORITY\SYSTEM` e `BUILTIN\Administradores`, com herança para futuros
  ficheiros.
- A consulta BitLocker exigiu privilégios administrativos e foi interrompida
  sem alteração; encriptação em repouso continua não confirmada.
- O Docker reporta aproximadamente `5,974 GB` de build cache, além do volume
  Mongo de `320,5 MB`; esta ocupação reduz a margem operacional real do disco.

Clientes/serviços externos observados:

- `mongo-docker-goleve` e `mongo-express-goleve` estão em `goleve_default`,
  não em `goleve_backend`; o primeiro usa o volume
  `goleve_mongodb_data_goleve`, não `goleve_mongo_data`.
- `mongo-docker` e `mongo-express` estão em
  `autentication_default_default`, separados do GoLeve principal.
- Node-RED e EMQX estão em `mqttdocker_mqtt_net_bridge`; não foram observadas
  variáveis Mongo nos seus metadados.
- Portainer está em `mqttdocker_default` e monta o socket Docker; não é um
  cliente Mongo direto confirmado, mas tem capacidade administrativa ampla
  sobre o host e deve ser incluído na avaliação de risco.
- Nenhum destes contentores partilha a rede `goleve_backend`. As ligações dos
  dois `mongo-express` apontam para os seus Mongo separados (`mongo` e
  `mongo-goleve`), não para `goleve-mongodb-1`.

O tamanho mínimo do backup não deve ser inferido apenas dos `dbStats`. Deve
incluir o arquivo comprimido, manifesto, hashes, cópia protegida, margem para
WiredTiger e crescimento. O script exige 5 GB livres por defeito; os 17,02 GB
atuais passam esse limiar técnico, mas a ocupação Docker e a retenção no mesmo
disco reduzem a margem. Recomenda-se preservar pelo menos 10 GB livres depois
do backup, não apenas antes dele.

### Destino C: preparado

O diretório foi criado nesta etapa autorizada e não contém arquivos. Os
comandos equivalentes de configuração são:

```powershell
$backupRoot = 'C:\Users\juanp\GoleveBackups'
New-Item -ItemType Directory -Path $backupRoot
icacls $backupRoot /inheritance:r
icacls $backupRoot /grant:r "$env:USERNAME:(OI)(CI)(F)" "SYSTEM:(OI)(CI)(F)" "Administrators:(OI)(CI)(F)"
Get-Acl -LiteralPath $backupRoot
Get-Item -LiteralPath $backupRoot -Force
```

O grupo local foi resolvido como `BUILTIN\Administradores`. A configuração
exclui `Everyone`, `Users` e `Authenticated Users`; o destino e os ancestrais
verificados não apresentam reparse points/junctions. A consulta BitLocker deve
ser repetida numa sessão administrativa sem imprimir recovery keys.

O mesmo disco que contém Docker não é uma estratégia de proteção contra falha
do disco. Deve existir uma cópia posterior em storage externo aprovado. A
política de retenção aprovada nesta etapa é preservar o backup pré-migração
até o restore isolado, a migração e a regressão estarem concluídos e aprovados,
sem substituição, sem limpeza automática e sem eliminação sem nova autorização
explícita. Os arquivos usam timestamps UTC únicos. A segunda cópia encriptada
fora de C: continua obrigatória antes de modificar o MongoDB principal e
ainda não foi criada.

### GO apenas se todos forem verdadeiros

- [ ] Janela de escrita aprovada por responsável operacional.
- [ ] Auth, User, Professional, Agenda e todos os restantes clientes Mongo
      identificados.
- [ ] Rotas de escrita, jobs, scripts manuais, clientes externos e processos
      legados suspensos; não apenas o API Gateway.
- [ ] Não existem operações Mongo em curso.
- [ ] Contentor e volume principal confirmados por nome, mount e projeto.
- [ ] Destino absoluto fora do Git, com ACL restrita, encriptação e retenção.
- [ ] Espaço livre suficiente para arquivo, cópia, hash e pelo menos 10 GB de
      margem operacional após o backup.
- [ ] `mongodump`/`mongorestore` 100.20.0 disponíveis e compatíveis com
      MongoDB 7.0.45, ou compatibilidade formalmente aprovada.
- [ ] Credenciais fornecidas por mecanismo protegido e não presentes em
      argumentos, código ou logs.
- [ ] Inventário pré-backup concluído e guardado no destino protegido.
- [ ] RPO/RTO e critérios de falha aprovados.
- [ ] Restore isolado confirmado com rede `internal`, volume novo e sem portas.
- [ ] Plano de retoma das escritas e interrupção segura aprovado.

### NO-GO imediato

- [ ] Destino inexistente, não protegido ou sem espaço suficiente.
- [ ] ACL, encriptação ou retenção não comprovadas.
- [ ] Escritor, cliente externo ou processo legado desconhecido.
- [ ] Credencial exposta ou URI registada em logs/histórico.
- [ ] Falha de hash, inventário ou compatibilidade de ferramentas.
- [ ] Qualquer referência ao `goleve_mongo_data` no restore.
- [ ] Necessidade de parar/apagar contentores sem autorização.

### Suspensão e retoma propostas

1. Congelar novas escritas nas APIs de Auth, User, Professional e Agenda.
2. Desativar, com mecanismo aprovado, jobs e scripts que escrevam nas bases.
3. Pausar clientes externos, ferramentas administrativas e processos legados.
4. Confirmar por logs/métricas que não existem operações em curso.
5. Executar inventário e backup durante a janela.
6. Validar arquivo, manifesto e SHA-256.
7. Reabrir primeiro os serviços e clientes numa ordem aprovada.
8. Confirmar saúde e escritas após a retoma.

Este procedimento é uma proposta operacional; os scripts não suspendem nem
retomam escritores automaticamente.

## Estado GO/NO-GO atual

**NO-GO.** Para passar a GO ainda é necessário:

1. confirmar a chave pública definitiva e a correspondência local;
2. obter inventário/aprovação dos clientes externos e do Portainer;
3. aprovar a janela sem escritas para todos os serviços com Mongo e clientes
   externos;
4. confirmar credenciais protegidas e compatibilidade das ferramentas;
5. demonstrar espaço livre com pelo menos 10 GB preservados depois do arquivo,
   sem usar o volume principal como destino;
6. aprovar RPO/RTO e o plano de retoma;
7. conceder autorização expressa para o primeiro backup.

O RPO zero só é exequível com escritas efetivamente suspensas durante a
captura (ou um snapshot consistente aprovado). O RTO de 60 minutos continua
por demonstrar através de um restore isolado cronometrado. A retenção até
aprovação final é viável apenas depois de existir storage protegido aprovado.

## Preparação final da janela de backup

### Bases abrangidas

O helper encriptado agora inclui explicitamente, por defeito, apenas as quatro
bases de aplicação atualmente existentes:
`goleve_auth`, `goleve_user`, `goleve_agenda` e `goleve_professional`. As bases
internas `admin`, `config` e `local` ficam excluídas do arquivo de aplicação;
esta escolha deve ser revista se a migração exigir metadados internos. O
manifesto regista a lista efetivamente solicitada. A lista pode ser alterada explicitamente com `--databases`, sem aceitar nomes
com caracteres de shell.

Na verificação nominal desta etapa, o MongoDB principal continha:
`admin`, `config`, `goleve_agenda`, `goleve_auth`, `goleve_professional`,
`goleve_user` e `local`. Assim, as quatro bases de aplicação existentes são
`goleve_agenda`, `goleve_auth`, `goleve_professional` e `goleve_user`; ainda não
existem `goleve_training`, `goleve_performance`, `goleve_hydration`,
`goleve_payment`, `goleve_notification` ou `goleve_ai_coach`. O comando
preparado para uma janela real deve passar somente as quatro bases existentes,
ou falhará explicitamente até as restantes serem criadas:

```powershell
--databases goleve_auth,goleve_user,goleve_agenda,goleve_professional
```

Foi testado no MongoDB isolado que `mongodump --db` de uma base inexistente
retorna código `0` e um arquivo não vazio. Portanto, confiar apenas no código
de saída permitiria uma omissão silenciosa. O helper agora executa
`listDatabases: nameOnly` antes do dump padrão, compara todos os nomes
solicitados, rejeita bases `goleve_*` adicionais não selecionadas e falha antes
de criar o diretório se algum faltar. O modo `WhatIf` também executa esta
pré-verificação quando usa a origem Docker padrão; testes sintéticos com uma
origem de bytes customizada não contactam MongoDB.

`mongodump --archive` preserva coleções, documentos, índices e metadados
suportados pelo formato BSON; a validação de contagens, índices e valores
deve ocorrer no restore isolado. Como as bases são usadas por serviços
separados mas podem ter referências lógicas entre Auth, User, Professional e
Agenda, a consistência transversal depende de uma janela sem escritas em
todos os escritores e clientes, não apenas da seleção correta de bases.

### Escritores e suspensão proposta

Os serviços com `MONGO_URI` no Compose são Auth, User, Training, Agenda,
Performance, Hydration, Professional, Payment, Notification e AI Coach.
Auth, User, Professional e Agenda têm escritas confirmadas no código. Os
outros seis devem ser tratados como escritores potenciais até confirmação
individual. Ferramentas externas, Mongo Express, scripts manuais, Portainer e
qualquer processo legado também devem ser bloqueados ou colocados em modo
somente leitura; parar apenas o Gateway não é suficiente.

`restart: unless-stopped` está definido para os serviços Compose. Uma paragem
manual com `docker compose stop` não deve ser revertida automaticamente pela
política do Docker, mas Portainer, operadores ou outro supervisor podem
iniciar contentores; essa possibilidade deve ser bloqueada durante a janela.

Na leitura Docker atual, `mongo-docker-goleve`/`mongo-express-goleve` usam
`goleve_default` e `goleve_mongodb_data_goleve`; `mongo-docker`/
`mongo-express` usam `autentication_default_default` e outro volume. Não foi
comprovada ligação destes clientes ao Mongo principal ou à rede
`goleve_backend`, mas continuam riscos a controlar. Node-RED e EMQX estão em
`mqttdocker_mqtt_net_bridge` sem ligação Mongo confirmada. Portainer está em
`mqttdocker_default` e monta `/var/run/docker.sock`, podendo iniciar
contentores ou alterar redes; deve ser colocado sob controlo operacional.

Sequência futura, sujeita a aprovação e **não executada**:

```powershell
# 1. Confirmar saúde, mounts, volume e chave pública; congelar novas requisições.
docker compose -f compose.yaml -p goleve ps
docker inspect goleve-mongodb-1
$env:AGE_RECIPIENT = 'age1...'

# 2. Parar primeiro a entrada HTTP e depois todos os clientes Mongo.
docker compose -f compose.yaml -p goleve stop api-gateway
docker compose -f compose.yaml -p goleve stop auth-service user-service training-service agenda-service performance-service hydration-service professional-service payment-service notification-service ai-coach-service

# 3. Bloquear clientes externos/Portainer e confirmar ausência de escritores.
docker ps --format '{{.Names}}|{{.Networks}}|{{.State}}'
docker logs --since 2m goleve-mongodb-1

# 4. Inventário somente leitura e backup encriptado, durante a janela.
pwsh -File .\scripts\mongodb\Invoke-MongoInventory.ps1 -OutputDirectory C:\Users\juanp\GoleveBackups\inventory
node .\scripts\mongodb\stream-encrypted-backup.cjs `
  --container goleve-mongodb-1 `
  --output-root C:\Users\juanp\GoleveBackups `
  --databases goleve_auth,goleve_user,goleve_agenda,goleve_professional

# 5. Validar manifesto/SHA-256 e preservar o arquivo; não executar limpeza automática.
Get-ChildItem C:\Users\juanp\GoleveBackups -Force

# 6. Retomar em ordem inversa: clientes Mongo e, por último, Gateway.
docker compose -f compose.yaml -p goleve start auth-service user-service training-service agenda-service performance-service hydration-service professional-service payment-service notification-service ai-coach-service
docker compose -f compose.yaml -p goleve start api-gateway
docker compose -f compose.yaml -p goleve ps
```

Os comandos `docker compose stop/start`, inventário real e backup acima não
foram executados. Antes do passo 2, deve ser obtida confirmação operacional
de que não existem jobs, clientes externos ou escritas em curso. O tempo de
indisponibilidade é uma estimativa: suspensão e validação ~5–15 minutos,
inventário/backup dependentes do tamanho real e retoma ~5–10 minutos; não é
uma medição e não constitui garantia de RTO.

Não executar `docker compose down`, `down -v`, `docker prune` ou comandos sem
`-f compose.yaml -p goleve` durante a janela. Controlar reinícios manuais no
Portainer ou em outro supervisor exige ação operacional separada, auditada e
autorizada; não foi executada nesta etapa.

### Checklist operacional de entrada e saída

**Entrada — todos obrigatórios:**

- [ ] Autorização expressa para a janela e chave pública validada.
- [ ] C: mantém pelo menos 10 GB livres após a estimativa do arquivo.
- [ ] Destino acessível, protegido, sem junction/symlink e sem substituição.
- [ ] As quatro bases existentes foram comparadas com `listDatabases`.
- [ ] Nenhuma base `goleve_*` nova ficou sem aprovação.
- [ ] Auth, User, Training, Agenda, Performance, Hydration, Professional,
      Payment, Notification e AI Coach estão suspensos.
- [ ] Gateway está suspenso antes dos escritores.
- [ ] Clientes externos, scripts, jobs, Portainer e operadores estão
      controlados.
- [ ] Não há escritas ou operações em curso.
- [ ] MongoDB saudável e mount/volume confirmados.

**Saída — todos obrigatórios:**

- [ ] `.age` final existe; nenhum `.partial` é aceite.
- [ ] SHA-256 e manifesto correspondem e não contêm segredos.
- [ ] Lista do manifesto corresponde às quatro bases aprovadas.
- [ ] Pelo menos 10 GB continuam livres.
- [ ] Serviços retomados apenas com `-f compose.yaml -p goleve`.
- [ ] Healthchecks, Gateway e regressões aprovados.
- [ ] Backup preservado sem substituição ou limpeza automática.
- [ ] Segunda cópia cifrada externa planeada antes da migração.

Qualquer falha de entrada é **NO-GO**. Se ocorrer falha durante o backup,
manter o ambiente controlado, terminar apenas os subprocessos da execução e
rejeitar o `.partial`. Falha de SHA-256 ou manifesto rejeita o arquivo. Falha
de retoma mantém os serviços afetados parados até decisão operacional; não
iniciar indiscriminadamente outro projeto Docker.

### Recuperação e aceitação

Se o backup falhar, manter os serviços suspensos apenas pelo período aprovado,
remover somente o diretório parcial criado pela execução atual após preservar
os logs sem segredos e decidir entre repetir a captura ou abortar a janela.
Nunca usar um `.partial` como backup. Após sucesso, validar existência do
`.age`, SHA-256, manifesto, lista de bases, espaço livre e ausência de URI ou
plaintext nos artefatos. O restauro deve ocorrer posteriormente apenas no
Compose isolado, com uma cópia da chave privada disponibilizada localmente
pelo utilizador; não deve apontar para `goleve-mongodb-1`.

## Preparação de backup encriptado

O destino `C:\Users\juanp\GoleveBackups` está preparado, mas não contém
backups. Foi instalada apenas a ferramenta oficial `FiloSottile.age` `v1.3.2` através
do `winget` (`FiloSottile.age`), a partir do release oficial
`FiloSottile/age`; o catálogo verificou o SHA-256 do instalador
`f48d8f8f9ebe903ab5027ed067652f2cc1db94bc206976430133b905dcd8e8c7`.
`age.exe` e `age-keygen.exe` reportaram `v1.3.2`. GnuPG não foi instalado.
As chaves geradas durante os testes foram exclusivamente temporárias e foram
removidas; nenhuma chave real foi criada. O backup real permanece bloqueado.

### Arquitetura aprovada para preparação

O fluxo deverá
ser binário e em streaming:

```text
mongodump --archive --gzip | age -r <chave-pública-validada> > backup-<UTC>.age
```

O fluxo de produção não deve passar stdout binário por pipelines de texto do
Windows PowerShell 5.1. Deve usar um helper Node.js com
`child_process.spawn`, streams `Buffer`, backpressure, stderr separado e
propagação explícita de exit codes. O arquivo deve ser escrito primeiro com
nome parcial único, por exemplo `.backup-<UTC>.age.partial`, e renomeado para
`.age` apenas depois do sucesso de `mongodump`, `age`, hash e manifesto. Falhas
ou interrupções devem deixar somente o parcial marcado para limpeza manual;
não pode existir fallback para arquivo não encriptado nem substituição de um
backup existente.

O URI deve continuar a ser fornecido por mecanismo protegido e nunca aparecer
em argumentos, logs ou manifestos. O mecanismo atual do script PowerShell
transmite o URI por stdin para `docker exec`, mas ainda escreve stdout binário
através da redireção nativa do PowerShell e não implementa encriptação,
ficheiro parcial ou limpeza transacional; não deve ser usado para um backup
encriptado real sem essa alteração e validação.

### Gestão de chaves

- A chave pública deve ser validada antes de qualquer backup real e pode ser
  registada no manifesto apenas como identificador/fingerprint não secreto.
- A chave privada nunca pode estar no Git, no diretório de backups, em Docker,
  nos scripts ou nos logs.
- A chave privada deve ser guardada e recuperável num gestor de passwords
  seguro ou cofre externo ao disco C:.
- O restauro deve disponibilizar a chave privada apenas durante o processo,
  desencriptar em streaming para `mongorestore` no ambiente isolado e nunca
  criar um arquivo MongoDB desencriptado no disco.
- Uma chave pública não validada, uma chave privada irrecuperável ou uma
  ferramenta não verificada são condições NO-GO.

Comandos futuros, sem segredos e não executados:

```powershell
# Instalação autorizada, fora desta etapa:
winget install --id FiloSottile.age

# Procedimento local, não executado pelo Copilot: derive somente em memória
# a chave pública da chave privada existente; não redirecione a chave privada
# para ficheiro, log ou variável persistente.
$env:AGE_RECIPIENT = ((Get-Content -Raw -LiteralPath 'D:\GoLeveKeys\goleve-private-key.txt' | & age-keygen -y) | Out-String).Trim()
if ($env:AGE_RECIPIENT -notmatch '^age1[0-9a-z]+$') { throw 'AGE_RECIPIENT inválido' }
node scripts/mongodb/stream-encrypted-backup.cjs `
  --container goleve-mongodb-1 `
  --output-root C:\Users\juanp\GoleveBackups `
  --databases goleve_auth,goleve_user,goleve_agenda,goleve_professional

# Após a janela, limpar apenas a variável da sessão:
Remove-Item Env:AGE_RECIPIENT

# Alternativas equivalentes: --recipient 'age1...' ou
# --recipient-file C:\caminho\fora-do-repositorio\mongo-backup-recipient.txt

# Restauro futuro somente no Compose isolado, com a chave privada temporária:
node scripts/mongodb/stream-encrypted-restore.cjs `
  --encrypted-archive C:\Users\juanp\GoleveBackups\backup-<UTC>.age `
  --container goleve-mongodb-restore-test-mongodb-restore-test-1
```

Os helpers `scripts/mongodb/stream-encrypted-backup.cjs` e
`scripts/mongodb/stream-encrypted-restore.cjs` implementam este fluxo. O
backup está restrito ao contentor `goleve-mongodb-1` e o restauro ao contentor
`goleve-mongodb-restore-test-mongodb-restore-test-1`, evitando apontamentos
acidentais para outros ambientes. A implementação usa `spawn`, streams
binários, `pipeline`, ficheiro `.partial`, SHA-256, manifesto sem segredos,
renomeação final sem substituição e limpeza apenas do diretório criado pela
execução atual. O modo `whatIf` não cria ficheiros, mas, quando usa a origem
Docker padrão, executa a verificação nominal das bases solicitadas.

O helper de backup aceita a chave pública via `AGE_RECIPIENT`, `--recipient`
ou arquivo absoluto fornecido por `--recipient-file`. O valor deve ser um
único recipient `age1...`; não é escrito no manifesto nem no log. O helper
aceita apenas a chave pública e nunca necessita de ler a chave privada.
A autenticação Mongo ainda exige que seja resolvida por um
mecanismo protegido compatível com o streaming. Se `MONGO_BACKUP_URI` estiver
definido, falha explicitamente: não tenta passá-lo em argumentos nem pelo
stdin, pois o stdin é reservado ao fluxo binário. O MongoDB atual não tem
autenticação explícita no Compose; qualquer futura autenticação exige desenho e
validação próprios antes do backup real.

### Validação de integração no ambiente isolado

Foi utilizado exclusivamente o projeto Compose
`goleve-mongodb-restore-test`, iniciado com:

```powershell
docker compose -f compose.mongodb-restore-test.yaml -p goleve-mongodb-restore-test up -d mongodb-restore-test
```

O projeto usa somente `goleve_mongodb_restore_test_data` e a rede interna
`goleve_mongodb_restore_test`, sem portas publicadas, sem `goleve_mongo_data`,
sem `goleve_backend` e sem ligação ao Gateway. O contentor foi mantido ativo
após o ensaio; não foi removido volume, rede ou contentor.

No MongoDB isolado foram criados apenas dados fictícios em
`synthetic_validation`: dois documentos em `records`, um em `metadata` e o
índice único `externalId_1`. O fluxo completo passou:

1. `mongodump --db synthetic_validation --archive --gzip` no contentor isolado;
2. `mongodump` -> `age` em streaming binário;
3. arquivo `.age`, SHA-256 e manifesto sem segredos;
4. desencriptação em streaming;
5. `mongorestore` no mesmo contentor isolado, namespace
   `synthetic_validation_restored`;
6. comparação de coleções, contagens, valores fictícios e índices.

O resultado restaurado teve as coleções `metadata` e `records`, contagens
`1` e `2`, e os índices `_id_` e `externalId_1` com unicidade preservada.
O diretório temporário continha apenas o `.age`, o hash e o manifesto; não
existiu arquivo MongoDB desencriptado ou `.partial` persistente. A pasta
definitiva `C:\Users\juanp\GoleveBackups` permaneceu vazia.

O helper aceita explicitamente o contentor de restore isolado apenas para este
ensaio; a execução normal continua direcionada ao contentor principal
`goleve-mongodb-1`. O parâmetro `sourceContainer` é validado contra uma lista
fechada de contentores aprovados.

### Autenticação MongoDB

A análise de `compose.yaml` e das URIs dos serviços mostra MongoDB principal
standalone sem `--auth`, `--keyFile` ou `MONGO_INITDB_ROOT_*`; as URIs usam
`mongodb://mongodb:27017/<base>` sem credenciais. Assim, o `mongodump` do
ambiente local não necessita de credenciais enquanto essa configuração
permanecer inalterada. O helper não aceita `MONGO_BACKUP_URI`, porque o stdin é
reservado ao stream binário e não há mecanismo comprovado para transportar uma
URI autenticada sem a expor. Se a autenticação for ativada no futuro, deve ser
implementada uma integração de segredo compatível com `spawn` antes de usar o
backup encriptado.

### Testes sintéticos

Foram executados num diretório temporário, com 384 bytes fictícios e sem
MongoDB, credenciais ou documentos reais:

- round-trip de encriptação/desencriptação: **aprovado**;
- integridade binária recuperada: **aprovada**;
- arquivo corrompido rejeitado: **aprovado**;
- chave incorreta rejeitada: **aprovado**;
- plaintext persistente após limpeza: **zero ficheiros**;
- chave privada de teste: removida e não copiada para o repositório;
- `mongodump`, `mongorestore` e MongoDB principal: não contactados.

Foram também executados testes dos helpers com `node --test
scripts/mongodb/tests/streaming.test.cjs` (5/5): fluxo binário com carga de
1 MiB, restauro para sink sintético, `WhatIf` sem efeitos, falha do processo
de origem, falha do `age`, cancelamento, limpeza de `.partial`, nomes únicos e
não-substituição. Nenhum teste contactou MongoDB, Docker ou a pasta real de
backups. A instalação e os testes dos helpers não autorizam backup real.

### Checklist adicional de autorização

- [x] `age` e `age-keygen` instalados por autorização (`v1.3.2`) e versões
      registadas.
- [ ] Chave pública validada por fingerprint fora do repositório.
- [ ] Chave privada recuperável fora do C: e indisponível ao Docker.
- [x] Helper binário testado com bytes fictícios, backpressure e falhas
      injetadas.
- [x] Integração isolada `mongodump -> age -> mongorestore` validada com dados
      fictícios e índices.
- [ ] Fluxo `mongodump -> gzip -> age -> .age` revisto e sem plaintext.
- [ ] SHA-256 calculado sobre o `.age` final e manifesto sem segredos.
- [ ] Restore em volume/rede isolados validado antes do backup real.
- [ ] Destino, retenção, janela sem escritas e autorização explícita aprovados.

## Verificações permitidas desta etapa

Foram permitidas apenas verificações não destrutivas:

- `git status`;
- `git diff --check`;
- `docker compose config`;
- `docker compose ps`.

Não executar `mongodump`, `mongorestore`, `docker compose up` do restore,
`docker compose down -v`, alterações ao Mongo principal ou reinícios.
