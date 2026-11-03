# GoLeve V1

## 1. Apresentação

O **GoLeve V1** é uma plataforma de gestão de atividade física e serviços de
bem-estar, desenvolvida no âmbito do Mestrado em Engenharia Informática do
Instituto Politécnico do Cávado e do Ave (IPCA).

O repositório contém um monorepo com clientes Web e Mobile, um API Gateway,
11 microserviços, MongoDB, RabbitMQ, contratos OpenAPI e a infraestrutura
Docker Compose para execução local.

Esta documentação descreve o estado efetivamente implementado e não apresenta
como concluídas funcionalidades que apenas existam no contrato ou no código
sem validação suficiente.

## 2. Descrição e objetivos da plataforma

O GoLeve pretende centralizar atividades de exercício físico, hidratação,
medições, desempenho, agenda e serviços profissionais numa arquitetura
modular.

Os objetivos técnicos observados são:

- separar os domínios de negócio em microserviços;
- disponibilizar uma fronteira REST única através do API Gateway;
- partilhar cliente, sessão, navegação e contratos entre Web e Mobile;
- persistir dados em MongoDB e propagar eventos através de RabbitMQ;
- aplicar autenticação JWT, autorização por perfis, MFA e step-up quando
  aplicável;
- manter pagamentos apenas no âmbito simulado do MockBank.

## 3. Principais funcionalidades

| Estado | Funcionalidades |
|---|---|
| Implementadas | Registo e login, logout, JWT, perfil próprio, treinos, hidratação, agenda pessoal, catálogo de profissionais/serviços e notificações internas |
| Parciais | MFA/step-up administrativo, medições e evolução integradas, marcações profissionais, gestão, administração e pagamentos MockBank |
| Não disponíveis ou não concluídas | Recuperação de password, Coach IA operacional, pagamentos reais, email/SMS/push externos e integração financeira real |

A Web e o Mobile não expõem necessariamente todas as operações existentes no
backend. A disponibilidade final depende também do perfil, da configuração e
das pré-condições de cada serviço.

## 4. Perfis de utilizador

| Perfil | Âmbito principal |
|---|---|
| Utilizador | Perfil, treinos, hidratação, medições, agenda pessoal, catálogo, reservas condicionais e notificações |
| Profissional | Perfil profissional, serviços, disponibilidade e agenda profissional, sujeitos a elegibilidade |
| Gestor | Âmbitos, serviços, reservas, indicadores e casos de gestão autorizados |
| Administrador | Utilizadores, aprovações, gestores, profissionais, supervisão e auditoria, com MFA/step-up quando exigido |

O menu da aplicação não substitui a autorização do backend. Um recurso pode
estar visível e continuar condicionado pelo papel, âmbito, estado ou
elegibilidade da conta.

## 5. Tecnologias utilizadas

| Área | Tecnologias |
|---|---|
| Backend | Node.js 22, TypeScript e Express |
| API | API Gateway, REST e OpenAPI 3.1 |
| Web | React, Vite e TypeScript |
| Mobile | React Native, Expo e TypeScript |
| Partilha | Cliente API, sessão, tokens, navegação e contratos no pacote Shared |
| Persistência | MongoDB 7 com replica set `goleveV1` |
| Mensagens | RabbitMQ, outbox, retry e filas de falha |
| Execução | Docker e Docker Compose |
| Segurança | JWT, sessões revogáveis, MFA, step-up, CORS e rate limiting |

## 6. Arquitetura do sistema

Os clientes comunicam exclusivamente com o API Gateway. Este encaminha os
pedidos para:

1. Auth Service;
2. User Service;
3. Training Service;
4. Hydration Service;
5. Performance Service;
6. Agenda Service;
7. Professional Service;
8. Management Service;
9. Payment Service;
10. Notification Service;
11. AI Coach Service.

Os microserviços usam MongoDB para persistência e RabbitMQ para comunicação
assíncrona, eventos e outbox. O Payment Service utiliza apenas um adaptador
MockBank local; não existe integração bancária real validada.

Para a descrição completa, consultar [ARCHITECTURE.md](documentation/ARCHITECTURE.md).

