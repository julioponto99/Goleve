# GoLeve V1 — Instalação e execução

## 1. Introdução

Este documento descreve a instalação do GoLeve V1 numa máquina nova, usando a
stack oficial definida em [compose.yaml](../compose.yaml). O procedimento
destina-se ao ambiente local-demo e não configura uma implantação de produção.

A instalação usa:

- Docker Compose para MongoDB, RabbitMQ, API Gateway e 11 microserviços;
- npm workspaces independentes para `backend/` e `frontend/`;
- ficheiros `.env` locais, não versionados;
- dados fictícios e o adaptador de pagamentos MockBank.

Os ficheiros `.env.example` existentes são referências de configuração. Não são
substituídos, eliminados ou publicados por este procedimento.

## 2. Requisitos do sistema

| Requisito | Estado/documentação |
|---|---|
| Sistema operativo | Windows, macOS ou Linux com Docker e Node.js disponíveis |
| Node.js | 22.x; o frontend declara `>=22.13.0 <23` |
| npm | Versão compatível com os lockfiles incluídos |
| Docker | Docker Engine/Desktop com contentores Linux |
| Docker Compose | Compose v2 ou superior |
| Git | Necessário para obter o repositório |
| Recursos | Memória e disco suficientes para 14 contentores, imagens e volumes |
| Mobile | Expo Go/development build ou emulador configurado separadamente |

O Mobile físico não foi validado. No Windows, uma build/execução iOS local
requer macOS e Xcode.

## 3. Ferramentas necessárias

Instalar previamente:

1. Node.js 22.x e npm;
2. Docker Desktop ou Docker Engine com Compose v2;
3. Git;
4. Para Web: navegador Chromium/Chrome para validação manual;
5. Para Mobile: Android Studio/emulador Android ou ambiente Expo compatível.

Confirmar versões sem iniciar serviços:

```powershell
node --version
npm --version
docker --version
docker compose version
git --version
```

## 4. Obtenção do código-fonte

Clonar o repositório oficial e entrar na raiz:

```powershell
git clone <URL-privado-do-repositorio> Goleve
Set-Location Goleve
```

O valor real da URL deve ser obtido pelo responsável pela entrega ou por um
canal privado autorizado. Não incluir credenciais na URL nem publicar ficheiros
`.env`, chaves ou passwords no GitHub.

Confirmar que a raiz contém:

```text
compose.yaml
backend/
frontend/
documentation/
scripts/
```

## 5. Estrutura do projeto

| Diretório | Conteúdo |
|---|---|
| `backend/` | Workspace npm do Gateway e dos 11 microserviços |
| `backend/api-gateway/` | Fronteira HTTP, proxies, segurança e Swagger |
| `backend/services/` | Auth, User, Training, Agenda, Performance, Hydration, Professional, Management, Payment, Notification e AI Coach |
| `frontend/web/` | React, Vite e TypeScript |
| `frontend/mobile/` | React Native, Expo e TypeScript |
| `frontend/shared/` | Cliente, sessão, tokens, navegação e contratos partilhados |
| `documentation/` | Contratos, arquitetura, estado e guias |
| `scripts/` | Preparação local, contratos e verificações auxiliares |

O clone aninhado `Goleve/`, se existir numa cópia de trabalho, não faz parte do
procedimento oficial. Deve ser distinguido da raiz usada pelo Compose.

## 6. Configuração das variáveis de ambiente

### 6.1 Ficheiros operacionais

O Compose carrega a configuração do Gateway e de cada serviço através de
`env_file`. A instalação operacional requer os seguintes `.env` locais:

```text
.env
backend/api-gateway/.env
backend/services/auth-service/.env
backend/services/user-service/.env
backend/services/training-service/.env
backend/services/agenda-service/.env
backend/services/performance-service/.env
backend/services/hydration-service/.env
backend/services/professional-service/.env
backend/services/management-service/.env
backend/services/payment-service/.env
backend/services/notification-service/.env
backend/services/ai-coach-service/.env
frontend/web/.env
frontend/mobile/.env
```

Os ficheiros devem ser criados por entrega privada segura ou pelo preparador
local existente. Não copiar valores secretos para esta documentação.

### 6.2 Preparação automática local

Depois de instalar as dependências do backend, o preparador oficial pode criar
os ficheiros ausentes, preservar os valores existentes e gerar segredos locais
apenas quando faltam:

```powershell
node scripts/local-runtime.cjs prepare
```

Este comando é de preparação de configuração. Não inicia Docker, não cria
contas, não semeia bases de dados e não executa migrações. Deve ser executado
na raiz do repositório. Os valores gerados devem permanecer privados.

