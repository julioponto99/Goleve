import type { ApiClient } from '../api/client';
import { ApiError } from '../api/errors';
import type { LoginInput, PublicUser } from '../contracts/domain';
import { decodeAuth, decodeMe } from './decoders';
import type { SessionStorage, StoredSession } from './storage';

export type SessionSnapshot =
 | {status:'anonymous'}
 | {status:'restoring'}
 | {status:'authenticated';user:PublicUser;expiresAt:number}
 | {status:'mfa-required';enrollmentRequired:boolean}
 | {status:'unavailable';error:ApiError};
export class SessionController {
 private snapshot:SessionSnapshot={status:'anonymous'};
 private credential:StoredSession|null=null;
 private challenge:{value:string;expiresAt:number}|null=null;
 private listeners=new Set<()=>void>();
 private epoch=0;
 private persistence:Promise<void>=Promise.resolve();
 private restoration:Promise<void>|undefined;
 private timer:ReturnType<typeof setTimeout>|undefined;
 constructor(private readonly api:ApiClient,private readonly storage:SessionStorage,private readonly now=()=>Date.now()){}
 getSnapshot=():SessionSnapshot=>this.snapshot;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 private publish(value:SessionSnapshot){this.snapshot=value;for(const fn of this.listeners)fn();}
 private persist(epoch:number,value:StoredSession|null){
  const job=this.persistence.catch(()=>{}).then(async()=>{if(epoch!==this.epoch)return;if(value)await this.storage.write(value);else await this.storage.clear();});
  this.persistence=job;return job;
 }
 private clearTimer(){if(this.timer!==undefined)clearTimeout(this.timer);this.timer=undefined;}
 private expireAt(expiresAt:number){
  this.clearTimer();
  this.timer=setTimeout(()=>this.invalidate(this.credential?.token),Math.min(2147483647,Math.max(0,expiresAt-this.now())));
  (this.timer as unknown as {unref?:()=>void}).unref?.();
 }
 currentToken():string|undefined {
  if(this.credential&&this.credential.expiresAt<=this.now()){this.invalidate(this.credential.token);return undefined;}
  return this.credential?.token;
 }
 invalidate(token?:string){
  if(!token||token!==this.credential?.token)return;
  const epoch=++this.epoch;this.credential=null;this.challenge=null;this.clearTimer();
  this.publish({status:'anonymous'});
  void this.persist(epoch,null).catch(()=>{if(epoch===this.epoch)this.publish({status:'unavailable',error:new ApiError(0,'SECURE_STORAGE_UNAVAILABLE','not-started')});});
 }
 restore():Promise<void>{
  if(this.restoration)return this.restoration;
  const job=this.restoreOnce();this.restoration=job;
  void job.finally(()=>{if(this.restoration===job)this.restoration=undefined;});
  return job;
 }
 private async restoreOnce(){
  const epoch=++this.epoch;this.clearTimer();this.publish({status:'restoring'});
  try{
   await this.persistence.catch(()=>{});
   const stored=await this.storage.read();
   if(epoch!==this.epoch)return;
   if(!stored||!stored.token||!Number.isFinite(stored.expiresAt)||stored.expiresAt<=this.now()){
    this.credential=null;await this.persist(epoch,null);if(epoch===this.epoch)this.publish({status:'anonymous'});return;
   }
   this.credential=stored;
   const response=await this.api.request('get','/auth/me');
   const user=decodeMe(response.body);
   if(epoch!==this.epoch)return;
   if(user.accountStatus!=='active')throw new ApiError(401,'ACCOUNT_UNAVAILABLE');
   this.publish({status:'authenticated',user,expiresAt:stored.expiresAt});this.expireAt(stored.expiresAt);
  }catch(error){
   if(epoch!==this.epoch)return;
   if(error instanceof ApiError&&error.status===401){this.invalidate(this.credential?.token);return;}
   this.credential=null;
   this.publish({status:'unavailable',error:error instanceof ApiError?error:new ApiError(0,'SECURE_STORAGE_UNAVAILABLE','not-started')});
  }
 }
 async signIn(input:LoginInput){
  const epoch=++this.epoch;this.clearTimer();this.credential=null;this.challenge=null;this.publish({status:'restoring'});
  try{
   await this.persist(epoch,null);
   const response=await this.api.request('post','/auth/login',{body:input,authenticated:false});
   await this.accept(response.body,epoch);
  }catch(error){if(epoch===this.epoch)this.publish({status:'anonymous'});throw error;}
 }
 private async accept(value:unknown,epoch:number){
  const data=decodeAuth(value);if(epoch!==this.epoch)return;
  if('mfaRequired'in data){
   this.challenge={value:data.challenge,expiresAt:this.now()+data.expiresIn*1000};
   this.publish({status:'mfa-required',enrollmentRequired:data.enrollmentRequired});return;
  }
  // A token's claims are not trusted for roles or access. Confirm current identity.
  this.credential={token:data.accessToken,expiresAt:this.now()+data.expiresIn*1000};
  try{
   const response=await this.api.request('get','/auth/me'),user=decodeMe(response.body);
   if(epoch!==this.epoch)return;
   if(user.accountStatus!=='active')throw new ApiError(401,'ACCOUNT_UNAVAILABLE');
   await this.persist(epoch,this.credential);
   if(epoch!==this.epoch)return;
   this.challenge=null;this.publish({status:'authenticated',user,expiresAt:this.credential!.expiresAt});this.expireAt(this.credential!.expiresAt);
  }catch(error){if(epoch===this.epoch){this.credential=null;await this.persist(epoch,null);this.publish({status:'anonymous'});}throw error;}
 }
 async completeMfa(factor:{otp:string}|{recoveryCode:string}){
  if(!this.challenge||this.challenge.expiresAt<=this.now())throw new ApiError(401,'MFA_CHALLENGE_EXPIRED','not-started');
  const epoch=this.epoch;
  const response=await this.api.request('post','/auth/mfa/complete',{body:{challenge:this.challenge.value,...factor},authenticated:false});
  await this.accept(response.body,epoch);
 }
 async signOut(){
  const token=this.currentToken();
  // Advance the epoch before awaiting HTTP so a stale login/restore cannot win.
  const epoch=++this.epoch;this.challenge=null;this.clearTimer();
  // request() captures its Bearer synchronously before its first await.
  const request=token?this.api.request('post','/auth/logout',{body:{}}):Promise.resolve();
  this.credential=null;this.publish({status:'anonymous'});
  // Handle storage rejection immediately even while the network request is pending.
  const cleared=this.persist(epoch,null).then(()=>null,()=>new ApiError(0,'SECURE_STORAGE_UNAVAILABLE','not-started'));
  let failure:unknown;
  try{await request;}catch(error){failure=error;}
  finally{
   const storageFailure=await cleared;if(storageFailure)throw storageFailure;
  }
  if(failure)throw failure;
 }
 dispose(){this.clearTimer();this.listeners.clear();this.epoch++;this.credential=null;this.challenge=null;}
}