## 7. Estrutura do repositório

| Caminho | Conteúdo |
|---|---|
| `backend/` | API Gateway e workspace dos 11 microserviços |
| `backend/api-gateway/` | Fronteira HTTP, segurança, proxies e Swagger |
| `backend/services/` | Serviços de autenticação, utilizadores, treino, hidratação, desempenho, agenda, profissionais, gestão, pagamentos, notificações e Coach IA |
| `frontend/web/` | Aplicação Web React/Vite |
| `frontend/mobile/` | Aplicação Mobile React Native/Expo |
| `frontend/shared/` | Cliente, sessão, navegação e contratos partilhados |
| `documentation/` | Documentação técnica e académica |
| `scripts/` | Preparação local, contratos e verificações auxiliares |
| `compose.yaml` | Configuração oficial da stack Docker local |

Os README internos dos módulos podem conter instruções específicas; este
ficheiro é a referência de entrada do repositório.

## 8. Requisitos de instalação

São necessários:

- Node.js 22.x e npm;
- Docker Engine/Desktop com Docker Compose v2;
- Git;
- navegador moderno para a Web;
- Expo Go/development build ou emulador Android para o Mobile.

Uma execução iOS local requer macOS e Xcode. A execução num dispositivo físico
Mobile não foi validada nesta versão.

Os ficheiros `.env` são locais e não devem ser publicados. A entrega utiliza
`.env` operacionais; os `.env.example` existentes são apenas referências e
não devem ser usados para publicar segredos.

## 9. Instalação rápida

Na raiz do repositório, preparar a configuração local:

```powershell
node scripts/local-runtime.cjs prepare
```

Instalar as dependências dos dois workspaces:

```powershell
Set-Location backend
npm.cmd ci
Set-Location ..\frontend
npm.cmd ci
Set-Location ..
```

Validar o Compose sem iniciar serviços:

```powershell
docker compose -f compose.yaml -p goleve config --quiet
```

O preparador preserva valores existentes e gera apenas configuração local
ausente. Não imprimir nem partilhar os valores dos `.env`, chaves ou
credenciais. Para o procedimento completo, consultar
[INSTALLATION.md](documentation/INSTALLATION.md).

## 10. Execução do backend e frontend

Construir e iniciar a stack oficial:

```powershell
docker compose -f compose.yaml -p goleve build
docker compose -f compose.yaml -p goleve up -d
docker compose -f compose.yaml -p goleve ps
```

O Gateway ficará disponível em `http://127.0.0.1:3000`.

Para iniciar a Web, executar a partir de `frontend/`:

```powershell
npm.cmd run dev:web
```

O endereço esperado é `http://127.0.0.1:5173`. Para iniciar o Mobile:

```powershell
npm.cmd run dev:mobile
```

No Android Emulator, a origem habitual do Gateway é
`http://10.0.2.2:3000`. As variáveis `VITE_API_BASE_URL` e
`EXPO_PUBLIC_API_BASE_URL` devem ser configuradas nos respetivos `.env`.

## 11. Docker Compose

`compose.yaml` é a configuração oficial e define:

- MongoDB 7;
- RabbitMQ com Management UI;
- API Gateway;
- 11 microserviços;
- dois volumes persistentes externos: `mongo_data` e `rabbitmq_data`.

Portas locais principais:

| Componente | Endereço |
|---|---|
| Gateway | `http://127.0.0.1:3000` |
| MongoDB | `127.0.0.1:27019` |
| RabbitMQ AMQP | `127.0.0.1:5672` |
| RabbitMQ Management | `http://127.0.0.1:15672` |

As portas dos serviços internos não são publicadas no anfitrião. O Mongo
Express é opcional, pertence ao perfil `tools` e não faz parte dos 14
contentores oficiais.

Consultar estado e logs:

```powershell
docker compose -f compose.yaml -p goleve ps
docker compose -f compose.yaml -p goleve logs --tail=100 api-gateway
```

Não utilizar `--remove-orphans`, não eliminar volumes e não iniciar stacks
históricas para validar a instalação oficial.

## 12. API Gateway e Swagger

