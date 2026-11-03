# GoLeve V1 — Estado do projeto

## 1. Identificação e objetivos

O GoLeve V1 é uma plataforma de gestão de atividade física e serviços de
bem-estar, organizada como um monorepo com API Gateway, 11 microserviços,
clientes Web e Mobile, MongoDB e RabbitMQ.

Este documento descreve o estado observado durante a auditoria atual, distinguindo:

- **Implementada** — existe implementação e há validação suficiente para o
  âmbito indicado;
- **Parcial** — existe implementação, mas há dependências, limites ou partes
  não demonstradas;
- **Não implementada** — não foi encontrada implementação correspondente;
- **Não validada** — existe código, mas não há evidência suficiente de
  funcionamento real no cenário avaliado.

A presença de uma operação no OpenAPI não é, por si só, prova de que ela é
executável para qualquer perfil ou configuração.

## 2. Resumo executivo do estado atual

O ambiente Docker oficial é o projeto `goleve`, definido em
[compose.yaml](../compose.yaml). Na última observação:

- API Gateway e 11 microserviços: **14 contentores healthy**;
- Gateway publicado apenas em `127.0.0.1:3000`;
- MongoDB 7: replica set `goleveV1`, estado `PRIMARY`;
- RabbitMQ: fila `goleve.agenda.professional.events` com 4 mensagens prontas;
- modo de execução: `local-demo`;
- documentação interativa do Gateway ativada apenas em desenvolvimento local;
- pagamentos exclusivamente MockBank/simulados.

Esta evidência é operacional e local. Não demonstra disponibilidade pública,
alta disponibilidade, TLS, recuperação automática ou adequação a produção.

## 3. Tecnologias utilizadas

| Área | Tecnologias/elementos observados |
|---|---|
| Backend | Node.js 22, TypeScript, Express, serviços REST e API Gateway |
| Dados | MongoDB 7, replica set `goleveV1` e persistência por serviço |
| Mensagens | RabbitMQ, outbox, retry e filas de falha |
| Execução | Docker e Docker Compose |
| Segurança | JWT Bearer, sessões, MFA, step-up, autorização por perfis, CORS e rate limiting |
| Contrato | OpenAPI 3.1 e Swagger UI |
| Clientes | React/Vite/TypeScript na Web e React Native/Expo no Mobile |

## 4. Arquitetura implementada

O Gateway publica a fronteira REST dos serviços e encaminha pedidos para os
11 microserviços. Os serviços mantêm responsabilidades separadas por domínio e
comunicam de forma assíncrona através de RabbitMQ quando o fluxo o exige.
MongoDB fornece persistência por serviço e o Compose define a topologia local.

O código de produção, os contratos e a configuração de execução estão
distribuídos por [backend/](../backend/), [frontend/](../frontend/) e
[compose.yaml](../compose.yaml). O Kubernetes não é a plataforma de execução
demonstrada nesta auditoria.

## 5. Estado dos microserviços

### 3.1 Componentes

| Componente | Estado | Evidência e limites |
|---|---|---|
| API Gateway | **Implementada** | Express, proxies dos 11 serviços, CORS, rate limiting, fronteira pública, preservação de Bearer JWT e bloqueio de `/internal/*`. |
| Auth Service | **Parcial** | Registo normal, login, sessões revogáveis, JWT, MFA e step-up existem. O provisionamento administrativo e os fluxos privilegiados dependem de autoridades e dados próprios; não são considerados plenamente validados no ambiente normal. |
| User Service | **Implementada** | Perfil, preferências, hábitos, objetivos e medições próprias; medições sensíveis têm proteção/cifragem prevista. O modo observado usa dados fictícios. |
| Training Service | **Implementada** | Exercícios, planos, sessões, estados de treino, histórico e eventos/outbox. Não equivale a prescrição clínica. |
| Hydration Service | **Implementada** | Metas, ingestões, totais, idempotência, lembretes configuráveis e eventos. O disparo automático de lembretes não foi demonstrado. |
| Performance Service | **Parcial** | Medições, passos, frequência cardíaca, objetivos e evolução existem. A convergência das unidades com User ainda não está definida. |
| Agenda Service | **Parcial** | Agenda pessoal está implementada; marcações profissionais dependem de elegibilidade profissional real, ausente no cenário normal observado. |
| Professional Service | **Parcial** | Catálogo, serviços, candidaturas, qualificações declaradas e relações existem. Autoridade profissional real e fluxos positivos de acompanhamento não estão validados. |
| Management Service | **Parcial** | Convites, âmbitos, serviços, casos, indicadores mínimos e auditoria existem. O percurso positivo interserviços permanece bloqueado por pré-condições administrativas. |
| Payment Service | **Parcial** | MockBank, idempotência, claim persistente, resultados incertos e outbox existem. Não há pagamentos reais, reconciliação financeira real ou integração de reserva plenamente validada. |
| Notification Service | **Implementada** | Consumo RabbitMQ, templates, preferências, deduplicação, retry/DLQ e leitura de notificações existem. Email, SMS e push externos não estão implementados. |
| AI Coach Service | **Parcial** | Há código para conversação cifrada e ações confirmadas, mas a capacidade está `disabled-by-default` e responde indisponível no cenário atual. |

