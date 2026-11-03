'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {appendMissing,assertIgnored,services}=require('./local-runtime.cjs');
const dotenv=require('../backend/node_modules/dotenv');
const root=path.resolve(__dirname,'..'),directory=path.join(root,'.secrets/local-runtime');
const manifestFile=path.join(directory,'demo-identities.json'),vaultFile=path.join(directory,'demo-credentials.enc'),vaultKey=path.join(directory,'demo-credentials.key');
function decryptCredentials(){const p=JSON.parse(fs.readFileSync(manifestFile)),v=JSON.parse(fs.readFileSync(vaultFile)),d=crypto.createDecipheriv('aes-256-gcm',Buffer.from(fs.readFileSync(vaultKey,'utf8').trim(),'hex'),Buffer.from(v.iv,'hex'));d.setAAD(Buffer.from('goleve-local-demo-credentials-v1:'+p.instance));d.setAuthTag(Buffer.from(v.tag,'hex'));return JSON.parse(Buffer.concat([d.update(Buffer.from(v.data,'base64')),d.final()]).toString());}
function setConfig(file,changes){let text=fs.readFileSync(file,'utf8');for(const[k,v]of Object.entries(changes)){const line=k+'='+JSON.stringify(String(v));if(new RegExp('^'+k+'=', 'm').test(text))text=text.replace(new RegExp('^'+k+'=.*$','m'),()=>line);else text+=(text.endsWith('\n')?'':'\n')+line+'\n';}fs.writeFileSync(file,text,{mode:0o600});}
function plan({activate=true}={}){
  for(const f of [manifestFile,vaultFile,vaultKey])assertIgnored(root,f);
  fs.mkdirSync(directory,{recursive:true});
  if(!fs.existsSync(manifestFile)){
    if(fs.existsSync(vaultFile)||fs.existsSync(vaultKey))throw Error('Partial existing credential preparation; preserve and review');
    const instance=crypto.randomBytes(8).toString('hex'),oid=()=>crypto.randomBytes(12).toString('hex'),now=new Date();
    const accounts=require('../backend/runtime/local-demo.cjs').accounts.map(([role,email],i)=>({id:oid(),role,email,name:['Utilizador de demonstração','Personal Trainer de demonstração','Nutricionista de demonstração','Gestor de demonstração','Administrador de demonstração'][i]}));
    const resources=Object.fromEntries(['ptProfile','ptCapability','ptService','ptApplication','ptQualification','ptEntitlement','nutritionProfile','nutritionCapability','nutritionService','nutritionApplication','nutritionQualification','nutritionEntitlement','managerOperator','managerScope','managerGrant'].map(k=>[k,oid()]));
    const p={version:1,instance,seedEpoch:now.toISOString(),expiresAt:new Date(now.getTime()+30*86400000).toISOString(),accounts,resources};
    const key=crypto.randomBytes(32),iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from('goleve-local-demo-credentials-v1:'+instance));
    const credentials=accounts.map(a=>({email:a.email,password:crypto.randomBytes(24).toString('base64url')}));
    const data=Buffer.concat([cipher.update(JSON.stringify(credentials)),cipher.final()]);
    fs.writeFileSync(vaultKey,key.toString('hex'),{flag:'wx',mode:0o600});fs.writeFileSync(vaultFile,JSON.stringify({iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),data:data.toString('base64')}),{flag:'wx',mode:0o600});
    fs.writeFileSync(manifestFile,JSON.stringify(p,null,2),{flag:'wx',mode:0o600});
  }
  const p=JSON.parse(fs.readFileSync(manifestFile));decryptCredentials();
  const keyFile=path.join(directory,'identity_auth_professional.key');assertIgnored(root,keyFile);if(!fs.existsSync(keyFile))fs.writeFileSync(keyFile,crypto.randomBytes(32).toString('hex'),{flag:'wx',mode:0o600});
  if(!activate){console.log(JSON.stringify({prepared:true,activated:false,accountsCreated:0,passwords:'encrypted vault; not displayed'}));return;}
  const rootEnvironment=dotenv.parse(fs.readFileSync(path.join(root,'.env')));
  for(const [owner]of [...services,['api-gateway']]){
    const relative=owner==='api-gateway'?'backend/api-gateway/.env':'backend/services/'+owner+'-service/.env',file=path.join(root,relative),existing=dotenv.parse(fs.readFileSync(file));
    if(existing.NODE_ENV!=='development')throw Error('Existing runtime is not development; configuration preserved');
    const e={GOLEVE_LOCAL_DEMO_ENABLED:'true',GOLEVE_RUNTIME_MODE:'local-demo',GOLEVE_LOCAL_DEMO_INSTANCE:p.instance,LOCAL_DEMO_GATEWAY_ORIGIN:'http://127.0.0.1:'+(rootEnvironment.API_GATEWAY_PORT||'3000'),LOCAL_DEMO_IDENTITIES_FILE:'/run/secrets/local_demo_identities',LOCAL_DEMO_OWNER:owner};
    if(['auth','professional'].includes(owner))e.LOCAL_DEMO_IDENTITY_KEY_FILE='/run/secrets/identity_auth_professional';
    if(owner==='auth')Object.assign(e,{LOCAL_DEMO_CREDENTIALS_FILE:'/run/secrets/local_demo_credentials',LOCAL_DEMO_CREDENTIALS_KEY_FILE:'/run/secrets/local_demo_credentials_key'});
    if(owner==='user')e.USER_DATA_MODE='synthetic';
    if(owner==='professional')Object.assign(e,{PROFESSIONAL_DATA_MODE:'synthetic',PROFESSIONAL_REVIEW_MODE:'disabled'});
    if(['professional','agenda','payment'].includes(owner)){
      Object.assign(e,{PAYMENT_AGENDA_DEMO_ENABLED:'true',PAYMENT_AGENDA_DEMO_INSTANCE:p.instance,AGENDA_SERVICE_URL:'http://agenda-service:3004',PAYMENT_SERVICE_URL:'http://payment-service:3009',PROFESSIONAL_SERVICE_URL:'http://professional-service:3007'});
      for(const peer of ['agenda','payment','professional'])if(peer!==owner){const pair=[peer,owner].sort().join('_').toUpperCase(),filename=pair==='AGENDA_PAYMENT'?'payment_agenda':pair.toLowerCase();e['PAYMENT_DEMO_KEY_'+pair+'_FILE']='/run/secrets/'+filename;}
    }
    if(owner==='agenda')Object.assign(e,{AGENDA_PROFESSIONAL_ENABLED:'true',AGENDA_PROFESSIONAL_MODE:'isolated',AGENDA_PROFESSIONAL_PUBLISH_EVENTS:'true',AGENDA_PROFESSIONAL_RABBITMQ_URL:existing.RABBITMQ_URL});
    if(owner==='payment')Object.assign(e,{PAYMENT_NOTIFICATION_EVENTS_ENABLED:'true',PAYMENT_NOTIFICATION_RABBITMQ_URL:existing.RABBITMQ_URL,PAYMENT_DEMO_FIXTURES:'local-demo-pt:3500:approve,local-demo-nutrition:5000:approve,local-demo-decline:3500:decline'});
    if(owner==='notification')e.NOTIFICATION_DEMO_EVENTS_ENABLED='true';
    if(['training','hydration'].includes(owner))e.OUTBOX_ENABLED='true';
    setConfig(file,e);
  }
  console.log(JSON.stringify({prepared:true,accounts:p.accounts.map(a=>({email:a.email,role:a.role})),passwords:'encrypted vault; not displayed',expiresAt:p.expiresAt,databaseWrites:0}));
}
function credentials(selector){
  if(!process.stdin.isTTY||process.platform!=='win32')throw Error('Credential access requires explicit interactive Windows terminal');
  const a=decryptCredentials().find(a=>a.email===selector);if(!a)throw Error('Select an approved demo email');
  const r=cp.spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','$secretInput=[Console]::In.ReadToEnd(); Set-Clipboard -Value $secretInput'],{input:a.password,encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error('Clipboard unavailable');console.log('Selected demonstration password copied locally; clear the clipboard after use.');
}
if(require.main===module){try{const action=process.argv[2];if(action==='plan')plan();else if(action==='prepare')plan({activate:false});else if(action==='credentials')credentials(process.argv[3]);else throw Error('Use prepare, plan or credentials <demo email>');}catch{console.error('Local demo operation refused; preserve existing files and review configuration. No secrets printed.');process.exitCode=1;}}
module.exports={decryptCredentials,setConfig};
