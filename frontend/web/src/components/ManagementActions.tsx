import { useRef, useState } from 'react';
import { ApiError, errorMessage, executeManagementCommand } from '@goleve/shared';
import type { ManagementCommand, ResourceRow, Runtime } from '@goleve/shared';
import { Button, TextField } from './ui';
export function ManagementActions({runtime,row,resource,onSaved}:{runtime:Runtime;row:ResourceRow;resource:'cases'|'managed-services';onSaved:()=>void}){
 const [reason,setReason]=useState(''),[busy,setBusy]=useState(false),[uncertain,setUncertain]=useState(false),[notice,setNotice]=useState(''),lock=useRef(false);
 const run=async(command:ManagementCommand)=>{if(lock.current||uncertain)return;lock.current=true;setBusy(true);setNotice('');try{await executeManagementCommand(runtime,command);setNotice('Operação confirmada pelo Management.');onSaved();}catch(error){if(error instanceof ApiError&&error.outcome==='unknown')setUncertain(true);setNotice(errorMessage(error));}finally{lock.current=false;setBusy(false);}};
 if(!row.id||!row.version)return null;
 return <div className="admin-row-actions"><TextField id={'management-reason-'+row.id} label="Código do motivo" value={reason} onChange={event=>setReason(event.target.value)} maxLength={64}/><div className="card-actions">
  {resource==='managed-services'?<><Button kind="secondary" disabled={busy||uncertain} onClick={()=>void run({kind:'service',id:row.id!,version:row.version!,reasonCode:reason,action:'suspend'})}>Suspender serviço</Button><Button kind="secondary" disabled={busy||uncertain} onClick={()=>void run({kind:'service',id:row.id!,version:row.version!,reasonCode:reason,action:'reactivate'})}>Solicitar reativação do serviço</Button><Button kind="quiet" disabled={busy||uncertain} onClick={()=>void run({kind:'create-case',serviceId:row.id!,reasonCode:reason})}>Abrir caso operacional</Button></>:(['in_progress','resolved','closed'] as const).filter(status=>row.status==='open'?status!=='resolved':row.status==='in_progress'?status!=='in_progress':row.status==='resolved'?status==='closed':false).map(status=><Button key={status} kind="secondary" disabled={busy||uncertain} onClick={()=>void run({kind:'case',id:row.id!,version:row.version!,reasonCode:reason,status})}>{status==='in_progress'?'Iniciar tratamento':status==='resolved'?'Resolver caso':'Fechar caso'}</Button>)}
  </div>{notice&&<p role="status" className="notice">{notice}</p>}{uncertain&&<p role="alert">Resultado por confirmar. Reconcilia o estado e o histórico; não repitas a operação.</p>}
 </div>;
}
