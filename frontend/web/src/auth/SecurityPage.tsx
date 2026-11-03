import { useEffect, useState } from 'react';
import { ApiError, errorMessage } from '@goleve/shared';
import { Button, Card, LoadingState, MessageState } from '../components/ui';
import type { Runtime } from '../runtime';
import { decodeSessions } from './security';
import type { CurrentSession } from './security';
export function SecurityPage({runtime,onLogout,onRevalidate}:{runtime:Runtime;onLogout:()=>void;onRevalidate:()=>void}){
 const [rows,setRows]=useState<CurrentSession[]|null>(null),[error,setError]=useState<unknown>(),[revision,setRevision]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();setRows(null);setError(undefined);
  void runtime.api.request('get','/auth/sessions',{signal:controller.signal}).then(result=>{if(!controller.signal.aborted)setRows(decodeSessions(result.body));}).catch(failure=>{if(!controller.signal.aborted)setError(failure);});
  return()=>controller.abort();
 },[runtime,revision]);
 return <>
  <Card><h2>Sessões da tua conta</h2><p>Informação devolvida pelo Auth Service. O token de acesso nunca é apresentado ou guardado no browser.</p>
   {error?<MessageState title={error instanceof ApiError&&error.status===403?'Consulta não autorizada':'Sessões indisponíveis'} error>{errorMessage(error)}</MessageState>:rows===null?<LoadingState label="A consultar sessões…"/>:rows.length===0?<MessageState title="Sem sessões devolvidas">A origem não devolveu sessões nesta consulta.</MessageState>:<ul className="session-list">{rows.map(row=><li key={row.id}><strong>{row.current?'Sessão atual':'Outra sessão'}</strong><span>Iniciada: {new Date(row.createdAt).toLocaleString('pt-PT')}</span><span>Expira: {new Date(row.expiresAt).toLocaleString('pt-PT')}</span><span>MFA: {row.mfa?'validado':'não associado a esta sessão'}</span></li>)}</ul>}
   <div className="card-actions"><Button kind="secondary" disabled={rows===null&&!error} onClick={()=>setRevision(value=>value+1)}>Atualizar sessões</Button><Button kind="secondary" onClick={onRevalidate}>Verificar sessão atual</Button><Button onClick={onLogout}>Terminar sessão atual</Button></div>
  </Card>
  <Card><h2>Operações de segurança</h2><p>A revogação individual de outras sessões e a recuperação de palavra-passe não estão disponíveis no contrato atual.</p><p>As operações administrativas sensíveis pedirão palavra-passe e segundo fator, vinculados à operação e ao recurso. Não existe uma autorização administrativa global nesta página.</p></Card>
 </>;
}
