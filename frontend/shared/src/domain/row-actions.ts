import type { PersonalCommand } from './commands';
import type { ResourceId, ResourceRow } from './resources';
export interface RowAction{label:string;command:PersonalCommand}
export function rowActions(resource:ResourceId,row:ResourceRow):RowAction[]{
 if(!row.id)return [];
 if(resource==='plans')return row.status==='active'?[{label:'Criar sessão deste plano',command:{kind:'session',planId:row.id}}]:[];
 if(resource==='activities')return row.status==='planned'?[
  {label:'Concluir atividade',command:{kind:'activity-transition',id:row.id,action:'complete'}},
  {label:'Cancelar atividade',command:{kind:'activity-transition',id:row.id,action:'cancel'}}
 ]:[];
 if(resource!=='training-sessions')return [];
 const allowed:Record<string,readonly ['start'|'pause'|'resume'|'complete'|'cancel',string][]>= {
  planned:[['start','Iniciar treino'],['cancel','Cancelar treino']],running:[['pause','Pausar treino'],['complete','Concluir treino'],['cancel','Cancelar treino']],paused:[['resume','Retomar treino'],['complete','Concluir treino'],['cancel','Cancelar treino']]
 };
 return (allowed[row.status??'']??[]).map(([action,label])=>({label,command:{kind:'training-transition',id:row.id!,action}}));
}
