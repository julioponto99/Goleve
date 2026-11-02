# Plano de conclusão do backend

> Leitura atual: as secções de implementação 10–16 atualizam progressivamente a auditoria original. Resumos/estimativas iniciais são históricos e não substituem os contratos executados. As Fases 5.6 e 5.7 mantêm utilização real bloqueada e não ativam o ambiente principal; ver [Agenda Profissional](api/professional-agenda.md) e [Coach IA](api/ai-coach.md).

**Âmbito:** auditoria documental do código existente em 2026-11-01.
**Restrições desta auditoria:** não foram alterados serviços, bases de dados,
volumes, chaves ou configurações Docker; não foi executado backup, migração,
paragem ou reinício de serviços.

## 1. Resumo executivo

O backend não está funcionalmente concluído apesar de os contentores estarem
saudáveis. O núcleo de identidade e dados pessoais tem implementação
substancial; a Agenda pessoal está implementada e testada; o Professional tem
workflows robustos, mas permanece deliberadamente sintético e sem elegibilidade
real. Training, Hydration, Performance, Notification, AI Coach e Payment só
arrancam e respondem a `/health`. O API Gateway não expõe esses seis domínios.
RabbitMQ está operacional como infraestrutura, mas não existe integração de
mensageria nem outbox.

**Estimativa global:** aproximadamente **30% do backend funcional solicitado**.
Esta percentagem é ponderada por capacidades de negócio e testes, não por
número de contentores ou ficheiros. A estimativa não considera funcionalidades
financeiras ou de IA como concluídas quando os requisitos ainda estão pendentes.

## 2. Matriz de conclusão

| Módulo | Estado | Estimativa | Evidência e lacunas principais |
|---|---|---:|---|
| Auth | Concluído para identidade local; incompleto para ciclo de conta | 85% | `/auth/register`, `/auth/login`, `/auth/me`; bcrypt, JWT com issuer/audience, validação de segredo e testes de integração/segurança. Faltam refresh tokens, recuperação de palavra-passe, verificação de email, lockout e workflow seguro de papéis. `backend/services/auth-service/src/routes/auth.routes.ts:14` |
| User | Implementado parcialmente | 80% | Perfil, preferências, hábitos, medições, peso e objetivos; isolamento por proprietário, ETags, idempotência, cifra e auditoria. O runtime exige `dataMode=synthetic`; faltam modo produtivo, consentimento/partilha, exportação, eliminação e integrações de domínio. `backend/services/user-service/src/routes/user.routes.ts:6` |
| Professional | Implementado parcialmente e sintético | 65% funcional / 40% pronto para produção | Perfil, capacidades, qualificações, disponibilidade declarada, candidaturas, revisão configurável e relações de acompanhamento. DTOs marcam dados sintéticos; elegibilidade real retorna indisponível; faltam credenciais, licenças, privilégios e diretório publicado. `backend/services/professional-service/src/routes/professional.routes.ts:7` |
| Agenda | Concluído no escopo pessoal atual | 75% | CRUD de atividades, treinos, filtros, paginação, fusos IANA, avisos de sobreposição, transições atómicas e isolamento JWT. Faltam auditoria, idempotência HTTP, recorrência, lembretes, calendário e reservas profissionais. `backend/services/agenda-service/src/routes/agenda.routes.ts:5` |
| Training | Implementado e validado no núcleo autónomo | 80% | Catálogo, planos versionados, sessões, transições, idempotência, isolamento JWT, índices, concorrência e proxy Gateway validados com 6 testes Mongo isolados. Faltam eventos/outbox e integração autorizada com Agenda. `backend/services/training-service/src/routes/training.routes.ts` |
| Hydration | Implementado e validado no núcleo autónomo | 75% | Metas sugeridas/personalizadas, ingestões UTC com dia local IANA, totais, histórico, idempotência, lembretes persistidos, índices, isolamento JWT e proxy Gateway. Faltam notificações reais, outbox e contrato aprovado para ler dados do User. `backend/services/hydration-service/src/routes/hydration.routes.ts` |
| Performance | Implementado e validado no núcleo autónomo | 75% | Medidas corporais, passos, frequência cardíaca, objetivos, evolução, resumos, idempotência, concorrência, isolamento JWT, índices e proxy Gateway validados em Mongo isolado. Integrações Apple Health, Health Connect, Training, Hydration e Coach IA continuam apenas contratos futuros. `backend/services/performance-service/src/routes/performance.routes.ts` |
| Notification | Implementado e validado no núcleo interno | 70% | Notificações internas, preferências, isolamento JWT, idempotência de eventos, consumer RabbitMQ, retries limitados, fila failed/DLQ e proxy Gateway validados em ambientes sintéticos. Email, push, scheduler de lembretes e outbox transacional continuam pendentes. `backend/services/notification-service/src/messaging/rabbitmq.ts` |
| AI Coach | Não implementado | 5% | Apenas `GET /health`; sem recomendações, contexto, consentimento, autorização de ações ou provider. `backend/services/ai-coach-service/src/server.ts:1` |
| Payment | Não implementado; decisão funcional pendente | 5% | Apenas `GET /health`; não há sequer transação simulada. Preços, contratação, cobrança e comissões continuam fora dos requisitos aprovados. `backend/services/payment-service/src/server.ts:1` |
| Management | Proxy/dependência administrativa parcial | 25% | Gateway encaminha `/management/*` para o serviço Professional; não existe cobertura funcional equivalente à dos domínios principais. Deve ser tratado como superfície administrativa dependente de decisão de papéis. `backend/api-gateway/src/app.ts:18-21` |
| API Gateway | Implementado parcialmente | 55% | Health, Auth, User, Professional, Management, Care Relationships, Agenda, Training e Hydration com proxies, timeout e erros 502 controlados. Faltam rotas Performance, Notification, AI Coach e Payment. `backend/api-gateway/src/app.ts:11-27` |
| RabbitMQ/outbox | RabbitMQ integrado; outbox pendente | 45% | Broker, contratos versionados, consumer, ACK, retry limitado, fila failed/DLQ e idempotência estão implementados. Publishers de domínio e outbox atómica dependem de replica set e contratos de cada serviço. `compose.yaml:44-57` |

`management-service` é incluído porque está no Compose e no Gateway, embora não
seja um dos domínios autónomos prioritários. MongoDB e RabbitMQ são
dependências de infraestrutura, não funcionalidades de produto.

## 3. Funcionalidades atualmente operacionais

### Identidade e perfil

- Registo, login e consulta de identidade com JWT.
- Hash de palavras-passe com bcrypt e respostas genéricas para credenciais
  inválidas.
- Perfil próprio, preferências, hábitos, objetivos e medições.
- Isolamento por utilizador, validação, ETags/concorrência otimista e
  idempotência de medições.
- Cifra de dados sensíveis do User e auditoria fail-closed para a operação
  inicial.

### Agenda pessoal

