'use strict';
// Existing, explicitly owned fictional fixture only. Never provisions or seeds.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const {inventoryJs,sameInventory}=require('../mongodb/consolidation-backup.cjs');
const repository=path.resolve(__dirname,'../..'),root=process.env.GOLEVE_RESTART_TEST_ROOT;
function ensure(ok,message){if(!ok)throw Error(message);}
ensure(process.env.GOLEVE_RESTART_TEST_ACK==='isolated-fictional-installation'&&root,'Explicit isolated test acknowledgement required');
ensure(path.dirname(path.resolve(root))===path.join(repository,'.local')&&path.basename(root).startsWith('restart-fixture-')&&fs.realpathSync(root)===path.resolve(root),'Only a real temporary fixture in this worktree is accepted');
const state=JSON.parse(fs.readFileSync(path.join(root,'.local/backend-installation.json'))),project=state.project;
ensure(project.startsWith('goleve-fresh-')&&project===process.env.GOLEVE_RESTART_TEST_PROJECT&&state.initializedAt&&state.demo&&state.root===root,'Explicit existing initialized test project required');
const checks=[],evidence=path.join(root,'.local','restart-evidence-'+new Date().toISOString().replace(/[:.]/g,'-'));
fs.mkdirSync(evidence,{recursive:true});
function run(command,args,timeout=180000){const p=cp.spawnSync(command,args,{cwd:root,encoding:'utf8',timeout,maxBuffer:24e6});ensure(p.status===0,'Isolated test command failed: '+command+' '+args.slice(0,3).join(' '));return p.stdout.trim();}
function write(name,data){fs.writeFileSync(path.join(evidence,name),JSON.stringify(data,null,2),{mode:0o600});}
function compose(args,timeout){return run('docker',['compose','--env-file','.env','-f','compose.yaml','-p',project,...args],timeout);}
function containers(){const ids=run('docker',['ps','-aq','--filter','label=com.docker.compose.project='+project]).split(/\s+/).filter(Boolean);return ids.length?JSON.parse(run('docker',['inspect',...ids])):[];}
function preflight(){
 const c=containers();ensure(c.length===14,'Expected exactly 14 existing test containers');
 for(const v of [state.resources.mongo,state.resources.rabbit]){ensure(v.startsWith(project+'_'),'Unexpected volume name');const info=JSON.parse(run('docker',['volume','inspect',v]))[0];ensure(info.Labels?.['goleve.installation.id']===state.id,'Unowned test volume');}
 const network=JSON.parse(run('docker',['network','inspect',state.resources.network]))[0];ensure(network.Labels?.['goleve.installation.id']===state.id,'Unowned network');
 for(const item of c){ensure(path.resolve(item.Config.Labels['com.docker.compose.project.working_dir'])===root,'Unexpected container owner');ensure(Object.keys(item.NetworkSettings.Networks).every(n=>n===state.resources.network),'Shared network');for(const m of item.Mounts){if(m.Type==='volume')ensure([state.resources.mongo,state.resources.rabbit].includes(m.Name),'Unexpected or official volume');else if(m.Type==='bind')ensure(path.resolve(m.Source).startsWith(root+path.sep),'External bind mount');else ensure(m.Type==='tmpfs','Unexpected mount type');}for(const bindings of Object.values(item.HostConfig.PortBindings||{}))for(const b of bindings||[])ensure(b.HostIp==='127.0.0.1'&&Object.values(state.ports).includes(Number(b.HostPort)),'Unexpected port publication');}
 const free=fs.statfsSync(root);ensure(Number(free.bavail)*Number(free.bsize)>1024**3,'Insufficient disk margin');
 const ids=run('docker',['ps','-aq']).split(/\s+/).filter(Boolean),all=JSON.parse(run('docker',['inspect',...ids]));for(const item of all.filter(x=>x.State.Running&&!c.some(y=>y.Id===x.Id))){for(const bindings of Object.values(item.NetworkSettings.Ports||{}))for(const b of bindings||[])ensure(!Object.values(state.ports).includes(Number(b.HostPort)),'Port shared with another running project');ensure(!item.Mounts.some(m=>[state.resources.mongo,state.resources.rabbit].includes(m.Name)),'Test volume shared with another project');}
 write('ownership.json',{project,root,installationId:state.id,containers:c.map(x=>({id:x.Id,image:x.Image,mounts:x.Mounts})),network:network.Id,resources:state.resources,ports:state.ports});
}
function exec(service,args){const c=containers().find(c=>c.Config.Labels['com.docker.compose.service']===service);ensure(c,'Owned service missing');return run('docker',['exec',c.Id,...args]);}
function query(js){return JSON.parse(exec('mongodb',['mongosh','--quiet','--eval',js]));}
function hash(value){return crypto.createHash('sha256').update(value).digest('hex');}
function snapshot(label){
 const c=containers();ensure(c.length===14&&c.every(c=>c.State.Running&&c.State.Health?.Status==='healthy'),'All 14 components must be healthy');
 const inventory=query(inventoryJs);
 const rs=query('const h=db.adminCommand({hello:1}),s=db.adminCommand({replSetGetStatus:1}),c=db.adminCommand({replSetGetConfig:1});print(JSON.stringify({set:h.setName,primary:h.isWritablePrimary,config:c.config,term:s.term,electionId:h.electionId,localTime:h.localTime,operationTime:h.operationTime,uptime:s.members[0].uptime}));');
 ensure(rs.set==='goleveV1'&&rs.primary,'Replica did not return PRIMARY');
 // Only this exact config field is operational. Every other config field is compared.
 const {term:configTerm,...structuralConfig}=rs.config;
 const volumes=[state.resources.mongo,state.resources.rabbit].map(v=>JSON.parse(run('docker',['volume','inspect',v]))[0]);
 const rabbit=(command,fields)=>JSON.parse(exec('rabbitmq',['rabbitmqctl','-q',command,...fields,'--formatter','json']));
 const queues=rabbit('list_queues',['name','durable','auto_delete','arguments','messages_ready','messages_unacknowledged']).sort((a,b)=>a.name.localeCompare(b.name));
 ensure(queues.every(q=>q.messages_unacknowledged===0),'In-flight RabbitMQ operation; no stable snapshot');
 const exchanges=rabbit('list_exchanges',['name','type','durable','auto_delete','internal','arguments']).sort((a,b)=>a.name.localeCompare(b.name));
 const bindings=rabbit('list_bindings',['source_name','source_kind','destination_name','destination_kind','routing_key','arguments']).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
 const current=JSON.parse(fs.readFileSync(path.join(root,'.local/backend-installation.json')));
 const persistent={inventory,replica:structuralConfig,volumes,network:JSON.parse(run('docker',['network','inspect',state.resources.network]))[0].Id,installation:{id:current.id,project:current.project,resources:current.resources,ports:current.ports,initializedAt:current.initializedAt},rabbit:{queues,exchanges,bindings},containers:c.map(c=>({id:c.Id,image:c.Image,mounts:c.Mounts,configurationSha256:hash(JSON.stringify(c.Config)),hostConfigurationSha256:hash(JSON.stringify(c.HostConfig))})).sort((a,b)=>a.id.localeCompare(b.id))};
 const operational={observedAt:new Date().toISOString(),configTerm,term:rs.term,electionId:rs.electionId,localTime:rs.localTime,operationTime:rs.operationTime,mongoUptime:rs.uptime,installerStartedAt:current.startedAt,containers:c.map(c=>({id:c.Id,startedAt:c.State.StartedAt,restartCount:c.RestartCount,health:c.State.Health?.Status}))};
 write(label+'.persistent.json',persistent);write(label+'.operational.json',operational);
 return{persistent,operational};
}
function differences(a,b,base=''){if(sameInventory(a,b))return[];if(!a||!b||typeof a!=='object'||typeof b!=='object')return[base];const keys=new Set([...Object.keys(a),...Object.keys(b)]);return[...keys].flatMap(k=>differences(a[k],b[k],base+'/'+k));}
function compare(before,after,name){const equal=sameInventory(before.persistent,after.persistent),paths=differences(before.persistent,after.persistent);if(!equal&&!paths.length)paths.push('/semantic-order');write(name+'.comparison.json',{equal,persistentDifferencePaths:paths,operational:{beforeTerm:before.operational.term,afterTerm:after.operational.term,beforeConfigTerm:before.operational.configTerm,afterConfigTerm:after.operational.configTerm}});ensure(equal,'Persistent divergence; inspect '+name+'.comparison.json');}
function up(){run(process.execPath,['scripts/backend-setup.cjs','up'],600000);}
function check(name){checks.push(name);console.log('PASS '+name);}
async function main(){
 preflight();check('existing temporary project, volumes, mounts, ports and disk verified');
 up();const before=snapshot('before');check('initialized installation resumed: PRIMARY and 14 healthy');
 compose(['stop'],180000);ensure(containers().every(c=>!c.State.Running),'Temporary stack did not stop');up();const after=snapshot('after-stop-up');compare(before,after,'stop-up');check('stop/up: strict persistent snapshot equivalence and 14 healthy');
 up();const twice=snapshot('after-second-up');compare(after,twice,'second-up');check('second up: strict persistent equivalence, same volumes and containers, no seed execution');
 const logs=run('docker',['logs',containers().find(c=>c.Config.Labels['com.docker.compose.service']==='mongodb').Id]);const initiationCommands=logs.split('\n').filter(l=>{try{return JSON.parse(l).msg==='replSetInitiate admin command received from client';}catch{return false;}}).length;ensure(initiationCommands===1,'Unexpected replica initialization history');check('only the original replica initialization command exists');
 compose(['stop'],180000);check('temporary stack stopped; volumes and data retained');
 const result={passed:checks.length,failed:0,project,checks,evidence,initiationCommands};write('result.json',result);fs.writeFileSync(path.join(repository,'.local/restart-validation-final.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
main().catch(e=>{const result={passed:checks.length,failed:1,project,checks,evidence,error:e.message};write('result.json',result);fs.writeFileSync(path.join(repository,'.local/restart-validation-final.json'),JSON.stringify(result,null,2));console.error(e.message);process.exitCode=1;});
