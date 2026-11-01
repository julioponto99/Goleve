import { createHash,createHmac,randomUUID,timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Connection,Schema } from 'mongoose';
import { ApiError } from './config/errors';
export type Peer='management'|'auth'|'professional'|'agenda'|'payment';
export interface ContractConfig { peer:Peer;origins:Partial<Record<Peer,string>>;keys:Partial<Record<Peer,Buffer>> }
const fail=(status:number,code:string):never=>{throw new ApiError(status,code,'Management contract unavailable or unauthorized');};
export function loadContract(peer:Peer):ContractConfig|undefined{
  const flag=process.env.MANAGEMENT_CONTRACT_ENABLED||'false';if(!['false','true'].includes(flag))throw new Error('Invalid Management contract flag');if(flag==='false')return;
  const result:ContractConfig={peer,origins:{},keys:{}};
  for(const target of (peer==='management'?['auth','professional','agenda','payment']:['management']) as Peer[]){
    const raw=process.env[target.toUpperCase()+'_SERVICE_URL'];if(!raw)throw new Error('Management contract origin required');const url=new URL(raw);
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash||process.env.NODE_ENV==='production'&&url.protocol!=='https:')throw new Error('Secure service origin required');
    const file=process.env['MANAGEMENT_'+(peer==='management'?target:peer).toUpperCase()+'_KEY_FILE'];if(!file)throw new Error('Dedicated Management pairwise key required');const value=readFileSync(file,'utf8').trim();if(!/^[a-f0-9]{64}$/i.test(value))throw new Error('Invalid Management service key');
    result.origins[target]=url.origin;result.keys[target]=Buffer.from(value,'hex');
  }return result;
}
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const mac=(value:string,key:Buffer)=>createHmac('sha256',key).update(value).digest('base64url');
const same=(a:string,b:string)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);};
export function serviceToken(config:ContractConfig,target:Peer,path:string,body:unknown,bearer:string){
 const now=Math.floor(Date.now()/1000),header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),payload=Buffer.from(JSON.stringify({iss:config.peer,aud:target+':management:v1',path,method:'POST',iat:now,exp:now+15,jti:randomUUID(),bodyHash:hash(body),bearerHash:hash(bearer)})).toString('base64url'),key=config.keys[target];if(!key)throw new Error('Missing service identity');return 'Service '+header+'.'+payload+'.'+mac(header+'.'+payload,key);
}
export async function verifyService(connection:Connection,config:ContractConfig,caller:Peer,path:string,body:unknown,bearer:string,authorization:string|undefined){
 let nonce:string;try{
  if(!authorization||authorization.length>4096||!/^Service [\w-]+\.[\w-]+\.[\w-]+$/.test(authorization))throw Error();
  const [h,p,s]=authorization.slice(8).split('.'),header=JSON.parse(Buffer.from(h,'base64url').toString()),c=JSON.parse(Buffer.from(p,'base64url').toString()),key=config.keys[caller],now=Math.floor(Date.now()/1000);
  if(!key||!same(s,mac(h+'.'+p,key))||header.alg!=='HS256'||header.typ!=='JWT'||Object.keys(header).length!==2||Object.keys(c).length!==9||c.iss!==caller||c.aud!==config.peer+':management:v1'||c.path!==path||c.method!=='POST'||c.bodyHash!==hash(body)||c.bearerHash!==hash(bearer)||!Number.isInteger(c.iat)||!Number.isInteger(c.exp)||c.iat>now+1||c.iat<now-15||c.exp<=now||c.exp-c.iat!==15||typeof c.jti!=='string'||!/^[a-f0-9-]{36}$/.test(c.jti))throw Error();nonce=c.jti;
 }catch{return fail(401,'SERVICE_AUTHENTICATION_REQUIRED');}
 const Replay=connection.models.ManagementContractNonce||connection.model('ManagementContractNonce',new Schema({_id:String,expiresAt:{type:Date,index:{expireAfterSeconds:0}}},{strict:'throw',versionKey:false,collection:'management_contract_nonces'}));
 try{await Replay.create({_id:nonce,expiresAt:new Date(Date.now()+60000)});}catch{return fail(401,'SERVICE_REPLAY_REJECTED');}
}
export class ContractClient {
 constructor(readonly config:ContractConfig){}
 async call<T>(target:Peer,operation:string,body:unknown,bearer:string):Promise<T>{
  const origin=this.config.origins[target],path='/internal/v1/management/'+operation;if(!origin)return fail(503,'DEPENDENCY_UNAVAILABLE');
  try{const r=await fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:serviceToken(this.config,target,path,body,bearer),'X-Management-User-Authorization':bearer,'X-Management-Caller':this.config.peer},body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(4000)});
   if(!r.ok){if([400,401,403,404,409,412,422].includes(r.status))return fail(r.status,'OWNER_OPERATION_REFUSED');throw Error();}
   const reader=r.body?.getReader();if(!reader)throw Error();const chunks:Uint8Array[]=[];let length=0;try{for(;;){const v=await reader.read();if(v.done)break;length+=v.value.length;if(length>131072)throw Error();chunks.push(v.value);}}finally{await reader.cancel().catch(()=>undefined);}return JSON.parse(Buffer.concat(chunks).toString()) as T;
  }catch(e){if(e instanceof ApiError)throw e;return fail(503,'DEPENDENCY_UNAVAILABLE');}
 }
}
