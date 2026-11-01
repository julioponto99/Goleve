# Fase 4.2 — Agenda profissional

**Estado:** Fase 5.6 implementada no âmbito local isolado, desligada por defeito. Contrato executado, decisões aprovadas e limites em [API da Agenda Profissional](../api/professional-agenda.md). Elegibilidade real continua bloqueada; não foi alterado o ambiente principal.
**Âmbito:** ambiente local e demonstração isolada com dados fictícios.
**Referências:** [utilização autónoma](./autonomous-use.md), [requisitos funcionais](../requirements/autonomous-use.md), [relações](./profile-relationships.md), [API de relações](../api/care-relationships.md) e commit da Fase 4.1 `a872598296eb6a35464290cea59ee1ea8e4aa753`.

Este documento é a fonte de detalhe da Agenda Profissional. A Agenda Pessoal continua a ser um domínio independente e já implementado; não se altera nesta fase.

## 1. Modalidades e invariantes

| Modalidade | Relação | Estado inicial | Regra |
|---|---|---|---|
| `initial_session` | Não exigida | `requested` | Primeira consulta/sessão com profissional elegível |
| `one_off_session` | Não exigida | `requested` | Sessão pontual repetível sem limite geral |
| `follow_up` | `accepted` obrigatória na solicitação e aceitação | `requested` | Acompanhamento continuado |

Todas exigem elegibilidade atual do profissional e da capacidade. Nenhuma:

- cria automaticamente uma `CareRelationship`;
- concede dados de saúde, grants ou permissões;
- implica contratação ou pagamento;
- pode contornar uma relação exigida convertendo `follow_up` em outra modalidade.

`initial_session` e `one_off_session` podem ser online ou presenciais (`gym`, `home`, `outdoor`) se a capacidade o permitir. A Agenda Pessoal pode apresentar um aviso de conflito, mas não é bloqueada nem usada como fonte de disponibilidade profissional.

## 2. Confirmação manual e estados

Estados propostos:

```text
requested -> accepted
requested -> declined
requested -> cancelled
requested -> expired
accepted  -> cancelled
accepted  -> completed
```

O utilizador cria sempre `requested`. Esse pedido reserva temporariamente o intervalo operacional. O profissional elegível pode aceitar ou recusar manualmente. A aceitação mantém o slot ocupado; recusa, cancelamento ou expiração libertam-no quando não existir outro bloqueio. Não existe aceitação automática.

As transições são operações CAS/atómicas, com `version`, estado esperado e auditoria. Tentativas concorrentes produzem uma única transição válida; as restantes falham sem alterar o documento. Estados finais não reabrem.

## 3. Expiração

O servidor calcula e guarda em UTC:

```text
expiresAtUtc = min(createdAtUtc + 24h, startAtUtc - 1h)
```

Um pedido não pode ser criado quando `expiresAtUtc <= nowUtc`. Enquanto `requested` e `expiresAtUtc > nowUtc`, ocupa o intervalo. Nas consultas de disponibilidade e na criação de reservas, um pedido com prazo vencido é tratado como livre, mesmo que a limpeza ainda não tenha ocorrido.

A expiração é `requested -> expired`, condicionada atomicamente a estado, versão e prazo. A aceitação exige novamente `status=requested` e `expiresAtUtc > nowUtc`, além de elegibilidade atual. A limpeza em segundo plano deve ser idempotente e não pode ser requisito para a correção das consultas.

## 4. Duração, cancelamento e reagendamento

Durações permitidas: **30, 45, 60 ou 90 minutos**, configuradas por serviço/capacidade. Buffers antes/depois ocupam o calendário, mas não integram a duração efetiva.

Regras aprovadas:

- reserva aceite cancelável pelo utilizador até 24 horas antes do início;
- pedido `requested` pode ser retirado antes de aceitação, desde que ainda válido;
- profissional pode cancelar com motivo estruturado;
- sem penalizações financeiras;
- histórico e auditoria são preservados;
- reagendamento cria uma nova reserva ligada à original;
- a reserva original não é apagada nem alterada silenciosamente;
- o novo slot deve ser validado antes de libertar ou substituir o original.

Situações excepcionais não criam permissões implícitas. Devem ser definidas por política própria.

**Decisão aprovada na implementação:** manter a original aceite e ocupada até à aceitação manual da nova. A nova ocupa temporariamente o seu intervalo. Aceitação confirma a nova e cancela a original na mesma transação. Recusa, retirada ou expiração preservam a original. Pedido e aceitação respeitam 24 horas antes do início original, e o prazo da nova também é limitado a esse instante. Não são permitidos reagendamentos pendentes concorrentes incompatíveis.

## 5. Conflitos e concorrência MongoDB

O calendário operacional considera:

- `requested` válidos;
- `accepted`;
- buffers antes/depois;
- bloqueios explícitos de disponibilidade.

Não considera ocupados `declined`, `cancelled` ou `expired`.

