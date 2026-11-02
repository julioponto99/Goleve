# Referência central de operações Gateway

Gerado de rotas reais em `000cc43`; não editar esta tabela à mão. [Guia](backend-release-v1.md), [OpenAPI 3.1](backend-release-v1.openapi.json).

As condições indicam limites de runtime; não implicam que os fluxos bloqueados tenham sido validados. Payloads de inventário parcial estão marcados no OpenAPI e remetem para o contrato proprietário.

## agenda

| Método | Caminho | Payload / query / headers | Disponibilidade | Fonte |
|---|---|---|---|---|
| GET | `/agenda/activities` | —; query: `page`, `pageSize`, `from`, `to`, `status`, `kind`, `environment` | local-fictional-data | [agenda.routes.ts:6](../../backend/services/agenda-service/src/routes/agenda.routes.ts) |
| POST | `/agenda/activities` | Activity | local-fictional-data | [agenda.routes.ts:7](../../backend/services/agenda-service/src/routes/agenda.routes.ts) |
| GET | `/agenda/activities/{activityId}` | — | local-fictional-data | [agenda.routes.ts:8](../../backend/services/agenda-service/src/routes/agenda.routes.ts) |
| PATCH | `/agenda/activities/{activityId}` | ActivityPatch | local-fictional-data | [agenda.routes.ts:9](../../backend/services/agenda-service/src/routes/agenda.routes.ts) |
| POST | `/agenda/activities/{activityId}/cancel` | Empty | local-fictional-data | [agenda.routes.ts:11](../../backend/services/agenda-service/src/routes/agenda.routes.ts) |
| POST | `/agenda/activities/{activityId}/complete` | Empty | local-fictional-data | [agenda.routes.ts:10](../../backend/services/agenda-service/src/routes/agenda.routes.ts) |
| GET | `/agenda/professional-appointments` | —; query: `from`, `to`, `limit`, `before`, `status`, `capabilityId` | professional-eligibility-required | [professional-agenda.routes.ts:21](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| POST | `/agenda/professional-appointments` | Booking; headers: `Idempotency-Key*` | professional-eligibility-required | [professional-agenda.routes.ts:20](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| GET | `/agenda/professional-appointments/{id}` | — | professional-eligibility-required | [professional-agenda.routes.ts:24](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| POST | `/agenda/professional-appointments/{id}/cancel` | Empty; headers: `Idempotency-Key*`, `If-Match*` | professional-eligibility-required | [professional-agenda.routes.ts:26](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| GET | `/agenda/professional-appointments/{id}/history` | — | professional-eligibility-required | [professional-agenda.routes.ts:23](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| POST | `/agenda/professional-appointments/{id}/reschedule` | Booking; headers: `Idempotency-Key*`, `If-Match*` | professional-eligibility-required | [professional-agenda.routes.ts:27](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| POST | `/agenda/professional-appointments/{id}/service` | ServiceAssociation; headers: `If-Match*` | payment-agenda-demo-blocked | [routes.ts:22](../../backend/services/agenda-service/src/payment-demo/routes.ts) |
| GET | `/agenda/professional/appointments` | —; query: `from`, `to`, `limit`, `before`, `status`, `capabilityId` | professional-eligibility-required | [professional-agenda.routes.ts:22](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| POST | `/agenda/professional/appointments/{id}/accept` | Empty; headers: `Idempotency-Key*`, `If-Match*` | professional-eligibility-required | [professional-agenda.routes.ts:25](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| POST | `/agenda/professional/appointments/{id}/cancel` | Review; headers: `Idempotency-Key*`, `If-Match*` | professional-eligibility-required | [professional-agenda.routes.ts:25](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| POST | `/agenda/professional/appointments/{id}/complete` | Empty; headers: `Idempotency-Key*`, `If-Match*` | professional-eligibility-required | [professional-agenda.routes.ts:25](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| POST | `/agenda/professional/appointments/{id}/decline` | Review; headers: `Idempotency-Key*`, `If-Match*` | professional-eligibility-required | [professional-agenda.routes.ts:25](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| GET | `/agenda/professional/availability-exceptions` | —; query: `limit`, `before`, `capabilityId` | professional-eligibility-required | [professional-agenda.routes.ts:17](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| POST | `/agenda/professional/availability-exceptions` | AvailabilityException; headers: `Idempotency-Key*` | professional-eligibility-required | [professional-agenda.routes.ts:16](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| DELETE | `/agenda/professional/availability-exceptions/{id}` | —; headers: `Idempotency-Key*`, `If-Match*` | professional-eligibility-required | [professional-agenda.routes.ts:18](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| GET | `/agenda/professional/availability-rules` | —; query: `limit`, `before`, `capabilityId` | professional-eligibility-required | [professional-agenda.routes.ts:13](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| POST | `/agenda/professional/availability-rules` | AvailabilityRule; headers: `Idempotency-Key*` | professional-eligibility-required | [professional-agenda.routes.ts:12](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| DELETE | `/agenda/professional/availability-rules/{id}` | —; headers: `Idempotency-Key*`, `If-Match*` | professional-eligibility-required | [professional-agenda.routes.ts:15](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| PATCH | `/agenda/professional/availability-rules/{id}` | AvailabilityRule; headers: `Idempotency-Key*`, `If-Match*` | professional-eligibility-required | [professional-agenda.routes.ts:14](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |
| GET | `/agenda/professionals/{professionalId}/availability` | —; query: `capabilityId`, `from`, `to`, `mode`, `environment` | professional-eligibility-required | [professional-agenda.routes.ts:19](../../backend/services/agenda-service/src/routes/professional-agenda.routes.ts) |

## coach

| Método | Caminho | Payload / query / headers | Disponibilidade | Fonte |
|---|---|---|---|---|
| GET | `/ai-coach/capabilities` | — | disabled-by-default | [app.ts:32](../../backend/services/ai-coach-service/src/app.ts) |
| GET | `/ai-coach/conversations` | —; query: `limit`, `before` | disabled-by-default | [coach.routes.ts:6](../../backend/services/ai-coach-service/src/routes/coach.routes.ts) |
| POST | `/ai-coach/conversations` | Conversation; headers: `Idempotency-Key*` | disabled-by-default | [coach.routes.ts:6](../../backend/services/ai-coach-service/src/routes/coach.routes.ts) |
| DELETE | `/ai-coach/conversations/{id}` | — | disabled-by-default | [coach.routes.ts:7](../../backend/services/ai-coach-service/src/routes/coach.routes.ts) |
| GET | `/ai-coach/conversations/{id}/actions` | —; query: `limit`, `before` | disabled-by-default | [coach.routes.ts:10](../../backend/services/ai-coach-service/src/routes/coach.routes.ts) |
| GET | `/ai-coach/conversations/{id}/messages` | —; query: `limit`, `before` | disabled-by-default | [coach.routes.ts:8](../../backend/services/ai-coach-service/src/routes/coach.routes.ts) |
| POST | `/ai-coach/conversations/{id}/messages` | Message; headers: `Idempotency-Key*` | disabled-by-default | [coach.routes.ts:8](../../backend/services/ai-coach-service/src/routes/coach.routes.ts) |
| PATCH | `/ai-coach/conversations/{id}/permissions` | CoachPermissions | disabled-by-default | [coach.routes.ts:7](../../backend/services/ai-coach-service/src/routes/coach.routes.ts) |
| GET | `/ai-coach/conversations/{id}/proposals` | —; query: `limit`, `before` | disabled-by-default | [coach.routes.ts:10](../../backend/services/ai-coach-service/src/routes/coach.routes.ts) |
| GET | `/ai-coach/conversations/{id}/recommendations` | —; query: `limit`, `before` | disabled-by-default | [coach.routes.ts:9](../../backend/services/ai-coach-service/src/routes/coach.routes.ts) |
| POST | `/ai-coach/proposals/{id}/confirm` | Proposal; headers: `Idempotency-Key*` | disabled-by-default | [coach.routes.ts:11](../../backend/services/ai-coach-service/src/routes/coach.routes.ts) |
| POST | `/ai-coach/proposals/{id}/reconcile` | ProposalReconcile | disabled-by-default | [coach.routes.ts:11](../../backend/services/ai-coach-service/src/routes/coach.routes.ts) |
| POST | `/ai-coach/proposals/{id}/reject` | ProposalPatch; headers: `Idempotency-Key*` | disabled-by-default | [coach.routes.ts:11](../../backend/services/ai-coach-service/src/routes/coach.routes.ts) |

## auth

| Método | Caminho | Payload / query / headers | Disponibilidade | Fonte |
|---|---|---|---|---|
| POST | `/auth/admin/step-up` | StepUp | privileged-no-provisioned-admin | [routes.ts:16](../../backend/services/auth-service/src/administration/routes.ts) |
| GET | `/auth/administration/audit` | —; query: `limit`, `before` | privileged-no-provisioned-admin | [routes.ts:32](../../backend/services/auth-service/src/administration/routes.ts) |
| GET | `/auth/administration/role-requests` | —; query: `limit`, `before`, `status` | privileged-no-provisioned-admin | [routes.ts:29](../../backend/services/auth-service/src/administration/routes.ts) |
| POST | `/auth/administration/role-requests/{id}/approve` | Mutation | privileged-no-provisioned-admin | [routes.ts:30](../../backend/services/auth-service/src/administration/routes.ts) |
| POST | `/auth/administration/role-requests/{id}/reject` | Mutation | privileged-no-provisioned-admin | [routes.ts:30](../../backend/services/auth-service/src/administration/routes.ts) |
| GET | `/auth/administration/users` | —; query: `limit`, `before`, `q`, `role`, `status` | privileged-no-provisioned-admin | [routes.ts:25](../../backend/services/auth-service/src/administration/routes.ts) |
| GET | `/auth/administration/users/{id}` | — | privileged-no-provisioned-admin | [routes.ts:26](../../backend/services/auth-service/src/administration/routes.ts) |
| GET | `/auth/administration/users/{id}/history` | —; query: `limit`, `before` | privileged-no-provisioned-admin | [routes.ts:31](../../backend/services/auth-service/src/administration/routes.ts) |
| POST | `/auth/administration/users/{id}/reactivate` | Mutation | privileged-no-provisioned-admin | [routes.ts:27](../../backend/services/auth-service/src/administration/routes.ts) |
| POST | `/auth/administration/users/{id}/revoke` | Mutation | privileged-no-provisioned-admin | [routes.ts:27](../../backend/services/auth-service/src/administration/routes.ts) |
| POST | `/auth/administration/users/{id}/role-requests` | RoleMutation | privileged-no-provisioned-admin | [routes.ts:28](../../backend/services/auth-service/src/administration/routes.ts) |
| POST | `/auth/administration/users/{id}/suspend` | Mutation | privileged-no-provisioned-admin | [routes.ts:27](../../backend/services/auth-service/src/administration/routes.ts) |
| POST | `/auth/initial-admin-invitation/accept` | contrato proprietário | privileged-no-provisioned-admin | [routes.ts:15](../../backend/services/auth-service/src/administration/routes.ts) |
| POST | `/auth/login` | contrato proprietário | local-fictional-data | [auth.routes.ts:12](../../backend/services/auth-service/src/routes/auth.routes.ts) |
| POST | `/auth/logout` | contrato proprietário | local-fictional-data | [routes.ts:17](../../backend/services/auth-service/src/administration/routes.ts) |
| POST | `/auth/manager-invitations` | InvitationIssue; headers: `X-Admin-Step-Up*` | privileged-no-provisioned-admin | [manager-invitations.ts:24](../../backend/services/auth-service/src/manager-invitations.ts) |
| POST | `/auth/manager-invitations/{id}/revoke` | Empty; headers: `X-Admin-Step-Up*` | privileged-no-provisioned-admin | [manager-invitations.ts:29](../../backend/services/auth-service/src/manager-invitations.ts) |
| POST | `/auth/manager-invitations/accept` | InvitationAccept | privileged-no-provisioned-admin | [manager-invitations.ts:31](../../backend/services/auth-service/src/manager-invitations.ts) |
| GET | `/auth/me` | — | local-fictional-data | [auth.routes.ts:13](../../backend/services/auth-service/src/routes/auth.routes.ts) |
| POST | `/auth/mfa/complete` | MfaFactor | local-fictional-data | [routes.ts:14](../../backend/services/auth-service/src/administration/routes.ts) |
| POST | `/auth/mfa/enroll` | contrato proprietário | local-fictional-data | [routes.ts:13](../../backend/services/auth-service/src/administration/routes.ts) |
| POST | `/auth/register` | Register | local-fictional-data | [auth.routes.ts:11](../../backend/services/auth-service/src/routes/auth.routes.ts) |
| GET | `/auth/sessions` | — | local-fictional-data | [routes.ts:18](../../backend/services/auth-service/src/administration/routes.ts) |

## professional

| Método | Caminho | Payload / query / headers | Disponibilidade | Fonte |
|---|---|---|---|---|
| POST | `/care-relationships` | Relationship; headers: `Idempotency-Key*` | professional-eligibility-required | [care-relationship.routes.ts:6](../../backend/services/professional-service/src/routes/care-relationship.routes.ts) |
| GET | `/care-relationships/{relationshipId}` | — | professional-eligibility-required | [care-relationship.routes.ts:8](../../backend/services/professional-service/src/routes/care-relationship.routes.ts) |
| POST | `/care-relationships/{relationshipId}/accept` | Empty; headers: `If-Match*`, `Idempotency-Key*` | professional-eligibility-required | [care-relationship.routes.ts:10](../../backend/services/professional-service/src/routes/care-relationship.routes.ts) |
| POST | `/care-relationships/{relationshipId}/cancel` | Empty; headers: `If-Match*`, `Idempotency-Key*` | professional-eligibility-required | [care-relationship.routes.ts:12](../../backend/services/professional-service/src/routes/care-relationship.routes.ts) |
| POST | `/care-relationships/{relationshipId}/decline` | Empty; headers: `If-Match*`, `Idempotency-Key*` | professional-eligibility-required | [care-relationship.routes.ts:11](../../backend/services/professional-service/src/routes/care-relationship.routes.ts) |
| POST | `/care-relationships/{relationshipId}/end` | Empty; headers: `If-Match*`, `Idempotency-Key*` | professional-eligibility-required | [care-relationship.routes.ts:13](../../backend/services/professional-service/src/routes/care-relationship.routes.ts) |
| GET | `/care-relationships/{relationshipId}/history` | — | professional-eligibility-required | [care-relationship.routes.ts:9](../../backend/services/professional-service/src/routes/care-relationship.routes.ts) |
| GET | `/care-relationships/me` | —; query: `limit`, `before`, `status` | professional-eligibility-required | [care-relationship.routes.ts:7](../../backend/services/professional-service/src/routes/care-relationship.routes.ts) |
| GET | `/management/professional-applications` | —; query: `limit`, `before`, `status` | legacy-review-disabled | [application.routes.ts:6](../../backend/services/professional-service/src/routes/application.routes.ts) |
| GET | `/management/professional-applications/{applicationId}` | — | legacy-review-disabled | [application.routes.ts:7](../../backend/services/professional-service/src/routes/application.routes.ts) |
| POST | `/management/professional-applications/{applicationId}/approve` | LegacyReviewApprove; headers: `If-Match*`, `Idempotency-Key*` | legacy-review-disabled | [application.routes.ts:9](../../backend/services/professional-service/src/routes/application.routes.ts) |
| GET | `/management/professional-applications/{applicationId}/history` | — | legacy-review-disabled | [application.routes.ts:8](../../backend/services/professional-service/src/routes/application.routes.ts) |
| POST | `/management/professional-applications/{applicationId}/reject` | LegacyReviewReason; headers: `If-Match*`, `Idempotency-Key*` | legacy-review-disabled | [application.routes.ts:10](../../backend/services/professional-service/src/routes/application.routes.ts) |
| POST | `/management/professional-applications/{applicationId}/suspend` | LegacyReviewReason; headers: `If-Match*`, `Idempotency-Key*` | legacy-review-disabled | [application.routes.ts:11](../../backend/services/professional-service/src/routes/application.routes.ts) |
| GET | `/professionals/catalog` | —; query: `limit`, `before` | local-fictional-data | [app.ts:53](../../backend/services/professional-service/src/app.ts) |
| GET | `/professionals/eligible-capabilities` | —; query: `limit`, `before` | professional-eligibility-required | [app.ts:59](../../backend/services/professional-service/src/app.ts) |
| GET | `/professionals/me` | — | local-fictional-data | [professional.routes.ts:17](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| PATCH | `/professionals/me` | ProfessionalProfilePatch; headers: `If-Match*` | local-fictional-data | [professional.routes.ts:19](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| PUT | `/professionals/me` | ProfessionalProfile; headers: `If-None-Match*` | local-fictional-data | [professional.routes.ts:18](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| GET | `/professionals/me/application-status` | — | local-fictional-data | [professional.routes.ts:16](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| GET | `/professionals/me/availability-declaration` | — | local-fictional-data | [professional.routes.ts:28](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| PATCH | `/professionals/me/availability-declaration` | AvailabilityDeclarationPatch; headers: `If-Match*` | local-fictional-data | [professional.routes.ts:30](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| PUT | `/professionals/me/availability-declaration` | AvailabilityDeclaration; headers: `If-None-Match*` | local-fictional-data | [professional.routes.ts:29](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| GET | `/professionals/me/capabilities` | —; query: `limit`, `before` | local-fictional-data | [professional.routes.ts:20](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| POST | `/professionals/me/capabilities` | Capability | local-fictional-data | [professional.routes.ts:21](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| GET | `/professionals/me/capabilities/{capabilityId}` | — | local-fictional-data | [professional.routes.ts:22](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| PATCH | `/professionals/me/capabilities/{capabilityId}` | CapabilityPatch; headers: `If-Match*` | local-fictional-data | [professional.routes.ts:23](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| GET | `/professionals/me/care-relationships` | —; query: `limit`, `before`, `status` | professional-eligibility-required | [app.ts:60](../../backend/services/professional-service/src/app.ts) |
| GET | `/professionals/me/qualifications` | —; query: `limit`, `before` | local-fictional-data | [professional.routes.ts:24](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| POST | `/professionals/me/qualifications` | Qualification; headers: `Idempotency-Key*` | local-fictional-data | [professional.routes.ts:25](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| GET | `/professionals/me/qualifications/{qualificationId}` | — | local-fictional-data | [professional.routes.ts:26](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| PATCH | `/professionals/me/qualifications/{qualificationId}` | QualificationPatch; headers: `If-Match*` | local-fictional-data | [professional.routes.ts:27](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| POST | `/professionals/me/reopen` | Empty; headers: `If-Match*`, `Idempotency-Key*` | local-fictional-data | [professional.routes.ts:15](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| GET | `/professionals/me/services` | —; query: `limit`, `before` | local-fictional-data | [professional.routes.ts:32](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| POST | `/professionals/me/services` | ProfessionalService | local-fictional-data | [professional.routes.ts:31](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| GET | `/professionals/me/services/{serviceId}` | — | local-fictional-data | [professional.routes.ts:33](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| PATCH | `/professionals/me/services/{serviceId}` | ProfessionalServicePatch; headers: `If-Match*` | local-fictional-data | [professional.routes.ts:34](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| POST | `/professionals/me/services/{serviceId}/deactivate` | Empty; headers: `If-Match*` | local-fictional-data | [professional.routes.ts:35](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| POST | `/professionals/me/submit` | ApplicationSubmit; headers: `If-Match*`, `Idempotency-Key*` | local-fictional-data | [professional.routes.ts:14](../../backend/services/professional-service/src/routes/professional.routes.ts) |
| GET | `/professionals/services` | —; query: `limit`, `before`, `q`, `category`, `capabilityId` | local-fictional-data | [app.ts:54](../../backend/services/professional-service/src/app.ts) |
| GET | `/professionals/specializations` | — | local-fictional-data | [professional.routes.ts:13](../../backend/services/professional-service/src/routes/professional.routes.ts) |

## gateway

| Método | Caminho | Payload / query / headers | Disponibilidade | Fonte |
|---|---|---|---|---|
| GET | `/health` | — | read-only-health | [app.ts:23](../../backend/api-gateway/src/app.ts) |
| GET | `/ready` | — | read-only-health | [app.ts:24](../../backend/api-gateway/src/app.ts) |

## hydration

| Método | Caminho | Payload / query / headers | Disponibilidade | Fonte |
|---|---|---|---|---|
| GET | `/hydration/goal` | — | local-fictional-data | [hydration.routes.ts:7](../../backend/services/hydration-service/src/routes/hydration.routes.ts) |
| PUT | `/hydration/goal` | HydrationGoal | local-fictional-data | [hydration.routes.ts:8](../../backend/services/hydration-service/src/routes/hydration.routes.ts) |
| GET | `/hydration/goal/history` | — | local-fictional-data | [hydration.routes.ts:9](../../backend/services/hydration-service/src/routes/hydration.routes.ts) |
| POST | `/hydration/goal/suggest` | HydrationSuggestion | local-fictional-data | [hydration.routes.ts:6](../../backend/services/hydration-service/src/routes/hydration.routes.ts) |
| GET | `/hydration/intakes` | —; query: `page`, `pageSize`, `from`, `to`, `timezone` | local-fictional-data | [hydration.routes.ts:12](../../backend/services/hydration-service/src/routes/hydration.routes.ts) |
| POST | `/hydration/intakes` | Intake | local-fictional-data | [hydration.routes.ts:10](../../backend/services/hydration-service/src/routes/hydration.routes.ts) |
| DELETE | `/hydration/intakes/{intakeId}` | — | local-fictional-data | [hydration.routes.ts:14](../../backend/services/hydration-service/src/routes/hydration.routes.ts) |
| PATCH | `/hydration/intakes/{intakeId}` | IntakePatch | local-fictional-data | [hydration.routes.ts:13](../../backend/services/hydration-service/src/routes/hydration.routes.ts) |
| GET | `/hydration/intakes/daily` | —; query: `date`, `timezone` | local-fictional-data | [hydration.routes.ts:11](../../backend/services/hydration-service/src/routes/hydration.routes.ts) |
| GET | `/hydration/reminders` | — | local-fictional-data | [hydration.routes.ts:15](../../backend/services/hydration-service/src/routes/hydration.routes.ts) |
| PUT | `/hydration/reminders` | Reminder | local-fictional-data | [hydration.routes.ts:16](../../backend/services/hydration-service/src/routes/hydration.routes.ts) |

## management

| Método | Caminho | Payload / query / headers | Disponibilidade | Fonte |
|---|---|---|---|---|
| GET | `/management/administration/applications` | —; query: `limit`, `before`, `status` | privileged-no-provisioned-admin | [administration.routes.ts:17](../../backend/services/management-service/src/routes/administration.routes.ts) |
| GET | `/management/administration/professionals` | —; query: `limit`, `before`, `q`, `status` | privileged-no-provisioned-admin | [administration.routes.ts:17](../../backend/services/management-service/src/routes/administration.routes.ts) |
| GET | `/management/administration/professionals/{id}/history` | —; query: `limit`, `before` | privileged-no-provisioned-admin | [administration.routes.ts:18](../../backend/services/management-service/src/routes/administration.routes.ts) |
| POST | `/management/administration/professionals/{id}/suspend` | contrato proprietário; headers: `If-Match*` | privileged-no-provisioned-admin | [administration.routes.ts:19](../../backend/services/management-service/src/routes/administration.routes.ts) |
| GET | `/management/administration/services` | —; query: `limit`, `before`, `q`, `status` | privileged-no-provisioned-admin | [administration.routes.ts:17](../../backend/services/management-service/src/routes/administration.routes.ts) |
| POST | `/management/administration/services/{id}/suspend` | contrato proprietário; headers: `If-Match*` | privileged-no-provisioned-admin | [administration.routes.ts:19](../../backend/services/management-service/src/routes/administration.routes.ts) |
| GET | `/management/appointments` | —; query: `limit`, `before`, `status` | privileged-no-provisioned-admin | [management.routes.ts:20](../../backend/services/management-service/src/routes/management.routes.ts) |
| GET | `/management/assignments` | —; query: `limit`, `before`, `status` | privileged-no-provisioned-admin | [management.routes.ts:18](../../backend/services/management-service/src/routes/management.routes.ts) |
| POST | `/management/assignments` | AssignmentRequest; headers: `X-Admin-Step-Up*` | privileged-no-provisioned-admin | [management.routes.ts:17](../../backend/services/management-service/src/routes/management.routes.ts) |
| POST | `/management/assignments/{id}/approve` | Empty; headers: `If-Match*`, `X-Admin-Step-Up*` | privileged-no-provisioned-admin | [management.routes.ts:19](../../backend/services/management-service/src/routes/management.routes.ts) |
| POST | `/management/assignments/{id}/approve-revocation` | Reason; headers: `If-Match*`, `X-Admin-Step-Up*` | privileged-no-provisioned-admin | [management.routes.ts:19](../../backend/services/management-service/src/routes/management.routes.ts) |
| GET | `/management/assignments/{id}/history` | —; query: `limit`, `before` | privileged-no-provisioned-admin | [management.routes.ts:13](../../backend/services/management-service/src/routes/management.routes.ts) |
| POST | `/management/assignments/{id}/reject` | contrato proprietário; headers: `If-Match*`, `X-Admin-Step-Up*` | privileged-no-provisioned-admin | [management.routes.ts:19](../../backend/services/management-service/src/routes/management.routes.ts) |
| POST | `/management/assignments/{id}/request-revocation` | Reason; headers: `If-Match*`, `X-Admin-Step-Up*` | privileged-no-provisioned-admin | [management.routes.ts:19](../../backend/services/management-service/src/routes/management.routes.ts) |
| GET | `/management/audit` | —; query: `limit`, `before` | privileged-no-provisioned-admin | [management.routes.ts:26](../../backend/services/management-service/src/routes/management.routes.ts) |
| GET | `/management/cases` | —; query: `limit`, `before`, `status`, `q` | privileged-no-provisioned-admin | [management.routes.ts:23](../../backend/services/management-service/src/routes/management.routes.ts) |
| POST | `/management/cases` | CaseCreate | privileged-no-provisioned-admin | [management.routes.ts:22](../../backend/services/management-service/src/routes/management.routes.ts) |
| PATCH | `/management/cases/{id}` | CaseTransition; headers: `If-Match*` | privileged-no-provisioned-admin | [management.routes.ts:24](../../backend/services/management-service/src/routes/management.routes.ts) |
| GET | `/management/cases/{id}/history` | —; query: `limit`, `before` | privileged-no-provisioned-admin | [management.routes.ts:25](../../backend/services/management-service/src/routes/management.routes.ts) |
| GET | `/management/dashboard` | —; query: `from`, `to` | privileged-no-provisioned-admin | [management.routes.ts:27](../../backend/services/management-service/src/routes/management.routes.ts) |
| GET | `/management/me` | — | privileged-no-provisioned-admin | [management.routes.ts:11](../../backend/services/management-service/src/routes/management.routes.ts) |
| GET | `/management/operators` | —; query: `limit`, `before`, `q`, `status` | privileged-no-provisioned-admin | [management.routes.ts:12](../../backend/services/management-service/src/routes/management.routes.ts) |
| POST | `/management/operators` | OperatorCreate; headers: `X-Admin-Step-Up*` | privileged-no-provisioned-admin | [management.routes.ts:14](../../backend/services/management-service/src/routes/management.routes.ts) |
| GET | `/management/payments` | —; query: `limit`, `before`, `status` | privileged-no-provisioned-admin | [management.routes.ts:20](../../backend/services/management-service/src/routes/management.routes.ts) |
| GET | `/management/professionals` | —; query: `limit`, `before`, `status`, `q` | privileged-no-provisioned-admin | [management.routes.ts:20](../../backend/services/management-service/src/routes/management.routes.ts) |
| GET | `/management/scopes` | —; query: `limit`, `before` | privileged-no-provisioned-admin | [management.routes.ts:16](../../backend/services/management-service/src/routes/management.routes.ts) |
| POST | `/management/scopes` | ScopeCreate; headers: `X-Admin-Step-Up*` | privileged-no-provisioned-admin | [management.routes.ts:15](../../backend/services/management-service/src/routes/management.routes.ts) |
| GET | `/management/services` | —; query: `limit`, `before`, `status`, `q` | privileged-no-provisioned-admin | [management.routes.ts:20](../../backend/services/management-service/src/routes/management.routes.ts) |
| POST | `/management/services/{id}/reactivate` | Reason; headers: `If-Match*` | privileged-no-provisioned-admin | [management.routes.ts:21](../../backend/services/management-service/src/routes/management.routes.ts) |
| POST | `/management/services/{id}/suspend` | Reason; headers: `If-Match*` | privileged-no-provisioned-admin | [management.routes.ts:21](../../backend/services/management-service/src/routes/management.routes.ts) |

## notification

| Método | Caminho | Payload / query / headers | Disponibilidade | Fonte |
|---|---|---|---|---|
| GET | `/notifications` | —; query: `page`, `pageSize`, `unread` | local-fictional-data | [notification.routes.ts:6](../../backend/services/notification-service/src/routes/notification.routes.ts) |
| POST | `/notifications/{notificationId}/read` | Empty | local-fictional-data | [notification.routes.ts:11](../../backend/services/notification-service/src/routes/notification.routes.ts) |
| GET | `/notifications/preferences` | — | local-fictional-data | [notification.routes.ts:9](../../backend/services/notification-service/src/routes/notification.routes.ts) |
| PUT | `/notifications/preferences` | NotificationPreferences | local-fictional-data | [notification.routes.ts:10](../../backend/services/notification-service/src/routes/notification.routes.ts) |
| POST | `/notifications/read-all` | Empty | local-fictional-data | [notification.routes.ts:8](../../backend/services/notification-service/src/routes/notification.routes.ts) |
| GET | `/notifications/unread-count` | — | local-fictional-data | [notification.routes.ts:7](../../backend/services/notification-service/src/routes/notification.routes.ts) |

## payment

| Método | Caminho | Payload / query / headers | Disponibilidade | Fonte |
|---|---|---|---|---|
| GET | `/payments` | — | local-fictional-data | [payment.routes.ts:7](../../backend/services/payment-service/src/routes/payment.routes.ts) |
| POST | `/payments` | PaymentInput; headers: `Idempotency-Key*` | local-fictional-data | [payment.routes.ts:6](../../backend/services/payment-service/src/routes/payment.routes.ts) |
| GET | `/payments/{paymentId}` | — | local-fictional-data | [payment.routes.ts:8](../../backend/services/payment-service/src/routes/payment.routes.ts) |
| POST | `/payments/{paymentId}/cancel` | Empty; headers: `Idempotency-Key*` | local-fictional-data | [payment.routes.ts:10](../../backend/services/payment-service/src/routes/payment.routes.ts) |
| POST | `/payments/{paymentId}/confirm` | Empty; headers: `Idempotency-Key*` | local-fictional-data | [payment.routes.ts:9](../../backend/services/payment-service/src/routes/payment.routes.ts) |
| GET | `/payments/appointment-payments/{id}` | — | payment-agenda-demo-blocked | [routes.ts:9](../../backend/services/payment-service/src/payment-demo/routes.ts) |
| POST | `/payments/appointment-payments/{id}/cancel` | Empty; headers: `Idempotency-Key*` | payment-agenda-demo-blocked | [routes.ts:10](../../backend/services/payment-service/src/payment-demo/routes.ts) |
| POST | `/payments/appointment-payments/{id}/confirm` | Empty; headers: `Idempotency-Key*` | payment-agenda-demo-blocked | [routes.ts:10](../../backend/services/payment-service/src/payment-demo/routes.ts) |
| POST | `/payments/appointment-payments/{id}/reconcile` | Empty | payment-agenda-demo-blocked | [routes.ts:10](../../backend/services/payment-service/src/payment-demo/routes.ts) |
| POST | `/payments/appointments/{appointmentId}` | Empty; headers: `Idempotency-Key*` | payment-agenda-demo-blocked | [routes.ts:8](../../backend/services/payment-service/src/payment-demo/routes.ts) |

## performance

| Método | Caminho | Payload / query / headers | Disponibilidade | Fonte |
|---|---|---|---|---|
| GET | `/performance/goals` | — | local-fictional-data | [performance.routes.ts:18](../../backend/services/performance-service/src/routes/performance.routes.ts) |
| PUT | `/performance/goals/{kind}` | PerformanceGoal | local-fictional-data | [performance.routes.ts:19](../../backend/services/performance-service/src/routes/performance.routes.ts) |
| GET | `/performance/heart-rate` | —; query: `page`, `pageSize`, `from`, `to` | local-fictional-data | [performance.routes.ts:17](../../backend/services/performance-service/src/routes/performance.routes.ts) |
| POST | `/performance/heart-rate` | HeartRate | local-fictional-data | [performance.routes.ts:15](../../backend/services/performance-service/src/routes/performance.routes.ts) |
| GET | `/performance/heart-rate/summary` | —; query: `page`, `pageSize`, `from`, `to` | local-fictional-data | [performance.routes.ts:16](../../backend/services/performance-service/src/routes/performance.routes.ts) |
| GET | `/performance/measurements` | —; query: `page`, `pageSize`, `from`, `to` | local-fictional-data | [performance.routes.ts:8](../../backend/services/performance-service/src/routes/performance.routes.ts) |
| POST | `/performance/measurements` | PerformanceMeasurement | local-fictional-data | [performance.routes.ts:6](../../backend/services/performance-service/src/routes/performance.routes.ts) |
| DELETE | `/performance/measurements/{measurementId}` | — | local-fictional-data | [performance.routes.ts:10](../../backend/services/performance-service/src/routes/performance.routes.ts) |
| PATCH | `/performance/measurements/{measurementId}` | PerformanceMeasurementPatch | local-fictional-data | [performance.routes.ts:9](../../backend/services/performance-service/src/routes/performance.routes.ts) |
| GET | `/performance/measurements/evolution` | —; query: `page`, `pageSize`, `from`, `to` | local-fictional-data | [performance.routes.ts:7](../../backend/services/performance-service/src/routes/performance.routes.ts) |
| GET | `/performance/steps` | —; query: `page`, `pageSize`, `from`, `to` | local-fictional-data | [performance.routes.ts:14](../../backend/services/performance-service/src/routes/performance.routes.ts) |
| POST | `/performance/steps` | Steps | local-fictional-data | [performance.routes.ts:11](../../backend/services/performance-service/src/routes/performance.routes.ts) |
| GET | `/performance/steps/daily` | —; query: `date`, `timezone` | local-fictional-data | [performance.routes.ts:12](../../backend/services/performance-service/src/routes/performance.routes.ts) |
| GET | `/performance/steps/summary` | —; query: `page`, `pageSize`, `from`, `to` | local-fictional-data | [performance.routes.ts:13](../../backend/services/performance-service/src/routes/performance.routes.ts) |
| GET | `/performance/summary` | — | local-fictional-data | [performance.routes.ts:20](../../backend/services/performance-service/src/routes/performance.routes.ts) |

## training

| Método | Caminho | Payload / query / headers | Disponibilidade | Fonte |
|---|---|---|---|---|
| GET | `/training/exercises` | —; query: `page`, `pageSize`, `environment`, `difficulty`, `type`, `muscleGroup` | local-fictional-data | [training.routes.ts:6](../../backend/services/training-service/src/routes/training.routes.ts) |
| POST | `/training/exercises` | Exercise | local-fictional-data | [training.routes.ts:7](../../backend/services/training-service/src/routes/training.routes.ts) |
| GET | `/training/exercises/{exerciseId}` | — | local-fictional-data | [training.routes.ts:8](../../backend/services/training-service/src/routes/training.routes.ts) |
| GET | `/training/plans` | —; query: `page`, `pageSize` | local-fictional-data | [training.routes.ts:10](../../backend/services/training-service/src/routes/training.routes.ts) |
| POST | `/training/plans` | Plan | local-fictional-data | [training.routes.ts:9](../../backend/services/training-service/src/routes/training.routes.ts) |
| GET | `/training/plans/{planId}` | — | local-fictional-data | [training.routes.ts:11](../../backend/services/training-service/src/routes/training.routes.ts) |
| PATCH | `/training/plans/{planId}` | PlanPatch | local-fictional-data | [training.routes.ts:12](../../backend/services/training-service/src/routes/training.routes.ts) |
| POST | `/training/plans/{planId}/archive` | Empty | local-fictional-data | [training.routes.ts:13](../../backend/services/training-service/src/routes/training.routes.ts) |
| POST | `/training/plans/{planId}/duplicate` | Empty | local-fictional-data | [training.routes.ts:14](../../backend/services/training-service/src/routes/training.routes.ts) |
| POST | `/training/plans/{planId}/exercises` | PlanExercise | local-fictional-data | [training.routes.ts:15](../../backend/services/training-service/src/routes/training.routes.ts) |
| DELETE | `/training/plans/{planId}/exercises/{exerciseId}` | — | local-fictional-data | [training.routes.ts:16](../../backend/services/training-service/src/routes/training.routes.ts) |
| GET | `/training/sessions` | —; query: `page`, `pageSize` | local-fictional-data | [training.routes.ts:18](../../backend/services/training-service/src/routes/training.routes.ts) |
| POST | `/training/sessions` | Session | local-fictional-data | [training.routes.ts:17](../../backend/services/training-service/src/routes/training.routes.ts) |
| GET | `/training/sessions/{sessionId}` | — | local-fictional-data | [training.routes.ts:19](../../backend/services/training-service/src/routes/training.routes.ts) |
| POST | `/training/sessions/{sessionId}/cancel` | Empty | local-fictional-data | [training.routes.ts:20](../../backend/services/training-service/src/routes/training.routes.ts) |
| POST | `/training/sessions/{sessionId}/complete` | Empty | local-fictional-data | [training.routes.ts:20](../../backend/services/training-service/src/routes/training.routes.ts) |
| POST | `/training/sessions/{sessionId}/exercises` | SessionExercise | local-fictional-data | [training.routes.ts:21](../../backend/services/training-service/src/routes/training.routes.ts) |
| POST | `/training/sessions/{sessionId}/pause` | Empty | local-fictional-data | [training.routes.ts:20](../../backend/services/training-service/src/routes/training.routes.ts) |
| POST | `/training/sessions/{sessionId}/resume` | Empty | local-fictional-data | [training.routes.ts:20](../../backend/services/training-service/src/routes/training.routes.ts) |
| POST | `/training/sessions/{sessionId}/start` | Empty | local-fictional-data | [training.routes.ts:20](../../backend/services/training-service/src/routes/training.routes.ts) |

## user

| Método | Caminho | Payload / query / headers | Disponibilidade | Fonte |
|---|---|---|---|---|
| GET | `/users/me` | — | local-fictional-data | [user.routes.ts:8](../../backend/services/user-service/src/routes/user.routes.ts) |
| PATCH | `/users/me` | ProfilePatch; headers: `If-Match*` | local-fictional-data | [user.routes.ts:10](../../backend/services/user-service/src/routes/user.routes.ts) |
| PUT | `/users/me` | Profile; headers: `If-None-Match*` | local-fictional-data | [user.routes.ts:9](../../backend/services/user-service/src/routes/user.routes.ts) |
| GET | `/users/me/goals` | —; query: `limit`, `cursor`, `status` | local-fictional-data | [user.routes.ts:22](../../backend/services/user-service/src/routes/user.routes.ts) |
| POST | `/users/me/goals` | UserGoal | local-fictional-data | [user.routes.ts:23](../../backend/services/user-service/src/routes/user.routes.ts) |
| GET | `/users/me/goals/{goalId}` | — | local-fictional-data | [user.routes.ts:24](../../backend/services/user-service/src/routes/user.routes.ts) |
| PATCH | `/users/me/goals/{goalId}` | UserGoalPatch; headers: `If-Match*` | local-fictional-data | [user.routes.ts:25](../../backend/services/user-service/src/routes/user.routes.ts) |
| GET | `/users/me/habits` | — | local-fictional-data | [user.routes.ts:14](../../backend/services/user-service/src/routes/user.routes.ts) |
| PATCH | `/users/me/habits` | HabitsPatch; headers: `If-Match*` | local-fictional-data | [user.routes.ts:16](../../backend/services/user-service/src/routes/user.routes.ts) |
| PUT | `/users/me/habits` | Habits; headers: `If-None-Match*` | local-fictional-data | [user.routes.ts:15](../../backend/services/user-service/src/routes/user.routes.ts) |
| GET | `/users/me/measurements` | —; query: `limit`, `cursor`, `kind` | local-fictional-data | [user.routes.ts:19](../../backend/services/user-service/src/routes/user.routes.ts) |
| POST | `/users/me/measurements` | UserMeasurement; headers: `Idempotency-Key*` | local-fictional-data | [user.routes.ts:20](../../backend/services/user-service/src/routes/user.routes.ts) |
| GET | `/users/me/measurements/{measurementId}` | — | local-fictional-data | [user.routes.ts:21](../../backend/services/user-service/src/routes/user.routes.ts) |
| GET | `/users/me/physical-data` | — | local-fictional-data | [user.routes.ts:17](../../backend/services/user-service/src/routes/user.routes.ts) |
| GET | `/users/me/preferences` | — | local-fictional-data | [user.routes.ts:11](../../backend/services/user-service/src/routes/user.routes.ts) |
| PATCH | `/users/me/preferences` | PreferencesPatch; headers: `If-Match*` | local-fictional-data | [user.routes.ts:13](../../backend/services/user-service/src/routes/user.routes.ts) |
| PUT | `/users/me/preferences` | Preferences; headers: `If-None-Match*` | local-fictional-data | [user.routes.ts:12](../../backend/services/user-service/src/routes/user.routes.ts) |
| GET | `/users/me/weight-history` | —; query: `limit`, `cursor`, `kind` | local-fictional-data | [user.routes.ts:18](../../backend/services/user-service/src/routes/user.routes.ts) |