### 6.3 Variáveis e regras essenciais

| Âmbito | Variáveis/configuração | Regra |
|---|---|---|
| Raiz/Compose | `COMPOSE_PROJECT_NAME`, `API_GATEWAY_PORT`, `MONGO_PORT`, `RABBITMQ_PORT`, `RABBITMQ_MANAGEMENT_PORT` | O projeto oficial é `goleve`; as portas publicadas são locais |
| Raiz/segurança | `RABBITMQ_USER`, `RABBITMQ_PASSWORD`, `JWT_SECRET` | Usar credenciais próprias; `JWT_SECRET` deve ser aleatório e nunca ser publicado |
| Raiz/dados | `MONGO_DB_PREFIX`, `USER_DATA_MODE`, `USER_DATA_KEY_PATH` | O modo normal usa dados fictícios; preservar a chave local correspondente |
| Gateway | `NODE_ENV`, `PORT`, `*_SERVICE_URL`, `CORS_ALLOWED_ORIGINS`, `GATEWAY_API_DOCS_ENABLED`, `GATEWAY_API_DOCS_TRY_IT_OUT`, `GATEWAY_API_DOCS_ORIGIN` | A documentação interativa só deve ser ativada em desenvolvimento loopback |
| Serviços | `MONGO_URI`, `RABBITMQ_URL`, `AUTH_SERVICE_URL` e URLs de serviços necessários | Dentro do Compose, usar os nomes DNS dos serviços, não portas públicas do anfitrião |
| Web | `VITE_API_BASE_URL` | Para a stack oficial: `http://127.0.0.1:3000` |
| Mobile | `EXPO_PUBLIC_API_BASE_URL` | Android Emulator: `http://10.0.2.2:3000`; dispositivo físico exige origem autorizada |
| AI Coach | `AI_COACH_ENABLED`, `AI_COACH_PROVIDER` e chaves de ficheiro | Permanece desativado por defeito; não inserir credenciais de fornecedor |

Não reutilizar credenciais de outra instalação. A configuração Docker usa
RabbitMQ e MongoDB na rede interna, enquanto Web e Mobile usam o Gateway
publicado no anfitrião.

### 6.4 Segredos e entrega académica

Segredos, chaves de cifragem, passwords RabbitMQ e identidades local-demo
devem ser entregues por canal privado ou gerados localmente. Não devem ser:

- adicionados ao Git;
- colocados em screenshots;
- incorporados em exemplos de código;
- enviados para o frontend;
- publicados na documentação académica.

O `.gitignore` exclui `.env`, chaves, `.secrets`, logs, dumps e artefactos
locais. Confirmar essa proteção antes de partilhar o repositório.

## 7. Instalação das dependências

O backend e o frontend têm lockfiles e workspaces separados. Instalar cada um
na sua raiz:

```powershell
Set-Location backend
npm.cmd ci

Set-Location ..\frontend
npm.cmd ci

Set-Location ..
```

Os Dockerfiles repetem a instalação dentro das imagens com `npm ci`; as
dependências no anfitrião são necessárias para o preparador local e para
executar Web/Mobile fora do Docker.

## 8. Configuração Docker Compose

O ficheiro oficial é `compose.yaml` e o projeto Compose é `goleve`. Validar a
configuração sem iniciar contentores:

```powershell
docker compose -f compose.yaml -p goleve config --quiet
```

A stack normal contém:

- `mongodb`;
- `rabbitmq`;
- `api-gateway`;
- os 11 serviços de domínio.

Os volumes oficiais `mongo_data` e `rabbitmq_data` são persistentes. Não usar
`--remove-orphans`, não eliminar volumes e não iniciar stacks históricas ou
`compose.demo.yaml` para validar a instalação oficial.

## 9. Inicialização do backend

Após configurar os `.env`, instalar as dependências e validar o Compose,
construir as imagens a partir da raiz:

```powershell
docker compose -f compose.yaml -p goleve build
```

O contexto de build é `backend/` e as imagens usam Node.js 22, os workspaces
do backend e o utilizador não root em runtime.

## 10. Inicialização do MongoDB e RabbitMQ

O arranque completo do Compose inicia primeiro as dependências de dados:

```powershell
docker compose -f compose.yaml -p goleve up -d
```

O MongoDB usa `mongo:7`, replica set `goleveV1` e volume `mongo_data`.
O RabbitMQ usa `rabbitmq:3-management` e volume `rabbitmq_data`. Os
healthchecks do Compose verificam, respetivamente, `isWritablePrimary` e o
estado/conectividade do broker.

