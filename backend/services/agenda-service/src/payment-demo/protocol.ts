import { localDemo } from '../local-demo';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Connection, Schema } from 'mongoose';
import { ApiError } from '../config/errors';
export type Peer = 'agenda' | 'payment' | 'professional';
export interface DemoConfig { service: Peer; instance: string; origins: Partial<Record<Peer,string>>; keys: Partial<Record<Peer,Buffer>> }
const error = (status:number,code:string):never => { throw new ApiError(status,code,'Payment integration demonstration contract unavailable or invalid'); };
export function assertDemo(config: DemoConfig, database: string) {
  if (!['development','test'].includes(process.env.NODE_ENV || '') || !/^[a-f0-9]{16}$/.test(config.instance) || database !== 'goleve_payagenda_'+config.instance+'_'+config.service && !(localDemo.policy()?.instance===config.instance&&localDemo.permitsDemoDatabase(config.service,database))) throw new Error('Payment integration requires an isolated synthetic database and is forbidden in production');
}
export function loadDemo(service: Peer): DemoConfig | undefined {
  const flag=process.env.PAYMENT_AGENDA_DEMO_ENABLED || 'false'; if(!['true','false'].includes(flag))throw new Error('Invalid payment integration flag'); if(flag==='false')return;
  const instance=process.env.PAYMENT_AGENDA_DEMO_INSTANCE || '',uri=new URL(process.env.MONGO_URI || '');
  const config:DemoConfig={service,instance,origins:{},keys:{}};
  if(uri.protocol!=='mongodb:' || !['127.0.0.1','localhost'].includes(uri.hostname)&&!(uri.hostname==='mongodb'&&localDemo.permitsDemoDatabase(service,uri.pathname.slice(1))))throw new Error('Isolated loopback MongoDB required');
  assertDemo(config,uri.pathname.slice(1));
  for(const peer of ['agenda','payment','professional'] as Peer[])if(peer!==service){
    const variable=peer==='agenda'?'AGENDA_SERVICE_URL':peer==='professional'?'PROFESSIONAL_SERVICE_URL':'PAYMENT_SERVICE_URL',value=process.env[variable];
    if(value){const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error('Invalid integration origin');config.origins[peer]=u.origin;}
    const pair=[service,peer].sort().join('_').toUpperCase(),file=process.env['PAYMENT_DEMO_KEY_'+pair+'_FILE'];if(!file)throw new Error('Dedicated pairwise demonstration keys required');
    const raw=readFileSync(file,'utf8').trim();if(!/^[a-f0-9]{64}$/i.test(raw))throw new Error('Invalid demonstration key');config.keys[peer]=Buffer.from(raw,'hex');
  }
  return config;
}
const hash=(body:unknown)=>createHash('sha256').update(JSON.stringify(body)).digest('hex');
const mac=(value:string,key:Buffer)=>createHmac('sha256',key).update(value).digest('base64url');
function same(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function sign(config:DemoConfig,target:Peer,path:string,body:unknown,now=Date.now()){
  const key=config.keys[target];if(!key)throw new Error('Missing pairwise key');const iat=Math.floor(now/1000);
  const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const claims=Buffer.from(JSON.stringify({iss:config.service,aud:target+':payment-demo:v1',instance:config.instance,scope:path,method:'POST',iat,exp:iat+15,jti:randomUUID(),bodyHash:hash(body)})).toString('base64url');
  return 'DemoService '+header+'.'+claims+'.'+mac(header+'.'+claims,key);
}
export function verify(config:DemoConfig,caller:Peer,path:string,body:unknown,authorization:string|undefined,now=Date.now()){
  try{
    if(!authorization||authorization.length>4096||!/^DemoService [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(authorization))throw new Error();
    const [h,p,s]=authorization.slice(12).split('.'),head=JSON.parse(Buffer.from(h,'base64url').toString()),c=JSON.parse(Buffer.from(p,'base64url').toString()),key=config.keys[caller],time=Math.floor(now/1000);
    if(!key||!same(s,mac(h+'.'+p,key))||head.alg!=='HS256'||head.typ!=='JWT'||Object.keys(head).length!==2||Object.keys(c).length!==9
      ||c.iss!==caller||c.aud!==config.service+':payment-demo:v1'||c.instance!==config.instance||c.scope!==path||c.method!=='POST'||c.bodyHash!==hash(body)
      ||!Number.isSafeInteger(c.iat)||!Number.isSafeInteger(c.exp)||c.iat>time+1||c.iat<time-15||c.exp<=time||c.exp-c.iat!==15||typeof c.jti!=='string'||!/^[a-f0-9-]{36}$/.test(c.jti))throw new Error();
    return c.jti as string;
  }catch{return error(401,'DEMO_SERVICE_AUTHENTICATION_REQUIRED');}
}
export function replayModel(connection:Connection){
  return connection.models.PaymentDemoNonce || connection.model('PaymentDemoNonce',new Schema({_id:String,expiresAt:Date},{versionKey:false,strict:'throw',collection:'payment_demo_nonces'}));
}
export function responseProof(config:DemoConfig,caller:Peer,data:unknown,requestAuthorization:string){const key=config.keys[caller];if(!key)throw new Error();return mac(config.instance+':'+config.service+':'+JSON.stringify(data)+':'+requestAuthorization,key);}
export class DemoClient{
  constructor(readonly config:DemoConfig){}
  async call<T>(target:Peer,operation:string,body:unknown):Promise<T>{
    const path='/internal/v1/payment-demo/'+operation,url=this.config.origins[target];if(!url)return error(503,'DEMO_DEPENDENCY_UNAVAILABLE');
    try{
      const authorization=sign(this.config,target,path,body);
      const r=await fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json','x-demo-caller':this.config.service,Authorization:authorization},body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(3000)});
      if(!r.ok){if([400,401,403,404,409,410,412,422].includes(r.status))return error(r.status,'DEMO_CONTRACT_REFUSED');throw new Error();}
      const reader=r.body?.getReader();if(!reader)throw new Error();let bytes=0;const chunks:Uint8Array[]=[];
      try{for(;;){const x=await reader.read();if(x.done)break;bytes+=x.value.length;if(bytes>16384)throw new Error();chunks.push(x.value);}}finally{await reader.cancel().catch(()=>undefined);}
      const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));const key=this.config.keys[target];
      if(!key||!same(r.headers.get('x-payment-demo-proof')||'',mac(this.config.instance+':'+target+':'+JSON.stringify(data)+':'+authorization,key)))throw new Error();
      return data as T;
    }catch(e){if(e instanceof ApiError)throw e;return error(503,'DEMO_DEPENDENCY_UNAVAILABLE');}
  }
}
export async function authenticateInternal(connection:Connection,config:DemoConfig,caller:Peer,path:string,body:unknown,authorization:string|undefined){
  assertDemo(config,connection.name);const nonce=verify(config,caller,path,body,authorization);
  try{await replayModel(connection).create({_id:nonce,expiresAt:new Date(Date.now()+60000)});}catch{return error(401,'DEMO_SERVICE_REPLAY_REJECTED');}
}
export const oid=(x:unknown):string=>{if(typeof x!=='string'||!/^[a-f0-9]{24}$/.test(x))return error(400,'INVALID_ID');return x;};
export function fields(body:unknown,allowed:string[]):Record<string,unknown>{if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!allowed.includes(k)))return error(400,'INVALID_INTEGRATION_BODY');return body as Record<string,unknown>;}
export interface Quote {quoteId:string;serviceId:string;professionalId:string;capabilityId:string;priceCents:number;currency:'EUR';serviceVersion:number;durationMinutes:number;expiresAt:string;authority:'synthetic';}
export function validQuote(q:Quote,expected:{serviceId:string;professionalId:string;capabilityId:string;durationMinutes:number}){
  if(!q||Object.entries(expected).some(([k,v])=>q[k as keyof Quote]!==v)||q.authority!=='synthetic'||q.currency!=='EUR'||!Number.isSafeInteger(q.priceCents)||q.priceCents<0||q.priceCents>100000||!Number.isSafeInteger(q.serviceVersion)||q.serviceVersion<1||!Number.isFinite(Date.parse(q.expiresAt))||Date.parse(q.expiresAt)<=Date.now()||Date.parse(q.expiresAt)>Date.now()+900001||!/^[a-f0-9]{24}$/.test(q.quoteId))return error(409,'INVALID_OR_EXPIRED_QUOTE');
  return q;
}
