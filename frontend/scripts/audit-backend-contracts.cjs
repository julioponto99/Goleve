'use strict';
// Read-only diagnosis and in-memory proof of a proposed patch. Never writes backend files.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const normalize=value=>value.replace(/\r\n/g,'\n');
function replaceOnce(source,from,to){assert.equal(source.split(from).length,2,'Candidate patch no longer matches source');return source.replace(from,to);}
function proposedReleasePatch(source){
 return replaceOnce(source,"const read=f=>fs.readFileSync(path.join(root,f),'utf8');","const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\\r\\n/g,'\\n');");
}
function proposedSwaggerPatch(source){
 source=replaceOnce(source,"fs.readFileSync(file));","Buffer.from(fs.readFileSync(file,'utf8').replace(/\\r\\n/g,'\\n')));");
 return replaceOnce(source,"fs.readFileSync(output, 'utf8'), generated.content","fs.readFileSync(output, 'utf8').replace(/\\r\\n/g,'\\n'), generated.content");
}
function load(file,source,overrides={}){
 const name=path.join(root,file),m=new Module(name,module);
 m.filename=name;m.paths=Module._nodeModulePaths(path.dirname(name));
 const original=m.require.bind(m);m.require=id=>Object.hasOwn(overrides,id)?overrides[id]:original(id);
 m._compile(source,name);
 return m.exports;
}
function hashSources(read){
 const files=['administration-v1','backend-integration-v1','backend-release-v1','management-v1'].map(x=>path.join(root,'documentation/api/'+x+'.openapi.json'));
 const hash=createHash('sha256');for(const file of files.sort((a,b)=>a.localeCompare(b)))hash.update(path.basename(file)).update(read(file));return hash.digest('hex');
}
function proveCandidate(lineEnding='lf',testTransform){
 const io=Object.create(fs);
 io.readFileSync=(file,options)=>{
  const actual=fs.readFileSync(file,options);
  if(typeof file!=='string'||!file.startsWith(root)||!/\.(?:json|ts|md)$/.test(file))return actual;
  let text=normalize(typeof actual==='string'?actual:actual.toString('utf8'));
  if(testTransform)text=testTransform(file,text);
  const result=lineEnding==='crlf'?text.replace(/\n/g,'\r\n'):text;
  return typeof actual==='string'?result:Buffer.from(result);
 };
 const releaseSource=fs.readFileSync(path.join(root,'scripts/release-contracts.cjs'),'utf8');
 const release=load('scripts/release-contracts.cjs',proposedReleasePatch(releaseSource),{'node:fs':io});
 const generated=release.generate();
 const files=['documentation/api/backend-release-v1.openapi.json','documentation/api/backend-release-v1.routes.json','documentation/api/backend-release-v1-endpoints.md'];
 const values=[JSON.stringify(generated.spec,null,2)+'\n',JSON.stringify({baseCommit:'000cc43ee2a47af9de5b0f8ace7fb09e8a5d5dd6',operations:generated.metadata},null,2)+'\n',generated.index];
 files.forEach((f,i)=>assert.equal(normalize(io.readFileSync(path.join(root,f),'utf8')),values[i],'Contract mismatch: '+f));
 const swaggerSource=fs.readFileSync(path.join(root,'scripts/gateway-swagger.cjs'),'utf8');
 const swagger=load('scripts/gateway-swagger.cjs',proposedSwaggerPatch(swaggerSource),{'node:fs':io,'./release-contracts.cjs':release});
 const bundled=swagger.bundle(),artifact=normalize(io.readFileSync(path.join(root,'backend/api-gateway/src/generated/api-docs-document.ts'),'utf8'));
 assert.equal(artifact,bundled.content,'Swagger content/hash mismatch');
 return {lineEnding,...release.validate(generated.spec,path.join(root,files[0])),sourceHash:bundled.sourceHash};
}
function audit(){
 const artifact=fs.readFileSync(path.join(root,'backend/api-gateway/src/generated/api-docs-document.ts'),'utf8'),stored=artifact.match(/Source SHA-256: ([a-f0-9]+)/)[1];
 const workingHash=hashSources(f=>fs.readFileSync(f));
 const normalizedHash=hashSources(f=>normalize(fs.readFileSync(f,'utf8')));
 const candidates=[proveCandidate('lf'),proveCandidate('crlf')];
 assert(candidates.every(c=>c.sourceHash===stored));
 return {mode:'read-only candidate proof; original scripts unchanged',storedHash:stored,workingHash,normalizedHash,workingMatchesStored:workingHash===stored,normalizedMatchesStored:normalizedHash===stored,candidates};
}
module.exports={normalize,proposedReleasePatch,proposedSwaggerPatch,proveCandidate,audit};
if(require.main===module)console.log(JSON.stringify(audit()));
