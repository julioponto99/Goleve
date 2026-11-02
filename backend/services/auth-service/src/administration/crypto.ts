import { createCipheriv,createDecipheriv,createHash,createHmac,randomBytes,timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { ApiError } from '../config/errors';
export const randomToken=()=>randomBytes(32).toString('hex');
export const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function canonical(value:unknown):string{if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',')+'}';}
export function loadMfaKey(){const file=process.env.AUTH_MFA_ENCRYPTION_KEY_FILE;if(!file)throw new ApiError(503,'MFA_KEY_UNAVAILABLE','Dedicated MFA encryption key required');try{const text=readFileSync(file,'utf8').trim();if(!/^[a-f0-9]{64}$/i.test(text))throw Error();return Buffer.from(text,'hex');}catch{throw new ApiError(503,'MFA_KEY_UNAVAILABLE','Dedicated MFA key unavailable');}}
export function seal(plain:string,key:Buffer,aad:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(aad));const encrypted=Buffer.concat([cipher.update(plain,'utf8'),cipher.final()]);return [iv,cipher.getAuthTag(),encrypted].map(x=>x.toString('base64url')).join('.');}
export function unseal(value:string,key:Buffer,aad:string){const [iv,tag,data]=value.split('.').map(x=>Buffer.from(x,'base64url'));const cipher=createDecipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(aad));cipher.setAuthTag(tag);return Buffer.concat([cipher.update(data),cipher.final()]).toString('utf8');}
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(value:Buffer){let bits=0,buffer=0,result='';for(const byte of value){buffer=(buffer<<8)|byte;bits+=8;while(bits>=5){bits-=5;result+=alphabet[(buffer>>>bits)&31];}}if(bits)result+=alphabet[(buffer<<(5-bits))&31];return result;}
export function decode32(value:string){let bits=0,buffer=0;const bytes:number[]=[];for(const char of value){const n=alphabet.indexOf(char);if(n<0)throw Error('Invalid Base32');buffer=(buffer<<5)|n;bits+=5;if(bits>=8){bits-=8;bytes.push((buffer>>>bits)&255);}}return Buffer.from(bytes);}
export function hotp(secret:Buffer,counter:number,digits=6,algorithm='sha1'){const buffer=Buffer.alloc(8);buffer.writeBigUInt64BE(BigInt(counter));const h=createHmac(algorithm,secret).update(buffer).digest(),offset=h[h.length-1]&15;return ((h.readUInt32BE(offset)&0x7fffffff)%10**digits).toString().padStart(digits,'0');}
export function totp(secret:string,time=Date.now(),digits=6,algorithm='sha1'){return hotp(decode32(secret),Math.floor(time/30000),digits,algorithm);}
export function matchTotp(secret:string,code:string,time:number,lastCounter=-1){if(!/^\d{6}$/.test(code))return -1;const counter=Math.floor(time/30000);let result=-1;for(const delta of [-1,0,1]){const n=counter+delta;if(n>=0&&n>lastCounter&&equal(hotp(decode32(secret),n),code))result=n;}return result;}
export function newSecret(){return base32(randomBytes(20));}
