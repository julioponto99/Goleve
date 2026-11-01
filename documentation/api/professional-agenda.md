# Fase 5.6 — Agenda Profissional

**Âmbito:** implementação local e dados fictícios. Desligada por defeito; não foi ativada, migrada ou instalada no MongoDB/Compose principal. Não concede elegibilidade real, acesso clínico, contratação ou pagamentos. A Agenda Pessoal preserva os contratos existentes.

## Decisões aprovadas e atomicidade

Transações MongoDB num replica set escrevem primeiro um documento de calendário por identidade profissional, comum a PT, nutrição e todas as capacidades da pessoa. A disputa dessa escrita serializa efetivamente as operações; uma consulta seguida de insert sem essa proteção não seria suficiente.

Reserva, calendário, histórico, auditoria, comando idempotente e outbox da alteração de reserva são persistidos na mesma transação. Conflitos transitórios têm até 5 tentativas. Um resultado de commit desconhecido repete apenas o commit até 3 vezes; nunca repete cegamente o efeito. Depois devolve 503 para releitura/repetição idempotente. Não há fallback para escritas sem transação.

No reagendamento, a original aceite permanece ocupada e o novo intervalo fica temporariamente reservado. Aceitação manual confirma a nova e cancela a original na mesma transação, com os dois históricos/outbox. Recusa, retirada ou expiração da nova preservam a original sem alteração. Apenas um reagendamento válido pendente por original. Cancelar a original cancela/expira os pedidos de substituição pendentes atomicamente.

Reagendamento preserva participantes, profissional, capacidade, tipo e relação; pedido e aceitação respeitam 24 horas antes do início original. O prazo é:

~~~text
min(createdAt + 24h, startAtUtc - 1h, original.startAtUtc - 24h quando reagendado)
~~~

Prazo já vencido impede criação. Requested vencido deixa imediatamente de ocupar disponibilidade, mesmo sem limpeza. Consulta/listagem e worker materializam expired sem apagar o histórico. No runtime normal, os predicados das escritas verificam também o relógio MongoDB $$NOW.

## Modelos

Todos pertencem à base Agenda, sem acesso direto às bases de outros serviços.

| Modelo / coleção | Responsabilidade |
| --- | --- |
| ProfessionalAvailabilityRule / agenda_professional_availability_rules | Dia/horas locais, fuso, capacidade, modos/ambientes, duração, buffers, validade, ativo/versão |
| ProfessionalAvailabilityException / agenda_professional_availability_exceptions | Bloqueio, disponibilidade extra e substituição de regra por dia local; remoção lógica |
| ProfessionalAppointment / agenda_professional_appointments | IDs dos participantes, tipo, UTC, ocupação com buffers, prazo, estado e ligações de reagendamento |
| ProfessionalCalendar / agenda_professional_calendars | Documento de serialização por professionalAuthUserId, comum a todas as capacidades |
| ProfessionalHistory / agenda_professional_history | Evento imutável por reserva/versão, tipo de ator e motivo estruturado |
| ProfessionalAudit / agenda_professional_audit | Metadados das alterações, sem corpos, contactos ou tokens |
| ProfessionalCommand / agenda_professional_commands | Hash da chave idempotente, impressão do comando, ator e recurso |
| ProfessionalOutbox / agenda_professional_outbox | Evento, tentativas, lease, próxima tentativa, confirmação/falha terminal |

Não há TTL de eliminação, syncIndexes, migração, remoção de reservas ou duplicação de perfil. Os novos modelos/índices só são inicializados no arranque explicitamente ativo e depois de confirmar replica set.

## Tipos, estados e autorização

- initial_session e one_off_session não recebem relationshipId, não criam uma relação e exigem capacidade elegível.
- follow_up exige relação accepted com os participantes e a capacidade exatos na criação e aceitação.
- online não aceita ambiente; in_person exige gym/home/outdoor e modo autorizado na capacidade. Se só existir home_visit, o contexto presencial limita-se a casa.
- requested transita para accepted, declined, cancelled ou expired; accepted para cancelled ou completed. Sem PATCH livre de estado ou reabertura.
- A confirmação é manual pelo profissional destinatário, com papel atual confirmado pelo Auth e elegibilidade revalidada. Recusa exige profissional elegível; uma relação de follow-up entretanto terminada não impede a recusa.
- O titular pode retirar pedido válido; reserva aceite exige pelo menos 24 horas de antecedência. O profissional participante cancela com motivo estruturado, mesmo para encerrar compromisso após perda de elegibilidade. Não há penalização financeira nem bypass administrativo.
- Conclusão só pelo profissional com papel atual e depois do fim de uma reserva aceite.
- Motivos profissionais: professional_unavailable, client_request, scheduling_change e eligibility_lost.

