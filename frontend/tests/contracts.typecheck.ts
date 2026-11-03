import type { ApiClient, RegisterInput, ProfileInput } from '../shared/src/index';
declare const api:ApiClient;
declare const profile:ProfileInput;
void profile;
const valid:RegisterInput={name:'Pessoa fictícia',email:'fictional@unit.invalid',password:'synthetic-input'};
void valid;
function publicContractChecks(){
 void api.request('get','/auth/me');
 // @ts-expect-error The reviewed step-up binding cannot request an arbitrary action.
 void api.request('post','/auth/admin/step-up',{body:{password:'synthetic-input',otp:'123456',action:'arbitrary.operation',targetId:'a'.repeat(24),parameters:{version:1,reasonCode:'test_reason'}}});
 // @ts-expect-error Step-up parameters are a closed DTO, not arbitrary HTTP commands.
 void api.request('post','/auth/admin/step-up',{body:{password:'synthetic-input',otp:'123456',action:'user.revoke',targetId:'a'.repeat(24),parameters:{url:'https://example.invalid'}}});
 // @ts-expect-error Technical APIs are not part of the public contract.
 void api.request('get','/internal/v1/management');
 // @ts-expect-error No refresh endpoint exists.
 void api.request('post','/auth/refresh');
 // @ts-expect-error Public registration cannot assign a role.
 const elevated:RegisterInput={...valid,role:'administrador'};
 // @ts-expect-error Body measurements do not belong to User profile input.
 const wrongProfile:ProfileInput={displayName:'Pessoa fictícia',weight:98};
 // @ts-expect-error GET /auth/me is not a DELETE operation.
 void api.request('delete','/auth/me');
 void elevated;void wrongProfile;
}
void publicContractChecks;