Uma consulta seguida de `insert` não é suficiente para excluir intervalos concorrentes. Na Fase 5.6 foi aprovada e implementada a estratégia de transações com **documento de calendário por identidade profissional**, comum a todas as capacidades. A primeira escrita disputa esse documento; reserva, histórico, auditoria, comando idempotente e outbox seguem na mesma transação, com retries limitados. Sem replica set a ativação é recusada. As alternativas consideradas no desenho inicial foram:

1. **Slots discretos:** normalizar sessões e buffers para unidades fixas e aplicar unicidade por profissional/slot.
2. **Lock lógico:** documento de lock por profissional/janela, adquirido com operação atómica e expiração segura.
3. **Transação MongoDB:** reservar intervalo e outbox numa transação, exigindo replica set ou cluster apropriado.

O MongoDB do `compose.yaml` principal permanece standalone, sem qualquer alteração nesta entrega. A feature está desativada por defeito e não funciona ativamente nesse ambiente. A atomicidade foi testada exclusivamente no replica set isolado autorizado; RabbitMQ não a substitui.

## 6. Modelo funcional

```text
ProfessionalAvailabilityRule
  professionalAuthUserId
  capabilityId
  weekday / localStartTime / localEndTime
  timezone
  sessionModes / environments
  slotDurationMinutes
  bufferBeforeMinutes / bufferAfterMinutes
  validFrom / validUntil
  status / version

ProfessionalAvailabilityException
  professionalAuthUserId
  startAtUtc / endAtUtc
  timezone
  type: block | extra_availability | replacement
  status / reasonCode

ProfessionalAppointment
  appointmentType: initial_session | one_off_session | follow_up
  subjectAuthUserId
  professionalAuthUserId
  professionalId
  capabilityId
  relationshipId?
  mode / environment?
  startAtUtc / endAtUtc / timezone
  createdAtUtc / expiresAtUtc
  status / version
  idempotencyKeyHash
  history / audit references
```

`relationshipId` é proibido nas duas modalidades sem relação e obrigatório em `follow_up`. Referências externas são IDs validados; não há `populate` remoto nem cópia de dados sensíveis.

## 7. Contratos internos e segurança

### Professional Service

O Professional Service é a autoridade para perfil, capacidade, papel e elegibilidade. O Agenda Service necessita de um contrato interno versionado que responda, no mínimo:

```text
capabilityId
professionalId
professionalAuthUserId
relationshipKind
eligible
canOfferAppointment
checkedAtUtc
validUntilUtc?
```

Para `follow_up`, deve validar também que o `relationshipId` pertence aos participantes, à capacidade e está `accepted`. A decisão deve ser repetida na aceitação.

O contrato atual ainda não fornece uma decisão positiva real: `ProfessionalCareEligibility` permanece fechado por defeito. A implementação não pode usar catálogo, fixtures normais ou `/auth/me` de terceiros como prova de elegibilidade.

### Auth e chamadas internas

JWT do utilizador é obrigatório nas rotas públicas e deve ser validado pelo Auth Service conforme os contratos existentes. Chamadas Agenda -> Professional não devem confiar apenas na rede Docker. Alternativas:

- mTLS entre serviços;
- credencial de serviço rotativa, com audience/scope e rotação;
- gateway interno autenticado com assinatura/verificação no destino.

Recomendação: contrato de serviço com credencial dedicada, audience restrita, expiração curta e logs sem tokens. Não partilhar a chave JWT do utilizador nem aceitar `professionalAuthUserId` livre do cliente.

### Demo

Testes positivos devem usar apenas a demonstração isolada e um adaptador injetado/credencial de teste claramente separado. O ambiente principal deve continuar a recusar elegibilidade positiva enquanto o contrato real não existir. O `compose.demo.yaml` atual não inclui Agenda nem a sua rota; a integração demo da Agenda Profissional é um trabalho futuro, não uma autorização para alterar o ambiente principal.

## 8. Outbox e RabbitMQ

Eventos previstos:

```text
agenda.professional.requested.v1
agenda.professional.accepted.v1
agenda.professional.declined.v1
agenda.professional.expired.v1
agenda.professional.cancelled.v1
agenda.professional.rescheduled.v1
```

O evento só pode ser publicado depois de a alteração persistir. O outbox deve ter estado, tentativas, `availableAt`, `publishedAt`, erro e chave idempotente. Consumidores devem tolerar duplicados. Sem transação MongoDB disponível, a garantia exata entre reserva e outbox fica pendente; RabbitMQ não substitui uma transação.

Não implementar emails, SMS ou push nesta fase.

## 9. APIs propostas

Profissional:

```text
POST   /agenda/professional/availability-rules
GET    /agenda/professional/availability-rules
PATCH  /agenda/professional/availability-rules/:id
DELETE /agenda/professional/availability-rules/:id
POST   /agenda/professional/availability-exceptions
GET    /agenda/professional/availability-exceptions
DELETE /agenda/professional/availability-exceptions/:id
GET    /agenda/professional/appointments
POST   /agenda/professional/appointments/:id/accept
POST   /agenda/professional/appointments/:id/decline
POST   /agenda/professional/appointments/:id/cancel
```