Todos os endpoints privados exigem Bearer JWT confirmado no Auth, inclusive acesso direto ao Agenda. IDs de titular/papel livres são recusados. O administrador não tem exceção para reservas de terceiros. Relação ou reserva aceite não concede acesso a peso, medições, hábitos, objetivos ou saúde.

## Endpoints e Gateway

O proxy /agenda existente foi reutilizado e exercitado por HTTP nos testes; o Gateway não autoriza o domínio nem expõe o contrato interno.

| Método | Endpoint | Finalidade |
| --- | --- | --- |
| POST / GET | /agenda/professional/availability-rules | Criar/listar regras próprias |
| PATCH / DELETE | /agenda/professional/availability-rules/:id | Alterar/desativar regra |
| POST / GET | /agenda/professional/availability-exceptions | Criar/listar exceções próprias |
| DELETE | /agenda/professional/availability-exceptions/:id | Desativar exceção |
| GET | /agenda/professionals/:professionalId/availability | Consultar janelas livres de capacidade elegível |
| POST / GET | /agenda/professional-appointments | Pedir/listar reservas do titular |
| GET | /agenda/professional-appointments/:id | Detalhe mínimo de participante |
| GET | /agenda/professional-appointments/:id/history | Histórico sem IDs Auth de atores |
| POST | /agenda/professional-appointments/:id/cancel | Retirar/cancelar pelo titular |
| POST | /agenda/professional-appointments/:id/reschedule | Pedir substituição de reserva aceite |
| GET | /agenda/professional/appointments | Consultar reservas recebidas |
| POST | /agenda/professional/appointments/:id/accept | Confirmar manualmente |
| POST | /agenda/professional/appointments/:id/decline | Recusar |
| POST | /agenda/professional/appointments/:id/cancel | Cancelar com motivo |
| POST | /agenda/professional/appointments/:id/complete | Concluir após o fim |

Escritas exigem Idempotency-Key de 8–128 caracteres seguros. Alterações, transições e desativações exigem If-Match no formato "<id>:<version>". Respostas individuais devolvem ETag. Accept/complete/cancel do titular recebem {}; decline/cancel profissional recebem apenas reasonCode. Reagendamento recebe o contrato de uma reserva nova, preservando os vínculos da original.

Criação devolve 201; repetição idêntica, 200 e Idempotency-Replayed. Reutilização de chave para outro comando: 409. Sem precondição: 428; versão antiga: 412; dados inválidos: 400; conflito/prazo/transição: 409/422; dependências ou feature indisponíveis: 503. DTOs não incluem perfis, contactos, segredos ou IDs Auth dos participantes.

Listagens: limit 1–100 e before por ID descendente. Reservas admitem status, capabilityId e from/to por interseção. Disponibilidade exige capabilityId/from/to, aceita mode/environment e limita o intervalo a 31 dias. Retorna janelas onde cabem duração e buffers, sem IDs das reservas ocupantes. Até 500 janelas, com truncated para indicar necessidade de reduzir o intervalo. A criação repete sempre a validação transacional.

## Disponibilidade, exceções e fusos

Regras exigem capabilityId, weekday 0–6, localStartTime/localEndTime HH:mm, timezone IANA, validFrom/validUntil YYYY-MM-DD, sessionModes e slotDurationMinutes. Ambientes são necessários para modo presencial. Durações: 30/45/60/90 minutos. Buffers opcionais inteiros de 0–120 minutos; validade máxima técnica de 366 dias e até 200 regras ativas por pessoa. Sem recorrência ilimitada ou regra que atravesse a meia-noite nesta versão.

Horas inexistentes são recusadas. Regras que incidam em hora repetida exigem dstDisambiguation=earlier|later. Reservas recebem instantes com offset explícito, normalizados para UTC, e conservam o fuso original. Ambas as mudanças de hora em Europe/Lisbon têm testes.

Bloqueios afetam todas as capacidades da pessoa. Extra_availability define janela UTC e configuração explícita. Replacement referencia replacesRuleId, usa o mesmo fuso e substitui a ocorrência dessa regra num único dia local, com apenas uma substituição ativa por regra/dia. Motivos: unavailable, schedule_adjustment e additional_hours.

