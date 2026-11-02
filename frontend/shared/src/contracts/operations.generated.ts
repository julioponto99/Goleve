// Generated public operations, no internal URLs or credentials.
export const publicOperations = [
  {
    "method": "get",
    "path": "/agenda/activities",
    "service": "agenda"
  },
  {
    "method": "post",
    "path": "/agenda/activities",
    "service": "agenda"
  },
  {
    "method": "get",
    "path": "/agenda/activities/{activityId}",
    "service": "agenda"
  },
  {
    "method": "patch",
    "path": "/agenda/activities/{activityId}",
    "service": "agenda"
  },
  {
    "method": "post",
    "path": "/agenda/activities/{activityId}/cancel",
    "service": "agenda"
  },
  {
    "method": "post",
    "path": "/agenda/activities/{activityId}/complete",
    "service": "agenda"
  },
  {
    "method": "get",
    "path": "/agenda/professional-appointments",
    "service": "agenda"
  },
  {
    "method": "post",
    "path": "/agenda/professional-appointments",
    "service": "agenda"
  },
  {
    "method": "get",
    "path": "/agenda/professional-appointments/{id}",
    "service": "agenda"
  },
  {
    "method": "post",
    "path": "/agenda/professional-appointments/{id}/cancel",
    "service": "agenda"
  },
  {
    "method": "get",
    "path": "/agenda/professional-appointments/{id}/history",
    "service": "agenda"
  },
  {
    "method": "post",
    "path": "/agenda/professional-appointments/{id}/reschedule",
    "service": "agenda"
  },
  {
    "method": "post",
    "path": "/agenda/professional-appointments/{id}/service",
    "service": "agenda"
  },
  {
    "method": "get",
    "path": "/agenda/professional/appointments",
    "service": "agenda"
  },
  {
    "method": "post",
    "path": "/agenda/professional/appointments/{id}/accept",
    "service": "agenda"
  },
  {
    "method": "post",
    "path": "/agenda/professional/appointments/{id}/cancel",
    "service": "agenda"
  },
  {
    "method": "post",
    "path": "/agenda/professional/appointments/{id}/complete",
    "service": "agenda"
  },
  {
    "method": "post",
    "path": "/agenda/professional/appointments/{id}/decline",
    "service": "agenda"
  },
  {
    "method": "get",
    "path": "/agenda/professional/availability-exceptions",
    "service": "agenda"
  },
  {
    "method": "post",
    "path": "/agenda/professional/availability-exceptions",
    "service": "agenda"
  },
  {
    "method": "delete",
    "path": "/agenda/professional/availability-exceptions/{id}",
    "service": "agenda"
  },
  {
    "method": "get",
    "path": "/agenda/professional/availability-rules",
    "service": "agenda"
  },
  {
    "method": "post",
    "path": "/agenda/professional/availability-rules",
    "service": "agenda"
  },
  {
    "method": "delete",
    "path": "/agenda/professional/availability-rules/{id}",
    "service": "agenda"
  },
  {
    "method": "patch",
    "path": "/agenda/professional/availability-rules/{id}",
    "service": "agenda"
  },
  {
    "method": "get",
    "path": "/agenda/professionals/{professionalId}/availability",
    "service": "agenda"
  },
  {
    "method": "get",
    "path": "/ai-coach/capabilities",
    "service": "coach"
  },
  {
    "method": "get",
    "path": "/ai-coach/conversations",
    "service": "coach"
  },
  {
    "method": "post",
    "path": "/ai-coach/conversations",
    "service": "coach"
  },
  {
    "method": "delete",
    "path": "/ai-coach/conversations/{id}",
    "service": "coach"
  },
  {
    "method": "get",
    "path": "/ai-coach/conversations/{id}/actions",
    "service": "coach"
  },
  {
    "method": "get",
    "path": "/ai-coach/conversations/{id}/messages",
    "service": "coach"
  },
  {
    "method": "post",
    "path": "/ai-coach/conversations/{id}/messages",
    "service": "coach"
  },
  {
    "method": "patch",
    "path": "/ai-coach/conversations/{id}/permissions",
    "service": "coach"
  },
  {
    "method": "get",
    "path": "/ai-coach/conversations/{id}/proposals",
    "service": "coach"
  },
  {
    "method": "get",
    "path": "/ai-coach/conversations/{id}/recommendations",
    "service": "coach"
  },
  {
    "method": "post",
    "path": "/ai-coach/proposals/{id}/confirm",
    "service": "coach"
  },
  {
    "method": "post",
    "path": "/ai-coach/proposals/{id}/reconcile",
    "service": "coach"
  },
  {
    "method": "post",
    "path": "/ai-coach/proposals/{id}/reject",
    "service": "coach"
  },
  {
    "method": "post",
    "path": "/auth/admin/step-up",
    "service": "auth"
  },
  {
    "method": "get",
    "path": "/auth/administration/audit",
    "service": "auth"
  },
  {
    "method": "get",
    "path": "/auth/administration/role-requests",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/auth/administration/role-requests/{id}/approve",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/auth/administration/role-requests/{id}/reject",
    "service": "auth"
  },
  {
    "method": "get",
    "path": "/auth/administration/users",
    "service": "auth"
  },
  {
    "method": "get",
    "path": "/auth/administration/users/{id}",
    "service": "auth"
  },
  {
    "method": "get",
    "path": "/auth/administration/users/{id}/history",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/auth/administration/users/{id}/reactivate",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/auth/administration/users/{id}/revoke",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/auth/administration/users/{id}/role-requests",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/auth/administration/users/{id}/suspend",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/auth/initial-admin-invitation/accept",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/auth/login",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/auth/logout",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/auth/manager-invitations",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/auth/manager-invitations/{id}/revoke",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/auth/manager-invitations/accept",
    "service": "auth"
  },
  {
    "method": "get",
    "path": "/auth/me",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/auth/mfa/complete",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/auth/mfa/enroll",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/auth/register",
    "service": "auth"
  },
  {
    "method": "get",
    "path": "/auth/sessions",
    "service": "auth"
  },
  {
    "method": "post",
    "path": "/care-relationships",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/care-relationships/{relationshipId}",
    "service": "professional"
  },
  {
    "method": "post",
    "path": "/care-relationships/{relationshipId}/accept",
    "service": "professional"
  },
  {
    "method": "post",
    "path": "/care-relationships/{relationshipId}/cancel",
    "service": "professional"
  },
  {
    "method": "post",
    "path": "/care-relationships/{relationshipId}/decline",
    "service": "professional"
  },
  {
    "method": "post",
    "path": "/care-relationships/{relationshipId}/end",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/care-relationships/{relationshipId}/history",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/care-relationships/me",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/health",
    "service": "gateway"
  },
  {
    "method": "get",
    "path": "/hydration/goal",
    "service": "hydration"
  },
  {
    "method": "put",
    "path": "/hydration/goal",
    "service": "hydration"
  },
  {
    "method": "get",
    "path": "/hydration/goal/history",
    "service": "hydration"
  },
  {
    "method": "post",
    "path": "/hydration/goal/suggest",
    "service": "hydration"
  },
  {
    "method": "get",
    "path": "/hydration/intakes",
    "service": "hydration"
  },
  {
    "method": "post",
    "path": "/hydration/intakes",
    "service": "hydration"
  },
  {
    "method": "delete",
    "path": "/hydration/intakes/{intakeId}",
    "service": "hydration"
  },
  {
    "method": "patch",
    "path": "/hydration/intakes/{intakeId}",
    "service": "hydration"
  },
  {
    "method": "get",
    "path": "/hydration/intakes/daily",
    "service": "hydration"
  },
  {
    "method": "get",
    "path": "/hydration/reminders",
    "service": "hydration"
  },
  {
    "method": "put",
    "path": "/hydration/reminders",
    "service": "hydration"
  },
  {
    "method": "get",
    "path": "/management/administration/applications",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/administration/professionals",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/administration/professionals/{id}/history",
    "service": "management"
  },
  {
    "method": "post",
    "path": "/management/administration/professionals/{id}/suspend",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/administration/services",
    "service": "management"
  },
  {
    "method": "post",
    "path": "/management/administration/services/{id}/suspend",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/appointments",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/assignments",
    "service": "management"
  },
  {
    "method": "post",
    "path": "/management/assignments",
    "service": "management"
  },
  {
    "method": "post",
    "path": "/management/assignments/{id}/approve",
    "service": "management"
  },
  {
    "method": "post",
    "path": "/management/assignments/{id}/approve-revocation",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/assignments/{id}/history",
    "service": "management"
  },
  {
    "method": "post",
    "path": "/management/assignments/{id}/reject",
    "service": "management"
  },
  {
    "method": "post",
    "path": "/management/assignments/{id}/request-revocation",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/audit",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/cases",
    "service": "management"
  },
  {
    "method": "post",
    "path": "/management/cases",
    "service": "management"
  },
  {
    "method": "patch",
    "path": "/management/cases/{id}",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/cases/{id}/history",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/dashboard",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/me",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/operators",
    "service": "management"
  },
  {
    "method": "post",
    "path": "/management/operators",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/payments",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/professional-applications",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/management/professional-applications/{applicationId}",
    "service": "professional"
  },
  {
    "method": "post",
    "path": "/management/professional-applications/{applicationId}/approve",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/management/professional-applications/{applicationId}/history",
    "service": "professional"
  },
  {
    "method": "post",
    "path": "/management/professional-applications/{applicationId}/reject",
    "service": "professional"
  },
  {
    "method": "post",
    "path": "/management/professional-applications/{applicationId}/suspend",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/management/professionals",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/scopes",
    "service": "management"
  },
  {
    "method": "post",
    "path": "/management/scopes",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/management/services",
    "service": "management"
  },
  {
    "method": "post",
    "path": "/management/services/{id}/reactivate",
    "service": "management"
  },
  {
    "method": "post",
    "path": "/management/services/{id}/suspend",
    "service": "management"
  },
  {
    "method": "get",
    "path": "/notifications",
    "service": "notification"
  },
  {
    "method": "post",
    "path": "/notifications/{notificationId}/read",
    "service": "notification"
  },
  {
    "method": "get",
    "path": "/notifications/preferences",
    "service": "notification"
  },
  {
    "method": "put",
    "path": "/notifications/preferences",
    "service": "notification"
  },
  {
    "method": "post",
    "path": "/notifications/read-all",
    "service": "notification"
  },
  {
    "method": "get",
    "path": "/notifications/unread-count",
    "service": "notification"
  },
  {
    "method": "get",
    "path": "/payments",
    "service": "payment"
  },
  {
    "method": "post",
    "path": "/payments",
    "service": "payment"
  },
  {
    "method": "get",
    "path": "/payments/{paymentId}",
    "service": "payment"
  },
  {
    "method": "post",
    "path": "/payments/{paymentId}/cancel",
    "service": "payment"
  },
  {
    "method": "post",
    "path": "/payments/{paymentId}/confirm",
    "service": "payment"
  },
  {
    "method": "get",
    "path": "/payments/appointment-payments/{id}",
    "service": "payment"
  },
  {
    "method": "post",
    "path": "/payments/appointment-payments/{id}/cancel",
    "service": "payment"
  },
  {
    "method": "post",
    "path": "/payments/appointment-payments/{id}/confirm",
    "service": "payment"
  },
  {
    "method": "post",
    "path": "/payments/appointment-payments/{id}/reconcile",
    "service": "payment"
  },
  {
    "method": "post",
    "path": "/payments/appointments/{appointmentId}",
    "service": "payment"
  },
  {
    "method": "get",
    "path": "/performance/goals",
    "service": "performance"
  },
  {
    "method": "put",
    "path": "/performance/goals/{kind}",
    "service": "performance"
  },
  {
    "method": "get",
    "path": "/performance/heart-rate",
    "service": "performance"
  },
  {
    "method": "post",
    "path": "/performance/heart-rate",
    "service": "performance"
  },
  {
    "method": "get",
    "path": "/performance/heart-rate/summary",
    "service": "performance"
  },
  {
    "method": "get",
    "path": "/performance/measurements",
    "service": "performance"
  },
  {
    "method": "post",
    "path": "/performance/measurements",
    "service": "performance"
  },
  {
    "method": "delete",
    "path": "/performance/measurements/{measurementId}",
    "service": "performance"
  },
  {
    "method": "patch",
    "path": "/performance/measurements/{measurementId}",
    "service": "performance"
  },
  {
    "method": "get",
    "path": "/performance/measurements/evolution",
    "service": "performance"
  },
  {
    "method": "get",
    "path": "/performance/steps",
    "service": "performance"
  },
  {
    "method": "post",
    "path": "/performance/steps",
    "service": "performance"
  },
  {
    "method": "get",
    "path": "/performance/steps/daily",
    "service": "performance"
  },
  {
    "method": "get",
    "path": "/performance/steps/summary",
    "service": "performance"
  },
  {
    "method": "get",
    "path": "/performance/summary",
    "service": "performance"
  },
  {
    "method": "get",
    "path": "/professionals/catalog",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/professionals/eligible-capabilities",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/professionals/me",
    "service": "professional"
  },
  {
    "method": "patch",
    "path": "/professionals/me",
    "service": "professional"
  },
  {
    "method": "put",
    "path": "/professionals/me",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/professionals/me/application-status",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/professionals/me/availability-declaration",
    "service": "professional"
  },
  {
    "method": "patch",
    "path": "/professionals/me/availability-declaration",
    "service": "professional"
  },
  {
    "method": "put",
    "path": "/professionals/me/availability-declaration",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/professionals/me/capabilities",
    "service": "professional"
  },
  {
    "method": "post",
    "path": "/professionals/me/capabilities",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/professionals/me/capabilities/{capabilityId}",
    "service": "professional"
  },
  {
    "method": "patch",
    "path": "/professionals/me/capabilities/{capabilityId}",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/professionals/me/care-relationships",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/professionals/me/qualifications",
    "service": "professional"
  },
  {
    "method": "post",
    "path": "/professionals/me/qualifications",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/professionals/me/qualifications/{qualificationId}",
    "service": "professional"
  },
  {
    "method": "patch",
    "path": "/professionals/me/qualifications/{qualificationId}",
    "service": "professional"
  },
  {
    "method": "post",
    "path": "/professionals/me/reopen",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/professionals/me/services",
    "service": "professional"
  },
  {
    "method": "post",
    "path": "/professionals/me/services",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/professionals/me/services/{serviceId}",
    "service": "professional"
  },
  {
    "method": "patch",
    "path": "/professionals/me/services/{serviceId}",
    "service": "professional"
  },
  {
    "method": "post",
    "path": "/professionals/me/services/{serviceId}/deactivate",
    "service": "professional"
  },
  {
    "method": "post",
    "path": "/professionals/me/submit",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/professionals/services",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/professionals/specializations",
    "service": "professional"
  },
  {
    "method": "get",
    "path": "/ready",
    "service": "gateway"
  },
  {
    "method": "get",
    "path": "/training/exercises",
    "service": "training"
  },
  {
    "method": "post",
    "path": "/training/exercises",
    "service": "training"
  },
  {
    "method": "get",
    "path": "/training/exercises/{exerciseId}",
    "service": "training"
  },
  {
    "method": "get",
    "path": "/training/plans",
    "service": "training"
  },
  {
    "method": "post",
    "path": "/training/plans",
    "service": "training"
  },
  {
    "method": "get",
    "path": "/training/plans/{planId}",
    "service": "training"
  },
  {
    "method": "patch",
    "path": "/training/plans/{planId}",
    "service": "training"
  },
  {
    "method": "post",
    "path": "/training/plans/{planId}/archive",
    "service": "training"
  },
  {
    "method": "post",
    "path": "/training/plans/{planId}/duplicate",
    "service": "training"
  },
  {
    "method": "post",
    "path": "/training/plans/{planId}/exercises",
    "service": "training"
  },
  {
    "method": "delete",
    "path": "/training/plans/{planId}/exercises/{exerciseId}",
    "service": "training"
  },
  {
    "method": "get",
    "path": "/training/sessions",
    "service": "training"
  },
  {
    "method": "post",
    "path": "/training/sessions",
    "service": "training"
  },
  {
    "method": "get",
    "path": "/training/sessions/{sessionId}",
    "service": "training"
  },
  {
    "method": "post",
    "path": "/training/sessions/{sessionId}/cancel",
    "service": "training"
  },
  {
    "method": "post",
    "path": "/training/sessions/{sessionId}/complete",
    "service": "training"
  },
  {
    "method": "post",
    "path": "/training/sessions/{sessionId}/exercises",
    "service": "training"
  },
  {
    "method": "post",
    "path": "/training/sessions/{sessionId}/pause",
    "service": "training"
  },
  {
    "method": "post",
    "path": "/training/sessions/{sessionId}/resume",
    "service": "training"
  },
  {
    "method": "post",
    "path": "/training/sessions/{sessionId}/start",
    "service": "training"
  },
  {
    "method": "get",
    "path": "/users/me",
    "service": "user"
  },
  {
    "method": "patch",
    "path": "/users/me",
    "service": "user"
  },
  {
    "method": "put",
    "path": "/users/me",
    "service": "user"
  },
  {
    "method": "get",
    "path": "/users/me/goals",
    "service": "user"
  },
  {
    "method": "post",
    "path": "/users/me/goals",
    "service": "user"
  },
  {
    "method": "get",
    "path": "/users/me/goals/{goalId}",
    "service": "user"
  },
  {
    "method": "patch",
    "path": "/users/me/goals/{goalId}",
    "service": "user"
  },
  {
    "method": "get",
    "path": "/users/me/habits",
    "service": "user"
  },
  {
    "method": "patch",
    "path": "/users/me/habits",
    "service": "user"
  },
  {
    "method": "put",
    "path": "/users/me/habits",
    "service": "user"
  },
  {
    "method": "get",
    "path": "/users/me/measurements",
    "service": "user"
  },
  {
    "method": "post",
    "path": "/users/me/measurements",
    "service": "user"
  },
  {
    "method": "get",
    "path": "/users/me/measurements/{measurementId}",
    "service": "user"
  },
  {
    "method": "get",
    "path": "/users/me/physical-data",
    "service": "user"
  },
  {
    "method": "get",
    "path": "/users/me/preferences",
    "service": "user"
  },
  {
    "method": "patch",
    "path": "/users/me/preferences",
    "service": "user"
  },
  {
    "method": "put",
    "path": "/users/me/preferences",
    "service": "user"
  },
  {
    "method": "get",
    "path": "/users/me/weight-history",
    "service": "user"
  }
] as const;
