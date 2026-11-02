export interface StoredSession {token:string;expiresAt:number}
export interface SessionStorage {
 read():Promise<StoredSession|null>;
 write(session:StoredSession):Promise<void>;
 clear():Promise<void>;
}
export function memorySessionStorage():SessionStorage {
 let current:StoredSession|null=null;
 return {read:async()=>current?{...current}:null,write:async value=>{current={...value};},clear:async()=>{current=null;}};
}
