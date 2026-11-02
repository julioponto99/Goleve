# Fase 5.9 — Eventos de reservas e pagamentos simulados

Apenas desenvolvimento/testes locais, dados fictícios e bases isoladas.
Não há email, SMS, push externo, pagamentos ou reembolsos reais.

## Contratos e destinatários

Todos têm `contractVersion: 1`. O produtor resolve os destinatários nos
documentos persistidos; operações públicas não recebem destinatários de
notificações.

| Tipo | Produtor | Destinatário |
|---|---|---|
| `agenda.professional.requested.v1` | Agenda | Profissional |
| `agenda.professional.accepted.v1` | Agenda | Cliente |
| `agenda.professional.declined.v1` | Agenda | Cliente |
| `agenda.professional.cancelled.v1` | Agenda | Outro participante; ambos se cancelamento de sistema |
| `agenda.professional.reschedule-requested.v1` | Agenda | Profissional; original mantém-se |
| `agenda.professional.rescheduled.v1` | Agenda | Ambos os participantes da original |
| `agenda.professional.expired.v1` | Agenda | Cliente |
| `payment.simulated.approved.v1` | Payment | Titular |
| `payment.simulated.declined.v1` | Payment | Titular |
| `payment.simulated.cancelled.v1` | Payment | Titular |
| `payment.simulated.unknown.v1` | Payment | Titular; resultado não confirmado |
| `payment.simulated.free.v1` | Payment | Titular; sem cobrança |
| `agenda.billing.refund-pending.v1` | Agenda | Titular; apenas reembolso simulado pendente |

Envelope: `eventId`, `contractVersion`, `type`, `source`, `recipientUserId`,
`occurredAt`, `payload`. A origem deve corresponder ao tipo. Payload fechado:

- `appointmentId` obrigatório nos eventos Agenda.
- `paymentId` obrigatório nos eventos Payment e reembolso pendente.
- `relatedAppointmentId` opcional no reagendamento.
- `version` inteiro positivo e `simulated: true` obrigatórios.
- `operationId` apenas no reembolso: `refund:<raiz-da-reserva>:<tentativa>`.

Sem preços, cotações, recibos bancários, nomes, contactos, texto livre, JWT ou
credenciais. Notification gera títulos e mensagens com templates fechados.
Mensagens financeiras identificam a simulação; resultado incerto não declara
aprovação e reembolso pendente nunca declara conclusão.

## Outbox e garantias

**Agenda:** estado, histórico, versão e snapshot mínimo das notificações são
gravados na mesma transação do calendário. Rollback não deixa eventos
publicáveis. O evento de domínio continua em `goleve.agenda.events`, com o
envelope anterior. O publicador entrega também os snapshots a
`goleve.notifications`, routing key `event`; só marca publicado depois das
confirmações de todas as entregas. Falha parcial permite reentrega. Registos
anteriores sem snapshots continuam apenas como eventos de domínio; não há
backfill ou migração.

Pedido de novo horário tem template próprio. Aceitação gera uma notificação
de aceitação ao cliente e outra de substituição da original aos participantes:
são factos distintos. Recusa/expiração do novo pedido não cancelam a original.

**Payment:** `payments` e `appointment_payments` ganham `notificationOutbox`
e `notificationVersion`. Estado, histórico e evento são escritos numa única
atualização com precondições atómicas. Não usa sessões ou transações
distribuídas, mantendo compatibilidade com standalone. Payment continua dono
dos resultados financeiros; Agenda apenas sinaliza reembolso pendente.

O array tem limite de **16 eventos**. Exige-se margem antes de nova chamada
bancária. Eventos pendentes, em processamento ou esgotados nunca são limpos.
Apenas eventos confirmados como publicados há mais de **24 horas** podem ser
removidos pelo worker ou por uma transição. Histórico financeiro e contador
de versão são preservados; não há crescimento ilimitado deste array.

Os dois publicadores usam lease atómico de **30 segundos**, publisher confirms,
`mandatory`, mensagens persistentes, **8 tentativas** e backoff exponencial
limitado a cinco minutos. Reinícios recuperam leases expirados. Esgotados
ficam `dead`, sem eliminação. Recuperação explícita nos módulos outbox:

- `recoverPaymentEvent(Model, paymentId, eventId)`.
- `recoverProfessionalEvent(models, eventId)`.

Só funcionam no âmbito local/base isolada e para eventos `dead`. Preservam
ID/payload e reiniciam apenas publicação, nunca cobrança. São funções de
manutenção autorizada, sem endpoint público; corrigir a causa antes de usar.

## Consumo e falhas

Notification valida estrutura, versão, origem e tipo. Índice único `eventId`
impede duplicados concorrentes. Supressões por preferências ficam em
`notification_processed_events`, impedindo reaparecimento por reentrega após
ativação posterior.

No reembolso, chave semântica inclui destinatário, tipo, operação e versão.
Outro ID com a mesma operação/versão é deduplicado; uma versão posterior não
é suprimida. Atualizar a cópia consultiva no Payment não gera novo reembolso.

ACK só após persistência, supressão ou deduplicação. Falhas usam o retry
existente, até três reentregas; DLQ exige confirmação de publicação e
roteamento antes do ACK original. Falha da DLQ mantém a original sem ACK e
readiness indisponível. O servidor tenta restabelecer o consumidor a cada
cinco segundos quando indisponível. `/health` mantém o processo HTTP vivo;
`/ready` exige MongoDB e consumidor prontos.

