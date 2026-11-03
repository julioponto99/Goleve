# GoLeve

**Consolidação do ambiente oficial em curso (2026-11-03).** O projeto operacional
é `goleve`, com [compose.yaml](compose.yaml), Gateway em `127.0.0.1:3000` e os
volumes existentes preservados. Consultar o [registo de execução e recuperação](documentation/consolidation-v1.md)
antes de iniciar serviços: os 14 componentes e cinco contas local-demo foram
validados por HTTP; a retenção Agenda e a recuperação MongoDB foram verificadas,
mas o cenário Payment durante falha RabbitMQ está bloqueado por um índice único.
Não executar os guias
históricos de stacks paralelas como configuração do ambiente principal.

Para integrar os frontends, começar pela
[entrega de desenvolvimento V1 — Fase 5.14](documentation/release-v1/README.md):
[instalação independente](documentation/release-v1/local-setup.md),
[referência central de API](documentation/api/backend-release-v1.md) e
[guia web/Android/iPhone](documentation/release-v1/frontend.md).
O Gateway oficial atual está em `http://127.0.0.1:3000`, com MongoDB replica set,
RabbitMQ e 11 microserviços, com segredos e dados fictícios próprios por instalação.
Os [12 bloqueios conhecidos](documentation/release-v1/readiness.md) continuam abertos.
Não é uma entrega de produção. A CLI histórica pressupõe a stack principal;
o novo guia explica o arranque independente. Não executar `integration.cjs test`
como simples verificação de conectividade: inclui paragens de dependências.

A [demonstração local isolada histórica](documentation/api/isolated-demo.md) usa cinco componentes e não é o ambiente oficial atual. Não a iniciar para consolidar o projeto `goleve`. Os guias antigos que referem `64344` descrevem a stack paralela preservada e parada.

Monorepo local com API Gateway, 11 microserviços TypeScript/Express, MongoDB e RabbitMQ.
Pagamentos: apenas simulados, nunca reais.

## Arranque

O arranque oficial usa apenas ficheiros operacionais chamados `.env`, carregados
explicitamente pelo Compose. `.env.example` existentes são referências
históricas, sem dependência de execução. Preparar sem substituir configurações:

~~~powershell
node scripts/local-runtime.cjs prepare
node scripts/local-demo.cjs plan
docker compose -f compose.yaml -p goleve config --quiet
~~~

O preparador requer as dependências Node.js já instaladas em `backend/`, conserva
valores existentes, gera apenas segredos ausentes e nunca os imprime. Os `.env`
por serviço, `.secrets/` e artefactos locais estão excluídos do Git. Não partilhar
estes ficheiros nem usar esta configuração local numa implantação pública.

### Mongo Express opcional

O Compose inclui o Mongo Express apenas no perfil local `tools`. Ele liga-se ao
MongoDB oficial (`mongodb:27017`, replica set `goleveV1`) e publica a interface
somente em `http://127.0.0.1:8081`, protegida por autenticação Web. Defina
`MONGO_EXPRESS_USERNAME` e `MONGO_EXPRESS_PASSWORD` no `.env` local; nunca os
adicione ao Git.

Iniciar sem reiniciar ou recriar os 14 serviços oficiais:

~~~powershell
docker compose --profile tools -f compose.yaml -p goleve-tools up -d --no-deps mongo-express
~~~

Abrir `http://127.0.0.1:8081` e, após consultar as bases, parar apenas a
ferramenta:

~~~powershell
docker compose --profile tools -f compose.yaml -p goleve-tools stop mongo-express
~~~

O perfil não é iniciado por `docker compose up` sem `--profile tools` e não
deve ser ativado numa implantação pública. O Mongo Express não cria outro
MongoDB nem altera índices, volumes ou dados.

O replica set existente já está validado; não o reinicializar. Arranque habitual:

~~~powershell
docker compose -f compose.yaml -p goleve up -d
docker compose -f compose.yaml -p goleve ps
~~~

Não acrescentar `--build` indiscriminadamente. Construir explicitamente apenas
as imagens identificadas como desatualizadas, preservando volumes e credenciais.
Os dois volumes oficiais são externos e obrigatórios: a sua ausência faz falhar
o Compose em vez de criar bases vazias. Não usar `--remove-orphans`: contentores
da instalação antiga partilham o nome de projeto e exigem análise separada.

As cinco identidades fictícias, preparação manual idempotente dos dados,
consulta local das passwords sem as imprimir, políticas MFA/step-up e comandos
de testes estão no [relatório de consolidação](documentation/consolidation-v1.md).
Só essas identidades têm autoridade `local-demo` sem MFA; contas reais e produção
mantêm as proteções administrativas. A Web usa `frontend/web/.env`; o Mobile
usa `frontend/mobile/.env`, com endereço adequado ao dispositivo. O Coach IA
continua desativado. Não publicar este ambiente nem partilhar os seus segredos.