Não se altera/bloqueia silenciosamente disponibilidade com reservas vivas afetadas: devolve 409 para resolver antes esses compromissos. Desativação é lógica. Requested válidos, accepted, buffers e bloqueios ocupam intervalos; limites consecutivos exatos não conflituam.

A Agenda Pessoal não bloqueia reservas nem é fonte de disponibilidade profissional. O detalhe indica até 20 IDs de atividades pessoais do próprio chamador que intersetam o compromisso, como aviso não bloqueante. Nunca mostra ao profissional as atividades pessoais do cliente, nem altera horários automaticamente.

## Contrato interno e elegibilidade real

POST /internal/v1/agenda/eligibility aceita apenas capabilityId, professionalId?, subjectAuthUserId? e relationshipId?. Não é encaminhado pelo Gateway.

Autenticação dedicada HMAC-SHA256 fixo, sem partilhar a chave JWT: emissor, audience professional-service:appointments:v1, scope único, método/path, hash do body, nonce persistente e validade de 15 segundos. Assinatura comparada em tempo constante; replay, audience/prazo inválidos ou credencial ausente são recusados. Rotação admite chave atual/anterior. Não se trata de um JWT humano nem de promoção de papel.

A resposta contém IDs mínimos, tipo, modos, decisão, confirmação da relação e prazo. O contrato real continua a devolver eligible=false, canOfferAppointment=false e authority=unavailable: os modelos atuais não comprovam habilitação/validade/papel profissional de terceiros. O adaptador normal recusa authority diferente de real, incluindo decisões sintéticas positivas, e respostas antigas/inválidas/indisponíveis. Não existe cache positiva.

A dependência de elegibilidade positiva só pode ser injetada no createApp com NODE_ENV=test e base goleve_agenda56_test_*. Não há variável para habilitar um adaptador positivo de demonstração no servidor.

## Feature flags e execução

AGENDA_PROFESSIONAL_ENABLED=false por defeito preserva o arranque standalone e as operações pessoais. Ativação exige development/test, AGENDA_PROFESSIONAL_MODE=isolated, base goleve_agenda_professional_local_<id> ou goleve_agenda56_test_<id>, credencial própria e replica set confirmado antes de inicializar os novos modelos.

PROFESSIONAL_AGENDA_CONTRACT_ENABLED=false por defeito; ativação exige também modo isolado e development/test. O contrato lê chaves apenas quando ativo. As cópias do pequeno módulo de autenticação são independentes para preservar os Dockerfiles por workspace, com teste de interoperabilidade.

~~~dotenv
AGENDA_PROFESSIONAL_ENABLED=false
PROFESSIONAL_AGENDA_CONTRACT_ENABLED=false
AGENDA_PROFESSIONAL_MODE=isolated
AGENDA_SERVICE_KEY_ID=
AGENDA_SERVICE_KEY_FILE=
AGENDA_SERVICE_PREVIOUS_KEY_ID=
AGENDA_SERVICE_PREVIOUS_KEY_FILE=
AGENDA_PROFESSIONAL_PUBLISH_EVENTS=false
AGENDA_PROFESSIONAL_RABBITMQ_URL=
~~~

O Agenda lê também PROFESSIONAL_SERVICE_URL, AUTH_SERVICE_URL e o seu MONGO_URI. Não foram alterados .env, Compose, chaves, MongoDB principal, volumes persistentes ou backups. Não foi ampliado o Compose de demonstração; a entrega usa aplicações HTTP reais e dependências fictícias no processo de teste.

## Outbox, workers e limites

Expiração: até 50 pedidos por lote a cada 15 segundos quando ativo; não é pré-requisito de correção. Publisher opcional, com flag e URL RabbitMQ próprias; desligado mantém os eventos pendentes.

Exchange dedicado goleve.agenda.events, topic, com fila durável própria goleve.agenda.professional.events, declarada e ligada antes de publicar. As mensagens persistentes ficam retidas mesmo sem consumidor. Tipos agenda.professional.requested/accepted/declined/expired/cancelled/rescheduled/completed.v1. Envelope v1 com eventId, agregado/versão, data e payload mínimo de ID/versão da reserva. Sem nomes, contactos, dados clínicos ou tokens.

Publisher confirms precedem published e mensagens devolvidas como não encaminhadas ficam para retry, sem confirmação de entrega. Leases de 30 segundos têm ID próprio; um worker antigo não confirma o lease de outro. Backoff limitado e até 8 tentativas; esgotadas ficam dead sem eliminação. Entrega at-least-once; consumidores futuros deduplicam eventId e reconciliam versões. Notification não consome estes eventos novos; não se publicam contratos incompatíveis no seu exchange.

