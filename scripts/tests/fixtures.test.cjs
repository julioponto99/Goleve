'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{createRequire}=require('node:module'),path=require('node:path');
const {fixtures,oid}=require('../../backend/runtime/fixtures.cjs'),{accounts}=require('../../backend/runtime/local-demo.cjs');
const p={instance:'1234567890abcdef',seedEpoch:new Date().toISOString(),expiresAt:new Date(Date.now()+30*86400000).toISOString(),accounts:accounts.map(([role,email],i)=>({role,email,id:String(i+1).padStart(24,'0'),name:'Conta fictícia '+i})),resources:{}};
for(const k of ['ptProfile','ptCapability','ptService','ptApplication','ptQualification','ptEntitlement','nutritionProfile','nutritionCapability','nutritionService','nutritionApplication','nutritionQualification','nutritionEntitlement','managerOperator','managerScope','managerGrant'])p.resources[k]=oid(p,k);
for(const owner of ['user','training','hydration','performance','agenda','professional','management','notification'])test(owner+' fixtures validate against the actual owner schemas and version of Mongoose',async()=>{
 const base=path.resolve(__dirname,'../../backend/services/'+owner+'-service'),req=createRequire(path.join(base,'package.json')),mongoose=req('mongoose'),c=mongoose.createConnection(),m=req('./dist/models');
 try{const factory=owner==='agenda'?'createAgendaModels':owner==='management'?'createManagementModels':'create'+owner[0].toUpperCase()+owner.slice(1)+'Models',models=m[factory](c);if(owner==='professional')models.Entitlement=req('./dist/local-demo-fixtures').entitlementModel(c);if(owner==='management')models.DemoGrant=req('./dist/local-demo-grants').demoGrantModel(c);
 const rows=fixtures(owner,p);assert.ok(rows.length>0);assert.equal(new Set(rows.map(r=>String(r.doc._id))).size,rows.length);
 for(const row of rows)await new models[row.model](row.doc).validate();
 if(owner==='professional'){for(const r of rows.filter(r=>r.model==='Application')){assert.equal(r.doc.status,'pending');assert.equal(r.doc.publicationEnabled,false);}for(const r of rows.filter(r=>r.model==='Qualification'))assert.equal(r.doc.verificationStatus,'unverified');}
 if(owner==='management')assert.ok(rows.every(r=>r.model!=='Assignment')); // Never fake independent administrative approval.
 }finally{await c.close();}
});