Consultar os estados sem alterar dados:

```powershell
docker compose -f compose.yaml -p goleve ps
docker inspect --format "{{.Name}} {{.State.Health.Status}}" goleve-mongodb-1
docker inspect --format "{{.Name}} {{.State.Health.Status}}" goleve-rabbitmq-1
```

Os nomes concretos dos contentores devem ser confirmados com `docker compose
ps`; não assumir nomes de uma instalação diferente.

## 11. Inicialização do API Gateway e microserviços

O Gateway depende dos healthchecks dos 11 microserviços. Cada microserviço
depende de MongoDB e RabbitMQ. Depois do arranque, aguardar os healthchecks e
consultar:

```powershell
docker compose -f compose.yaml -p goleve ps
Invoke-WebRequest http://127.0.0.1:3000/health
Invoke-WebRequest http://127.0.0.1:3000/ready
```

A porta pública do Gateway é `127.0.0.1:3000` por defeito. Os microserviços
não publicam portas no anfitrião; são alcançados pela rede Docker.

Para consultar logs sem alterar serviços:

```powershell
docker compose -f compose.yaml -p goleve logs --tail=100 api-gateway
docker compose -f compose.yaml -p goleve logs --tail=100 auth-service
docker compose -f compose.yaml -p goleve logs --tail=100 rabbitmq
```

## 12. Inicialização do frontend Web

Configurar `frontend/web/.env` com o endereço público do Gateway e executar:

```powershell
Set-Location frontend
npm.cmd run dev:web
```

O Vite publica a Web em `http://127.0.0.1:5173` com `strictPort=true`. A
configuração do Gateway deve autorizar essa origem em
`CORS_ALLOWED_ORIGINS`.

Para uma compilação de produção local:

```powershell
npm.cmd run build:web
npm.cmd run preview --workspace=@goleve/web
```

O preview usa `http://127.0.0.1:4173`. Esta compilação não substitui uma
implantação de produção nem altera a stack Docker.

## 13. Inicialização da aplicação Mobile

Configurar `frontend/mobile/.env` antes de iniciar Expo:

```powershell
Set-Location frontend
npm.cmd run dev:mobile
```

Comandos específicos disponíveis no workspace Mobile:

```powershell
npm.cmd run start --workspace=@goleve/mobile
npm.cmd run android --workspace=@goleve/mobile
npm.cmd run ios --workspace=@goleve/mobile
```

O Android Emulator usa `10.0.2.2` para alcançar o anfitrião. Um dispositivo
físico não deve ser resolvido expondo MongoDB ou RabbitMQ; requer encaminhamento
de desenvolvimento e uma origem autorizada. iOS Simulator/build local requer
macOS/Xcode. O repositório contém verificação de exportação, mas não há
evidência de validação num dispositivo físico nesta fase:

```powershell
npm.cmd run check:mobile
```

## 14. Endereços e portas da aplicação

Todas as portas publicadas pelo Compose estão limitadas a loopback.

| Componente | Endereço/porta |
|---|---|
| API Gateway | `http://127.0.0.1:3000` |
| Swagger completo | `http://127.0.0.1:3000/api-docs` |
| Swagger essencial | `http://127.0.0.1:3000/api-docs/essentials` |
| Web Vite | `http://127.0.0.1:5173` |
| Web preview | `http://127.0.0.1:4173` |
| MongoDB no anfitrião | `127.0.0.1:27019` |
| RabbitMQ AMQP | `127.0.0.1:5672` |
| RabbitMQ Management | `http://127.0.0.1:15672` |
| Mongo Express opcional | `http://127.0.0.1:8081` com perfil `tools` |

As portas internas dos serviços são 3001–3011 e não são publicadas pelo
Compose oficial.

## 15. Swagger UI e autenticação JWT

O Swagger completo documenta 215 operações em 170 caminhos. O Swagger
essencial local contém 30 operações em 24 caminhos, derivados por allowlist
explícita. O modo essencial exclui health, readiness, rotas internas,
operações administrativas e AI Coach.

Para ativar `Try it out` apenas no ambiente local:

1. confirmar `NODE_ENV=development`;
2. confirmar `GATEWAY_API_DOCS_ENABLED=true`;
3. usar origem loopback;
4. incluir a origem da Web em `CORS_ALLOWED_ORIGINS`;
5. definir `GATEWAY_API_DOCS_TRY_IT_OUT=true`;
6. reiniciar apenas o Gateway se a configuração estiver a ser aplicada numa
   stack já iniciada.

