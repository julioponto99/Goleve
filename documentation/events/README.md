# Eventos do backend

Contratos aceites pelo Notification: `hydration.reminder.requested.v1`,
`hydration.daily_goal.reached.v1`, `training.session.completed.v1` e
`agenda.activity.reminder.requested.v1` (este último não implica um agendador
implementado).

- [Reservas profissionais e pagamentos simulados — Fase 5.9](agenda-payment-notifications.md).
- [API e preferências do Notification Service](../api/notification-service.md).

Os contratos novos exigem demonstração local isolada explicitamente ativa.
Os contratos anteriores de Training/Hydration são preservados. Os nomes
anteriormente listados como previstos (`hydration.reminder.due`,
`training.scheduled`, `training.completed`, `marketplace.offer.submitted`,
`marketplace.offer.approved`, `payment.simulated`) não identificam os
contratos versionados implementados.
