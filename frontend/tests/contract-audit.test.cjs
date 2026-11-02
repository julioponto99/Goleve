'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {audit,proveCandidate,normalize}=require('../scripts/audit-backend-contracts.cjs');
test('candidate retains all public contracts and exact committed Swagger hash with LF',()=>{
 const result=proveCandidate('lf');assert.equal(result.operations,215);assert.equal(result.services,11);assert.equal(result.paths,170);
});
test('the same candidate retains the same contracts/hash with CRLF',()=>{
 assert.deepEqual({...proveCandidate('lf'),lineEnding:undefined},{...proveCandidate('crlf'),lineEnding:undefined});
});
test('normalisation does not hide real contract changes or strip content',()=>{
 assert.notEqual(normalize('{"price":100}\r\n'),normalize('{"price":101}\n'));
 assert.notEqual(normalize('POST /a\r\n'),normalize('GET /a\n'));
 assert.equal(normalize('line\r\nnext\n'),'line\nnext\n');
 const result=audit();assert.equal(result.normalizedMatchesStored,true);
});
test('a real OpenAPI contract change is still rejected by the candidate checker',()=>{
 assert.throws(()=>proveCandidate('crlf',(file,text)=>{
  if(!file.endsWith('backend-release-v1.openapi.json'))return text;
  const changed=JSON.parse(text);changed.paths['/auth/login'].post.security=[{ChangedContract:[]}];
  return JSON.stringify(changed,null,2)+'\n';
 }),/Contract mismatch/);
});
