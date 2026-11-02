import type { ThemePreference } from './tokens';
export const themeStorageKey='goleve.ui.theme.v1';
export function parseTheme(value:unknown):ThemePreference|null{
 return value==='light'||value==='dark'||value==='system'?value:null;
}
export interface ThemeStorage{read():Promise<unknown>;write(value:ThemePreference):Promise<void>}
// Preference only: no identity, credentials, domain data or API writes.
export function createThemeStore(storage:ThemeStorage,initial:ThemePreference){
 let value=initial,revision=0,restoring:Promise<boolean>|undefined,writes=Promise.resolve();
 const listeners=new Set<()=>void>();
 const emit=()=>{for(const listener of listeners)listener();};
 return {
  getSnapshot:()=>value,
  subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
  restore:()=>restoring??(restoring=(async()=>{
   const startedAt=revision;
   try{const saved=parseTheme(await storage.read());if(saved&&revision===startedAt){value=saved;emit();}return true;}catch{return false;}
  })()),
  set:(next:ThemePreference):Promise<boolean>=>{
   if(!parseTheme(next))return Promise.resolve(false);
   revision++;value=next;emit();
   // Serialize asynchronous platform writes; a late earlier write cannot win.
   writes=writes.catch(()=>{}).then(()=>storage.write(next));
   return writes.then(()=>true,()=>false);
  }
 };
}