- Atividades pessoais e treinos em casa, ginásio ou exterior.
- Criação, consulta, edição anterior ao início, conclusão após o fim e
  cancelamento de atividades planeadas.
- Filtros, paginação, fusos horários IANA e avisos de sobreposição.
- Transições finais e operações de estado com atualização atómica.
- Testes de validação, isolamento, JWT, paginação, sobreposição e Gateway.

### Profissionais

- Candidatura e perfil profissional em modo controlado.
- Capacidades, qualificações, disponibilidade declarada e histórico.
- Relações com convite, aceitação, recusa, cancelamento, expiração e
  histórico.
- Auditoria, ETags, locks de rascunho e verificações de autorização.
- O fluxo positivo continua bloqueado no runtime normal porque a elegibilidade
  real não está implementada.

### Infraestrutura

- MongoDB, RabbitMQ e healthchecks Docker.
- Gateway com proxies para os domínios já existentes e rate limit de registo/
  login.
- Testes de integração isolados para Auth, User, Professional e Agenda.

## 4. Funcionalidades em falta ou simuladas

1. **Treino:** catálogo de exercícios/equipamentos, compatibilidade com
   ambiente, planos versionados, sessões, execução e duração efetiva.
2. **Hidratação:** ingestões, totais, metas, histórico e lembretes.
3. **Performance:** passos, frequência cardíaca, peso/evolução agregados e
   integração futura com fontes externas.
4. **Notificações:** preferências, templates, canais, agendamento, entrega,
   retries e deduplicação.
5. **Coach IA:** contexto autorizado, consentimento, recomendações, explicação
   e ações explicitamente autorizadas.
6. **Gateway:** proxies e testes para os seis domínios ausentes.
7. **Eventos:** outbox por serviço, contratos versionados, publishers,
   consumers, ACK, retry, DLQ e idempotência.
8. **Produção:** User e Professional estão limitados a modos sintéticos;
   elegibilidade e revisão profissional real continuam indisponíveis.
9. **Pagamentos:** não iniciar implementação financeira antes de decisão sobre
   preços, contratação, cobrança, reembolsos, moeda e fornecedor.
10. **Autonomia completa:** os requisitos definem que o núcleo pessoal não pode
    exigir PT, nutricionista, ginásio, pagamento ou IA; os domínios pessoais
    acima devem funcionar sem essas dependências.

## 5. Bloqueios e riscos técnicos

### Transações e consistência

O MongoDB principal continua standalone. Não remover garantias de consistência
para contornar essa limitação. Qualquer fluxo que altere várias coleções ou
publique um evento deve aguardar uma estratégia aprovada:

- migração para replica set com transações, ou
- desenho explicitamente compensatório, com outbox e reconciliação, quando a
  consistência forte não for necessária.

Agenda já usa transições atómicas dentro do seu documento, mas não tem outbox.
Criação de uma atividade e publicação de notificação não deve ser dividida em
duas operações sem uma estratégia de recuperação.

### Integrações externas

Performance pode depender de dispositivos ou APIs móveis; Notification de
provedores de email/push/SMS; AI Coach de um provider de modelo; Payment de um
gateway financeiro. Nenhuma dessas integrações está definida no código atual.
Até haver contratos aprovados, implementar adaptadores internos e providers
fictícios testáveis, sem chamar serviços reais.

### Autorização e dados

O Auth remoto é dependência síncrona do User, Professional e Agenda. É
necessário definir política de indisponibilidade antes de introduzir novos
fluxos. O acesso profissional a dados pessoais exige elegibilidade, relação
aceite e autorização específica; um papel ou relação não deve desbloquear
automaticamente medições, objetivos ou hábitos.

### Docker e ambientes

O Compose injeta `MONGO_URI` e `RABBITMQ_URL` nos serviços incompletos, mas os
processos não os utilizam. Healthchecks positivos não provam persistência,
autorização ou integração. Os testes devem usar Compose/volumes isolados e não
alterar `goleve_mongo_data`.

## 6. Plano faseado de desenvolvimento

### Fase A — Training core autónomo

**Objetivo:** entregar o primeiro domínio incompleto que desbloqueia a
experiência autónoma.

**Serviço e Gateway:** Training Service e um proxy `/training/*` no Gateway.

**Endpoints propostos, sujeitos ao contrato final:**

- `GET /training/exercises`
- `GET /training/exercises/:exerciseId`
- `POST /training/plans`
- `GET /training/plans`
- `GET /training/plans/:planId`
- `PATCH /training/plans/:planId`
- `POST /training/sessions`
- `GET /training/sessions`
- `POST /training/sessions/:sessionId/start`
- `POST /training/sessions/:sessionId/complete`

**Modelos MongoDB:** `Exercise`, `TrainingPlan`, `TrainingPlanVersion`,
`TrainingSession` e, se necessário, `ExerciseExecution`. Todos devem conter
`ownerId`, timestamps, versão e estado; conteúdo profissional deve preservar
autoria e versão sem ser sobrescrito por edição pessoal.

**Regras:** ambiente `home`, `gym` ou `outdoor`; equipamento confirmado por
sessão; ausência de equipamento é válida; duração pretendida é distinta da
efetiva; o núcleo próprio não exige relação profissional, pagamento ou IA.

**Integrações:** validação JWT via Auth, referências não duplicadas ao User,
referência opcional à Agenda e publicação futura de eventos apenas através de
outbox. Não depender de Notification ou AI Coach para criar/terminar uma
sessão.

**Testes e aceitação:**

- validação de ambiente, duração e equipamento;
- isolamento entre utilizadores;
- planos versionados e autoria;
- transições de sessão e idempotência;
- filtros/paginação;
- Gateway com JWT inválido/ausente e erros upstream;
- testes de integração com Mongo isolado;
- `GET /health` não ser o único teste de sucesso.

**Dependências:** contrato funcional mínimo de exercícios, planos e sessões;
decisão sobre necessidade de replica set para alterações multi-documento.

### Fase B — Hidratação e notificações internas

Implementar Hydration com ingestões, metas pessoais e totais derivados.
Implementar Notification com preferências e uma entrega fictícia/outbox
testável antes de qualquer provider externo. Definir idempotência por evento,
deduplicação e política de retry. Integrar os dois serviços no Gateway.

**Aceitação:** ingestão isolada por utilizador, totais determinísticos,
timezone correto, lembretes não duplicados e falha do provider sem perda do
registo de domínio.

### Fase C — Performance e evolução

Implementar registos de passos, frequência cardíaca, peso/evolução e métricas
de desempenho. Separar dados declarados no User de eventos de performance.
Definir importação móvel como adaptador, sem pressupor fornecedor.

**Aceitação:** origem e timestamp de cada medição, validação de unidades,
idempotência de importações, consultas paginadas e ausência de exposição entre
utilizadores.

### Fase D — Eventos, outbox e consistência

