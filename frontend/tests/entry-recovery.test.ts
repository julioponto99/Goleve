import test from 'node:test';
import assert from 'node:assert/strict';
import { entryDestination, navigationDecision, navigationFor, passwordRecovery, recoveryPaths, recoveryStage, webRouteForPath } from '../shared/src/index';
import type { Role, SessionSnapshot } from '../shared/src/index';
const roles:Role[]=['utilizador','profissional','gestor','administrador'];
for(const role of roles)test('verified entry and menu isolation: '+role,()=>{
 const state={status:'authenticated',user:{userType:role}} as SessionSnapshot;
 assert.equal(entryDestination(state,'/',false),'/painel/'+role);
 for(const item of navigationFor(role))assert.equal(navigationDecision(item,state),'allowed');
 for(const other of roles.filter(value=>value!==role))assert.equal(navigationDecision(webRouteForPath('/painel/'+other)!,state),'forbidden');
 if(role!=='administrador')assert.ok(!navigationFor(role).some(item=>item.id.startsWith('admin-')));
});
test('anonymous/pending MFA never enter a protected screen; restore is not success',()=>{
 for(const path of ['/','/painel/administrador']){
  assert.equal(entryDestination({status:'anonymous'},path,path!=='/'),'/entrar');
  assert.equal(entryDestination({status:'mfa-required',enrollmentRequired:true},path,path!=='/'),'/autenticacao/mfa');
  assert.equal(entryDestination({status:'restoring'},path,path!=='/'),null);
 }
});
test('public recovery paths stay unavailable and never grant a session',()=>{
 assert.equal(passwordRecovery.available,false);
 for(const path of Object.values(recoveryPaths)){assert.ok(recoveryStage(path));assert.equal(webRouteForPath(path)?.private,false);assert.equal(entryDestination({status:'anonymous'},path,false),null);}
 assert.equal(recoveryStage('/auth/password-recovery/complete'),null);
});
