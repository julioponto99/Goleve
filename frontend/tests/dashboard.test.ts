import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardAccess, dashboardFor, dashboardModules, dashboardRoutes, webRouteForPath } from '../web/src/navigation';
import type { Role, SessionSnapshot } from '../shared/src/index';
const roles:Role[]=['utilizador','profissional','gestor','administrador'];
function identity(role:Role):SessionSnapshot{return {status:'authenticated',user:{id:'a'.repeat(24),name:'Teste isolado',email:'unit@example.invalid',userType:role,accountStatus:'active',roleVersion:1,createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'},expiresAt:Date.now()+60000};}
test('the four dashboards accept only their own current Auth role',()=>{
 for(const route of dashboardRoutes)for(const role of roles)assert.equal(dashboardAccess(route,identity(role)),role===route.dashboardRole?'allowed':'forbidden');
});
test('anonymous, MFA-only and unverified sessions cannot open a dashboard',()=>{
 for(const route of dashboardRoutes){
  assert.equal(dashboardAccess(route,{status:'anonymous'}),'authentication-required');
  assert.equal(dashboardAccess(route,{status:'mfa-required',enrollmentRequired:true}),'authentication-required');
  assert.equal(dashboardAccess(route,{status:'restoring'}),'identity-unavailable');
 }
});
test('dashboard navigation is closed and never accepts role values, URLs or internal endpoints from the client',()=>{
 for(const role of roles)assert.equal(webRouteForPath(dashboardFor(role).path),dashboardFor(role));
 for(const path of ['/painel/root','https://example.invalid','/internal/authorize','//evil.invalid'])assert.equal(webRouteForPath(path),undefined);
});
test('unimplemented modules are descriptions without a fake metric or executable backend operation',()=>{
 for(const role of roles){assert.ok(dashboardModules[role].length>=4);for(const module of dashboardModules[role])assert.deepEqual(Object.keys(module).filter(key=>['value','count','href','operation','permissionGrant'].includes(key)),[]);}
});