Introduzir uma biblioteca/contrato comum apenas depois de um caso de uso real
da Fase B ou C. Cada serviço deve persistir o evento na mesma unidade de
consistência do seu write model, publicar com retry e aceitar reprocessamento
idempotente. Definir exchanges/filas, versões, DLQ e reconciliação.

Se a operação exige transação multi-documento, esta fase depende de uma
replica set autorizada e testada. Não usar `Promise.all` ou duas escritas
independentes como substituto de transação.

### Fase E — Professional operacional

Substituir o modo sintético apenas após decisões de produto e segurança:
verificação de credenciais/licenças, papéis Auth, revisão administrativa,
elegibilidade atual, publicação e permissões de acesso a dados. Implementar
grants específicos e auditoria de leitura, não apenas autorização de relação.

### Fase F — Coach IA

Definir finalidade, consentimento, retenção, contexto permitido, provider,
limites de segurança e catálogo de ações. Implementar primeiro recomendações
sem efeitos; depois ações explicitamente autorizadas, idempotentes e auditadas.
O percurso autónomo deve continuar funcional se AI Coach estiver indisponível.

### Fase G — Payment, apenas após decisão de negócio

Não implementar cobrança real enquanto não existirem decisões sobre preços,
moeda, contratação, fornecedor, webhooks, reembolsos, reconciliação e
requisitos legais. Primeiro criar contrato de domínio e testes com provider
fictício; só depois integrar um provider real em ambiente separado.

## 7. Ordem recomendada

1. **Training core autónomo (Fase A)** — primeiro trabalho concreto; é
   independente de pagamentos, PT e IA e dá forma ao percurso autónomo.
2. Hidratação e notificações internas (Fase B).
3. Performance (Fase C).
4. Outbox/eventos e decisão de transações (Fase D).
5. Professional real e grants (Fase E).
6. Coach IA autorizado (Fase F).
7. Payment condicionado a decisão (Fase G).

Esta ordem evita construir integrações de notificações/IA sobre serviços que
não possuem modelos de domínio e evita tratar Payment como requisito do núcleo
pessoal.

## 8. Primeira fase pronta para começar

Antes de escrever código da Fase A, devem ser aprovados apenas os detalhes que
não estão definidos nos documentos atuais:

- campos mínimos de `Exercise`, `TrainingPlan` e `TrainingSession`;
- catálogo inicial de exercícios e se é seed fictício ou administrável;
- estados válidos e transições de plano/sessão;
- política de edição de planos e versionamento;
- se uma sessão pode referenciar uma atividade Agenda sem duplicar o
  compromisso;
- necessidade de transação MongoDB em cada comando.

Depois dessa decisão, a implementação pode começar com Mongo isolado e testes
de contrato, sem parar serviços principais e sem tocar no backup da Fase 4.2.

## 9. Validação transversal de cada fase

Cada entrega deve incluir:

1. rotas de serviço e proxy Gateway;
2. autenticação JWT e isolamento por `ownerId`;
3. validação de payloads, estados, datas e unidades;
4. modelos/indexes e migração/seed apenas em ambiente isolado;
5. testes unitários, integração Mongo, erros e concorrência quando aplicável;
6. teste Gateway com dados fictícios;
7. healthcheck separado de testes funcionais;
8. documentação do contrato e decisões pendentes;
9. `docker compose config`, testes focados e `git diff --check`;
10. confirmação de que o Mongo principal, volumes, backup e chaves não foram
    tocados.

## 10. Fase 5.1 implementada — Training Service

### Endpoints

Todas as rotas de domínio estão sob `/training` e exigem um JWT validado pelo
Auth Service:

| Método | Endpoint | Finalidade |
|---|---|---|
| GET | `/training/exercises` | Catálogo global e exercícios privados acessíveis, com filtros e paginação |
| POST | `/training/exercises` | Criar exercício privado do utilizador autenticado |
| GET | `/training/exercises/:exerciseId` | Consultar exercício global ou próprio |
| POST | `/training/plans` | Criar plano autónomo |
| GET | `/training/plans` | Listar planos próprios com paginação/status |
| GET | `/training/plans/:planId` | Consultar plano próprio e histórico |
| PATCH | `/training/plans/:planId` | Editar plano e criar snapshot de versão |
| POST | `/training/plans/:planId/archive` | Arquivar plano |
| POST | `/training/plans/:planId/duplicate` | Duplicar plano próprio |
| POST | `/training/plans/:planId/exercises` | Adicionar exercício configurado |
| DELETE | `/training/plans/:planId/exercises/:exerciseId` | Remover exercício do plano |
| POST | `/training/sessions` | Criar sessão, opcionalmente a partir de plano |
| GET | `/training/sessions` | Consultar histórico próprio com paginação/status |
| GET | `/training/sessions/:sessionId` | Consultar sessão própria |
| POST | `/training/sessions/:sessionId/start` | Iniciar sessão |
| POST | `/training/sessions/:sessionId/pause` | Pausar sessão |
| POST | `/training/sessions/:sessionId/resume` | Retomar sessão |
| POST | `/training/sessions/:sessionId/complete` | Concluir sessão idempotentemente |
| POST | `/training/sessions/:sessionId/cancel` | Cancelar sessão planeada/ativa |
| POST | `/training/sessions/:sessionId/exercises` | Registar exercício e séries realizadas |

O API Gateway encaminha `/training/*` para `TRAINING_SERVICE_URL`, preservando
headers, query string e tratamento de indisponibilidade 502.

Exemplos de integração frontend:

```http
POST /training/plans
Authorization: Bearer <access-token>
Content-Type: application/json

{"title":"Plano casa","goals":["strength"],"days":["monday"],"environment":"home","exercises":[]}
```

Resposta criada (forma resumida):

```json
{"data":{"id":"<plan-id>","ownerId":"<jwt-user-id>","status":"active","version":1,"history":[]}}
```

```http
POST /training/sessions/<session-id>/complete
Authorization: Bearer <access-token>
```

A conclusão repetida da mesma sessão devolve o estado `completed` existente,
sem criar outra sessão. JWT ausente/inválido devolve `401`; dados inválidos
devolvem `400`; uma alteração concorrente rejeitada devolve `409`.

### Modelos e regras

- `training_exercises`: catálogo global (sem `ownerId`) e exercícios privados
  com `ownerId`; contextos `home`, `gym` e `outdoor`; dificuldade, tipo,
  equipamento e instruções validados.
- `training_plans`: proprietário, objetivos, dias, contexto opcional,
  exercícios configurados, estado `active`/`archived`, versão e snapshots
  históricos no mesmo documento.
- `training_sessions`: proprietário, plano opcional, exercícios realizados,
  séries, estado `planned`/`running`/`paused`/`completed`/`cancelled`,
  timestamps e versão.
- Todas as consultas de domínio usam a identidade obtida no Auth Service;
  IDs de utilizador enviados pelo cliente não são usados.
- Planos arquivados não podem ser editados. Sessões têm transições explícitas,
  atualização otimista por `version` e conclusão idempotente.
