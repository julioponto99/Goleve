import test from 'node:test';
import assert from 'node:assert/strict';
import { colors, decimalInput, navigationDecision, passwordFormatValid, resolveTheme, routes, utf8Length } from '../shared/src/index';
test('all private routes deny an anonymous or MFA-only identity',()=>{
 for(const route of routes.filter(r=>r.private)){
  assert.equal(navigationDecision(route,{status:'anonymous'}),'authentication-required');
  assert.equal(navigationDecision(route,{status:'mfa-required',enrollmentRequired:false}),'authentication-required');
  assert.equal(navigationDecision(route,{status:'restoring'}),'identity-unavailable');
 }
});
test('home remains available without AI, session or professional relationship',()=>{
 assert.equal(navigationDecision(routes[0],{status:'anonymous'}),'allowed');assert.equal(routes.find(r=>r.id==='coach')?.availability,'blocked');
});
test('light/dark is independent of navigation and system preference resolves correctly',()=>{
 assert.equal(resolveTheme('dark','light'),'dark');assert.equal(resolveTheme('system','light'),'light');assert.equal(resolveTheme('system','dark'),'dark');assert.equal(colors.dark.accent,colors.light.accent);
});
test('decimal formatting supports Portuguese input without medical or conversion rules',()=>{
 assert.equal(decimalInput('78,4'),78.4);assert.equal(decimalInput('78.4'),78.4);assert.equal(decimalInput('1,234.5'),null);assert.equal(decimalInput('NaN'),null);
});
test('password UX uses UTF-8 byte limit rather than treating 72 characters as safe',()=>{
 assert.equal(utf8Length('á'.repeat(37)),74);assert.equal(passwordFormatValid('á'.repeat(37)),false);assert.equal(passwordFormatValid('not-a-real-password'),true);assert.equal(passwordFormatValid('short'),false);
});
test('a manager role cannot pass an Administrator-only navigation hint',()=>{
 const user={id:'a'.repeat(24),name:'Pessoa fictícia',email:'fictional@unit.invalid',userType:'gestor' as const,accountStatus:'active' as const,roleVersion:1,createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'};
 assert.equal(navigationDecision({private:true,roles:['administrador']},{status:'authenticated',user,expiresAt:Date.now()+60000}),'forbidden');
});