## 6. Estado das funcionalidades por perfil

| Funcionalidade | Estado | Observação |
|---|---|---|
| Registo de utilizadores | **Implementada** | Limitado a utilizadores normais fictícios no modo local-demo. |
| Login e logout | **Implementada** | Login emite sessão/JWT segundo o perfil; logout revoga a sessão. |
| Autenticação JWT | **Implementada** | Bearer JWT é validado no Gateway/serviços; `/auth/me` sem token devolve `401`. |
| MFA e step-up | **Parcial** | Existem e são preservados; fluxos administrativos completos não estão todos validados no ambiente normal. |
| Recuperação de password | **Não implementada** | O frontend documenta a recuperação como indisponível enquanto não existir contrato real aprovado. |
| Gestão de perfis | **Implementada** | Consulta e atualização do próprio perfil com controlo de concorrência/ETag. |
| Gestão de treinos | **Implementada** | Planos, sessões e registo de exercícios têm código e testes direcionados. |
| Registo de atividades | **Implementada** | Existem atividades pessoais e registo de exercício; regras de estado continuam limitadas pelo contrato. |
| Hidratação | **Implementada** | Leitura de meta/histórico e registo idempotente estão implementados. |
| Medições corporais | **Parcial** | User suporta medições próprias; a integração/convergência com Performance não está fechada. |
| Desempenho e evolução | **Parcial** | Endpoints de medições, objetivos, resumo e evolução existem; limites de unidades e validação clínica permanecem. |
| Agenda pessoal | **Implementada** | Leitura, criação, edição, conclusão/cancelamento e sobreposição informativa. |
| Marcações profissionais | **Parcial** | O código existe, mas a elegibilidade profissional real bloqueia a demonstração positiva no ambiente normal. |
| Profissionais e serviços | **Implementada** | Catálogo e serviços públicos estão disponíveis com dados fictícios. |
| Pagamentos MockBank | **Parcial** | Apenas simulados; fluxos autónomos têm testes direcionados, mas reserva→pagamento continua bloqueado. |
| Notificações | **Implementada** | Notificações internas e contagem de não lidas funcionam dentro do fluxo RabbitMQ local validado. |
| AI Coach | **Não disponível no ambiente atual** | A implementação existe, mas a capacidade está desativada por defeito. |
| Administração e gestão | **Parcial** | Há código e controlos de MFA/step-up, mas os percursos positivos administrativos não estão validados no ambiente normal. |

## 12. Estado da API e Swagger

O contrato canónico é
[backend-release-v1.openapi.json](api/backend-release-v1.openapi.json).
A verificação do contrato local produziu:

- **215 operações**;
- **170 caminhos**;
- **1289 referências resolvidas**;
- 11 grupos de serviços/Gateway;
- sem referências externas no bundle verificado.

### 4.1 Swagger completo

`/api-docs` mantém o contrato técnico completo: 215 operações e 170 caminhos.
Inclui operações administrativas e capacidades condicionais porque é uma
referência técnica; isso não concede autorização.

### 4.2 Swagger essencial local

O código local em
[swagger-documents.ts](../backend/api-gateway/src/docs/swagger-documents.ts)
usa uma allowlist explícita com **30 operações em 24 caminhos**. A seleção
não inclui health, readiness, `/internal/*`, operações administrativas nem AI
Coach:

```text
POST /auth/register
POST /auth/login
GET /auth/me
POST /auth/logout
GET /users/me
PATCH /users/me
GET /training/exercises
GET /training/plans
GET /training/sessions
POST /training/sessions
POST /training/sessions/{sessionId}/exercises
GET /hydration/goal
GET /hydration/intakes
POST /hydration/intakes
GET /performance/goals
GET /performance/measurements
GET /performance/measurements/evolution
GET /performance/summary
GET /agenda/activities
POST /agenda/activities
GET /agenda/professional-appointments
POST /agenda/professional-appointments
GET /agenda/professionals/{professionalId}/availability
GET /professionals/catalog
GET /professionals/services
GET /payments
POST /payments
GET /payments/{paymentId}
GET /notifications
GET /notifications/unread-count
```

Os schemas, parâmetros, request bodies e respostas são derivados do contrato
canónico; a seleção não duplica componentes. Os resumos e tags do modo
essencial são apresentados em português de Portugal.

### 4.3 Divergência entre código local e contentor

No momento desta auditoria, o contentor oficial ainda servia a imagem anterior:

- código local: 30 operações / 24 caminhos;
- runtime Docker observado: 31 operações / 26 caminhos.

Assim, a seleção de 30 operações está validada no código e nos testes locais,
mas ainda requer reconstrução autorizada exclusivamente do API Gateway para
ser refletida no contentor. Não se deve apresentar o runtime atual como
sincronizado com esta revisão até essa operação ocorrer.

## 7. Estado do frontend Web

A aplicação Web usa React/Vite/TypeScript e o pacote Shared. Existem:

- login, registo e MFA;
- sessão em memória e logout;
- navegação por perfil;
- painéis de utilizador, profissional e gestão;
- estados de carregamento, erro e indisponibilidade;
- cliente HTTP ligado ao Gateway;
- temas Light/Dark e navegação responsiva.

O frontend documenta testes históricos com API simulada e percursos Chrome com
API real. Esses testes não comprovam todos os fluxos de escrita contra o
ambiente oficial. A recuperação de password continua indisponível.

## 8. Estado do frontend Mobile

A aplicação Mobile usa React Native/Expo e o pacote Shared. Existem:

- sessão e formulários de autenticação;
- SecureStore para sessão/configuração local;
- navegação nativa e painéis por domínio;
- contratos e cliente partilhados com a Web.

O bundle foi validado, mas não foi demonstrada execução num dispositivo físico
iOS/Android nesta auditoria. O Gateway oficial está limitado a loopback, pelo
que um dispositivo físico exige encaminhamento de desenvolvimento autorizado.

## 9. Estado das integrações

O pacote Shared fornece cliente API, descodificação de JWT, sessão, contratos
OpenAPI gerados e navegação. A Web usa `VITE_API_BASE_URL`; o Mobile usa
`EXPO_PUBLIC_API_BASE_URL`. A configuração oficial atual é
`http://127.0.0.1:3000`; referências a `64344` pertencem à stack paralela
histórica e devem ser tratadas como tal.

As integrações REST entre clientes e Gateway estão implementadas para os
domínios documentados. As integrações assíncronas usam RabbitMQ e outbox. As
integrações externas financeiras, de email, SMS e push não são integrações reais
validadas neste ambiente.

## 10. Estado da base de dados

MongoDB 7 está configurado com o replica set `goleveV1` e foi observado em
estado `PRIMARY`. A instância local observada tem um único membro, pelo que
não demonstra alta disponibilidade. O restauro foi validado anteriormente com
a exceção documentada para `admin.system.keys`; este documento não altera essa
evidência nem os dados persistentes.

Algumas coleções têm TTL ou dados de sessão com expiração. Por isso, diferenças
temporais em dados efémeros não devem ser interpretadas como perda de dados
sem comparar os metadados e o processo de restauro.

## 11. Estado da infraestrutura Docker e segurança

- Node.js 22 e TypeScript/Express são usados no backend.
- Dockerfiles compilam os workspaces com `npm ci`; imagens executam como
  utilizador não root.
- MongoDB 7 usa `goleveV1`; a instância observada tem um membro e não fornece
  alta disponibilidade.
- RabbitMQ fornece eventos, outbox, retry e filas de falha.
- JWT Bearer, MFA, step-up, autorização por perfil, CORS e rate limiting estão
  presentes.