- Não há criação automática de eventos Agenda. A integração futura deve ser
  opt-in e manter Agenda como proprietária dos compromissos; Training é
  proprietário dos planos e sessões.
- Nenhum comando depende de transações MongoDB multi-documento. O histórico
  de plano é gravado no mesmo documento. Outbox/eventos e sincronização Agenda
  continuam bloqueados até a Fase D e decisão de consistência.

### Testes da Fase 5.1

`backend/services/training-service/tests/training.test.cjs` cobre schemas,
validação, acesso a exercícios, autenticação, idempotência de conclusão e
proxy Gateway. O resultado focado foi **6/6 aprovado**. Não foi executado teste de integração
com uma base Mongo real nesta etapa, porque não foi fornecido um URI de
MongoDB isolado para testes; nenhum teste apontou para `goleve_mongo_data`.
Os testes de persistência real, concorrência multi-request e índices devem ser
executados quando existir um ambiente isolado autorizado.

### Validação real 5.1.1

Foi reutilizado o contentor existente `goleve-mongodb-restore-test` através da
rede interna `goleve_mongodb_restore_test`. O teste correu num contentor Node
temporário sem portas publicadas, usando apenas a base sintética
`goleve_training_integration_test`; não utilizou `goleve-mongodb-1`,
`27019`, `goleve_mongo_data` ou dados reais.

Resultado da suite `training.integration.test.cjs`: **6 testes, 6 aprovados,
0 falhas**:

- persistência real de exercícios globais/privados, filtros e paginação;
- isolamento do utilizador B perante dados privados do utilizador A;
- criação, edição, histórico de versões, duplicação e arquivo de planos;
- lifecycle de sessão, séries, pausa/retoma, conclusão concorrente idempotente
  e consulta de histórico;
- JWT ausente/inválido e payload inválido;
- índices Mongoose e atualização otimista atómica por `version`;
- encaminhamento por uma instância real de `createApp` do API Gateway, com
  propagação do Bearer token e query string.

Os índices verificados incluem o índice composto de planos por
`ownerId/status/updatedAt`; os schemas também inicializaram os índices de
exercícios e sessões. A corrida de duas atualizações com a mesma versão
produziu exatamente um vencedor e uma versão final; duas conclusões
simultâneas da mesma sessão retornaram sucesso idempotente sem duplicar
documentos.

Durante a primeira execução foram observados avisos de depreciação de
Mongoose para `{ new: true }`. Foram corrigidos no Training Service e nos
testes para `returnDocument: 'after'`; a suite foi repetida com sucesso. O
aviso de `util._extend` vem da dependência do proxy HTTP existente, não do
Training Service, e não causou falha.

Os testes reais deixaram dados exclusivamente na base sintética do volume
isolado já existente. Não foram removidos volumes ou contentores. A
persistência foi comprovada; uma limpeza posterior dessa base/volume exige
autorização separada.

## 11. Fase 5.2 implementada — Hydration Service

### Endpoints

Todas as rotas exigem JWT validado pelo Auth Service e derivam o proprietário
da identidade autenticada:

| Método | Endpoint | Finalidade |
|---|---|---|
| POST | `/hydration/goal/suggest` | Calcular objetivo sugerido |
| GET | `/hydration/goal` | Consultar objetivo atual |
| PUT | `/hydration/goal` | Criar ou alterar objetivo |
| GET | `/hydration/goal/history` | Consultar alterações do objetivo |
| POST | `/hydration/intakes` | Registar consumo com chave idempotente |
| GET | `/hydration/intakes/daily` | Consultar total de um dia local |
| GET | `/hydration/intakes` | Consultar histórico paginado por intervalo |
| PATCH | `/hydration/intakes/:intakeId` | Corrigir consumo próprio |
| DELETE | `/hydration/intakes/:intakeId` | Eliminar consumo próprio |
| GET | `/hydration/reminders` | Consultar configuração de lembretes |
| PUT | `/hydration/reminders` | Criar ou alterar configuração |

O Gateway encaminha `/hydration/*` para `HYDRATION_SERVICE_URL`, preservando
autorização, query string e erros de indisponibilidade. Exemplo:

```http
PUT /hydration/goal
Authorization: Bearer <jwt>
Content-Type: application/json

{"targetMl":2500,"source":"custom","timezone":"Europe/Lisbon"}
```

### Modelos, fórmulas e limites

- `hydration_goals`: objetivo, origem (`suggested`/`custom`), timezone, versão
  e histórico embutido, com unicidade por `ownerId`.
- `hydration_intakes`: quantidade, instante UTC, timezone, dia local, chave
  idempotente e timestamps; unicidade por `ownerId`/`idempotencyKey`.
- `hydration_reminders`: estado, frequência, janela horária, timezone e
  versão, com unicidade por `ownerId`.
- Objetivo sugerido: homem 35 ml/kg, mulher 30 ml/kg, redução de 5% acima de
  55 anos e acréscimo de 500 ml quando ativo. O resultado inclui litros e
  copos de 250 ml. Esta é uma regra funcional do produto, não recomendação
  médica; o utilizador pode rever o objetivo.
- Dias locais são calculados com timezone IANA a partir do instante UTC.
  Atualizações de objetivos e lembretes usam versão otimista; ingestões usam
  idempotência e atualização concorrente por timestamp.
- A configuração de lembretes não envia notificações. Notification, RabbitMQ,
  outbox e leitura de dados sensíveis do User continuam fora desta fase.

### Validação da Fase 5.2

Os testes unitários/schema e Gateway em
`backend/services/hydration-service/tests/hydration.test.cjs` tiveram **3/3
aprovados**. A suite de integração
`hydration.integration.test.cjs` teve **4/4 aprovados** no contentor Mongo
isolado existente, na base sintética `goleve_hydration_integration_test`.
Foram comprovados persistência real, histórico, total por dia local,
idempotência, edição/eliminação, isolamento entre utilizadores, JWT ausente,
validação de timezone/data, rejeição de versão obsoleta e índices Mongoose.
Não foram usados o Mongo principal, a porta 27019 ou o volume
`goleve_mongo_data`; os dados sintéticos permanecem no ambiente isolado.

## 12. Fase 5.3 implementada — Performance Service

### Endpoints

As rotas exigem JWT validado pelo Auth Service e usam exclusivamente o
proprietário derivado da identidade autenticada:

| Método | Endpoint | Finalidade |
|---|---|---|
| POST | `/performance/measurements` | Criar peso ou medida corporal |
| GET | `/performance/measurements` | Histórico paginado |
| PATCH | `/performance/measurements/:measurementId` | Corrigir registo próprio |
| DELETE | `/performance/measurements/:measurementId` | Eliminar registo próprio |
| GET | `/performance/measurements/evolution` | Evolução por tipo de medida |
| POST | `/performance/steps` | Registar passos manualmente |
| GET | `/performance/steps` | Histórico paginado |
| GET | `/performance/steps/daily` | Total local de um dia e cumprimento |
| GET | `/performance/steps/summary` | Totais e médias por intervalo |
| POST | `/performance/heart-rate` | Registar BPM e contexto |
| GET | `/performance/heart-rate` | Histórico paginado |
| GET | `/performance/heart-rate/summary` | Média, mínimo, máximo e tendência |
| GET | `/performance/goals` | Consultar objetivos |
| PUT | `/performance/goals/:kind` | Criar ou alterar objetivo |
| GET | `/performance/summary` | Resumo de evolução |

