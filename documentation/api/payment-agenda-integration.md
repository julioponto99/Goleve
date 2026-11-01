# Integração Payment + Agenda + Professional — Fase 5.8.2

Implementação exclusivamente local, com dados fictícios e bases isoladas.
`PAYMENT_AGENDA_DEMO_ENABLED=false` por defeito. A ativação é recusada fora de
`NODE_ENV=development|test`, incluindo produção. Não aprova candidaturas,
atribui papéis ou transforma elegibilidade sintética em elegibilidade real.
O adaptador normal da Agenda continua a exigir `authority=real`.

## Responsabilidades e contratos

- **Professional** é proprietário do serviço, preço, capacidade e aprovação
  simulada. Exige perfil não suspenso/arquivado, capacidade não suspensa,
  expirada ou rejeitada, candidatura aprovada/publicada e serviço ativo da
  mesma capacidade. A cotação valida também a duração da reserva.
- **Agenda** mantém reserva, titularidade, versões, reagendamentos e o ledger
  de cobrança da cadeia. Claim, recibo e histórico financeiro usam a mesma
  transação e documento de calendário que serializam as reservas. As regras
  anteriores de buffers, conflitos, expiração e cancelamento mantêm-se.
- **Payment** guarda intenção e recibo próprios e chama apenas o
  `MockBankProvider`. Não lê bases dos outros serviços.

Contratos internos, todos `POST`, autenticados e fora do Gateway:

| Serviço | Caminho | Conteúdo mínimo |
|---|---|---|
| Professional | `/internal/v1/payment-demo/eligibility` | Capacidade, profissional e prova sintética com validade de 10 segundos; relação quando necessária |
| Professional | `/internal/v1/payment-demo/quote` | Titular, serviço, profissional, capacidade, duração e `quoteId` opcional |
| Agenda | `/internal/v1/payment-demo/context` | Reserva do titular, referências, estado, versão, duração, cadeia e sinalizadores financeiros |
| Agenda | `/internal/v1/payment-demo/claim` | Titular, reserva, versão, tentativa e cotação |
| Agenda | `/internal/v1/payment-demo/settle` | Titular, reserva, tentativa, token do claim e resultado simulado |

A cotação devolve `quoteId`, `serviceId`, `professionalId`, `capabilityId`,
`priceCents`, `currency=EUR`, `serviceVersion`, `durationMinutes`, `expiresAt`
e `authority=synthetic`. É vinculada ao titular e válida por 15 minutos.
O preço fica fixado nesse intervalo; serviço inativo, duração incompatível
ou perda de elegibilidade impedem a confirmação. O preço nunca é recebido
do cliente.

## API pública

JWT do titular obrigatório, validado pelo middleware existente através do
Auth. O Gateway reutiliza o proxy `/payments`; não ganha rotas internas.
As mutações Payment aceitam corpo vazio e rejeitam campos financeiros ou
identificadores de serviço enviados no corpo.

| Método e caminho | Operação |
|---|---|
| `POST /payments/appointments/:appointmentId` | Criar intenção e obter cotação; `Idempotency-Key` obrigatório |
| `GET /payments/appointment-payments/:id` | Consultar pagamento próprio e atualizar os sinalizadores da Agenda |
| `POST /payments/appointment-payments/:id/confirm` | Confirmar uma única chamada bancária; `Idempotency-Key` obrigatório |
| `POST /payments/appointment-payments/:id/cancel` | Cancelar apenas uma intenção ainda pendente; `Idempotency-Key` obrigatório |
| `POST /payments/appointment-payments/:id/reconcile` | Consultar recibo conclusivo persistido na Agenda; nunca voltar a cobrar |
| `POST /agenda/professional-appointments/:id/service` | Associar explicitamente `{ "serviceId": "..." }` a reserva aceite anterior; exige `If-Match` |

