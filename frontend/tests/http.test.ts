import test from 'node:test';
import assert from 'node:assert/strict';
import { apiOrigin, createApiClient, ApiError, errorMessage } from '../shared/src/index';
import type { PublicPath } from '../shared/src/index';
const origin='https://gateway.goleve.invalid';
const json=(data:unknown,status=200,headers:Record<string,string>={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json',...headers}});
test('only HTTPS or explicitly local development origins are accepted',()=>{
 assert.equal(apiOrigin(origin),origin);assert.equal(apiOrigin('http://10.0.2.2:64344',true),'http://10.0.2.2:64344');
 for(const value of ['http://public.invalid','http://127.0.0.1:64344','https://user:password@gateway.invalid','https://gateway.invalid/internal','https://gateway.invalid?token=x','file:///tmp'])assert.throws(()=>apiOrigin(value));
});
test('an operation uses Gateway origin, session Bearer, ETag and no cookies/redirects',async()=>{
 let calls=0;
 const api=createApiClient({origin,token:{current:()=> 'unit-test-token',invalidate:()=>assert.fail()},fetch:async(input,init)=>{
  calls++;assert.equal(String(input),origin+'/users/me');assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer unit-test-token');assert.equal(new Headers(init?.headers).get('If-Match'),'"resource:2"');assert.equal(init?.credentials,'omit');assert.equal(init?.redirect,'error');assert.equal(init?.referrerPolicy,'no-referrer');
  return json({data:{}},200,{ETag:'"resource:3"'});
 }});
 const response=await api.request('patch','/users/me',{body:{displayName:'Pessoa fictícia'},headers:{'If-Match':'"resource:2"'}});
 assert.equal(calls,1);assert.equal(response.etag,'"resource:3"');
});
test('public calls omit the Bearer and Auth envelope is preserved',async()=>{
 const api=createApiClient({origin,token:{current:()=> 'unit-test-token',invalidate:()=>assert.fail()},fetch:async(_url,init)=>{
  assert.equal(new Headers(init?.headers).has('Authorization'),false);return json({user:{id:'example'},accessToken:'synthetic'});
 }});
 const result=await api.request('post','/auth/login',{authenticated:false,body:{email:'fictional@unit.invalid',password:'synthetic-input'}});
 assert.deepEqual(result.body,{user:{id:'example'},accessToken:'synthetic'});
});
test('internal endpoints, arbitrary URLs and unsupported methods never reach fetch',async()=>{
 let calls=0;const api=createApiClient({origin,fetch:async()=>{calls++;return json({});}});
 for(const path of ['/internal/v1/management','https://attacker.invalid','//attacker.invalid','/auth/../internal','/%69nternal'])await assert.rejects(()=>api.request('get',path as PublicPath),{code:'UNSUPPORTED_OPERATION'});
 // Exercise the runtime boundary independently of the compile-time rejection.
 // @ts-expect-error DELETE /auth/me is intentionally not a public operation.
 await assert.rejects(()=>api.request('delete','/auth/me'),{code:'UNSUPPORTED_OPERATION'});
 assert.equal(calls,0);
});
test('missing or encoded traversal parameters and extra parameters are rejected',async()=>{
 const api=createApiClient({origin,fetch:async()=>assert.fail('Must not send')});
 for(const id of ['..','a/b','%2e%2e','a?b','a#b','a\\b'])await assert.rejects(()=>api.request('get','/payments/{paymentId}',{params:{paymentId:id}}),{code:'INVALID_PATH_PARAMETER'});
 await assert.rejects(()=>api.request('get','/payments/{paymentId}'),{code:'INVALID_PATH_PARAMETER'});
 await assert.rejects(()=>api.request('get','/auth/me',{params:{ownerId:'other'}}),{code:'UNEXPECTED_PATH_PARAMETER'});
});
test('credential and service headers cannot be injected through request options',async()=>{
 const api=createApiClient({origin,fetch:async()=>assert.fail('Must not send')});
 await assert.rejects(()=>api.request('get','/auth/me',{headers:{Authorization:'arbitrary'} as never}),{code:'UNSUPPORTED_HEADER'});
});
test('204 is not parsed as JSON',async()=>{
 const api=createApiClient({origin,fetch:async()=>new Response(null,{status:204})});
 const result=await api.request('post','/auth/logout',{body:{}});assert.equal(result.body,undefined);
});
test('JSON errors retain safe code/correlation and never the raw server message',async()=>{
 const api=createApiClient({origin,fetch:async()=>json({error:{code:'VALIDATION_ERROR',message:'sensitive raw body',requestId:'synthetic-correlation'}},422)});
 await assert.rejects(()=>api.request('get','/auth/me'),e=>{
  assert(e instanceof ApiError);assert.equal(e.code,'VALIDATION_ERROR');assert.equal(e.requestId,'synthetic-correlation');assert(!e.message.includes('sensitive'));assert(!errorMessage(e).includes('sensitive'));return true;
 });
});
test('401 invalidates only the token captured for that request',async()=>{
 const invalidated:string[]=[];let token='old-token';
 const api=createApiClient({origin,token:{current:()=>token,invalidate:value=>{invalidated.push(value);}},fetch:async()=>{token='new-token';return json({error:{code:'INVALID_TOKEN'}},401);}});
 await assert.rejects(()=>api.request('get','/auth/me'),{status:401});
 assert.deepEqual(invalidated,['old-token']);
});
test('429 preserves Retry-After and never retries',async()=>{
 let calls=0;const api=createApiClient({origin,fetch:async()=>{calls++;return json({error:{code:'RATE_LIMITED'}},429,{'Retry-After':'60'});}});
 await assert.rejects(()=>api.request('get','/auth/me'),{status:429,retryAfter:'60'});assert.equal(calls,1);
});
test('a lost write response is unknown and is never retried',async()=>{
 let calls=0;const api=createApiClient({origin,fetch:async()=>{calls++;throw new TypeError('socket lost');}});
 await assert.rejects(()=>api.request('post','/payments/{paymentId}/confirm',{params:{paymentId:'synthetic'},body:{},headers:{'Idempotency-Key':'synthetic-intention'}}),{outcome:'unknown',code:'NETWORK_ERROR'});
 assert.equal(calls,1);
});
test('uncertain payment response remains blocked for reconciliation',async()=>{
 const api=createApiClient({origin,fetch:async()=>json({error:{code:'PAYMENT_RECONCILIATION_REQUIRED'}},503)});
 await assert.rejects(()=>api.request('post','/payments/{paymentId}/confirm',{params:{paymentId:'synthetic'},body:{}}),e=>{
  assert(e instanceof ApiError);assert.equal(e.outcome,'unknown');assert(errorMessage(e).includes('Não repitas'));return true;
 });
});
test('pre-aborted calls are not sent',async()=>{
 const controller=new AbortController();controller.abort();
 const api=createApiClient({origin,fetch:async()=>assert.fail('Must not send')});
 await assert.rejects(()=>api.request('get','/auth/me',{signal:controller.signal}),{code:'REQUEST_ABORTED',outcome:'not-started'});
});
test('timeout is bounded through response body parsing as well as headers',async()=>{
 const api=createApiClient({origin,timeoutMs:15,fetch:async(_url,init)=>{
  const body=new ReadableStream({start(controller){init!.signal!.addEventListener('abort',()=>controller.error(new Error('aborted')),{once:true});}});
  return new Response(body,{headers:{'Content-Type':'application/json'}});
 }});
 await assert.rejects(()=>api.request('get','/auth/me'),{code:'REQUEST_ABORTED'});
});
test('non-JSON success and write errors are not shown as server HTML',async()=>{
 const api=createApiClient({origin,fetch:async()=>new Response('<private>upstream error</private>',{status:502})});
 await assert.rejects(()=>api.request('post','/auth/logout',{body:{}}),e=>{
  assert(e instanceof ApiError);assert.equal(e.code,'INVALID_RESPONSE');assert.equal(e.outcome,'unknown');assert(!e.message.includes('private'));return true;
 });
});