`kind` de medida suporta `weight`, `height`, `waist`, `hip`, `chest`, `arm`,
`thigh` e `other`. Objetivos suportados são `weight`, `steps`, `waist` e
`heart_rate`. Datas são instantes ISO UTC; os passos também guardam o dia
local derivado do timezone IANA enviado pelo utilizador.

### Modelos e regras

- `performance_measurements`: valores de peso/medidas em kg ou cm, origem
  manual, instante, timezone e chave idempotente.
- `performance_steps`: contagem, instante, dia local, timezone, origem manual
  e chave idempotente. Os campos `apple_health` e `health_connect` estão
  preparados no modelo, mas não são produzidos por integrações nesta fase.
- `performance_heart_rates`: BPM, instante, contexto opcional, timezone e
  chave idempotente. O serviço calcula estatísticas descritivas, sem diagnóstico
  ou classificação clínica.
- `performance_goals`: objetivo único por utilizador e indicador, unidade,
  timezone e versão para atualizações otimistas.
- Evolução de medidas compara o primeiro e o último registo do período.
  Tendência cardíaca é a diferença entre o último e o primeiro BPM. Resumos
  de passos agrupam pelo dia local e calculam média diária e percentagem do
  objetivo quando configurado.
- Nenhum serviço lê coleções de outro serviço. Não foram adicionados eventos,
  RabbitMQ ou integrações fictícias; contratos externos ficam para uma fase
  posterior.

### Validação da Fase 5.3

Os testes unitários/schema e Gateway em
`backend/services/performance-service/tests/performance.test.cjs` tiveram
**2/2 aprovados**. A suite de integração
`performance.integration.test.cjs` teve **4/4 aprovados** no contentor Mongo
isolado existente, na base sintética `goleve_performance_integration_test`.
Foram comprovados persistência real, evolução, totais por timezone,
idempotência, edição/eliminação, objetivos, tendência de BPM, isolamento,
JWT ausente, validação, concorrência de objetivos e índices Mongoose.

O build de todos os workspaces passou. Não foram usados o Mongo principal, a
porta 27019 ou o volume `goleve_mongo_data`; os dados sintéticos permanecem
exclusivamente no ambiente isolado. Apple Health, Health Connect, Training,
Hydration e Coach IA ainda não são integrações funcionais.

O próximo passo recomendado é a Fase 5.4 — Notification/outbox, começando por
contratos de eventos e entrega idempotente antes de ligar lembretes e
indicadores a notificações reais.

## 13. Fase 5.4 implementada — Notification Service e RabbitMQ

### Endpoints

Todas as rotas exigem JWT validado pelo Auth Service e limitam as consultas ao
utilizador autenticado:

| Método | Endpoint | Finalidade |
|---|---|---|
| GET | `/notifications` | Listar notificações com paginação e `unread=true` |
| GET | `/notifications/unread-count` | Consultar número de não lidas |
| POST | `/notifications/:notificationId/read` | Marcar uma notificação como lida |
| POST | `/notifications/read-all` | Marcar todas como lidas |
| GET | `/notifications/preferences` | Consultar preferências |
| PUT | `/notifications/preferences` | Alterar preferências com versão otimista |

Não existe endpoint público para criar notificações. A criação só ocorre pelo
consumer após validação de um evento interno.

### Modelos e contratos

- `notifications`: proprietário, `eventId` único, tipo, origem, título, corpo,
  instante de ocorrência e `readAt`.
- `notification_preferences`: ativação geral e preferências para hidratação,
  treino e agenda, com versão e unicidade por utilizador.
- `notification_processed_events`: deduplicação de eventos processados.
- Contrato `v1`: `eventId`, `contractVersion`, `type`, `source`,
  `recipientUserId`, `occurredAt` UTC e payload mínimo `{title, body}`.
- Tipos aceites: `hydration.reminder.requested.v1`,
  `training.session.completed.v1` e
  `agenda.activity.reminder.requested.v1`.

### RabbitMQ

O consumer declara o exchange durável `goleve.notifications`, a fila
`goleve.notification-service.events`, uma fila de retry com TTL e a fila
`goleve.notification-service.events.failed`. Mensagens válidas são persistidas
antes de ACK. Falhas de validação/processamento fazem até três ciclos de retry;
após esse limite, a mensagem é publicada na fila failed/DLQ e confirmada para
evitar redelivery infinito. Logs contêm apenas tipo do erro e número de retry,
sem payload ou dados pessoais.

Não foram adicionados publishers diretos aos serviços de domínio. Solicitações
de lembretes de hidratação, eventos de treino e compromissos de agenda
continuam dependentes de contratos de domínio e outbox. Sem replica set no
MongoDB principal, não é afirmada consistência transacional entre write model e
publicação RabbitMQ.

### Validação da Fase 5.4

Os testes unitários/schema e Gateway em
`backend/services/notification-service/tests/notification.test.cjs` tiveram
**3/3 aprovados**. A integração Mongo isolada em
`notification.integration.test.cjs` teve **4/4 aprovados**, comprovando
persistência, preferências, isolamento, JWT, marcação de leitura,
idempotência e índices.

O teste RabbitMQ isolado teve **1/1 aprovado**: evento válido consumido,
duplicação sem segunda notificação, mensagem inválida com três retries e
encaminhamento para a fila failed/DLQ. Foi usado um contentor temporário sem
volume nem portas públicas e uma base sintética Mongo; o RabbitMQ principal e
os serviços principais não foram utilizados.

Email, push, agendamento automático de lembretes, publishers de domínio,
outbox transacional e integração com providers externos permanecem pendentes.
O próximo passo recomendado é a Fase 5.5 — outbox e publishers de domínio,
após autorização e suporte de replica set para as garantias de consistência.

## 14. Fase 5.5 implementada - Transactional Outbox

### Eventos, produtores e consumidor

Foram implementados contratos `v1` para:

- `training.session.completed.v1`, produzido pelo Training Service.
- `hydration.daily_goal.reached.v1`, produzido pelo Hydration Service.

Ambos os produtores guardam o evento na coleção outbox da própria base, na
mesma transação MongoDB que a alteração de domínio. O Notification Service é
o consumidor e mantém a deduplicação persistente por `eventId`. A entrega é
at-least-once; não é prometido exactly-once.

### Coleções e workers

- `training_outbox`: eventos do Training Service.
- `hydration_outbox`: eventos do Hydration Service.