### Instruções históricas da configuração anterior

Os parágrafos seguintes são mantidos como histórico de instalação. Não executar
a sua geração manual de segredos ou o arranque com build global para consolidar
o ambiente atual; usar o preparador e o registo de execução acima.

Requisitos: Docker Engine com contentores Linux e Docker Compose v2 ou superior.
Antes do primeiro arranque, definir `JWT_SECRET` no `.env` local. Se o ficheiro ainda não existir, criá-lo a partir de `.env.example`. Para gerar uma chave aleatória de 32 bytes:

~~~sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
~~~

Guardar o valor apenas no `.env`, que está ignorado pelo Git. Inicializar também a chave local do User Service, a partir da raiz (Node.js 22; não instala dependências):

~~~sh
node backend/services/user-service/scripts/init-local-key.cjs
~~~

O script preserva uma chave existente e nunca apresenta o seu valor. A pasta `.secrets/` está ignorada pelo Git; o Compose monta o ficheiro apenas no User Service, em modo de leitura. É necessário preservar esta chave para ler os dados fictícios já cifrados. Depois, na raiz do projeto:

~~~sh
docker compose up -d --build
docker compose ps
~~~

O build instala as dependências com `npm ci` a partir do lockfile central e compila cada workspace com `npm run build --workspace=<caminho>`. A geração inicial das chaves acima usa Node.js no anfitrião; os builds não requerem dependências instaladas no anfitrião. Os 12 Dockerfiles usam `backend/` como contexto de build, respeitam os workspaces e criam imagens Node.js 22 sem dependências de desenvolvimento, executadas pelo utilizador `node`.

Os microserviços aguardam MongoDB e RabbitMQ saudáveis; o gateway aguarda os 11 microserviços. O arranque em segundo plano pode terminar antes do health check final do gateway. Para aguardar por todos:

~~~sh
docker compose up -d --build --wait --wait-timeout 240
~~~

## Portas

Todas as portas publicadas estão limitadas a `127.0.0.1`.

| Serviço | Porta interna | Acesso no anfitrião |
|---|---:|---|
| API Gateway | 3000 | http://localhost:3000/health |
| auth-service | 3001 | Apenas rede Docker |
| user-service | 3002 | Apenas rede Docker |
| training-service | 3003 | Apenas rede Docker |
| agenda-service | 3004 | Apenas rede Docker |
| performance-service | 3005 | Apenas rede Docker |
| hydration-service | 3006 | Apenas rede Docker |
| professional-service | 3007 | Apenas rede Docker |
| management-service | 3008 | Apenas rede Docker |
| payment-service | 3009 | Apenas rede Docker |
| notification-service | 3010 | Apenas rede Docker |
| ai-coach-service | 3011 | Apenas rede Docker |
| MongoDB | 27017 | localhost:27019 |
| RabbitMQ AMQP | 5672 | localhost:5672 |
| RabbitMQ Management | 15672 | http://localhost:15672 |

As portas publicadas são configuráveis em `.env` por `API_GATEWAY_PORT`, `MONGO_PORT`, `RABBITMQ_PORT` e `RABBITMQ_MANAGEMENT_PORT`. Por exemplo, `MONGO_PORT=27020` muda apenas a porta no anfitrião. A porta local MongoDB por defeito e 27019 para evitar conflitos com instancias existentes em 27017/27018. Os contentores continuam a usar `mongodb:27017`. Os microserviços não publicam portas.

## Ambiente e comunicação

`.env.example` documenta as opções. As portas e os serviços de infraestrutura têm valores locais por defeito; `JWT_SECRET` é obrigatório no auth-service e não tem fallback nesse serviço.

Todos os serviços partilham a rede `backend` e comunicam por DNS:

- `MONGO_URI` é configurado por microserviço: `mongodb://mongodb:27017/goleve_<serviço>`. O prefixo é alterável por `MONGO_DB_PREFIX`.
- `RABBITMQ_URL` usa o nome `rabbitmq`, porta 5672 e as credenciais `RABBITMQ_USER` / `RABBITMQ_PASSWORD`. Usar caracteres seguros para URLs.
- O gateway recebe as 11 variáveis `AUTH_SERVICE_URL`, `USER_SERVICE_URL`, `TRAINING_SERVICE_URL`, `AGENDA_SERVICE_URL`, `PERFORMANCE_SERVICE_URL`, `HYDRATION_SERVICE_URL`, `PROFESSIONAL_SERVICE_URL`, `MANAGEMENT_SERVICE_URL`, `PAYMENT_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`, `AI_COACH_SERVICE_URL`, por exemplo `USER_SERVICE_URL=http://user-service:3002`.
- `JWT_SECRET` é obtido de `.env`. Em produção, o auth-service rejeita valores curtos, placeholders de desenvolvimento e padrões repetidos. A rotação da chave invalida os tokens anteriores.