As suites professional.unit.test.cjs e professional.integration.test.cjs cobrem validação, DST, autenticação, rejeição de standalone/sintético, Auth e Gateway reais, modelos, modalidades, regras/exceções, buffers, idempotência, conflitos entre capacidades, transições, expiração/reagendamento concorrentes, rollback e RabbitMQ. A Agenda Pessoal tem regressão própria.

Integração exige AGENDA_TEST_MONGO_URI num replica set local isolado e AGENDA_TEST_RABBITMQ_URL num broker isolado. Cada execução cria novas bases e não elimina dados ou volumes anteriores. Sem URI a suite Mongo é ignorada explicitamente; isso não valida transações.

Bloqueadores restantes: provisionamento seguro e verificação/validade profissional real, política de partilha aplicável, TLS/operação e rotação das credenciais, infraestrutura transacional fora dos testes, cancelamentos excepcionais, localização/links online, consumidores de eventos e notificações. Não foram implementados emails, SMS, push, pagamentos ou consentimentos IA. Não foi feito commit, push ou migração.

## Resultados desta entrega

- Regressão dos serviços: **377 testes aprovados, zero falhas e zero ignorados**, incluindo Auth, User, Professional, Agenda, Training, Hydration, Performance e Notification, com integrações no replica set e broker isolados.
- Após reforçar a retenção/routing do publisher, a suite focada de Agenda foi repetida: **42 aprovados, zero falhas e zero ignorados**. Estes testes já fazem parte do âmbito da regressão; não se somam aos 377.
- TypeScript: todos os workspaces compilaram; Agenda foi novamente compilada após o ajuste final do outbox.
- Os 14 serviços principais continuam saudáveis, com os mesmos IDs, estados e montagens. Os dois contentores legados também foram preservados.
- 222 ficheiros protegidos, `.env` e chave User conservaram os hashes iniciais; não houve migração, reinício principal ou alteração de backups/volumes.
- Regressão da demonstração anterior: **14 testes aprovados, zero falhas e zero ignorados**, sem alterar os testes antigos. A execução validada foi precedida da confirmação de isolamento de um terceiro MongoDB standalone autorizado, com rede exclusiva, tmpfs, sem volumes persistentes e porta apenas em loopback. O contentor, a rede e as fixtures temporárias desta operação foram removidos depois; o replica set e o RabbitMQ dos testes anteriores foram preservados.
- Total: **391 testes distintos aprovados** (377 dos serviços + 14 da demonstração). Os 42 da suite focada de Agenda estão incluídos nos 377. A regressão antiga emitiu apenas o aviso existente `DEP0060` da dependência de proxy, sem falhas.
- Referências locais e `git diff --check` verificados. As credenciais geradas dos recursos de teste estão apenas em artefactos locais ignorados; não constam dos ficheiros da implementação.

## Ficheiros desta etapa

São 25 ficheiros; os restantes serviços, Compose, Dockerfiles, scripts MongoDB, backups e chaves foram preservados.

```text
backend/package-lock.json
backend/services/agenda-service/package.json
backend/services/agenda-service/src/app.ts
backend/services/agenda-service/src/controllers/professional-agenda.controller.ts
backend/services/agenda-service/src/professional/availability.ts
backend/services/agenda-service/src/professional/eligibility.ts
backend/services/agenda-service/src/professional/models.ts
backend/services/agenda-service/src/professional/outbox.ts
backend/services/agenda-service/src/professional/service-auth.ts
backend/services/agenda-service/src/professional/service.ts
backend/services/agenda-service/src/professional/settings.ts
backend/services/agenda-service/src/professional/time.ts
backend/services/agenda-service/src/professional/transaction.ts
backend/services/agenda-service/src/professional/validation.ts
backend/services/agenda-service/src/routes/professional-agenda.routes.ts
backend/services/agenda-service/src/server.ts
backend/services/agenda-service/tests/professional.integration.test.cjs
backend/services/agenda-service/tests/professional.unit.test.cjs
backend/services/professional-service/src/app.ts
backend/services/professional-service/src/config/settings.ts
backend/services/professional-service/src/internal/agenda-service-auth.ts
backend/services/professional-service/src/internal/agenda.routes.ts
documentation/api/professional-agenda.md
documentation/architecture/professional-agenda.md
documentation/backend-completion-plan.md
```