As coleções têm índices para estado, datas de retry, reservas e identificador
do evento. Os workers reservam eventos, publicam num exchange RabbitMQ com
publisher confirms, aplicam backoff limitado e recuperam reservas expiradas.
Eventos publicados ou falhados não são eliminados.

O payload publicado usa `contractVersion`, `type`, `source`, `recipientUserId`,
`occurredAt` UTC e payload mínimo. Não inclui passwords, tokens ou dados
clínicos.

### Feature flag e limitações

`OUTBOX_ENABLED=true` exige que o MongoDB anuncie `setName` (replica set).
Quando a flag está desativada, Training e Hydration mantêm as operações
autónomas existentes sem afirmar que eventos foram publicados. O MongoDB
principal standalone não foi alterado nem ativado para transações.

O outbox partilhado entre serviços, outbox transacional no ambiente principal,
publicações de Agenda/Professional, email, push e agendamento automático
continuam fora desta fase.

### Validação da Fase 5.5

No replica set MongoDB temporário e sem volumes foram aprovados:

- Training outbox: **3/3**, incluindo commit atómico, rollback conjunto e
  rejeição explícita de MongoDB standalone.
- Hydration outbox: **2/2**, incluindo commit atómico e não duplicação do
  evento diário.
- Notification RabbitMQ: **1/1**, incluindo ACK após persistência,
  idempotência, retries e fila failed/DLQ.
- Integração Training -> RabbitMQ -> Notification e Hydration -> RabbitMQ ->
  Notification: **1/1**, com dois eventos publicados e persistidos.

Durante a validação foi corrigida a incompatibilidade entre o campo produzido
`eventVersion` e o contrato do consumidor, que exige `contractVersion`. O
RabbitMQ principal e o MongoDB principal não foram utilizados.

## 15. Fase 5.6 implementada — Agenda Profissional local isolada

Contrato completo: [API da Agenda Profissional](api/professional-agenda.md).
Fonte de requisitos: [arquitetura profissional](architecture/professional-agenda.md).

- Regras recorrentes por capacidade/fuso IANA, buffers, bloqueios globais à
  pessoa, disponibilidade extra e substituições por regra/dia local.
- Pedidos initial_session/one_off_session sem relação e follow_up com relação
  accepted exata; confirmação manual, recusa, cancelamento, conclusão após fim,
  expiração e reagendamento que preserva a original até à aceitação da nova.
- Documento de calendário comum a todas as capacidades e transações reais
  envolvendo reserva, histórico, auditoria, idempotência e outbox. Conflitos
  de escrita e commit desconhecido têm retries limitados.
- JWT validado no Auth e contrato interno autenticado de curta validade,
  com audiência, hash do pedido e nonce persistente contra replay. O adaptador
  normal rejeita decisões positivas sintéticas; o Professional continua a
  negar elegibilidade real até existirem os respetivos contratos e provas.
- Rotas no namespace /agenda já encaminhado pelo Gateway; sem ampliar o
  Compose existente ou tocar nos serviços principais. Agenda Pessoal mantém
  contratos e sobreposições próprias não bloqueantes.
- Outbox com publisher confirms, leases, backoff e limite de tentativas num
  exchange de domínio próprio. Notification não consome ainda estes eventos;
  não foram implementados email, SMS, push ou links de reunião.

`AGENDA_PROFESSIONAL_ENABLED=false` e
`PROFESSIONAL_AGENDA_CONTRACT_ENABLED=false` são os defaults. Ativação Agenda
exige modo local isolado, base própria e replica set confirmado antes de criar
os novos modelos. Standalone é recusado quando ativo. Nenhuma migração,
alteração de volumes persistentes, backups, chaves ou MongoDB principal foi
executada; não se atribuem papéis nem se promovem profissionais por fixtures.

As suites unitárias e HTTP/transacionais exercitam dados fictícios em bases
novas de um replica set isolado autorizado, com Auth/Gateway reais e uma
dependência de elegibilidade simulada exclusivamente no processo de teste.
Cobrem concorrência entre capacidades da mesma pessoa, reservas simultâneas,
buffers, expiração durante validação, reagendamentos concorrentes, aceitação
versus cancelamento, rollback multi-coleção, privacidade e outbox RabbitMQ.
Os resultados finais e limites da validação constam do contrato de API.

Validação concluída: 377 testes dos serviços e 14 da demonstração anterior
aprovados (391 distintos, sem falhas ou testes ignorados). Os 42 testes
focados de Agenda integram os 377. A regressão antiga usou um terceiro
MongoDB standalone autorizado e isolado, sem alterar os testes; esse
contentor, a rede exclusiva e as fixtures temporárias foram removidos.
Os 14 serviços principais permaneceram saudáveis e preservados.

**Ainda bloqueado:** atendimento real, verificação/validade profissional,
provisionamento seguro, partilha sensível, operação produtiva de credenciais
e infraestrutura transacional, cancelamentos excepcionais, consumidores dos
eventos, localização presencial/links online e notificações externas. Não há
pagamentos ou consentimentos específicos de IA nesta fase.

## 16. Fase 5.7 implementada — Coach IA local isolado

Contrato executado: [API do Coach IA](api/ai-coach.md).
Ownership e decisões aprovadas: [arquitetura](architecture/ai-coach.md).

- Conversas, mensagens, histórico paginado, recomendações com proveniência,
  propostas imutáveis, confirmação/rejeição, expiração e histórico de ações.
- Autorização explícita de categorias e ferramentas por conversa, sem criar
  ConsentRecord/AccessGrant de produção. Contexto mínimo construído pelas APIs
  reais de User, Training, Hydration, Performance e Agenda; Professional não
  é contexto autorizado por inferência do contrato interno da Fase 5.6.
- Persistência própria, payloads AES-256-GCM com AAD, retenção de sete dias,
  propostas de dez minutos, eliminação física pelo titular e auditoria mínima
  sem conteúdo por trinta dias. TTL e purga síncrona própria; sem jobs de IA
  em fundo. O monitor TTL tem atraso físico possível, documentado na API.
- JWT e audiência comum `goleve-api` verificados no Auth e nos destinos.
  Bearer transitório apenas em pedidos síncronos confirmados; sem segredo JWT
  no Coach ou token em fornecedor, DB, logs, filas ou histórico.
- Quatro ferramentas reais validadas por HTTP: alterar objetivo existente de
  hidratação, criar plano autónomo de treino, objetivo de atividade no User e
  atividade pessoal na Agenda, preservando o aviso de sobreposição.
- Claims/recibos/auditoria locais transacionais, idempotência, isolamento e
  concorrência; resultado incerto bloqueia novas tentativas de escrita.
  Reconciliação só consulta um recurso próprio e não prova causalidade.
- Fornecedor `none` ou adaptador HTTPS `http-json-v1`, sem assumir vendor
  configurado. Mock/relógio injetados apenas em testes; nenhum LLM externo
  foi chamado. O Gateway tem proxy `/ai-coach` e o percurso autónomo mantém
  independência da IA.

