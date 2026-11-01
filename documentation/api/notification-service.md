# Notification Service — notificações internas

Os endpoints existentes continuam protegidos por Bearer validado em
`Auth /auth/me`. O titular vem dessa identidade, nunca do corpo do pedido.
Consultas e alterações filtram sempre pelo próprio `ownerId`.

| Método | Endpoint | Função |
|---|---|---|
| GET | `/notifications` | Lista paginada; `page`, `pageSize`, `unread` |
| GET | `/notifications/unread-count` | Contagem própria não lida |
| POST | `/notifications/:notificationId/read` | Marcar notificação própria |
| POST | `/notifications/read-all` | Marcar todas as próprias |
| GET | `/notifications/preferences` | Consultar preferências próprias |
| PUT | `/notifications/preferences` | Alterar preferências com versão |
| GET | `/health` | Liveness HTTP, independente das dependências |
| GET | `/ready` | 200 com MongoDB e consumidor RabbitMQ prontos; caso contrário 503 |

Uma notificação nova tem destinatário, categoria `agenda|payment`, título,
mensagem, referência à reserva/pagamento, `readAt` (ausente enquanto não lida),
`createdAt`, origem e identificação do evento. As anteriores não são migradas.

Preferências booleanas: `enabled`, `hydrationReminders`, `trainingEvents`,
`agendaReminders` e **`paymentEvents`**, esta última ativa por defeito também
para documentos anteriores. `enabled=false` suprime todas; `agendaReminders`
controla reservas; `paymentEvents` controla pagamentos e reembolso simulado
pendente. A versão protege contra edições concorrentes.

Resultado incerto não significa pagamento aprovado; reembolso pendente não
significa reembolso concluído. Não há envio externo ou endpoint público para
injetar eventos. O Gateway existente não necessita de alterações.

Contratos, destinatários, outbox, deduplicação, retry, DLQ, configuração,
recuperação e testes: [eventos da Fase 5.9](../events/agenda-payment-notifications.md).