- O Swagger interativo exige `NODE_ENV=development`, documentação ativada,
  origem loopback e origem explicitamente autorizada pelo CORS.
- O Gateway rejeita destinos externos, credenciais em URLs, `/internal/*`,
  traversal e credenciais de serviço.
- Não há pagamento bancário real nem integração financeira real.

## 13. Funcionalidades implementadas

### Validações confirmadas

- `docs:check`: contrato 215/170 e referências resolvidas;
- build TypeScript do API Gateway;
- suite Swagger/fronteira: 23/23 testes aprovados no código local;
- validação HTTP do Swagger completo e essencial;
- `GET /health`: `200`;
- `/auth/me` sem JWT: `401`;
- `/internal/health`: `404`;
- 14 contentores healthy no último estado observado;
- MongoDB `PRIMARY`;
- 4 mensagens RabbitMQ preservadas na fila de retenção.

### Limitações abertas

1. A imagem Docker ainda não contém a allowlist essencial local de 30/24.
2. O teste browser Playwright/Cromium é opcional e fica ignorado quando
   `GOLEVE_SWAGGER_TEST_BROWSER` não está configurado.
3. Marcações profissionais positivas dependem de elegibilidade real não
   provisionada no ambiente normal.
4. Fluxos administrativos positivos e integração de gestão continuam
   condicionais.
5. AI Coach está desativado.
6. Recuperação de password não tem contrato aprovado.
7. Pagamentos são apenas MockBank e não constituem reconciliação financeira.
8. Não foi feita validação de dispositivo físico Mobile.
9. Não foram repetidos testes disruptivos de paragem/recuperação de MongoDB ou
   RabbitMQ nesta auditoria.
10. Instalação limpa noutro host, TLS, rotação de segredos, HA e operação de
    produção não estão demonstrados.

## 14. Funcionalidades parciais ou não validadas

Permanecem parciais ou não validados: marcações profissionais, performance
integrada com User, administração, gestão, pagamentos MockBank, AI Coach,
execução Mobile física, vários fluxos administrativos positivos e integração
financeira real.

## 15. Funcionalidades pendentes

As pendências prioritárias são: sincronizar a imagem Docker do Gateway com a
allowlist essencial local; validar os percursos profissionais elegíveis;
concluir os fluxos administrativos autorizados; definir a convergência das
medições; aprovar um contrato de recuperação de password; e decidir a política
de integrações financeiras e notificações externas.

## 16. Limitações conhecidas

As limitações abertas acima impedem classificar o sistema como produto de
produção. Em particular, não foram demonstrados alta disponibilidade,
instalação limpa noutro host, TLS, rotação de segredos, execução Mobile física,
integração financeira real ou os fluxos profissionais e administrativos
positivos dependentes de autoridade.

## 17. Trabalho necessário para a entrega

O repositório contém código backend, frontend, Compose, contrato OpenAPI,
testes e documentação de desenvolvimento. Também contém alterações locais
Web/Mobile não publicadas e artefactos locais ignorados/não rastreados, que
não devem ser removidos sem revisão:

- clone Git aninhado `Goleve/`;
- `docker-inventory-before-cleanup.csv`;
- logs históricos em `.demo/`;
- caches e capturas frontend.

Nenhum destes artefactos foi apagado para preservar o trabalho existente.
Antes da entrega académica é necessária uma decisão explícita sobre a limpeza,
seguida de validação do pacote final.

## 18. Conclusão

O GoLeve V1 tem uma base backend funcional e testada em ambiente local-demo,
com clientes Web/Mobile, contrato OpenAPI e infraestrutura Docker reproduzível.
Não deve ser classificado como produto de produção nem como cobertura completa
de todos os percursos de negócio.

O estado mais rigoroso para entrega é:

- **Implementada:** autenticação normal, perfil próprio, treino, hidratação,
  notificações, catálogo profissional, agenda pessoal e infraestrutura local
  validada;
- **Parcial:** marcações profissionais, performance integrada, administração,
  pagamentos MockBank, gestão e AI Coach;
- **Não implementada:** recuperação de password aprovada;
- **Não validada:** execução Mobile física, vários fluxos administrativos
  positivos, integração financeira real e recuperação disruptiva dos serviços.