**Validação:** 42 testes do Coach + 377 de regressão dos serviços + 14 antigos
da demonstração = **433 distintos aprovados**, sem falhas/ignorados. Todos os
workspaces TypeScript compilaram. Replica set, standalone e RabbitMQ foram
criados exclusivamente para os testes autorizados, com tmpfs, rede própria e
portas loopback. O ambiente principal não foi reiniciado ou modificado.
Os três recursos e a rede temporários, fixtures e ficheiros auxiliares desta
execução foram removidos. Nenhum volume foi eliminado. Os 31 contentores
preexistentes foram preservados e os 14 serviços principais estão saudáveis.

`AI_COACH_ENABLED=false` por defeito; produção é recusada quando ativo. Faltam
políticas e fornecedores para dados reais, identidade técnica/grants,
delegação com scopes por destino, recibos/idempotência nos proprietários,
KMS/rotação/TLS/ACLs, direitos/expurgo operacional e avaliação do modelo.
Não houve migração, backup real, alteração de chaves ou volumes principais,
commit ou push. Limites completos e ficheiros desta etapa constam da API.

## 17. Fase 5.8.2 implementada — Payment + Agenda + Professional em demonstração

Contrato: [integração de pagamentos e reservas](api/payment-agenda-integration.md).

- Cotação autenticada no Professional, vinculada ao titular e válida por
  15 minutos; serviço, capacidade, duração e elegibilidade revalidados.
- Adaptador de elegibilidade sintética exclusivo da demonstração aprovada,
  com provas autenticadas e frescas. O adaptador normal continua a exigir
  autoridade real. Não há aprovação automática nem atribuição de papéis.
- Reserva aceite e titularidade verificadas na Agenda; associação explícita
  de serviço para reservas anteriores, sem migração ou inferência financeira.
- Claim de cobrança serializado pelo calendário profissional, ledger e
  histórico transacionais; CAS e unicidade por cadeia no Payment antes do
  MockBankProvider. Sem cobrança para serviços gratuitos.
- Idempotência, recusa e nova tentativa controlada, bloqueio de resultados
  incertos e reconciliação apenas com recibo conclusivo já persistido.
- Cancelamentos preservam histórico e sinalizam reembolso simulado pendente;
  reagendamentos equivalentes conservam a cobrança, diferenças bloqueiam
  para reconciliação. Não há reembolsos reais.
- JWT interno por par, audiência, validade curta, hash do pedido, proteção de
  replay e prova da resposta vinculada ao pedido. Nenhuma rota interna nova
  no Gateway; o proxy Payment existente serve os novos endpoints públicos.

**Validação:** 29 testes direcionados da integração e 3 existentes do Payment
aprovados (32 distintos, zero falhas). Professional, Agenda e Payment
compilaram. Testes com os três serviços reais por HTTP e transações num único
MongoDB replica set temporário em tmpfs; Auth simulado e proxy Payment do
Gateway testado isoladamente. Sem regressão completa ou ponta a ponta global.

`PAYMENT_AGENDA_DEMO_ENABLED=false` por defeito; produção recusada e bases
isoladas identificadas pela instância obrigatórias. Apenas fixtures fictícias
nos testes; sem alteração do ambiente principal, contas ou credenciais reais.
Ficam pendentes operação produtiva, conciliação sem recibo durável, banco e
reembolso reais e integração Notification. Limitações e configuração na API.

## 18. Fase 5.9 implementada — Notificações internas da demonstração

Contratos: [eventos Agenda/Payment](events/agenda-payment-notifications.md).
API e preferências: [Notification Service](api/notification-service.md).

- Eventos de reserva solicitada, aceite, recusada, cancelada, reagendamento
  pedido/aceite e expiração, com destinatários derivados dos documentos.
- Pagamento simulado aprovado, recusado, cancelado, gratuito ou incerto;
  reembolso apenas pendente, emitido transacionalmente pelo ledger Agenda.
- Outbox Agenda preservada; outbox Payment embutida e atómica, limitada a 16
  eventos. Confirmações, leases, retry/backoff, retenção de `dead` e recuperação
  explícita; limpeza apenas de publicados há mais de 24 horas.
- Templates fechados, referências mínimas, deduplicação e preferências;
  `paymentEvents` ativa por defeito sem migrar documentos antigos.
- DLQ confirmada antes do ACK; liveness/readiness preservadas e consumidor
  com tentativa periódica de reconexão. Training/Hydration compatíveis.

Validação: **65 testes distintos aprovados**, zero falhas/ignorados, e build
TypeScript dos três serviços afetados. MongoDB replica set e RabbitMQ
temporários autorizados; bases separadas e dados fictícios. Sem regressão
completa, teste global ponta a ponta ou alteração do ambiente principal.

Flags demo desativadas por defeito e produção bloqueada. Continuam pendentes
envio externo, garantias produtivas de broker/ACL/TLS, operação de DLQ e
reembolsos reais. A integração Notification pendente na Fase 5.8.2 encontra-se
agora implementada apenas neste âmbito local. Sem migrações, commit ou push.

## 19. Fase 5.10 — Management / Gestor V1

Implementação permanente em `feat/management-v1`, sem condição de demonstração
no Management. [Arquitetura](architecture/management-v1.md),
[API](api/management-v1.md) e [OpenAPI 3.1](api/management-v1.openapi.json).

- Auth: convites administrativos para novas identidades Gestor, token com hash,
  prazo de 24 horas, consumo/revogação atómicos e password do convidado.
- Management: perfil persistente, âmbito de serviços canónicos, atribuições
  com prazo/aprovação independente, RBAC + âmbito, revogação efetiva, casos e
  auditoria transacional. Sem grants implícitos pelo papel.
- Proprietários: contratos internos autenticados por destino, autorização
  atual revalidada, DTO mínimo e suspensão de serviço com versão/motivo.
  Sem consulta direta às bases alheias ou cancelamento/reembolso automático.
- Indicadores reais dos registos persistidos por dia UTC, até 31 dias,
  supressão/intervalos conservadores e falhas explícitas, não zeros inventados.
  Fontes sintéticas permanecem identificadas como tal.

**Dependências:** provisionamento inicial e reforço administrativo na Fase
5.11; autoridade real de elegibilidade no Professional. A reativação normal
fica negada até existir essa autoridade; só o ramo de teste isolado usa prova
simulada de autoridade real. Payment mantém o seu bloqueio em produção.
Não se declara a V1 pronta para produção ou a reativação real concluída.

Testes direcionados e resultados concretos constam da API. Não houve
alteração da infraestrutura principal, migração, commit, push ou merge.

## 20. Fase 5.11 — Administração da plataforma V1