A criação de reserva profissional aceita agora `serviceId` opcional. Quando
presente, é validado no Professional. Reservas anteriores sem associação
continuam válidas, mas não podem ser pagas até o titular selecionar um serviço
compatível. Não há migração, inferência de preços ou alteração automática.
O vínculo não pode ser trocado após início do histórico financeiro.
O Payment anterior, com referências opacas e fixtures próprias, permanece
separado: as suas referências não são interpretadas como reservas.

## Cobrança, concorrência e resultados incertos

1. Só o cliente de uma reserva `accepted` pode criar/confirmar pagamento.
2. Índice único parcial impede intenções simultaneamente pendentes, em
   processamento, aprovadas, gratuitas ou incertas para a mesma cadeia.
3. CAS durável no Payment e claim transacional na Agenda antecedem o banco.
   Reservas reagendadas partilham a raiz financeira; não permitem uma segunda
   cobrança aprovada.
4. Confirmação revalida cotação, reserva e elegibilidade. Uma cotação expirada
   antes da chamada não chega ao banco; um claim não executado pode ser
   libertado por expiração controlada.
5. Serviço gratuito termina como `free`, sem chamada bancária. Uma recusa
   permite nova intenção explícita com outra chave. Não há retry bancário
   automático.
6. Timeout, recibo inválido ou falha após possível cobrança produzem `unknown`
   e bloqueio para reconciliação. Processamento interrompido há mais de 60
   segundos é sinalizado na consulta. Sem recibo conclusivo persistido,
   `/reconcile` devolve conflito e mantém o bloqueio.

Não existe transação distribuída entre os três serviços e o banco. A
segurança resulta de claims duráveis, unicidade, histórico e bloqueio de
resultados ambíguos. Não se presume sucesso ou falha numa resposta perdida.

Cancelamento da reserva paga preserva recibos e marca `refundPending`, sem
reembolso real. O ledger é atualizado na transação do cancelamento; o Payment
reflete esse sinalizador quando consultado. Reagendamento aceite conserva a
cobrança se serviço, preço e moeda forem iguais; diferenças marcam
`reconciliationRequired` e impedem nova cobrança. Recibos e cotação originais
não são reescritos. Recusa/expiração do novo horário preservam a original.

## Configuração e segurança

Cada serviço exige a sua base `goleve_payagenda_<instance>_<service>`;
`instance` tem 16 caracteres hexadecimais e `service` é `agenda`, `payment`
ou `professional`. A configuração de arranque aceita MongoDB em loopback.
Agenda exige replica set e o modo isolado transacional já existente.

Configuração explícita, sem valores secretos no repositório:

- `PAYMENT_AGENDA_DEMO_ENABLED`, `PAYMENT_AGENDA_DEMO_INSTANCE`, `MONGO_URI`.
- Origens fixas `AGENDA_SERVICE_URL`, `PAYMENT_SERVICE_URL`,
  `PROFESSIONAL_SERVICE_URL` e `AUTH_SERVICE_URL`.
- Ficheiros de chaves próprias por par:
  `PAYMENT_DEMO_KEY_AGENDA_PAYMENT_FILE`,
  `PAYMENT_DEMO_KEY_AGENDA_PROFESSIONAL_FILE`,
  `PAYMENT_DEMO_KEY_PAYMENT_PROFESSIONAL_FILE`.
  Cada processo recebe apenas as chaves dos seus dois pares.
- Payment mantém `PAYMENT_DEMO_ENABLED=true`. O resultado bancário é
  configuração do backend (`PAYMENT_DEMO_BANK_OUTCOME=approve|decline`).
- Agenda mantém `AGENDA_PROFESSIONAL_ENABLED=true` e
  `AGENDA_PROFESSIONAL_MODE=isolated`.
- Professional exige `PROFESSIONAL_DATA_MODE=synthetic` e
  `PROFESSIONAL_REVIEW_MODE=synthetic`, respeitando a configuração prévia de
  revisores. Esta integração não provisiona administradores nem aprovação.