O Gateway é a fronteira REST pública e aplica CORS, rate limiting, validação
de fronteira e bloqueio de rotas internas.

| Interface | Endereço | Conteúdo |
|---|---|---|
| Swagger completo | `http://127.0.0.1:3000/api-docs` | 215 operações em 170 caminhos |
| Swagger funcional | `http://127.0.0.1:3000/api-docs/essentials` | 30 operações em 24 caminhos no código local |

A imagem Docker atualmente observada ainda serve a seleção anterior de 31
operações em 26 caminhos. É necessária uma atualização autorizada da imagem
do Gateway antes de considerar o runtime sincronizado com o código local.

Para a referência dos parâmetros, corpos, respostas e permissões, consultar
[API.md](documentation/API.md).

## 13. Segurança e autenticação

- O acesso protegido usa JWT Bearer.
- As sessões podem ser revogadas através do Auth Service.
- MFA e step-up são exigidos nos fluxos privilegiados quando aplicável.
- A autorização é feita por perfil, propriedade do recurso e âmbito.
- CORS está limitado a origens autorizadas.
- O Gateway bloqueia rotas internas, destinos externos indevidos e credenciais
  em URLs.
- Os segredos devem permanecer nos `.env` ou no mecanismo local de segredos.
- Não colocar tokens, passwords ou chaves no Git, em screenshots ou na
  documentação.

O Coach IA permanece desativado por defeito e a recuperação de password não
está implementada no contrato aprovado.

## 14. Documentação técnica

- [Estado do projeto](documentation/PROJECT_STATUS.md)
- [Arquitetura](documentation/ARCHITECTURE.md)
- [Instalação](documentation/INSTALLATION.md)
- [Referência da API](documentation/API.md)
- [Manual do utilizador](documentation/USER_GUIDE.md)
- [Contrato OpenAPI](documentation/api/backend-release-v1.openapi.json)

Estes documentos distinguem implementação, disponibilidade, validação e
funcionalidades previstas, evitando tratar contratos como prova de execução.

## 15. Estado atual do projeto

Na última auditoria operacional documentada:

- 14 contentores oficiais foram observados como saudáveis;
- o MongoDB estava em `PRIMARY` no replica set `goleveV1`;
- RabbitMQ estava operacional com a retenção local preservada;
- o Gateway e os serviços estavam configurados para o modo local-demo;
- o código local tinha Swagger essencial 30/24;
- o runtime Docker ainda precisava de atualização para essa seleção;
- as áreas pessoais Web/Mobile estavam implementadas, enquanto vários fluxos
  profissionais, administrativos e de pagamento permaneciam condicionais.

Este estado é local e não demonstra disponibilidade pública, TLS, alta
disponibilidade ou adequação a produção. Os detalhes e evidências encontram-se
em [PROJECT_STATUS.md](documentation/PROJECT_STATUS.md).

## 16. Limitações conhecidas

1. A recuperação de password não está disponível.
2. O Coach IA está desativado no ambiente atual.
3. Marcações profissionais dependem de elegibilidade e dados autorizados.
4. Pagamentos são apenas MockBank e não constituem pagamentos reais.
5. Email, SMS e push externos não estão implementados.
6. A execução Mobile em dispositivo físico não foi validada.
7. Alguns percursos administrativos positivos continuam condicionais.
8. A instância MongoDB observada tem um único membro e não demonstra alta
   disponibilidade.
9. A instalação limpa noutro host, TLS, rotação de segredos e operação de
   produção não estão demonstradas.

## 17. Equipa de desenvolvimento

| Elemento | Número |
|---|---:|
| Júlio Pereira | 29860 |
| Juan Peixoto | 29614 |
| Manuel Bizerra | 37725 |

## 18. Contexto académico

Projeto desenvolvido no âmbito do **Mestrado em Engenharia Informática** do
**Instituto Politécnico do Cávado e do Ave (IPCA)**.

**Unidade curricular:** Arquiteturas e Integração de Sistemas

**Ano letivo:** 2026/2027

Este repositório representa uma entrega académica V1. As funcionalidades
simuladas e as limitações explicitadas não devem ser interpretadas como
características de um produto de produção.
