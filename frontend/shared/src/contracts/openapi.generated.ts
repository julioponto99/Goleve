// Generated from the verified public Gateway document. Do not edit.
// Some owner responses are deliberately generic; decode them at the boundary.
export interface paths {
    "/agenda/activities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List own personal agenda (actual implemented path)
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["agenda_get___agenda__activities"];
        put?: never;
        /**
         * Create own activity; overlapping times return a warning
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["agenda_post___agenda__activities"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/activities/{activityId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read one own activity
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["agenda_get___agenda__activities___activityId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Edit only future planned activity
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["agenda_patch___agenda__activities___activityId"];
        trace?: never;
    };
    "/agenda/activities/{activityId}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * cancel a planned activity using server time
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["agenda_post___agenda__activities___activityId___cancel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/activities/{activityId}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * complete a planned activity using server time
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["agenda_post___agenda__activities___activityId___complete"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/professional-appointments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.own
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["agenda_get___agenda__professional_appointments"];
        put?: never;
        /**
         * c.request
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["agenda_post___agenda__professional_appointments"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/professional-appointments/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.get
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["agenda_get___agenda__professional_appointments___id"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/professional-appointments/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * c.resolve
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["agenda_post___agenda__professional_appointments___id___cancel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/professional-appointments/{id}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.history
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["agenda_get___agenda__professional_appointments___id___history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/professional-appointments/{id}/reschedule": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * c.reschedule
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["agenda_post___agenda__professional_appointments___id___reschedule"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/professional-appointments/{id}/service": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * async
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["agenda_post___agenda__professional_appointments___id___service"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/professional/appointments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.received
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["agenda_get___agenda__professional__appointments"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/professional/appointments/{id}/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * c.resolve
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["agenda_post___agenda__professional__appointments___id___accept"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/professional/appointments/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * c.resolve
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["agenda_post___agenda__professional__appointments___id___cancel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/professional/appointments/{id}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * c.resolve
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["agenda_post___agenda__professional__appointments___id___complete"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/professional/appointments/{id}/decline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * c.resolve
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["agenda_post___agenda__professional__appointments___id___decline"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/professional/availability-exceptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.exceptions
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["agenda_get___agenda__professional__availability_exceptions"];
        put?: never;
        /**
         * c.createException
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["agenda_post___agenda__professional__availability_exceptions"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/professional/availability-exceptions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * c.removeException
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        delete: operations["agenda_delete___agenda__professional__availability_exceptions___id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/professional/availability-rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.rules
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["agenda_get___agenda__professional__availability_rules"];
        put?: never;
        /**
         * c.createRule
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["agenda_post___agenda__professional__availability_rules"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agenda/professional/availability-rules/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * c.removeRule
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        delete: operations["agenda_delete___agenda__professional__availability_rules___id"];
        options?: never;
        head?: never;
        /**
         * c.updateRule
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["agenda_patch___agenda__professional__availability_rules___id"];
        trace?: never;
    };
    "/agenda/professionals/{professionalId}/availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.availability
         * @description Repository owner documentation: documentation/api/professional-agenda.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["agenda_get___agenda__professionals___professionalId___availability"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-coach/capabilities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Authenticated route; Coach is disabled in this stack
         * @description Repository owner documentation: documentation/api/ai-coach.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["coach_get___ai_coach__capabilities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-coach/conversations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.list
         * @description Repository owner documentation: documentation/api/ai-coach.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["coach_get___ai_coach__conversations"];
        put?: never;
        /**
         * c.create
         * @description Repository owner documentation: documentation/api/ai-coach.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["coach_post___ai_coach__conversations"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-coach/conversations/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * c.remove
         * @description Repository owner documentation: documentation/api/ai-coach.md. See x-availability; route availability does not grant privileges.
         */
        delete: operations["coach_delete___ai_coach__conversations___id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-coach/conversations/{id}/actions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.actions
         * @description Repository owner documentation: documentation/api/ai-coach.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["coach_get___ai_coach__conversations___id___actions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-coach/conversations/{id}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.history
         * @description Repository owner documentation: documentation/api/ai-coach.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["coach_get___ai_coach__conversations___id___messages"];
        put?: never;
        /**
         * c.send
         * @description Repository owner documentation: documentation/api/ai-coach.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["coach_post___ai_coach__conversations___id___messages"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-coach/conversations/{id}/permissions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * c.permissions
         * @description Repository owner documentation: documentation/api/ai-coach.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["coach_patch___ai_coach__conversations___id___permissions"];
        trace?: never;
    };
    "/ai-coach/conversations/{id}/proposals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.proposals
         * @description Repository owner documentation: documentation/api/ai-coach.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["coach_get___ai_coach__conversations___id___proposals"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-coach/conversations/{id}/recommendations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.recommendations
         * @description Repository owner documentation: documentation/api/ai-coach.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["coach_get___ai_coach__conversations___id___recommendations"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-coach/proposals/{id}/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * c.confirm
         * @description Repository owner documentation: documentation/api/ai-coach.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["coach_post___ai_coach__proposals___id___confirm"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-coach/proposals/{id}/reconcile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * c.reconcile
         * @description Repository owner documentation: documentation/api/ai-coach.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["coach_post___ai_coach__proposals___id___reconcile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ai-coach/proposals/{id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * c.reject
         * @description Repository owner documentation: documentation/api/ai-coach.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["coach_post___ai_coach__proposals___id___reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/admin/step-up": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Reauthenticate and issue a bound one-use authorization
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__admin__step_up"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/administration/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read minimum administrative audit
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["auth_get___auth__administration__audit"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/administration/role-requests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List role-change requests
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["auth_get___auth__administration__role_requests"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/administration/role-requests/{id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Independent decision on a role change
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__administration__role_requests___id___approve"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/administration/role-requests/{id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Independent decision on a role change
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__administration__role_requests___id___reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/administration/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Search identity metadata; active MFA administrator and quorum
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["auth_get___auth__administration__users"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/administration/users/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get identity metadata
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["auth_get___auth__administration__users___id"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/administration/users/{id}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get administrative history for one account
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["auth_get___auth__administration__users___id___history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/administration/users/{id}/reactivate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Administrative account reactivate
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__administration__users___id___reactivate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/administration/users/{id}/revoke": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Administrative account revoke
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__administration__users___id___revoke"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/administration/users/{id}/role-requests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Request a role change without changing own role
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__administration__users___id___role_requests"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/administration/users/{id}/suspend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Administrative account suspend
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__administration__users___id___suspend"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/initial-admin-invitation/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Accept the single CLI-issued second administrator invitation
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__initial_admin_invitation__accept"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Password login; administrator returns MFA challenge instead of privileged JWT
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Revoke current session
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/manager-invitations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * issue Manager Invitation
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__manager_invitations"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/manager-invitations/{id}/revoke": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * revoke Manager Invitation
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__manager_invitations___id___revoke"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/manager-invitations/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * accept Manager Invitation
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__manager_invitations__accept"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Confirm current identity and session, including suspension and revocation
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["auth_get___auth__me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/mfa/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Complete TOTP or consume a recovery code atomically
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__mfa__complete"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/mfa/enroll": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Enroll initial real TOTP using password and login challenge
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__mfa__enroll"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create only a normal fictional user and a persistent session
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["auth_post___auth__register"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List current own sessions
         * @description Repository owner documentation: documentation/api/administration-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["auth_get___auth__sessions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/care-relationships": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * controller.create
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["professional_post___care_relationships"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/care-relationships/{relationshipId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.get
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___care_relationships___relationshipId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/care-relationships/{relationshipId}/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * controller.command
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["professional_post___care_relationships___relationshipId___accept"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/care-relationships/{relationshipId}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * controller.command
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["professional_post___care_relationships___relationshipId___cancel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/care-relationships/{relationshipId}/decline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * controller.command
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["professional_post___care_relationships___relationshipId___decline"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/care-relationships/{relationshipId}/end": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * controller.command
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["professional_post___care_relationships___relationshipId___end"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/care-relationships/{relationshipId}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.history
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___care_relationships___relationshipId___history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/care-relationships/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.list
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___care_relationships__me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Gateway HTTP liveness
         * @description Repository owner documentation: documentation/api/../release-v1/local-setup.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["gateway_get___health"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/hydration/goal": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read own hydration goal
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["hydration_get___hydration__goal"];
        /**
         * Set own hydration goal; version prevents conflicting updates
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        put: operations["hydration_put___hydration__goal"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/hydration/goal/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.goalHistory
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["hydration_get___hydration__goal__history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/hydration/goal/suggest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * controller.suggest
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["hydration_post___hydration__goal__suggest"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/hydration/intakes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.history
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["hydration_get___hydration__intakes"];
        put?: never;
        /**
         * Record intake idempotently and write notification outbox in the same transaction
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["hydration_post___hydration__intakes"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/hydration/intakes/{intakeId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * controller.deleteIntake
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        delete: operations["hydration_delete___hydration__intakes___intakeId"];
        options?: never;
        head?: never;
        /**
         * controller.updateIntake
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["hydration_patch___hydration__intakes___intakeId"];
        trace?: never;
    };
    "/hydration/intakes/daily": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.daily
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["hydration_get___hydration__intakes__daily"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/hydration/reminders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.getReminder
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["hydration_get___hydration__reminders"];
        /**
         * controller.setReminder
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        put: operations["hydration_put___hydration__reminders"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/administration/applications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read minimum administrative applications
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__administration__applications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/administration/professionals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read minimum administrative professionals
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__administration__professionals"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/administration/professionals/{id}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read professional administrative decisions
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__administration__professionals___id___history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/administration/professionals/{id}/suspend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Suspend professionals without cancelling reservations or payments
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["management_post___management__administration__professionals___id___suspend"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/administration/services": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read minimum administrative services
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__administration__services"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/administration/services/{id}/suspend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Suspend services without cancelling reservations or payments
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["management_post___management__administration__services___id___suspend"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/appointments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list Appointment Records
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__appointments"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/assignments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list Assignments
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__assignments"];
        put?: never;
        /**
         * request Assignment
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["management_post___management__assignments"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/assignments/{id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * assignment Approve
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["management_post___management__assignments___id___approve"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/assignments/{id}/approve-revocation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * assignment Approve Revocation
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["management_post___management__assignments___id___approve_revocation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/assignments/{id}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Administrative history of an assignment
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__assignments___id___history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/assignments/{id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Reject a pending scope assignment independently
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["management_post___management__assignments___id___reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/assignments/{id}/request-revocation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * assignment Request Revocation
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["management_post___management__assignments___id___request_revocation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list Audit Records
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__audit"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/cases": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list Case Records
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__cases"];
        put?: never;
        /**
         * create Case
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["management_post___management__cases"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/cases/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * transition Case
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["management_patch___management__cases___id"];
        trace?: never;
    };
    "/management/cases/{id}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * get Case History
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__cases___id___history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * get Operational Dashboard
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__dashboard"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * get Manager Profile
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/operators": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List manager profiles and current Auth role/account state
         * @description Items include currentRole and accountStatus confirmed through Auth. Administrator MFA and quorum required. Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__operators"];
        put?: never;
        /**
         * create Operator
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["management_post___management__operators"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list Payment Records
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__payments"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/professional-applications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.list
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___management__professional_applications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/professional-applications/{applicationId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.detail
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___management__professional_applications___applicationId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/professional-applications/{applicationId}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * controller.decide
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["professional_post___management__professional_applications___applicationId___approve"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/professional-applications/{applicationId}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.history
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___management__professional_applications___applicationId___history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/professional-applications/{applicationId}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * controller.decide
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["professional_post___management__professional_applications___applicationId___reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/professional-applications/{applicationId}/suspend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * controller.decide
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["professional_post___management__professional_applications___applicationId___suspend"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/professionals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list Professional Records
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__professionals"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/scopes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list Scopes
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__scopes"];
        put?: never;
        /**
         * create Scope
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["management_post___management__scopes"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/services": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * list Service Records
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["management_get___management__services"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/services/{id}/reactivate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * reactivate Service
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["management_post___management__services___id___reactivate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/management/services/{id}/suspend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * suspend Service
         * @description Repository owner documentation: documentation/api/management-v1.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["management_post___management__services___id___suspend"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List own internal notifications
         * @description Repository owner documentation: documentation/api/notification-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["notification_get___notifications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/{notificationId}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Mark own notification read
         * @description Repository owner documentation: documentation/api/notification-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["notification_post___notifications___notificationId___read"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.getPreferences
         * @description Repository owner documentation: documentation/api/notification-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["notification_get___notifications__preferences"];
        /**
         * controller.setPreferences
         * @description Repository owner documentation: documentation/api/notification-service.md. See x-availability; route availability does not grant privileges.
         */
        put: operations["notification_put___notifications__preferences"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/read-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * controller.markAllRead
         * @description Repository owner documentation: documentation/api/notification-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["notification_post___notifications__read_all"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/unread-count": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Count own unread notifications
         * @description Repository owner documentation: documentation/api/notification-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["notification_get___notifications__unread_count"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List own simulated payments
         * @description Repository owner documentation: documentation/api/payment-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["payment_get___payments"];
        put?: never;
        /**
         * Standalone local MockBank payment; not payment of an accepted appointment
         * @description Repository owner documentation: documentation/api/payment-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["payment_post___payments"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{paymentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read own simulated payment
         * @description Repository owner documentation: documentation/api/payment-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["payment_get___payments___paymentId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{paymentId}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * cancel standalone simulated payment; preserve history
         * @description Repository owner documentation: documentation/api/payment-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["payment_post___payments___paymentId___cancel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{paymentId}/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * confirm standalone simulated payment; preserve history
         * @description Repository owner documentation: documentation/api/payment-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["payment_post___payments___paymentId___confirm"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/appointment-payments/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * work
         * @description Repository owner documentation: documentation/api/payment-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["payment_get___payments__appointment_payments___id"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/appointment-payments/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * work
         * @description Repository owner documentation: documentation/api/payment-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["payment_post___payments__appointment_payments___id___cancel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/appointment-payments/{id}/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * work
         * @description Repository owner documentation: documentation/api/payment-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["payment_post___payments__appointment_payments___id___confirm"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/appointment-payments/{id}/reconcile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * work
         * @description Repository owner documentation: documentation/api/payment-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["payment_post___payments__appointment_payments___id___reconcile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/appointments/{appointmentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * work
         * @description Repository owner documentation: documentation/api/payment-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["payment_post___payments__appointments___appointmentId"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/performance/goals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List own performance goals
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["performance_get___performance__goals"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/performance/goals/{kind}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * controller.setGoal
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        put: operations["performance_put___performance__goals___kind"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/performance/heart-rate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.heartRateHistory
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["performance_get___performance__heart_rate"];
        put?: never;
        /**
         * controller.createHeartRate
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["performance_post___performance__heart_rate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/performance/heart-rate/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.heartRateSummary
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["performance_get___performance__heart_rate__summary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/performance/measurements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.listMeasurements
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["performance_get___performance__measurements"];
        put?: never;
        /**
         * controller.createMeasurement
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["performance_post___performance__measurements"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/performance/measurements/{measurementId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * controller.deleteMeasurement
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        delete: operations["performance_delete___performance__measurements___measurementId"];
        options?: never;
        head?: never;
        /**
         * controller.updateMeasurement
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["performance_patch___performance__measurements___measurementId"];
        trace?: never;
    };
    "/performance/measurements/evolution": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.measurementEvolution
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["performance_get___performance__measurements__evolution"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/performance/steps": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.listSteps
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["performance_get___performance__steps"];
        put?: never;
        /**
         * controller.createSteps
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["performance_post___performance__steps"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/performance/steps/daily": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.dailySteps
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["performance_get___performance__steps__daily"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/performance/steps/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.stepsSummary
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["performance_get___performance__steps__summary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/performance/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.overview
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["performance_get___performance__summary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/professionals/catalog": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * createApplicationController
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___professionals__catalog"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/professionals/eligible-capabilities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * careController.eligible
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___professionals__eligible_capabilities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/professionals/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.getProfile
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___professionals__me"];
        /**
         * controller.createProfile
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        put: operations["professional_put___professionals__me"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * controller.updateProfile
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["professional_patch___professionals__me"];
        trace?: never;
    };
    "/professionals/me/application-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * application.status
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___professionals__me__application_status"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/professionals/me/availability-declaration": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.getAvailability
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___professionals__me__availability_declaration"];
        /**
         * controller.createAvailability
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        put: operations["professional_put___professionals__me__availability_declaration"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * controller.updateAvailability
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["professional_patch___professionals__me__availability_declaration"];
        trace?: never;
    };
    "/professionals/me/capabilities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.listCapabilities
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___professionals__me__capabilities"];
        put?: never;
        /**
         * controller.createCapability
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["professional_post___professionals__me__capabilities"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/professionals/me/capabilities/{capabilityId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.getCapability
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___professionals__me__capabilities___capabilityId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * controller.updateCapability
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["professional_patch___professionals__me__capabilities___capabilityId"];
        trace?: never;
    };
    "/professionals/me/care-relationships": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * careController.inbox
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___professionals__me__care_relationships"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/professionals/me/qualifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.listQualifications
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___professionals__me__qualifications"];
        put?: never;
        /**
         * controller.createQualification
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["professional_post___professionals__me__qualifications"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/professionals/me/qualifications/{qualificationId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.getQualification
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___professionals__me__qualifications___qualificationId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * controller.updateQualification
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["professional_patch___professionals__me__qualifications___qualificationId"];
        trace?: never;
    };
    "/professionals/me/reopen": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * application.reopen
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["professional_post___professionals__me__reopen"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/professionals/me/services": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * offerings.listMine
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___professionals__me__services"];
        put?: never;
        /**
         * offerings.create
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["professional_post___professionals__me__services"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/professionals/me/services/{serviceId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * offerings.get
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___professionals__me__services___serviceId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * offerings.update
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["professional_patch___professionals__me__services___serviceId"];
        trace?: never;
    };
    "/professionals/me/services/{serviceId}/deactivate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * offerings.deactivate
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["professional_post___professionals__me__services___serviceId___deactivate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/professionals/me/submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * application.submit
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["professional_post___professionals__me__submit"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/professionals/services": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * offerings.publicCatalog
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___professionals__services"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/professionals/specializations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read specialization catalogue; does not confer professional eligibility
         * @description Repository owner documentation: documentation/api/professional-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["professional_get___professionals__specializations"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Aggregate dependency readiness; disabled capabilities remain separately documented
         * @description Repository owner documentation: documentation/api/../release-v1/local-setup.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["gateway_get___ready"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/training/exercises": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.listExercises
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["training_get___training__exercises"];
        put?: never;
        /**
         * controller.createExercise
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["training_post___training__exercises"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/training/exercises/{exerciseId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.getExercise
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["training_get___training__exercises___exerciseId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/training/plans": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List own training plans
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["training_get___training__plans"];
        put?: never;
        /**
         * controller.createPlan
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["training_post___training__plans"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/training/plans/{planId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * controller.getPlan
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["training_get___training__plans___planId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * controller.updatePlan
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["training_patch___training__plans___planId"];
        trace?: never;
    };
    "/training/plans/{planId}/archive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * controller.archivePlan
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["training_post___training__plans___planId___archive"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/training/plans/{planId}/duplicate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * controller.duplicatePlan
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["training_post___training__plans___planId___duplicate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/training/plans/{planId}/exercises": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * controller.addPlanExercise
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["training_post___training__plans___planId___exercises"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/training/plans/{planId}/exercises/{exerciseId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * controller.removePlanExercise
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        delete: operations["training_delete___training__plans___planId___exercises___exerciseId"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/training/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List own sessions
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["training_get___training__sessions"];
        put?: never;
        /**
         * Create own planned training session
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["training_post___training__sessions"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/training/sessions/{sessionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read own training session
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["training_get___training__sessions___sessionId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/training/sessions/{sessionId}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Transition training session: cancel
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["training_post___training__sessions___sessionId___cancel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/training/sessions/{sessionId}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Transition training session: complete
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["training_post___training__sessions___sessionId___complete"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/training/sessions/{sessionId}/exercises": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * controller.recordExercise
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["training_post___training__sessions___sessionId___exercises"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/training/sessions/{sessionId}/pause": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Transition training session: pause
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["training_post___training__sessions___sessionId___pause"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/training/sessions/{sessionId}/resume": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Transition training session: resume
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["training_post___training__sessions___sessionId___resume"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/training/sessions/{sessionId}/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Transition training session: start
         * @description Repository owner documentation: documentation/api/../release-v1/frontend.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["training_post___training__sessions___sessionId___start"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Read own profile
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["user_get___users__me"];
        /**
         * Create own fictional profile; detailed optional fields in user-service.md
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        put: operations["user_put___users__me"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update profile with exact ETag
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["user_patch___users__me"];
        trace?: never;
    };
    "/users/me/goals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.listGoals
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["user_get___users__me__goals"];
        put?: never;
        /**
         * c.createGoal
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["user_post___users__me__goals"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/goals/{goalId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.getGoal
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["user_get___users__me__goals___goalId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * c.updateGoal
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["user_patch___users__me__goals___goalId"];
        trace?: never;
    };
    "/users/me/habits": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.getHabits
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["user_get___users__me__habits"];
        /**
         * c.createHabits
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        put: operations["user_put___users__me__habits"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * c.updateHabits
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["user_patch___users__me__habits"];
        trace?: never;
    };
    "/users/me/measurements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.listMeasurements
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["user_get___users__me__measurements"];
        put?: never;
        /**
         * c.createMeasurement
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        post: operations["user_post___users__me__measurements"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/measurements/{measurementId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.getMeasurement
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["user_get___users__me__measurements___measurementId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/physical-data": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.physicalData
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["user_get___users__me__physical_data"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/me/preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.getPreferences
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["user_get___users__me__preferences"];
        /**
         * c.createPreferences
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        put: operations["user_put___users__me__preferences"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * c.updatePreferences
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        patch: operations["user_patch___users__me__preferences"];
        trace?: never;
    };
    "/users/me/weight-history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * c.weightHistory
         * @description Repository owner documentation: documentation/api/user-service.md. See x-availability; route availability does not grant privileges.
         */
        get: operations["user_get___users__me__weight_history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Empty: Record<string, never>;
        Register: {
            name: string;
            /** Format: email */
            email: string;
            /** @description 8+ characters and at most 72 UTF-8 bytes; never log */
            password: string;
        };
        Profile: {
            displayName: string;
            /** Format: date */
            birthDate?: string | null;
            /** @enum {string|null} */
            gender?: "mulher" | "homem" | "nao_binario" | "autodescrito" | "prefiro_nao_indicar" | null;
            genderDescription?: string | null;
            contactEmail?: string | null;
            phoneE164?: string | null;
            countryCode?: string | null;
            approximateLocation?: {
                regionCode?: string;
                cityLabel?: string;
            } | null;
        };
        Preferences: {
            locale?: string;
            timeZone: string;
            /** @enum {string} */
            theme?: "system" | "light" | "dark";
            units?: {
                /** @enum {string} */
                system: "metric" | "imperial";
            };
            notifications?: {
                channels?: {
                    inApp?: boolean;
                    email?: boolean;
                    push?: boolean;
                };
                categories?: {
                    appointments?: boolean;
                    activity?: boolean;
                    hydration?: boolean;
                    security?: boolean;
                };
            };
            quietHours?: {
                startMinute?: number;
                endMinute?: number;
                days?: number[];
            } | null;
        };
        Habits: {
            usualSleepMinutes?: number | null;
            exerciseDaysPerWeek?: number | null;
            activityLevel?: string | null;
            hydrationHabit?: string | null;
            preferredTrainingWindows?: {
                day: number;
                startMinute: number;
                endMinute: number;
                timeZone: string;
            }[];
        };
        UserMeasurement: {
            /** @enum {string} */
            kind: "weight" | "height" | "waist" | "hip" | "chest" | "upper_arm" | "thigh" | "calf";
            value: number;
            /** @enum {string} */
            unit: "g" | "mm";
            /** Format: date-time */
            measuredAt: string;
        };
        UserGoal: {
            /** @enum {string} */
            goalType: "weight_loss" | "weight_maintenance" | "muscle_gain" | "fitness" | "hydration" | "daily_activity" | "custom";
            title: string;
            description?: string | null;
            target?: {
                /** @enum {string} */
                metric: "body_weight" | "water_volume" | "steps" | "active_minutes" | "training_frequency";
                value: number;
                tolerance?: number;
                unit: string;
                /** @enum {string} */
                period: "once" | "day" | "week";
            } | null;
            baselineMeasurementId?: string | null;
            /** Format: date */
            startsOn?: string | null;
            /** Format: date */
            targetDate?: string | null;
            /** @enum {string} */
            status?: "proposed" | "active" | "paused" | "achieved" | "archived";
        };
        Exercise: {
            name: string;
            description?: string;
            muscleGroup: string;
            equipment: string[];
            environments: ("home" | "gym" | "outdoor")[];
            /** @enum {string} */
            difficulty: "beginner" | "intermediate" | "advanced";
            /** @enum {string} */
            type: "strength" | "cardio" | "mobility" | "flexibility" | "balance";
            instructions: string;
        };
        PlanExercise: {
            exerciseId: string;
            sets?: number;
            repetitions?: number;
            load?: number;
            durationSeconds?: number;
            restSeconds?: number;
            day?: string;
        };
        Plan: {
            title: string;
            description?: string;
            goals?: string[];
            days?: string[];
            /** @enum {string} */
            environment?: "home" | "gym" | "outdoor";
            exercises: components["schemas"]["PlanExercise"][];
        };
        Session: {
            planId?: string;
        };
        HydrationSuggestion: {
            /** @enum {string} */
            gender: "homem" | "mulher";
            weightKg: number;
            ageYears: number;
            active?: boolean;
        };
        HydrationGoal: {
            targetMl: number;
            timezone: string;
            /** @enum {string} */
            source?: "custom" | "suggested";
            version?: number;
        };
        Intake: {
            amountMl: number;
            timezone: string;
            /** Format: date-time */
            consumedAt?: string;
            idempotencyKey: string;
        };
        Reminder: {
            enabled?: boolean;
            /** @enum {string} */
            frequency: "hourly" | "two_hourly" | "custom";
            intervalMinutes?: number;
            startTime: string;
            endTime: string;
            timezone: string;
            version?: number;
        };
        PerformanceMeasurement: {
            kind: string;
            value: number;
            unit?: string;
            /** Format: date-time */
            measuredAt?: string;
            timezone: string;
            idempotencyKey?: string;
        };
        Steps: {
            count: number;
            /** Format: date-time */
            recordedAt?: string;
            timezone: string;
            idempotencyKey?: string;
        };
        HeartRate: {
            bpm: number;
            /** Format: date-time */
            measuredAt?: string;
            timezone: string;
            context?: string;
            idempotencyKey?: string;
        };
        PerformanceGoal: {
            target: number;
            timezone: string;
            version?: number;
        };
        Activity: {
            title: string;
            description?: string;
            /** @enum {string} */
            kind: "personal" | "workout";
            /** @enum {string} */
            environment?: "gym" | "home" | "outdoor";
            /** Format: date-time */
            startAt: string;
            /** Format: date-time */
            endAt: string;
            timezone: string;
            /** @enum {string} */
            status?: "planned" | "completed";
        };
        SessionExercise: {
            exerciseId: string;
            sets: {
                repetitions?: number;
                load?: number;
                durationSeconds?: number;
            }[];
            notes?: string;
        };
        ProfessionalProfile: {
            professionalName: string;
            biography?: string | null;
            privateContactEmail?: string | null;
            publicContacts?: {
                email?: string;
                phoneE164?: string;
            } | null;
            countryCode: string;
            languages: string[];
        };
        Capability: {
            /** @enum {string} */
            kind: "personal_trainer" | "nutritionist";
            jurisdictionCountry: string;
            specializations?: string[];
            experienceStartYear?: number | null;
            serviceModes: string[];
        };
        Qualification: {
            capabilityId?: string;
            qualificationType: string;
            title: string;
            issuerName: string;
            /** Format: date */
            awardedOn?: string | null;
            /** Format: date */
            expiresOn?: string | null;
            specializationCodes?: string[];
        };
        AvailabilityDeclaration: {
            timeZone: string;
            preferredWeekdays: number[];
            windows: {
                weekday: number;
                startMinute: number;
                endMinute: number;
            }[];
            serviceModes: ("online" | "in_person")[];
        };
        ProfessionalService: {
            capabilityId: string;
            /** @enum {string} */
            category: "personal_trainer" | "nutritionist";
            name: string;
            description: string;
            priceEur: number;
            /** @enum {integer} */
            durationMinutes: 30 | 45 | 60 | 90;
            bufferBeforeMinutes: number;
            bufferAfterMinutes: number;
        };
        ApplicationSubmit: {
            publicationRequested?: boolean;
            publicQualificationIds?: string[];
        };
        Review: {
            reasonCode?: string;
        };
        Relationship: {
            professionalId: string;
            capabilityId: string;
            /** @enum {string} */
            relationshipKind: "personal_training" | "nutrition";
        };
        Booking: {
            serviceId?: string;
            professionalId: string;
            capabilityId: string;
            /** @enum {string} */
            appointmentType: "initial_session" | "one_off_session" | "follow_up";
            relationshipId?: string;
            /** @enum {string} */
            mode: "online" | "in_person";
            /** @enum {string} */
            environment?: "home" | "gym" | "outdoor";
            /** Format: date-time */
            startAtUtc: string;
            /** Format: date-time */
            endAtUtc: string;
            timezone: string;
        };
        AvailabilityRule: {
            capabilityId: string;
            weekday: number;
            localStartTime: string;
            localEndTime: string;
            validFrom: string;
            validUntil: string;
            dstDisambiguation?: string;
            timezone: string;
            sessionModes: string[];
            environments?: string[];
            slotDurationMinutes: number;
            bufferBeforeMinutes?: number;
            bufferAfterMinutes?: number;
        };
        AvailabilityException: {
            capabilityId: string;
            /** @enum {string} */
            type: "block" | "extra_availability" | "replacement";
            /** Format: date-time */
            startAtUtc: string;
            /** Format: date-time */
            endAtUtc: string;
            reasonCode: string;
            replacesRuleId?: string;
            timezone: string;
            sessionModes?: string[];
            environments?: string[];
            slotDurationMinutes?: number;
            bufferBeforeMinutes?: number;
            bufferAfterMinutes?: number;
        };
        PaymentInput: {
            priceReference: string;
            serviceReference: string;
            amountCents: number;
        };
        NotificationPreferences: {
            enabled?: boolean;
            hydrationReminders?: boolean;
            trainingEvents?: boolean;
            agendaReminders?: boolean;
            paymentEvents?: boolean;
            version?: number;
        };
        Message: {
            content: string;
        };
        CoachPermissions: {
            categories: string[];
            selectedGoalIds?: string[];
            allowedTools: string[];
            version: number;
        };
        Conversation: {
            purpose: string;
            timezone: string;
            categories: string[];
            selectedGoalIds?: string[];
            allowedTools: string[];
        };
        Proposal: {
            version: number;
            /** @constant */
            confirm: true;
        };
        ProposalReconcile: {
            resourceId: string;
            version: number;
        };
        Error: {
            error?: {
                code?: string;
                message?: string;
                requestId?: string;
            };
        };
        ActivityPatch: {
            title?: string;
            description?: string;
            /** @enum {string} */
            kind?: "personal" | "workout";
            /** @enum {string} */
            environment?: "gym" | "home" | "outdoor";
            /** Format: date-time */
            startAt?: string;
            /** Format: date-time */
            endAt?: string;
            timezone?: string;
        };
        ServiceAssociation: {
            serviceId: string;
        };
        ProposalPatch: {
            version: number;
        };
        IntakePatch: {
            amountMl?: number;
            timezone?: string;
            /** Format: date-time */
            consumedAt?: string;
        };
        LegacyReviewApprove: {
            publish?: boolean;
        };
        LegacyReviewReason: {
            reason: string;
        };
        PerformanceMeasurementPatch: {
            value?: number;
            /** Format: date-time */
            measuredAt?: string;
            timezone?: string;
        };
        ProfessionalProfilePatch: {
            professionalName?: string;
            biography?: string | null;
            privateContactEmail?: string | null;
            publicContacts?: {
                email?: string;
                phoneE164?: string;
            } | null;
            countryCode?: string;
            languages?: string[];
        };
        AvailabilityDeclarationPatch: {
            timeZone?: string;
            preferredWeekdays?: number[];
            windows?: {
                weekday: number;
                startMinute: number;
                endMinute: number;
            }[];
            serviceModes?: ("online" | "in_person")[];
        };
        CapabilityPatch: {
            specializations?: string[];
            experienceStartYear?: number | null;
            serviceModes?: string[];
        };
        QualificationPatch: {
            qualificationType?: string;
            title?: string;
            issuerName?: string;
            /** Format: date */
            awardedOn?: string | null;
            /** Format: date */
            expiresOn?: string | null;
            specializationCodes?: string[];
        };
        ProfessionalServicePatch: {
            name?: string;
            description?: string;
            priceEur?: number;
            /** @enum {integer} */
            durationMinutes?: 30 | 45 | 60 | 90;
            bufferBeforeMinutes?: number;
            bufferAfterMinutes?: number;
        };
        PlanPatch: {
            title?: string;
            description?: string;
            goals?: string[];
            days?: string[];
            /** @enum {string} */
            environment?: "home" | "gym" | "outdoor";
            exercises?: components["schemas"]["PlanExercise"][];
        };
        ProfilePatch: {
            displayName?: string;
            /** Format: date */
            birthDate?: string | null;
            /** @enum {string|null} */
            gender?: "mulher" | "homem" | "nao_binario" | "autodescrito" | "prefiro_nao_indicar" | null;
            genderDescription?: string | null;
            contactEmail?: string | null;
            phoneE164?: string | null;
            countryCode?: string | null;
            approximateLocation?: {
                regionCode?: string;
                cityLabel?: string;
            } | null;
        };
        UserGoalPatch: {
            /** @enum {string} */
            goalType?: "weight_loss" | "weight_maintenance" | "muscle_gain" | "fitness" | "hydration" | "daily_activity" | "custom";
            title?: string;
            description?: string | null;
            target?: {
                /** @enum {string} */
                metric: "body_weight" | "water_volume" | "steps" | "active_minutes" | "training_frequency";
                value: number;
                tolerance?: number;
                unit: string;
                /** @enum {string} */
                period: "once" | "day" | "week";
            } | null;
            baselineMeasurementId?: string | null;
            /** Format: date */
            startsOn?: string | null;
            /** Format: date */
            targetDate?: string | null;
            /** @enum {string} */
            status?: "proposed" | "active" | "paused" | "achieved" | "archived";
        };
        HabitsPatch: {
            usualSleepMinutes?: number | null;
            exerciseDaysPerWeek?: number | null;
            activityLevel?: string | null;
            hydrationHabit?: string | null;
            preferredTrainingWindows?: {
                day: number;
                startMinute: number;
                endMinute: number;
                timeZone: string;
            }[];
        };
        PreferencesPatch: {
            locale?: string;
            timeZone?: string;
            /** @enum {string} */
            theme?: "system" | "light" | "dark";
            units?: {
                /** @enum {string} */
                system: "metric" | "imperial";
            };
            notifications?: {
                channels?: {
                    inApp?: boolean;
                    email?: boolean;
                    push?: boolean;
                };
                categories?: {
                    appointments?: boolean;
                    activity?: boolean;
                    hydration?: boolean;
                    security?: boolean;
                };
            };
            quietHours?: {
                startMinute?: number;
                endMinute?: number;
                days?: number[];
            } | null;
        };
        backend_integration_v1__Activity: {
            id: string;
            authUserId?: string;
            title: string;
            /** @enum {unknown} */
            kind: "personal" | "workout";
            /** @enum {unknown} */
            environment?: "gym" | "home" | "outdoor";
            /** Format: date-time */
            startAt: string;
            /** Format: date-time */
            endAt: string;
            timezone: string;
            /** @enum {unknown} */
            status: "planned" | "completed" | "cancelled";
            version?: number;
        } & {
            [key: string]: unknown;
        };
        backend_integration_v1__Error: {
            error: {
                code: string;
                message?: string;
            } & {
                [key: string]: unknown;
            };
        };
        backend_integration_v1__ActivityResult: {
            activity: components["schemas"]["backend_integration_v1__Activity"];
            overlapWarning: boolean;
            overlaps: string[];
        };
        administration_v1__Error: {
            error: {
                code: string;
                message: string;
            };
        };
        administration_v1__StepUp: {
            /** Format: password */
            password: string;
            otp: string;
            /** @enum {string} */
            action: "user.suspend" | "user.reactivate" | "user.revoke" | "role.request" | "role.approve" | "role.reject" | "manager.invite" | "manager.invite.revoke" | "quorum.invite" | "management.operator.create" | "management.scope.create" | "management.assignment.request" | "management.assignment.approve" | "management.assignment.reject" | "management.assignment.request-revocation" | "management.assignment.approve-revocation" | "professional.admin.suspend" | "professional.admin.service.suspend" | "professional.simulated.review";
            targetId: string;
            /** @description Exact canonical parameters specified in administration-v1.md */
            parameters: Record<string, never>;
        } | {
            /** Format: password */
            password: string;
            recoveryCode: string;
            /** @enum {string} */
            action: "user.suspend" | "user.reactivate" | "user.revoke" | "role.request" | "role.approve" | "role.reject" | "manager.invite" | "manager.invite.revoke" | "quorum.invite" | "management.operator.create" | "management.scope.create" | "management.assignment.request" | "management.assignment.approve" | "management.assignment.reject" | "management.assignment.request-revocation" | "management.assignment.approve-revocation" | "professional.admin.suspend" | "professional.admin.service.suspend" | "professional.simulated.review";
            targetId: string;
            /** @description Exact canonical parameters specified in administration-v1.md */
            parameters: Record<string, never>;
        };
        administration_v1__Audit: {
            id: string;
            actorId: string;
            action: string;
            resourceId: string;
            /** Format: date-time */
            occurredAt: string;
            /** @enum {unknown} */
            result: "allowed" | "denied" | "failed";
            reasonCode?: string;
            /** Format: uuid */
            correlationId: string;
            version?: number;
        };
        administration_v1__RoleRequest: {
            id: string;
            targetId: string;
            /** @enum {unknown} */
            newRole: "utilizador" | "profissional" | "gestor" | "administrador";
            /** @enum {unknown} */
            status: "pending" | "approved" | "rejected";
            version: number;
            requestedBy?: string;
            approvedBy?: string;
            reasonCode?: string;
            /** Format: date-time */
            createdAt?: string;
        };
        administration_v1__Mutation: {
            version: number;
            reasonCode: string;
        };
        administration_v1__User: {
            id: string;
            name: string;
            /** Format: email */
            email: string;
            /** @enum {unknown} */
            userType: "utilizador" | "profissional" | "gestor" | "administrador";
            /** @enum {unknown} */
            accountStatus: "active" | "suspended";
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        administration_v1__RoleMutation: {
            /** @enum {unknown} */
            newRole: "utilizador" | "profissional" | "gestor" | "administrador";
            version: number;
            reasonCode: string;
        };
        administration_v1__PublicUser: {
            id: string;
            name: string;
            /** Format: email */
            email: string;
            /** @enum {unknown} */
            userType: "utilizador" | "profissional" | "gestor" | "administrador";
            /** @enum {unknown} */
            accountStatus: "active" | "suspended";
            roleVersion: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        administration_v1__Login: {
            user: components["schemas"]["administration_v1__PublicUser"];
            accessToken: string;
            /** @constant */
            tokenType: "Bearer";
            /** @constant */
            expiresIn: 3600;
            recoveryCodes?: string[];
        };
        administration_v1__MfaChallenge: {
            challenge: string;
            /** @constant */
            mfaRequired: true;
            enrollmentRequired: boolean;
            /** @constant */
            expiresIn: 600;
        };
        management_v1__Invitation: {
            id: string;
            /** Format: date-time */
            expiresAt: string;
            /** @description Revelado apenas na emissão. Não guardar em logs, analytics ou armazenamento do frontend. */
            token: string;
        };
        management_v1__Error: {
            error: {
                code: string;
                message: string;
            };
        };
        management_v1__InvitationIssue: {
            /** Format: email */
            email: string;
        };
        management_v1__Empty: Record<string, never>;
        management_v1__ManagerCreated: {
            id: string;
            /** @constant */
            userType: "gestor";
            /** @constant */
            onboarding: "requires_administrator_and_scope_assignment";
        };
        management_v1__InvitationAccept: {
            token: string;
            name: string;
            /** @description Limite adicional de 72 bytes UTF-8, validado no backend. */
            password: string;
        };
        backend_integration_v1__Identity: components["schemas"]["administration_v1__PublicUser"];
        administration_v1__MfaFactor: {
            challenge: string;
            otp: string;
        } | {
            challenge: string;
            recoveryCode: string;
        };
        backend_integration_v1__Login: components["schemas"]["administration_v1__Login"];
        administration_v1__Session: {
            id: string;
            current: boolean;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            expiresAt: string;
            mfa: boolean;
        };
        backend_integration_v1__Health: {
            service: string;
            status: string;
        } & {
            [key: string]: unknown;
        };
        backend_integration_v1__Goal: {
            id: string;
            ownerId?: string;
            targetMl: number;
            timezone: string;
            version?: number;
        } & {
            [key: string]: unknown;
        };
        backend_integration_v1__Intake: {
            id: string;
            amountMl: number;
            timezone: string;
            /** Format: date-time */
            consumedAt?: string;
            /** Format: date */
            localDate?: string;
        } & {
            [key: string]: unknown;
        };
        administration_v1__Application: {
            id: string;
            professionalId: string;
            /** @enum {unknown} */
            status: "draft" | "pending" | "approved" | "rejected" | "suspended";
            publicationEnabled: boolean;
            /** Format: date-time */
            submittedAt: string;
            version: number;
            /** @constant */
            verificationAuthority: "unavailable";
            /** @constant */
            approvalType: "simulated";
        };
        administration_v1__Professional: {
            id: string;
            professionalName: string;
            status: string;
            administrativelySuspended: boolean;
            version: number;
            /** @constant */
            verificationAuthority: "unavailable";
        };
        administration_v1__Suspension: {
            id: string;
            version: number;
            /** @constant */
            administrativelySuspended: true;
        };
        administration_v1__Service: {
            id: string;
            professionalId: string;
            capabilityId: string;
            name: string;
            active: boolean;
            administrativelySuspended: boolean;
            managementSuspended: boolean;
            durationMinutes: number;
            version: number;
        };
        management_v1__Appointment: {
            id: string;
            serviceId: string;
            professionalId: string;
            /** @enum {unknown} */
            status: "requested" | "accepted" | "declined" | "cancelled" | "expired" | "completed";
            appointmentType: string;
            /** Format: date-time */
            startAtUtc: string;
            /** Format: date-time */
            endAtUtc: string;
            version: number;
            rescheduleOfId?: string;
            rescheduledToId?: string;
        };
        management_v1__AppointmentPage: {
            items: components["schemas"]["management_v1__Appointment"][];
            nextBefore: string | null;
        };
        management_v1__Assignment: {
            id: string;
            operatorProfileId: string;
            scopeId: string;
            permissions: ("professionals.read" | "services.read" | "services.suspend" | "services.reactivate" | "appointments.read" | "payments.read" | "dashboard.read" | "cases.read" | "cases.write" | "audit.read")[];
            /** Format: date-time */
            validFrom: string;
            /** Format: date-time */
            validUntil: string;
            /** @enum {unknown} */
            status: "pending" | "active" | "revocation_pending" | "revoked" | "rejected";
            requestedBy: string;
            approvedBy?: string;
            revocationRequestedBy?: string;
            revokedBy?: string;
            reasonCode?: string;
            /** Format: date-time */
            approvedAt?: string;
            /** Format: date-time */
            revokedAt?: string;
            version: number;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
            authRoleVersion?: number;
            requesterRoleVersion?: number;
        };
        management_v1__AssignmentPage: {
            items: components["schemas"]["management_v1__Assignment"][];
            nextBefore: string | null;
        };
        management_v1__AssignmentRequest: {
            operatorProfileId: string;
            scopeId: string;
            permissions: ("professionals.read" | "services.read" | "services.suspend" | "services.reactivate" | "appointments.read" | "payments.read" | "dashboard.read" | "cases.read" | "cases.write" | "audit.read")[];
            /** Format: date-time */
            validFrom: string;
            /** Format: date-time */
            validUntil: string;
        };
        management_v1__Reason: {
            reasonCode: string;
        };
        management_v1__Audit: {
            id: string;
            actorId: string;
            actionCode: string;
            resourceType: string;
            resourceId: string;
            scopeId?: string;
            resourceVersion?: number;
            requestId: string;
            /** @enum {unknown} */
            result: "allowed" | "denied" | "failed" | "intent";
            reasonCode?: string;
            /** Format: date-time */
            occurredAt: string;
        };
        management_v1__AuditPage: {
            items: components["schemas"]["management_v1__Audit"][];
            nextBefore: string | null;
        };
        management_v1__Case: {
            id: string;
            scopeId: string;
            serviceId: string;
            /** @enum {unknown} */
            caseType: "professional_review" | "scheduling_issue" | "account_request" | "service_operation";
            /** @enum {unknown} */
            resourceOwnerService: "professional" | "agenda" | "payment";
            resourceId: string;
            responsibleOperatorId: string;
            /** @enum {unknown} */
            status: "open" | "in_progress" | "resolved" | "closed";
            reasonCode: string;
            createdBy: string;
            /** Format: date-time */
            closedAt?: string;
            version: number;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        management_v1__CasePage: {
            items: components["schemas"]["management_v1__Case"][];
            nextBefore: string | null;
        };
        management_v1__CaseCreate: {
            serviceId: string;
            /** @enum {unknown} */
            caseType: "professional_review" | "scheduling_issue" | "account_request" | "service_operation";
            /** @enum {unknown} */
            resourceOwnerService: "professional" | "agenda" | "payment";
            resourceId: string;
            reasonCode: string;
        };
        management_v1__CaseTransition: {
            /** @enum {unknown} */
            status: "in_progress" | "resolved" | "closed";
            reasonCode: string;
        };
        management_v1__Metric: {
            /** Format: date */
            day: string;
            value: null;
            suppressed: boolean;
            range: null | {
                min: number;
                max: number;
            };
        };
        management_v1__Dashboard: {
            /** Format: date */
            from: string;
            /** Format: date */
            to: string;
            partial: boolean;
            sources: {
                /** @enum {unknown} */
                source: "professional" | "agenda" | "payment";
                /** @enum {unknown} */
                status: "available" | "unavailable";
                simulated?: boolean;
                /** Format: date-time */
                computedAt?: string;
                /** @constant */
                policy?: "utc-daily-portfolio-ranges-v1";
                series?: components["schemas"]["management_v1__Metric"][];
                /** @enum {unknown} */
                metricCode?: "services.created" | "appointments.created" | "payments.created";
            }[];
        };
        management_v1__Operator: {
            id: string;
            authUserId: string;
            displayName: string;
            /** @enum {string} */
            operatorStatus: "invited" | "active" | "suspended" | "archived";
            /** Format: date-time */
            onboardingApprovedAt: string;
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        management_v1__Me: {
            identityId: string;
            operator: components["schemas"]["management_v1__Operator"] | null;
            assignments: components["schemas"]["management_v1__AssignmentPage"];
        };
        management_v1__OperatorCurrent: {
            id: string;
            authUserId: string;
            displayName: string;
            /** @enum {string} */
            operatorStatus: "invited" | "active" | "suspended" | "archived";
            /** Format: date-time */
            onboardingApprovedAt: string;
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            /** @enum {unknown} */
            currentRole: "utilizador" | "profissional" | "gestor" | "administrador";
            /** @enum {unknown} */
            accountStatus: "active" | "suspended";
        };
        management_v1__OperatorCurrentPage: {
            items: components["schemas"]["management_v1__OperatorCurrent"][];
            nextBefore: string | null;
        };
        management_v1__OperatorCreate: {
            authUserId: string;
            displayName: string;
        };
        management_v1__Payment: {
            id: string;
            appointmentId: string;
            serviceId: string;
            /** @enum {unknown} */
            state: "pending" | "processing" | "approved" | "declined" | "free" | "unknown" | "cancelled" | "expired" | "failed";
            refundPending: boolean;
            reconciliationRequired: boolean;
            version: number;
            /** @constant */
            simulated: true;
        };
        management_v1__PaymentPage: {
            items: components["schemas"]["management_v1__Payment"][];
            nextBefore: string | null;
            /** @constant */
            simulated: true;
        };
        management_v1__Professional: {
            id: string;
            professionalName: string;
            status: string;
            /** @enum {unknown} */
            dataAuthority: "synthetic" | "real" | "unavailable";
        };
        management_v1__ProfessionalPage: {
            items: components["schemas"]["management_v1__Professional"][];
            nextBefore: string | null;
        };
        management_v1__Scope: {
            id: string;
            /** @constant */
            kind: "service";
            name: string;
            serviceIds: string[];
            createdBy: string;
            /** @enum {string} */
            status: "active" | "archived";
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        management_v1__ScopePage: {
            items: components["schemas"]["management_v1__Scope"][];
            nextBefore: string | null;
        };
        management_v1__ScopeCreate: {
            name: string;
            serviceIds: string[];
        };
        management_v1__Service: {
            id: string;
            professionalId: string;
            capabilityId: string;
            name: string;
            category: string;
            durationMinutes: number;
            active: boolean;
            managementSuspended: boolean;
            version: number;
            dataAuthority: string;
        };
        management_v1__ServicePage: {
            items: components["schemas"]["management_v1__Service"][];
            nextBefore: string | null;
        };
        management_v1__ServiceTransition: {
            id: string;
            active: boolean;
            managementSuspended: boolean;
            version: number;
            dataAuthority: string;
        };
        backend_integration_v1__Notification: {
            id: string;
            ownerId?: string;
            eventId: string;
            eventType: string;
            title: string;
            body: string;
            readAt?: string | null;
            /** Format: date-time */
            occurredAt?: string;
            /** Format: date-time */
            createdAt?: string;
            /** @enum {unknown} */
            category?: "agenda" | "payment";
        } & {
            [key: string]: unknown;
        };
        backend_integration_v1__Payment: {
            id: string;
            ownerId?: string;
            priceReference?: string;
            serviceReference?: string;
            amountCents: number;
            /** @constant */
            currency?: "EUR";
            /** @enum {unknown} */
            state: "pending" | "approved" | "declined" | "cancelled";
            /** @constant */
            method: "mock";
        } & {
            [key: string]: unknown;
        };
        backend_integration_v1__Ready: {
            /** @constant */
            service: "api-gateway";
            /** @enum {unknown} */
            status: "ready" | "unavailable";
            dependencies: {
                service: string;
                /** @enum {unknown} */
                status: "ready" | "unavailable";
            }[];
        };
        backend_integration_v1__Session: {
            id: string;
            /** @enum {unknown} */
            status: "planned" | "running" | "paused" | "completed" | "cancelled";
            ownerId?: string;
            version?: number;
            /** Format: date-time */
            startedAt?: string;
            /** Format: date-time */
            completedAt?: string;
        } & {
            [key: string]: unknown;
        };
        backend_integration_v1__Profile: {
            id: string;
            authUserId?: string;
            displayName: string;
            version: number;
            profileStatus?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        } & {
            [key: string]: unknown;
        };
    };
    responses: never;
    parameters: {
        administration_v1__Limit: number;
        administration_v1__Before: string;
        administration_v1__Id: string;
        administration_v1__IfMatch: string;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    agenda_get___agenda__activities: {
        parameters: {
            query?: {
                page?: number;
                pageSize?: number;
                from?: string;
                to?: string;
                status?: "planned" | "completed" | "cancelled";
                kind?: "personal" | "workout";
                environment?: "home" | "gym" | "outdoor";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["backend_integration_v1__Activity"][];
                            total?: number;
                            page?: number;
                            pageSize?: number;
                        } & {
                            [key: string]: unknown;
                        };
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    agenda_post___agenda__activities: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Activity"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__ActivityResult"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    agenda_get___agenda__activities___activityId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activityId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Activity"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    agenda_patch___agenda__activities___activityId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activityId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActivityPatch"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__ActivityResult"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    agenda_post___agenda__activities___activityId___cancel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activityId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Activity"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    agenda_post___agenda__activities___activityId___complete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activityId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Activity"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    agenda_get___agenda__professional_appointments: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                from?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                to?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                status?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                capabilityId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_post___agenda__professional_appointments: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Booking"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_get___agenda__professional_appointments___id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_post___agenda__professional_appointments___id___cancel: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_get___agenda__professional_appointments___id___history: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_post___agenda__professional_appointments___id___reschedule: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Booking"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_post___agenda__professional_appointments___id___service: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ServiceAssociation"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_get___agenda__professional__appointments: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                from?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                to?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                status?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                capabilityId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_post___agenda__professional__appointments___id___accept: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_post___agenda__professional__appointments___id___cancel: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Review"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_post___agenda__professional__appointments___id___complete: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_post___agenda__professional__appointments___id___decline: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Review"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_get___agenda__professional__availability_exceptions: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                capabilityId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_post___agenda__professional__availability_exceptions: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AvailabilityException"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_delete___agenda__professional__availability_exceptions___id: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_get___agenda__professional__availability_rules: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                capabilityId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_post___agenda__professional__availability_rules: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AvailabilityRule"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_delete___agenda__professional__availability_rules___id: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_patch___agenda__professional__availability_rules___id: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AvailabilityRule"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    agenda_get___agenda__professionals___professionalId___availability: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                capabilityId?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                from?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                to?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                mode?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                environment?: string;
            };
            header?: never;
            path: {
                professionalId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    coach_get___ai_coach__capabilities: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description AI_COACH_DISABLED; no provider or conversations are enabled */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    coach_get___ai_coach__conversations: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    coach_post___ai_coach__conversations: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Conversation"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    coach_delete___ai_coach__conversations___id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    coach_get___ai_coach__conversations___id___actions: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    coach_get___ai_coach__conversations___id___messages: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    coach_post___ai_coach__conversations___id___messages: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Message"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    coach_patch___ai_coach__conversations___id___permissions: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CoachPermissions"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    coach_get___ai_coach__conversations___id___proposals: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    coach_get___ai_coach__conversations___id___recommendations: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    coach_post___ai_coach__proposals___id___confirm: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Proposal"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    coach_post___ai_coach__proposals___id___reconcile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProposalReconcile"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    coach_post___ai_coach__proposals___id___reject: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProposalPatch"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    auth_post___auth__admin__step_up: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["administration_v1__StepUp"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            stepUpToken: string;
                            /** @constant */
                            expiresIn: 300;
                        };
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_get___auth__administration__audit: {
        parameters: {
            query?: {
                limit?: components["parameters"]["administration_v1__Limit"];
                before?: components["parameters"]["administration_v1__Before"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["administration_v1__Audit"][];
                            nextBefore: string | null;
                        };
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_get___auth__administration__role_requests: {
        parameters: {
            query?: {
                limit?: components["parameters"]["administration_v1__Limit"];
                before?: components["parameters"]["administration_v1__Before"];
                status?: "pending" | "approved" | "rejected";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["administration_v1__RoleRequest"][];
                            nextBefore: string | null;
                        };
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_post___auth__administration__role_requests___id___approve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["administration_v1__Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["administration_v1__Mutation"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            id: string;
                            targetId: string;
                            /** @enum {unknown} */
                            status: "approved" | "rejected";
                            version: number;
                        };
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_post___auth__administration__role_requests___id___reject: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["administration_v1__Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["administration_v1__Mutation"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            id: string;
                            targetId: string;
                            /** @enum {unknown} */
                            status: "approved" | "rejected";
                            version: number;
                        };
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_get___auth__administration__users: {
        parameters: {
            query?: {
                limit?: components["parameters"]["administration_v1__Limit"];
                before?: components["parameters"]["administration_v1__Before"];
                q?: string;
                role?: "utilizador" | "profissional" | "gestor" | "administrador";
                status?: "active" | "suspended";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["administration_v1__User"][];
                            nextBefore: string | null;
                        };
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_get___auth__administration__users___id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["administration_v1__Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["administration_v1__User"];
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_get___auth__administration__users___id___history: {
        parameters: {
            query?: {
                limit?: components["parameters"]["administration_v1__Limit"];
                before?: components["parameters"]["administration_v1__Before"];
            };
            header?: never;
            path: {
                id: components["parameters"]["administration_v1__Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["administration_v1__Audit"][];
                            nextBefore: string | null;
                        };
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_post___auth__administration__users___id___reactivate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["administration_v1__Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["administration_v1__Mutation"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["administration_v1__User"];
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_post___auth__administration__users___id___revoke: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["administration_v1__Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["administration_v1__Mutation"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["administration_v1__User"];
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_post___auth__administration__users___id___role_requests: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["administration_v1__Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["administration_v1__RoleMutation"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["administration_v1__RoleRequest"];
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_post___auth__administration__users___id___suspend: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["administration_v1__Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["administration_v1__Mutation"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["administration_v1__User"];
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_post___auth__initial_admin_invitation__accept: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    token: string;
                    name: string;
                    /** Format: password */
                    password: string;
                };
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            id: string;
                            /** @constant */
                            mfaEnrollmentRequired: true;
                        };
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_post___auth__login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: email */
                    email: string;
                    /** Format: password */
                    password: string;
                };
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Login"] | components["schemas"]["administration_v1__MfaChallenge"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_post___auth__logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": Record<string, never>;
            };
        };
        responses: {
            /** @description Session revoked */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_post___auth__manager_invitations: {
        parameters: {
            query?: never;
            header: {
                "X-Admin-Step-Up": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["management_v1__InvitationIssue"];
            };
        };
        responses: {
            /** @description Operação concluída. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__Invitation"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    auth_post___auth__manager_invitations___id___revoke: {
        parameters: {
            query?: never;
            header: {
                "X-Admin-Step-Up": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["management_v1__Empty"];
            };
        };
        responses: {
            /** @description Operação concluída. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    auth_post___auth__manager_invitations__accept: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["management_v1__InvitationAccept"];
            };
        };
        responses: {
            /** @description Operação concluída. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__ManagerCreated"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    auth_get___auth__me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        user: components["schemas"]["backend_integration_v1__Identity"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    auth_post___auth__mfa__complete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["administration_v1__MfaFactor"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Login"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_post___auth__mfa__enroll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    challenge: string;
                    /** Format: password */
                    password: string;
                };
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            secret: string;
                            /** Format: uri */
                            otpauthUri: string;
                        };
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    auth_post___auth__register: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Register"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Login"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    auth_get___auth__sessions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["administration_v1__Session"][];
                        };
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    professional_post___care_relationships: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Relationship"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___care_relationships___relationshipId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                relationshipId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_post___care_relationships___relationshipId___accept: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
                "Idempotency-Key": string;
            };
            path: {
                relationshipId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_post___care_relationships___relationshipId___cancel: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
                "Idempotency-Key": string;
            };
            path: {
                relationshipId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_post___care_relationships___relationshipId___decline: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
                "Idempotency-Key": string;
            };
            path: {
                relationshipId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_post___care_relationships___relationshipId___end: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
                "Idempotency-Key": string;
            };
            path: {
                relationshipId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___care_relationships___relationshipId___history: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                relationshipId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___care_relationships__me: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    gateway_get___health: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Health"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    hydration_get___hydration__goal: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Goal"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    hydration_put___hydration__goal: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["HydrationGoal"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Goal"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    hydration_get___hydration__goal__history: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    hydration_post___hydration__goal__suggest: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["HydrationSuggestion"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    hydration_get___hydration__intakes: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                page?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                pageSize?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                from?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                to?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                timezone?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    hydration_post___hydration__intakes: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Intake"];
            };
        };
        responses: {
            /** @description Same idempotency key replay */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Intake"];
                    };
                };
            };
            /** @description Success */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Intake"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    hydration_delete___hydration__intakes___intakeId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                intakeId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    hydration_patch___hydration__intakes___intakeId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                intakeId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IntakePatch"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    hydration_get___hydration__intakes__daily: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                date?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                timezone?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    hydration_get___hydration__reminders: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    hydration_put___hydration__reminders: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Reminder"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    management_get___management__administration__applications: {
        parameters: {
            query?: {
                limit?: components["parameters"]["administration_v1__Limit"];
                before?: components["parameters"]["administration_v1__Before"];
                status?: "draft" | "pending" | "approved" | "rejected" | "suspended";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["administration_v1__Application"][];
                            nextBefore: string | null;
                        };
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    management_get___management__administration__professionals: {
        parameters: {
            query?: {
                limit?: components["parameters"]["administration_v1__Limit"];
                before?: components["parameters"]["administration_v1__Before"];
                q?: string;
                status?: "draft" | "submitted" | "active" | "suspended" | "archived";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["administration_v1__Professional"][];
                            nextBefore: string | null;
                        };
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    management_get___management__administration__professionals___id___history: {
        parameters: {
            query?: {
                limit?: components["parameters"]["administration_v1__Limit"];
                before?: components["parameters"]["administration_v1__Before"];
            };
            header?: never;
            path: {
                id: components["parameters"]["administration_v1__Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["administration_v1__Audit"][];
                            nextBefore: string | null;
                        };
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    management_post___management__administration__professionals___id___suspend: {
        parameters: {
            query?: never;
            header: {
                "If-Match": components["parameters"]["administration_v1__IfMatch"];
            };
            path: {
                id: components["parameters"]["administration_v1__Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    reasonCode: string;
                };
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["administration_v1__Suspension"];
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    management_get___management__administration__services: {
        parameters: {
            query?: {
                limit?: components["parameters"]["administration_v1__Limit"];
                before?: components["parameters"]["administration_v1__Before"];
                q?: string;
                status?: "active" | "inactive";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["administration_v1__Service"][];
                            nextBefore: string | null;
                        };
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    management_post___management__administration__services___id___suspend: {
        parameters: {
            query?: never;
            header: {
                "If-Match": components["parameters"]["administration_v1__IfMatch"];
            };
            path: {
                id: components["parameters"]["administration_v1__Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    reasonCode: string;
                };
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["administration_v1__Suspension"];
                    };
                };
            };
            /** @description See administration-v1.md for error semantics */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
            /** @description See administration-v1.md for error semantics */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["administration_v1__Error"];
                };
            };
        };
    };
    management_get___management__appointments: {
        parameters: {
            query?: {
                limit?: number;
                before?: string;
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__AppointmentPage"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_get___management__assignments: {
        parameters: {
            query?: {
                limit?: number;
                before?: string;
                status?: "pending" | "active" | "revocation_pending" | "revoked" | "rejected";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__AssignmentPage"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_post___management__assignments: {
        parameters: {
            query?: never;
            header: {
                "X-Admin-Step-Up": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["management_v1__AssignmentRequest"];
            };
        };
        responses: {
            /** @description Operação concluída. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__Assignment"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_post___management__assignments___id___approve: {
        parameters: {
            query?: never;
            header: {
                /** @description ETag recebido: "<id>:<version>". */
                "If-Match": string;
                "X-Admin-Step-Up": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["management_v1__Empty"];
            };
        };
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__Assignment"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_post___management__assignments___id___approve_revocation: {
        parameters: {
            query?: never;
            header: {
                /** @description ETag recebido: "<id>:<version>". */
                "If-Match": string;
                "X-Admin-Step-Up": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["management_v1__Reason"];
            };
        };
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__Assignment"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_get___management__assignments___id___history: {
        parameters: {
            query?: {
                limit?: number;
                before?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Paginated administrative audit */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__AuditPage"];
                    };
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_post___management__assignments___id___reject: {
        parameters: {
            query?: never;
            header: {
                /** @description ETag recebido: "<id>:<version>". */
                "If-Match": string;
                "X-Admin-Step-Up": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    reasonCode: string;
                };
            };
        };
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__Assignment"];
                    };
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_post___management__assignments___id___request_revocation: {
        parameters: {
            query?: never;
            header: {
                /** @description ETag recebido: "<id>:<version>". */
                "If-Match": string;
                "X-Admin-Step-Up": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["management_v1__Reason"];
            };
        };
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__Assignment"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_get___management__audit: {
        parameters: {
            query?: {
                limit?: number;
                before?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__AuditPage"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_get___management__cases: {
        parameters: {
            query?: {
                limit?: number;
                before?: string;
                status?: string;
                q?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__CasePage"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_post___management__cases: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["management_v1__CaseCreate"];
            };
        };
        responses: {
            /** @description Operação concluída. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__Case"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_patch___management__cases___id: {
        parameters: {
            query?: never;
            header: {
                /** @description ETag recebido: "<id>:<version>". */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["management_v1__CaseTransition"];
            };
        };
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__Case"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_get___management__cases___id___history: {
        parameters: {
            query?: {
                limit?: number;
                before?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__AuditPage"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_get___management__dashboard: {
        parameters: {
            query: {
                /** @description Limites UTC; to exclusivo; máximo 31 dias. */
                from: string;
                /** @description Limites UTC; to exclusivo; máximo 31 dias. */
                to: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__Dashboard"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_get___management__me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__Me"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_get___management__operators: {
        parameters: {
            query?: {
                limit?: number;
                before?: string;
                q?: string;
                status?: "invited" | "active" | "suspended" | "archived";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description {data:{items,nextBefore}} */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__OperatorCurrentPage"];
                    };
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Administrative authorization, validation or dependency failure */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_post___management__operators: {
        parameters: {
            query?: never;
            header: {
                "X-Admin-Step-Up": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["management_v1__OperatorCreate"];
            };
        };
        responses: {
            /** @description Operação concluída. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__Operator"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_get___management__payments: {
        parameters: {
            query?: {
                limit?: number;
                before?: string;
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__PaymentPage"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    professional_get___management__professional_applications: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___management__professional_applications___applicationId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_post___management__professional_applications___applicationId___approve: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
                "Idempotency-Key": string;
            };
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LegacyReviewApprove"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___management__professional_applications___applicationId___history: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_post___management__professional_applications___applicationId___reject: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
                "Idempotency-Key": string;
            };
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LegacyReviewReason"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_post___management__professional_applications___applicationId___suspend: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
                "Idempotency-Key": string;
            };
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LegacyReviewReason"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    management_get___management__professionals: {
        parameters: {
            query?: {
                limit?: number;
                before?: string;
                status?: string;
                q?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__ProfessionalPage"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_get___management__scopes: {
        parameters: {
            query?: {
                limit?: number;
                before?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__ScopePage"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_post___management__scopes: {
        parameters: {
            query?: never;
            header: {
                "X-Admin-Step-Up": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["management_v1__ScopeCreate"];
            };
        };
        responses: {
            /** @description Operação concluída. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__Scope"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_get___management__services: {
        parameters: {
            query?: {
                limit?: number;
                before?: string;
                status?: string;
                q?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__ServicePage"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_post___management__services___id___reactivate: {
        parameters: {
            query?: never;
            header: {
                /** @description ETag recebido: "<id>:<version>". */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["management_v1__Reason"];
            };
        };
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__ServiceTransition"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    management_post___management__services___id___suspend: {
        parameters: {
            query?: never;
            header: {
                /** @description ETag recebido: "<id>:<version>". */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["management_v1__Reason"];
            };
        };
        responses: {
            /** @description Operação concluída. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["management_v1__ServiceTransition"];
                    };
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
            /** @description Pedido recusado ou dependência indisponível. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["management_v1__Error"];
                };
            };
        };
    };
    notification_get___notifications: {
        parameters: {
            query?: {
                page?: number;
                pageSize?: number;
                unread?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["backend_integration_v1__Notification"][];
                            total?: number;
                            page?: number;
                            pageSize?: number;
                        } & {
                            [key: string]: unknown;
                        };
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    notification_post___notifications___notificationId___read: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                notificationId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Notification"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    notification_get___notifications__preferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    notification_put___notifications__preferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["NotificationPreferences"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    notification_post___notifications__read_all: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    notification_get___notifications__unread_count: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            count: number;
                        };
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    payment_get___payments: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["backend_integration_v1__Payment"][];
                            nextBefore: string | null;
                        };
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    payment_post___payments: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PaymentInput"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Payment"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    payment_get___payments___paymentId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                paymentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Payment"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    payment_post___payments___paymentId___cancel: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path: {
                paymentId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Payment"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    payment_post___payments___paymentId___confirm: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path: {
                paymentId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Payment"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    payment_get___payments__appointment_payments___id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    payment_post___payments__appointment_payments___id___cancel: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    payment_post___payments__appointment_payments___id___confirm: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    payment_post___payments__appointment_payments___id___reconcile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    payment_post___payments__appointments___appointmentId: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path: {
                appointmentId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    performance_get___performance__goals: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description Owner-specific goals as defined by Performance Service */
                        data: Record<string, never>;
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    performance_put___performance__goals___kind: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                kind: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PerformanceGoal"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    performance_get___performance__heart_rate: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                page?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                pageSize?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                from?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    performance_post___performance__heart_rate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["HeartRate"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    performance_get___performance__heart_rate__summary: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                page?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                pageSize?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                from?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    performance_get___performance__measurements: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                page?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                pageSize?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                from?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    performance_post___performance__measurements: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PerformanceMeasurement"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    performance_delete___performance__measurements___measurementId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                measurementId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    performance_patch___performance__measurements___measurementId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                measurementId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PerformanceMeasurementPatch"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    performance_get___performance__measurements__evolution: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                page?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                pageSize?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                from?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    performance_get___performance__steps: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                page?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                pageSize?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                from?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    performance_post___performance__steps: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Steps"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    performance_get___performance__steps__daily: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                date?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                timezone?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    performance_get___performance__steps__summary: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                page?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                pageSize?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                from?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    performance_get___performance__summary: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___professionals__catalog: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___professionals__eligible_capabilities: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___professionals__me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_put___professionals__me: {
        parameters: {
            query?: never;
            header: {
                "If-None-Match": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProfessionalProfile"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_patch___professionals__me: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProfessionalProfilePatch"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___professionals__me__application_status: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___professionals__me__availability_declaration: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_put___professionals__me__availability_declaration: {
        parameters: {
            query?: never;
            header: {
                "If-None-Match": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AvailabilityDeclaration"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_patch___professionals__me__availability_declaration: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AvailabilityDeclarationPatch"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___professionals__me__capabilities: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_post___professionals__me__capabilities: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Capability"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___professionals__me__capabilities___capabilityId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                capabilityId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_patch___professionals__me__capabilities___capabilityId: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
            };
            path: {
                capabilityId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CapabilityPatch"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___professionals__me__care_relationships: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___professionals__me__qualifications: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_post___professionals__me__qualifications: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Qualification"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___professionals__me__qualifications___qualificationId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                qualificationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_patch___professionals__me__qualifications___qualificationId: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
            };
            path: {
                qualificationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QualificationPatch"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_post___professionals__me__reopen: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___professionals__me__services: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_post___professionals__me__services: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProfessionalService"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___professionals__me__services___serviceId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serviceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_patch___professionals__me__services___serviceId: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
            };
            path: {
                serviceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProfessionalServicePatch"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_post___professionals__me__services___serviceId___deactivate: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
            };
            path: {
                serviceId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_post___professionals__me__submit: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ApplicationSubmit"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___professionals__services: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                before?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                q?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                category?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                capabilityId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    professional_get___professionals__specializations: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: Record<string, never>;
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    gateway_get___ready: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Ready"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    training_get___training__exercises: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                page?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                pageSize?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                environment?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                difficulty?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                type?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                muscleGroup?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    training_post___training__exercises: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Exercise"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    training_get___training__exercises___exerciseId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                exerciseId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    training_get___training__plans: {
        parameters: {
            query?: {
                page?: number;
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: Record<string, never>[];
                            total?: number;
                            page?: number;
                            pageSize?: number;
                        } & {
                            [key: string]: unknown;
                        };
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    training_post___training__plans: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Plan"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    training_get___training__plans___planId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                planId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    training_patch___training__plans___planId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                planId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PlanPatch"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    training_post___training__plans___planId___archive: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                planId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    training_post___training__plans___planId___duplicate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                planId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    training_post___training__plans___planId___exercises: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                planId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PlanExercise"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    training_delete___training__plans___planId___exercises___exerciseId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                planId: string;
                exerciseId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    training_get___training__sessions: {
        parameters: {
            query?: {
                page?: number;
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["backend_integration_v1__Session"][];
                            total?: number;
                            page?: number;
                            pageSize?: number;
                        } & {
                            [key: string]: unknown;
                        };
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    training_post___training__sessions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Session"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Session"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    training_get___training__sessions___sessionId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Session"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    training_post___training__sessions___sessionId___cancel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Session"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    training_post___training__sessions___sessionId___complete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Session"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    training_post___training__sessions___sessionId___exercises: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SessionExercise"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    training_post___training__sessions___sessionId___pause: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Session"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    training_post___training__sessions___sessionId___resume: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Session"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    training_post___training__sessions___sessionId___start: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Empty"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Session"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    user_get___users__me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Profile"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    user_put___users__me: {
        parameters: {
            query?: never;
            header: {
                "If-None-Match": "*";
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Profile"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Profile"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    user_patch___users__me: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProfilePatch"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["backend_integration_v1__Profile"];
                    };
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
            /** @description Validation, permission, concurrency or dependency error */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["backend_integration_v1__Error"];
                };
            };
        };
    };
    user_get___users__me__goals: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                cursor?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    user_post___users__me__goals: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserGoal"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    user_get___users__me__goals___goalId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                goalId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    user_patch___users__me__goals___goalId: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
            };
            path: {
                goalId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserGoalPatch"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    user_get___users__me__habits: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    user_put___users__me__habits: {
        parameters: {
            query?: never;
            header: {
                "If-None-Match": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Habits"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    user_patch___users__me__habits: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["HabitsPatch"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    user_get___users__me__measurements: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                cursor?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                kind?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    user_post___users__me__measurements: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserMeasurement"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    user_get___users__me__measurements___measurementId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                measurementId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    user_get___users__me__physical_data: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    user_get___users__me__preferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    user_put___users__me__preferences: {
        parameters: {
            query?: never;
            header: {
                "If-None-Match": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Preferences"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    user_patch___users__me__preferences: {
        parameters: {
            query?: never;
            header: {
                "If-Match": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PreferencesPatch"];
            };
        };
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    user_get___users__me__weight_history: {
        parameters: {
            query?: {
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                limit?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                cursor?: string;
                /** @description Validated by the owner; pagination rules in backend-release-v1.md */
                kind?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success (200/201/204 according to owner); exact envelope/DTO follows owner contract */
            "2XX": {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            /** @description Owner or Gateway error; see common HTTP handling */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
}
