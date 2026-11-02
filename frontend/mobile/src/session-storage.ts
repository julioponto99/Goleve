import * as SecureStore from 'expo-secure-store';
import type { SessionStorage, StoredSession } from '@goleve/shared';
const key='goleve.auth.session.v1';
const options={keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY};
export const deviceSessionStorage:SessionStorage={
 async read(){
  const raw=await SecureStore.getItemAsync(key,options);if(!raw)return null;
  let value:unknown;try{value=JSON.parse(raw);}catch{await this.clear();return null;}
  if(!value||typeof value!=='object'||!('token'in value)||typeof value.token!=='string'||!value.token||!('expiresAt'in value)||typeof value.expiresAt!=='number'||!Number.isFinite(value.expiresAt)){await this.clear();return null;}
  return {token:value.token,expiresAt:value.expiresAt};
 },
 async write(value:StoredSession){await SecureStore.setItemAsync(key,JSON.stringify({token:value.token,expiresAt:value.expiresAt}),options);},
 async clear(){await SecureStore.deleteItemAsync(key,options);}
};
