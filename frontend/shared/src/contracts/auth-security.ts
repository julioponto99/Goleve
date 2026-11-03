import type { Role } from './domain';
import type { MfaFactor } from '../auth/validation';
// Verified against Auth SecurityService.stepUp/userAction/requestRole/decideRole.
// The OpenAPI parameters object is generic; this SDK supports these closed Auth
// bindings only. Management/Professional bindings need their own exact DTOs later.
export type AuthAdminAction='user.suspend'|'user.reactivate'|'user.revoke'|'role.request'|'role.approve'|'role.reject';
export type AuthMutationParameters=Readonly<{version:number;reasonCode:string;newRole?:Role}>;
// Password-only requests are accepted by Auth only for its explicit local-demo authority.
export type AuthStepUpInput={password:string;action:AuthAdminAction;targetId:string;parameters:AuthMutationParameters}&(MfaFactor|{otp?:never;recoveryCode?:never});
