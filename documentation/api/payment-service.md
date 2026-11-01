# Payment Service — Fase 5.8.1

Serviço local de demonstração para pagamentos fictícios. Não comunica com bancos, não movimenta fundos e não aceita dados de cartões, IBAN, credenciais ou tokens bancários.

## Configuração

O serviço só arranca com `PAYMENT_DEMO_ENABLED=true` e fora de `NODE_ENV=production`. Os preços têm de estar previamente definidos no backend através de fixtures:

```dotenv
PAYMENT_DEMO_FIXTURES=demo-training:2500:approve,demo-decline:999:decline
```

O formato é `priceReference:amountCents:approve|decline`. O cliente envia apenas uma referência e o montante deve coincidir com a fixture; não pode escolher o resultado.

## Endpoints

Todos exigem JWT Bearer válido e isolamento pelo utilizador autenticado:

| Método | Endpoint | Finalidade |
|---|---|---|
| POST | `/payments` | Criar pagamento `pending`; exige `Idempotency-Key` |
| GET | `/payments` | Listar pagamentos próprios (`limit`, `before`) |
| GET | `/payments/:paymentId` | Consultar pagamento próprio |
| POST | `/payments/:paymentId/confirm` | Autorizar/recusar através do banco simulado |
| POST | `/payments/:paymentId/cancel` | Cancelar pagamento pendente |

Confirmação e cancelamento também exigem `Idempotency-Key`. As transições são CAS no MongoDB: apenas um pedido concorrente pode sair de `pending`.

## Modelo

A coleção `payments` guarda `ownerId`, `priceReference`, `serviceReference`, `amountCents`, `currency=EUR`, `state`, `method=mock`, referência de transação simulada, chaves de idempotência e histórico mínimo. Existem índices por `(ownerId, idempotencyKey)`, `(ownerId, createdAt)` e confirmação.

Estados permitidos: `pending -> approved`, `pending -> declined`, `pending -> cancelled`. Estados finais não reabrem.

## Limitações

Esta parte não integra Agenda, Notification ou RabbitMQ. A referência ao serviço/reserva é apenas uma referência opaca validada; preços reais e cobrança devem ser definidos numa fase posterior com contratos seguros. O MongoDB principal não deve ser usado para testes destrutivos nem são criados contentores automaticamente.
