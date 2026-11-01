# API Gestor V1

[OpenAPI 3.1](management-v1.openapi.json) define corpos, respostas, estados,
paginação, erros e autenticação para web/mobile.

| Área | Endpoints |
|---|---|
| Identidade | `GET /management/me` |
| Administração | `POST /management/operators`, `POST/GET /management/scopes`, `POST/GET /management/assignments` |
| Aprovação | `POST /management/assignments/:id/approve` |
| Revogação | `POST /management/assignments/:id/request-revocation`, `POST .../:id/approve-revocation` |
| Supervisão | `GET /management/professionals`, `/management/services`, `/management/appointments`, `/management/payments` |
| Serviços | `POST /management/services/:id/suspend`, `POST .../:id/reactivate` |
| Casos | `POST/GET /management/cases`, `PATCH /management/cases/:id`, `GET .../:id/history` |
| Auditoria | `GET /management/audit` |
| Dashboard | `GET /management/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD` |
| Convites Auth | `POST /auth/manager-invitations`, `POST .../:id/revoke`, `POST .../accept` |

Convites, operadores e governação de atribuições exigem Administrador atual;
leituras operacionais exigem Gestor + atribuição/permissão. Listagens de
âmbitos/atribuições também são disponíveis à Administração. Administrador
não ganha implicitamente as consultas operacionais de Gestor.

Listagens: `limit` 1–100 (20 por defeito), `before` cursor opaco ObjectId;
resposta `{data:{items,nextBefore}}`. `q` pesquisa nomes nos serviços e
profissionais, motivo nos casos; regex é escapada. Estado é validado por
domínio. Não há pesquisa livre sobre clientes/reservas/dados financeiros.
Histórico/auditoria aceitam só cursor e limite. `to` é exclusivo no dashboard.

Mutações com versão devolvem `ETag: "<id>:<version>"`; enviar esse valor em
`If-Match` nas aprovações, revogações, alterações de serviço e casos. Motivos
são `reasonCode` estruturados, 3–64 caracteres `[a-z][a-z0-9_]*`; não introduzir
texto clínico. Exemplo de suspensão: `{ "reasonCode": "operational_review" }`.
Nunca enviar `role`, `approvedBy`, preços, destinatários ou âmbitos livres.

Erros: 400 validação; 401 autenticação; 403 papel/permissão/âmbito; 404 recurso;
409 estado/duplicado/aprovação não independente; 410 convite indisponível;
412 versão; 428 falta `If-Match`; 429 limite; 503 dependência, auditoria ou
elegibilidade não confirmável. Resultados remotos não têm transação
distribuída: após timeout de mutação consultar a versão/estado antes de repetir.

## Contratos internos, nunca no Gateway

`POST /internal/v1/management/<operação>` nos proprietários:

| Serviço | Operações |
|---|---|
| Auth | `identity`: `{authUserId}`; apenas Administrador atual; devolve `{id,userType}` |
| Management | `authorize`: `{serviceIds,permission}`; identidade atual + atribuições |
| Professional | `validate`, `services`, `professionals`, `suspend`, `reactivate`, `resource`, `metrics` |
| Agenda | `appointments`, `resource`, `metrics` |
| Payment | `payments`, `resource`, `metrics` |

Pedidos aos proprietários incluem `serviceIds` e `permission`; listagens
acrescentam cursor/filtros permitidos. `resource` acrescenta `resourceId`;
mutações acrescentam `serviceId`, `version`, `reasonCode`; métricas usam
`from/to` UTC. `authorize` devolve `{actorId,permission,serviceIds,checkedAt}`.
Auth/Management não devolvem emails/hashes/tokens nesses contratos.

Identidade técnica por par com HMAC-SHA256, audiência por destino, emissor,
método/caminho, hash do corpo e do Bearer transitório, validade de 15 segundos
e nonce de utilização única persistido. `Authorization: Service <JWT>`;
`X-Management-User-Authorization` transporta o Bearer apenas durante o pedido;
`X-Management-Caller` identifica o proprietário no callback autenticado.
Bearer e credenciais nunca ficam nas bases/auditorias. HTTPS é obrigatório
nas origens configuradas para produção; não se reutiliza a chave JWT do Auth.

`MANAGEMENT_CONTRACT_ENABLED=true` ativa o contrato permanente, não um modo
demo. Cada serviço fornece origem Management e chave própria
`MANAGEMENT_AUTH_KEY_FILE`, `MANAGEMENT_PROFESSIONAL_KEY_FILE`,
`MANAGEMENT_AGENDA_KEY_FILE` ou `MANAGEMENT_PAYMENT_KEY_FILE`, conforme o par.
Management recebe as quatro; cada proprietário só a sua. Ficheiros locais
contêm 32 bytes aleatórios em hexadecimal, nunca versionados. Origens usam
`AUTH_SERVICE_URL`, `PROFESSIONAL_SERVICE_URL`, `AGENDA_SERVICE_URL`,
`PAYMENT_SERVICE_URL`, `MANAGEMENT_SERVICE_URL` e bases próprias `MONGO_URI`.

Management exige replica set para mutações+auditoria. Não alterar o MongoDB
principal para satisfazer isso sem um plano/autorização próprios. Payment
continua bloqueado em produção e identifica resultados simulados; Management
reporta indisponibilidade se esse proprietário não puder operar. O proxy
anterior `/management/professional-applications` continua separado e sujeito
ao revisor administrador do Professional, não é um privilégio Gestor.

Arquitetura, limitações e elegibilidade: [Management V1](../architecture/management-v1.md).

Validação, ficheiros alterados e limpeza dos testes:
[relatório da Fase 5.10](management-v1-validation.md).
