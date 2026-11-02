import { createRuntime, memorySessionStorage } from '@goleve/shared';
export type Runtime=ReturnType<typeof createRuntime>;
export function webRuntime():Runtime|null{
 try{
  const origin=import.meta.env.VITE_API_BASE_URL??(import.meta.env.DEV?'http://127.0.0.1:64344':undefined);
  if(!origin)return null;
  return createRuntime({origin,development:import.meta.env.DEV},memorySessionStorage());
 }catch{return null;}
}