Implementação permanente na branch `feat/administration-v1`.
[Arquitetura/matriz](architecture/administration-v1.md),
[transição Auth](architecture/administration-v1-transition.md),
[instalação e recuperação](architecture/administration-v1-installation.md),
[API](api/administration-v1.md), [OpenAPI](api/administration-v1.openapi.json)
e [validação](api/administration-v1-validation.md).

- Bootstrap por CLI, transacional, explícito e irreutilizável; cerimónia única
  de segundo Administrador; quórum só após MFA real de ambos. Não executado
  sobre contas ou bases reais.
- TOTP cifrado, códigos de recuperação com hash/consumo único, sessões
  persistidas e revogáveis, step-up de cinco minutos vinculado à operação.
  JWT anteriores sem sessão deixam de funcionar numa implantação futura.
- Consulta administrativa mínima de identidades e histórico; suspensão,
  reativação, revogação global e mudanças de papel com decisão independente,
  controlo de versão e proteção transacional do último Administrador ativo.
- Convites Gestor e âmbitos existentes reforçados; recusa/histórico de
  atribuições e consulta dos estados atuais dos Gestores. Revogação de conta
  também invalida épocas de atribuição, sem restaurar acessos antigos.
- Supervisão profissional mínima e suspensão auditada no proprietário;
  catálogos/elegibilidade respeitam suspensão. Sem aprovação real, reativação
  administrativa, cancelamento de reservas ou reembolso automático.
- Contratos internos existentes por destino, nova confirmação de autorização
  atual no Auth e gateway público sem rotas internas. Coach IA não alterado.

Testes direcionados com contas fictícias e bases separadas num replica set
temporário autorizado. Resultados, comandos e limites estão no relatório de
validação. Sem regressão global, alteração dos 14 componentes principais,
migrações, provisionamento real, commit, push ou merge.

Dependências V1: implantação controlada de replica set/chaves/contratos, revisão
de segurança integrada, autoridade profissional real, política operacional de
recuperação completa e rotação de fatores/chaves. Não se declara prontidão para
produção nem se ativa qualquer funcionalidade sintética nesse ambiente.

## 21. Fase 5.12 — Integração de desenvolvimento

[Arquitetura](architecture/backend-integration-v1.md),
[arranque/frontend](api/backend-integration-v1.md),
[OpenAPI](api/backend-integration-v1.openapi.json) e
[validação](api/backend-integration-v1-validation.md).

Stack paralela com 14 componentes, replica set autenticado, identidades Mongo
por base, volumes/segredos próprios, contratos Management/Agenda configurados,
outboxes Training/Hydration/Payment e consumidor Notification. Gateway com CORS
explícito, readiness agregada, limite geral e proteção da fronteira pública.
Sem alteração do Compose ou dos recursos principais.

Decisão aprovada: não alterar validadores restritos a loopback. Payment+Agenda
em Docker e Coach ativo permanecem bloqueados/documentados. A Agenda Profissional
normal não aceita elegibilidade sintética. Não existem Administradores nem
profissionais aprovados automaticamente na base de desenvolvimento.

Validar HTTP, isolamento Mongo, eventos/DLQ, sessões/MFA e recuperação apenas
nos recursos novos. Testes administrativos usam base/credencial separadas.
Sem pagamentos reais, migrações, backups, commit, push ou merge. Preparação de
produção continua dependente de revisão de segurança e validação de implantação.

## 22. Fase 5.13 — Validação E2E e encerramento técnico

[Relatório consolidado](api/backend-e2e-v1-closeout.md),
[histórico completo](api/backend-e2e-v1-validation.md) e
[reconciliação operacional de pagamentos](operations/payment-reconciliation.md).

A regressão global final, com validadores inalterados e sem reinícios, registou
**80 casos aprovados, zero falhas e 12 bloqueados**. Dez são bloqueios históricos
de autoridade/elegibilidade, configuração financeira, identidades/âmbitos e
inventário; os outros dois são testes disruptivos sem autorização nesta etapa.
O relatório identifica individualmente a condição segura para desbloquear cada caso.

A falha de concorrência do Payment autónomo foi corrigida na etapa anterior,
testada com persistência e instalada exclusivamente no Payment paralelo por
autorização: claim durável anterior ao banco, replay, resultado incerto sem
retry de cobrança e outbox coerente. Dez verificações HTTP/componentes na imagem
passaram; a regressão global voltou a confirmar uma chamada ao banco na sonda.
O histórico inicial 81/1/10 e os incidentes intermédios foram preservados.

Nesta etapa de encerramento foram alterados apenas documentos e metadados locais
de evidência. O baseline operacional reconciliou seis paragens antigas já
autorizadas, mantendo arquivo original com hashes e as cinco ausências externas.
Nenhum controlo do validador foi alterado, nem houve provisionamento real ou
alteração de infraestrutura. Os 14 principais e 14 paralelos continuam saudáveis.

**Pendente:** reconciliação financeira efetiva/fornecedor real, autoridade de
verificação profissional, fluxo privilegiado integrado, configuração financeira
isolada compatível, convergência de medições/preferências e validação operacional
de recuperação/artefactos. Coach permanece desativado. Não se declara prontidão
para produção. Sem migrações, commit, push ou merge.

## 23. Fase 5.14 — Consolidação e entrega de desenvolvimento

[Entrega](release-v1/README.md), [instalação independente](release-v1/local-setup.md),
[contrato central de API](api/backend-release-v1.md),
[frontend web/Android/iPhone](release-v1/frontend.md),
[prontidão](release-v1/readiness.md) e [validação](release-v1/validation.md).

Branch `feat/backend-release-v1`, baseada em `000cc43`. Referência dos onze serviços
através do Gateway, inventário de rotas verificável e OpenAPI central que reutiliza
os contratos administrativos. DTOs ainda genéricos estão explicitamente limitados;
não se declara um SDK estrito completo. Scripts offline verificam drift/referências,
sem carregar serviços ou iniciar infraestrutura.

Instalação nova gera instância, bases, volumes e segredos próprios. O guia distingue
o Compose paralelo do principal legado e documenta a dependência histórica da CLI
em 14 componentes principais, sem a contornar nos validadores ou alterar segurança.
Ainda não se executou uma instalação limpa noutra máquina. Não se criam fixtures
privilegiadas, Administradores, aprovações ou dados reais.

Os **12 bloqueios da Fase 5.13 permanecem abertos**. O último E2E 80/0/12 é evidência
histórica, não uma regressão nova nesta fase. A Agenda Pessoal real usa os tipos
`personal/workout`; as diferenças face aos requisitos históricos foram assinaladas.
Há orientações de sessão, MFA/step-up, concorrência, erros, notificações, unidades
e estrutura futura dos frontends, sem implementar interfaces.

Validação apenas documental/estática e sondas não disruptivas. Sem alterações de
código de negócio, configurações executáveis, MongoDB/RabbitMQ, contentores, volumes
ou segredos; sem migrações, provisionamento, commit, push ou merge. Produção continua
dependente de revisão de segurança e dos percursos/autoridades/contratos pendentes.