Filas clássicas, TTL e DLX existentes foram preservados. Confirmações não
oferecem garantias produtivas de quorum durante falhas do próprio broker.
HA/quorum, TLS, ACLs por produtor e operação de DLQ ficam pendentes.

## Configuração explícita

- Agenda: flags da fase anterior e replica set; ativar
  `AGENDA_PROFESSIONAL_PUBLISH_EVENTS=true` e fornecer
  `AGENDA_PROFESSIONAL_RABBITMQ_URL` dedicado. Worker funciona também com o
  adaptador Payment demo aprovado.
- Payment: modo local `PAYMENT_DEMO_ENABLED=true`; manter as configurações
  da Fase 5.8.2 para reservas. `PAYMENT_NOTIFICATION_EVENTS_ENABLED=false`
  por defeito; ativação exige base isolada e
  `PAYMENT_NOTIFICATION_RABBITMQ_URL` próprio. Worker a cada cinco segundos.
- Notification: `NOTIFICATION_DEMO_EVENTS_ENABLED=false` por defeito;
  ativação exige `NODE_ENV=development|test` e base
  `goleve_notification59_<identificador-hex>_notification`. Produção recusada
  mesmo com flag ativa. MongoDB e RabbitMQ próprios da demonstração.

Não usar segredos principais. Cada serviço mantém base distinta. Eventos
demo são recusados pelo consumidor quando a flag está desativada, preservando
os contratos anteriores de Training/Hydration. Não há aprovação profissional,
papéis novos ou alteração de elegibilidade nesta fase.

## Validação direcionada

**65 testes distintos aprovados, zero falhas/ignorados:** 31 de integração
nova; 29 unitários/compatibilidade de contratos, DLQ, readiness, Payment e
Agenda Profissional; 4 da API Notification e 1 do consumidor RabbitMQ anterior.
Os três serviços compilaram em TypeScript. Sem regressão completa ou teste
global ponta a ponta.

MongoDB replica set e RabbitMQ reais, temporários, em tmpfs, rede própria e
portas loopback; bases separadas e apenas fixtures fictícias. Elegibilidade,
banco e Auth foram simulados nos testes que precisavam desses contratos.
Os testes novos estão em `backend/services/notification-service/tests/`:
`domain-events.test.cjs` e `domain-events.integration.test.cjs`.
O segundo exige `NOTIFICATION59_MONGO_URI` (replica set `notify59`, loopback)
e `NOTIFICATION59_RABBITMQ_URL` do broker isolado.

Cobertura: estados persistidos e rollback, destinatários, cancelamento,
reagendamento, expiração, reembolso pendente, confirmação/recusa/resultado
incerto do Payment, atualização estado+evento atómica, cap/limpeza, NACK,
mandatory return, backoff, concorrência dos dois publicadores, leases após
reinício, recuperação de `dead`, deduplicação/reentrega, preferências,
isolamento por utilizador, retry/DLQ, produção bloqueada e Training/Hydration.

## Ficheiros e limpeza

Em `backend/services/agenda-service/`: `src/payment-demo/billing.ts`,
`src/professional/models.ts`, `outbox.ts`, `service.ts`, novo
`notification-events.ts` e `src/server.ts`.

Em `backend/services/payment-service/`: `package.json`,
`src/models/payment.model.ts`, `src/payment-demo/models.ts`, `service.ts`,
`src/services/payment.service.ts`, `src/server.ts` e novo `src/events/outbox.ts`.

Em `backend/services/notification-service/`: `src/contracts/events.ts`, novo
`demo-events.ts`, novo `src/config/demo.ts`, `src/messaging/rabbitmq.ts`,
`src/models/notification.model.ts`, `preference.model.ts`, `src/server.ts`,
`src/services/notification.service.ts` e os dois novos ficheiros de teste.

Também `backend/package-lock.json` e quatro documentos: este contrato,
`documentation/events/README.md`, `documentation/api/notification-service.md`
e `documentation/backend-completion-plan.md`. Total: **28 ficheiros**.
Payment declara `amqplib` e os seus tipos nas versões já usadas/instaladas;
apenas os manifests/lock foram sincronizados, sem atualização de bibliotecas.

Os dois contentores, rede e ficheiros auxiliares desta execução foram
removidos após verificar identidade e isolamento. Nenhum volume foi eliminado.
Os 31 contentores preexistentes conservaram estado, health, mounts e redes;
os 14 componentes principais permaneceram saudáveis. Sem migrações, backups,
commit, push ou merge. Coach IA e os restantes serviços não foram alterados.

## Valida??o na integra??o V1 ? Fase 5.12

A [stack paralela](../architecture/backend-integration-v1.md) preserva estes contratos.
Training/Hydration e o pagamento MockBank independente foram exercitados por HTTP,
com outboxes reais, confirma??es RabbitMQ, persist?ncia/deduplica??o, retry/DLQ
e recupera??o ap?s indisponibilidade do broker. O broker principal n?o foi alterado.

Payment+Agenda permanece desativado devido aos validadores de loopback preservados
por decis?o do utilizador; eventos de reservas/reembolsos n?o foram emitidos por
um fluxo profissional positivo nesta stack. N?o se criaram profissionais aprovados
na base de desenvolvimento. Nenhum pagamento ou reembolso real foi executado.
