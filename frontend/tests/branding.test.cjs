'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),hash=b=>createHash('sha256').update(b).digest('hex');
test('official 512px PNGs remain unchanged and all Web/Mobile copies are byte-identical',()=>{
 const provenance=JSON.parse(fs.readFileSync(path.join(root,'shared/assets/provenance.json'),'utf8')).identity;
 for(const entry of provenance.files){
  const original=fs.readFileSync(path.join(root,'branding',entry.name));
  assert.equal(original.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(original.toString('ascii',12,16),'IHDR');assert.equal(original.readUInt32BE(16),512);assert.equal(original.readUInt32BE(20),512);assert.equal(hash(original),entry.sha256);
  for(const folder of ['shared/assets/branding','web/public/branding'])assert.deepEqual(fs.readFileSync(path.join(root,folder,entry.name)),original);
 }
 const config=JSON.parse(fs.readFileSync(path.join(root,'mobile/app.json'),'utf8')).expo;
 for(const target of [config.icon,config.android.icon,config.ios.icon.light,config.ios.icon.dark])assert(fs.existsSync(path.resolve(root,'mobile',target)));
 assert(config.ios.icon.dark.endsWith('icone-dark-512.png'));assert(config.ios.icon.light.endsWith('icone-lime-512.png'));
});