Os valores `MONGO_URI` e `RABBITMQ_URL` da raiz podem continuar a servir para execução local. O Compose fornece explicitamente os endereços dos contentores para evitar usar `localhost` do anfitrião.

RabbitMQ Management usa `goleve / goleve-local` por defeito. As variáveis de criação do utilizador só se aplicam à primeira inicialização do volume. Num broker já inicializado, gerir as alterações de credenciais no próprio RabbitMQ.

O gateway encaminha `/auth/*` para o auth-service, que já estabelece a ligação MongoDB e disponibiliza registo, login e consulta do utilizador autenticado. Consultar [endpoints, validação e testes de autenticação](documentation/api/authentication.md). O `/health` do auth-service verifica também o MongoDB.

O gateway encaminha `/users/*` para o User Service, que valida cada Bearer JWT através do `/auth/me` existente, sem receber a chave JWT. Disponibiliza perfil pessoal, preferências, hábitos, medições, histórico de peso e objetivos do próprio titular. O `/health` verifica o MongoDB. Consultar [contratos, configuração, testes e decisões pendentes do User Service](documentation/api/user-service.md).

A fase 1 do User Service está autorizada apenas para desenvolvimento local com dados fictícios. O valor por defeito `USER_DATA_MODE=disabled` bloqueia os endpoints de dados. Para o desenvolvimento aprovado, definir `USER_DATA_MODE=synthetic` no `.env` local e recriar o User Service. Não existe modo de recolha de dados reais nesta fase.

O gateway encaminha `/professionals/*` para o Professional Service. A fase 1 permite candidaturas privadas de PT/Nutricionista, qualificações declaradas e horários preferidos privados, sem conceder papéis ou privilégios profissionais. `PROFESSIONAL_DATA_MODE=disabled` é o valor seguro por defeito; `synthetic` permite exclusivamente dados fictícios no desenvolvimento local. A disponibilidade operacional e os agendamentos continuam a pertencer ao Agenda Service. Consultar [endpoints, decisões e testes do Professional Service](documentation/api/professional-service.md).

A fase 2 permite submeter candidaturas e simular aprovação, rejeição e suspensão através de `/management/professional-applications/*`. A revisão fica desativada por defeito; exige papel atual de administrador no Auth e ID explicitamente autorizado no servidor Professional. Não cria contas nem atribui papéis. `/professionals/catalog` mostra apenas resumos aprovados com publicação autorizada; os códigos fictícios estão em `/professionals/specializations`. Consultar [configuração, estados, segurança e testes da aprovação simulada](documentation/api/professional-applications.md).

A fase 3 acrescenta `/care-relationships/*` no Professional, com histórico atómico, idempotência e expiração passiva de pedidos (7 dias por defeito). Não ativa elegibilidade profissional, aprovação ou acesso a dados sensíveis: os fluxos positivos são testados com dependências simuladas isoladas. O ambiente normal continua sem profissionais elegíveis confirmados. Consultar [relações, autorização, expiração e testes](documentation/api/care-relationships.md).

Os outros sete microserviços mantêm os seus endpoints de saúde iniciais; a publicação e o consumo de eventos RabbitMQ continuam por implementar.

O gateway limita os pedidos de registo e login. Consultar o [relatório da revisão de segurança e ficheiros para commit](documentation/api/authentication-security-review.md).

## Persistência e diagnóstico

`mongo_data:/data/db` preserva os dados MongoDB e o volume existente do projeto.
`rabbitmq_data:/var/lib/rabbitmq` mantém os dados do broker, com hostname estável. Este novo volume não importa automaticamente dados de volumes anónimos anteriores; esses volumes não são eliminados.

~~~sh
docker compose logs --tail=100 api-gateway auth-service
docker compose logs --tail=100 mongodb rabbitmq
docker compose exec user-service node -e "fetch('http://127.0.0.1:3002/health').then(r=>r.json()).then(console.log)"
docker compose stop
docker compose start
~~~

`docker compose down` conserva os volumes nomeados. Não usar `docker compose down -v` para preservar os dados.

A estrutura MVC e os scripts locais `dev`, `build` e `start` permanecem disponíveis.