Chamadas internas usam JWT HMAC por par com audiência, emissor, instância,
operação, método, hash do corpo, validade de 15 segundos e nonce persistido
para negar replay. A resposta tem MAC vinculado ao pedido específico.
O Bearer humano não é enviado nestes contratos nem guardado nos pagamentos.
Não são aceites URLs ou operações arbitrárias do cliente.

## Persistência e validação efetuada

Coleções adicionais: `appointment_payments` no Payment;
`agenda_demo_billing` e `agenda_demo_billing_history` na Agenda;
`professional_demo_payment_quotes` no Professional;
`payment_demo_nonces` nas bases dos destinatários. Todas são exclusivas da
demonstração; o ledger/histórico da Agenda usa transações com calendário.

**32 testes distintos aprovados, zero falhas:** 29 de integração direcionada
e 3 existentes do Payment. Os três workspaces compilaram em TypeScript.
Comando direcionado, após compilar Professional, Agenda e Payment:
`npm run test:agenda --workspace=@goleve/payment-service`, no diretório
`backend`, com `NODE_ENV=test` e `PAYMENT_AGENDA_TEST_MONGO_URI` apontado
exclusivamente ao replica set isolado `pay582` em loopback.

Os testes exercitaram os três serviços reais por HTTP, persistência e
transações reais num único MongoDB temporário em tmpfs. Auth foi simulado
com verificação de assinatura, emissor, audiência e identidade fictícia;
o proxy Payment existente do Gateway foi testado isoladamente. Não houve
regressão completa nem teste global ponta a ponta.

Cobertura: reserva aceite/pendente/cancelada, titularidade e JWT, preço
adulterado, cotação expirada antes/depois do claim, revogação de
elegibilidade, provas sintéticas expiradas/adulteradas, produção bloqueada,
autenticação interna e replay, duplicados, confirmações concorrentes, recusa
e nova tentativa, gratuito, cancelamento durante/depois da cobrança,
reagendamento equivalente/diferente, associação legada, timeout, recibo
inválido, reconciliação com recibo persistido e rollback transacional.

O contentor e a rede exclusivos destes testes foram removidos, bem como os
dois ficheiros temporários desta execução. Nenhum volume foi eliminado.
Os 31 contentores preexistentes conservaram estado, health, mounts e redes;
os 14 componentes principais continuam saudáveis. Não houve alterações de
credenciais, migrações, backups, commit ou push.

### Ficheiros desta implementação

Na raiz `backend/services/`:

- `agenda-service/src/app.ts`, `src/server.ts`;
  `src/professional/models.ts`, `service.ts`, `settings.ts`, `validation.ts`;
  novos `src/payment-demo/billing.ts`, `eligibility.ts`, `protocol.ts`, `routes.ts`.
- `payment-service/package.json`, `src/server.ts`;
  novos `src/payment-demo/models.ts`, `protocol.ts`, `routes.ts`, `service.ts`
  e `tests/agenda-integration.test.cjs`.
- `professional-service/src/app.ts`, `src/config/settings.ts`;
  novos `src/payment-demo/protocol.ts`, `routes.ts`.

Documentação: este contrato e `documentation/backend-completion-plan.md`.
Total: 23 ficheiros. Gateway, Compose, dependências instaladas e restantes
serviços não foram alterados.

## Limitações e Notification

Não há ativação no ambiente principal, fornecedor bancário real, reembolso
real, concessões produtivas ou aprovação automática. A execução HTTP positiva
usa candidaturas aprovadas apenas como fixtures explícitas na base isolada
de testes; não fornece um caminho de aprovação no servidor normal.

Resultados incertos sem recibo durável exigem procedimento futuro de
reconciliação. Atualizações financeiras entre serviços são consultivas e
síncronas; não há consumidor Notification nem propagação automática por
RabbitMQ nesta fase. Notificações de pagamento, recusa, reembolso pendente e
reconciliação, com deduplicação e conteúdo mínimo, ficam para tarefa própria.