O botão `Authorize` recebe um Bearer JWT válido. As permissões continuam a ser
verificadas pelo backend; o Swagger não concede privilégios. Não guardar JWT,
passwords ou credenciais de serviço em URLs, screenshots ou ficheiros
versionados.

## 16. Validação da instalação

### 16.1 Procedimento do avaliador

```powershell
docker compose -f compose.yaml -p goleve ps
docker compose -f compose.yaml -p goleve config --quiet
Invoke-WebRequest http://127.0.0.1:3000/health
Invoke-WebRequest http://127.0.0.1:3000/ready
Invoke-WebRequest http://127.0.0.1:3000/api-docs
Invoke-WebRequest http://127.0.0.1:3000/api-docs/essentials
```

Confirmar no navegador:

- o Swagger completo carrega;
- o Swagger essencial carrega;
- a Web abre em `127.0.0.1:5173`;
- login e chamadas autenticadas usam apenas uma conta autorizada;
- respostas `401`/`403` continuam a ocorrer quando falta autorização;
- o Mobile aponta para o Gateway correto.

### 16.2 Evidência já existente

O projeto documenta 14 contentores healthy, MongoDB `PRIMARY`, RabbitMQ com
mensagens de retenção preservadas e testes HTTP do Gateway. Também existem
testes locais do contrato e da fronteira Swagger. Esses resultados são
evidência do ambiente observado, não garantia de uma instalação nova.

Não foram executadas validações novas durante a criação deste documento.

## 17. Resolução de problemas

| Sintoma | Verificações |
|---|---|
| `docker compose config` falha | Confirmar todos os `.env`, nomes das variáveis obrigatórias e execução na raiz |
| Contentor unhealthy | Consultar `docker compose logs --tail=100 <serviço>` e verificar primeiro MongoDB/RabbitMQ |
| Gateway não arranca | Confirmar os 11 serviços healthy, URLs internas e `backend/api-gateway/.env` |
| Swagger devolve `404` | Confirmar `GATEWAY_API_DOCS_ENABLED` e se a imagem Gateway contém o código local esperado |
| `Try it out` desativado | Confirmar desenvolvimento, origem loopback, CORS e `GATEWAY_API_DOCS_TRY_IT_OUT` |
| Web não alcança a API | Confirmar `VITE_API_BASE_URL`, CORS e que o Gateway está em `127.0.0.1:3000` |
| Android não alcança a API | Usar `10.0.2.2:3000` no emulador; não expor bases de dados |
| Porta ocupada | Alterar a porta configurável correspondente e atualizar a variável do cliente |
| MongoDB não fica PRIMARY | Consultar o healthcheck e a configuração do replica set; não apagar o volume |
| RabbitMQ indisponível | Confirmar credenciais privadas, healthcheck e volume `rabbitmq_data` |
| Sessão Web desaparece | O token Web fica em memória; após reload é necessário novo login |

Não usar `docker compose down -v`, não apagar volumes e não executar scripts de
resiliência ou migração como simples diagnóstico de conectividade.

## 18. Paragem segura dos serviços

Para parar a stack sem eliminar contentores, volumes ou dados:

```powershell
docker compose -f compose.yaml -p goleve stop
```

Para voltar a iniciar os mesmos serviços:

```powershell
docker compose -f compose.yaml -p goleve start
```

Terminar Web/Mobile com `Ctrl+C` nos respetivos terminais. Não usar `down -v`,
remoção de volumes ou limpeza Docker como procedimento normal de paragem.

## 19. Limitações e requisitos adicionais

- A instalação requer segredos locais e ficheiros `.env` privados.
- A configuração local-demo usa dados fictícios e MockBank.
- MongoDB local tem um único membro; não demonstra alta disponibilidade.
- AI Coach permanece desativado por defeito.
- Recuperação de password não tem contrato aprovado.
- Marcações profissionais, fluxos administrativos e integração financeira real
  têm dependências e bloqueios documentados.
- O Mobile físico não foi validado.
- TLS, rotação de segredos, observabilidade de produção e instalação limpa
  noutro host não foram demonstrados.
- A imagem Docker do Gateway pode estar desfasada do código local do Swagger
  essencial até ser reconstruída de forma autorizada.

## 20. Conclusão

O procedimento acima reproduz a topologia oficial do GoLeve V1 sem expor
segredos e separa a instalação do backend Docker da execução dos clientes Web e
Mobile. A validação deve ser feita num ambiente local controlado, preservando
os volumes e usando credenciais próprias.

Este documento não autoriza reconstruções, reinicializações, migrações,
alterações de dados ou publicação de segredos. A documentação descreve os
comandos disponíveis; a execução efetiva deve respeitar as autorizações e o
estado operacional da instalação.
