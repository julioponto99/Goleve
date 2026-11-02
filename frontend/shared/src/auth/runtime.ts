import { createApiClient } from '../api/client';
import type { ClientOptions } from '../api/client';
import { SessionController } from './session';
import type { SessionStorage } from './storage';
export function createRuntime(options:Omit<ClientOptions,'token'>,storage:SessionStorage){
 let session:SessionController;
 const api=createApiClient({...options,token:{current:()=>session.currentToken(),invalidate:token=>session.invalidate(token)}});
 session=new SessionController(api,storage);
 return {api,session};
}