Utilizador:

```text
GET  /agenda/professionals/:professionalId/availability
POST /agenda/professional-appointments
GET  /agenda/professional-appointments
GET  /agenda/professional-appointments/:id
POST /agenda/professional-appointments/:id/cancel
POST /agenda/professional-appointments/:id/reschedule
```

O Gateway apenas encaminha; autorização de domínio permanece no Agenda Service.

## 10. Fusos e DST

Disponibilidades recorrentes são definidas no fuso IANA local do profissional. Reservas guardam instantes UTC e o timezone original. Horas inexistentes são rejeitadas; horas repetidas exigem desambiguação explícita. Recorrências não podem ser calculadas apenas com offsets. `Europe/Lisbon` deve ter testes para ambas as mudanças de hora.

## 11. Contradições e impedimentos atuais

| Tema | Estado atual | Consequência |
|---|---|---|
| Elegibilidade positiva | Professional fecha decisões reais como inelegíveis/indisponíveis | Não há fluxo positivo no ambiente principal |
| Transações | MongoDB Compose standalone | Outbox transacional e exclusão multi-documento exigem infraestrutura/decisão |
| Eventos | RabbitMQ configurado, sem contrato/outbox de Agenda | Não prometer entrega exatamente uma vez |
| Demo | Não encaminha Agenda no `compose.demo.yaml` | Testes demo profissionais exigem desenho adicional |
| Auth interno | Não existe contrato de credencial serviço-serviço para este domínio | Não implementar chamadas internas baseadas só na rede |
| Agenda Pessoal | Sobreposições próprias são permitidas com aviso | Não reutilizar regra profissional rígida nem misturar ownership |
| Relações | Estados atuais são `pending/accepted/declined/cancelled/ended/expired` | `follow_up` deve usar exatamente `accepted`; não criar novos estados por inferência |

## 12. Plano de implementação e referência da entrega

Os passos seguintes eram o plano inicial. A implementação local de disponibilidade, reservas, transações, expiração, comandos, reagendamento e outbox está descrita na [API](../api/professional-agenda.md). O Gateway existente foi reutilizado; integração num Compose de demonstração ampliado, consumidores dos novos eventos e habilitação real continuam pendentes.

1. Aprovar decisões pendentes e o mecanismo de exclusão de intervalos.
2. Definir contrato de elegibilidade e autenticação serviço-serviço.
3. Modelar regras, exceções, reservas, histórico, índices e idempotência.
4. Implementar criação, consulta e bloqueio de disponibilidade.
5. Implementar pedidos `requested`, expiração passiva e limpeza idempotente.
6. Implementar aceitação/recusa/cancelamento com CAS e validação de elegibilidade.
7. Implementar reagendamento sem perda do slot original.
8. Adicionar outbox após decidir replica set/estratégia de consistência.
9. Integrar Gateway e, separadamente, o ambiente demo.
10. Executar testes de unidade, concorrência, DST, segurança, contratos e HTTP.

## 13. Testes necessários

- modalidades e relação obrigatória;
- elegibilidade no pedido e na aceitação;
- expiração nos dois limites da fórmula;
- pedido já fora da janela;
- aceitação concorrente com expiração/cancelamento;
- duplicados e intervalos sobrepostos com buffers;
- libertação após `declined`, `cancelled` e `expired`;
- confirmação manual e visibilidade por titular;
- cancelamento e reagendamento;
- DST em `Europe/Lisbon`;
- isolamento de utilizadores/profissionais;
- JWT ausente/inválido e credencial interna inválida;
- outbox, retries e consumidores idempotentes;
- Agenda Pessoal continua independente;
- demo positiva isolada sem alterar elegibilidade real.

## 14. Decisões resolvidas e pendências

Foram aprovados transações/serialização por profissional, contrato com credencial dedicada de curta validade, feature desativada por defeito e reagendamento que preserva a original. O adaptador normal não aceita fontes sintéticas. Bloqueios são globais à pessoa; disponibilidade extra é explícita; substituição afeta uma regra num dia local, sem invalidar reservas existentes. Os detalhes e limites técnicos estão no contrato executado.

A lista original abaixo identifica temas de evolução. Exclusão de intervalos, autenticação interna, ausência de cache positiva, outbox transacional e reagendamento normal foram resolvidos nesta entrega; políticas excepcionais, operação de produção e integrações ainda precisam de aprovação:

- Estratégia de exclusão de intervalos: slots, lock lógico ou replica set.
- Credencial e contrato para chamadas internas.
- Validade/cache da decisão de elegibilidade.
- Modelo de bloqueios e exceções de disponibilidade.
- Política para cancelamento excepcional e reagendamento.
- Momento e prioridade de conflito com compromisso pessoal, mantendo aviso não bloqueante.
- Política de limpeza, retries, métricas e alertas de expiração.
- Outbox com transação real ou garantia compensatória explicitamente aprovada.
- Inclusão futura da Agenda no ambiente demo.
- Contrato de localização presencial, links online e notificações.
