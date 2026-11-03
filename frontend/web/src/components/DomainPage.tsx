import { useEffect, useRef, useState } from 'react';
import { ApiError, authAdminIntent, errorMessage, executePersonalCommand, readResource, resources, resourcesForPage, rowActions } from '@goleve/shared';
import type { AuthAdminIntent, PublicUser, ResourceId, ResourceQuery, ResourceRow, ResourceView, Role, Runtime } from '@goleve/shared';
import { Badge, Button, Card, LoadingState, MessageState, TextField } from './ui';
import { StepUpDialog } from '../auth/StepUpDialog';
import { PersonalActions } from './PersonalActions';
import { ManagementActions } from './ManagementActions';
import { UserDashboard } from '../dashboard/UserDashboard';
export function DomainPage({runtime,user,page,onNavigate}:{runtime:Runtime;user:PublicUser;page:string;onNavigate:(path:string)=>void}){
 const [intent,setIntent]=useState<AuthAdminIntent|null>(null),[notice,setNotice]=useState(''),[revision,setRevision]=useState(0);
 const modules:readonly ResourceId[]=page==='settings'?['preferences']:resourcesForPage(user.userType,page);
 if(page.startsWith('dashboard')&&user.userType==='utilizador')return <UserDashboard runtime={runtime} user={user} onNavigate={onNavigate}/>;
 return <>
  {page.startsWith('dashboard')&&<section className="dashboard-heading"><Badge>{user.userType}</Badge><h2>Olá, {user.name}.</h2><p className="muted">Dados fornecidos pelos serviços da tua conta. As permissões são verificadas no servidor.</p></section>}
  {notice&&<p role="status" className="notice">{notice}</p>}
  {['hydration','measurements','agenda','training','profile'].includes(page)&&<PersonalActions runtime={runtime} page={page} onSaved={()=>setRevision(value=>value+1)}/>}
  {modules.length?<div className="dashboard-grid">{modules.map(id=><ResourceCard key={id} runtime={runtime} id={id} revision={revision} user={user} onIntent={setIntent}/>)}</div>:<Card><MessageState title={page==='coach'?'Coach IA indisponível':'Funcionalidade indisponível'}>{page==='coach'?'O Coach IA permanece desativado neste ambiente. O GoLeve pode ser utilizado sem IA.':'Esta funcionalidade ainda não está disponível nesta interface.'}</MessageState></Card>}
  {['catalog','bookings','professional-agenda','professional-availability','professional-services'].includes(page)&&<p className="notice">Reservas e publicação exigem elegibilidade confirmada pelo backend. Pagamentos são exclusivamente simulados. Os fluxos condicionados pelos bloqueios da V1 não são confirmados pela interface.</p>}
  {user.userType==='administrador'&&<StepUpDialog runtime={runtime} intent={intent} label={intent?`Operação ${intent.action} sobre ${intent.targetId}. Motivo: ${intent.parameters.reasonCode}.`:''} onSuccess={()=>{setNotice('Operação confirmada pelo Auth.');setRevision(value=>value+1);}} onFailure={error=>setNotice(errorMessage(error))} onClose={()=>setIntent(null)}/>}
 </>;
}
function ResourceCard({runtime,id,revision,user,onIntent}:{runtime:Runtime;id:ResourceId;revision:number;user:PublicUser;onIntent:(intent:AuthAdminIntent)=>void}){
 const [view,setView]=useState<ResourceView|null>(null),[error,setError]=useState<unknown>(null),[query,setQuery]=useState<ResourceQuery>({}),[search,setSearch]=useState(''),[refresh,setRefresh]=useState(0),[mutating,setMutating]=useState(false),[writeError,setWriteError]=useState('');
 const controller=useRef<AbortController|null>(null),def=resources[id];
 const writeLock=useRef(false),[uncertain,setUncertain]=useState(false);
 useEffect(()=>{const request=new AbortController();controller.current=request;setView(null);setError(null);void readResource(runtime,id,query,request.signal).then(data=>{if(!request.signal.aborted)setView(data);}).catch(failure=>{if(!request.signal.aborted)setError(failure);});return()=>request.abort();},[runtime,id,query,refresh,revision]);
 const notificationRead=async(row:ResourceRow)=>{
  if(writeLock.current||!row.id)return;writeLock.current=true;setMutating(true);setWriteError('');
  try{await runtime.api.request('post','/notifications/{notificationId}/read',{params:{notificationId:row.id},body:{}});setRefresh(value=>value+1);}catch(failure){setWriteError(errorMessage(failure));}finally{writeLock.current=false;setMutating(false);}
 };
 const perform=async(command:import('@goleve/shared').PersonalCommand)=>{if(writeLock.current||uncertain)return;writeLock.current=true;setMutating(true);setWriteError('');try{await executePersonalCommand(runtime,command);setRefresh(value=>value+1);}catch(failure){if(failure instanceof ApiError&&failure.outcome==='unknown')setUncertain(true);setWriteError(errorMessage(failure));}finally{writeLock.current=false;setMutating(false);}};
 return <Card className="resource-card"><h2>{def.title}</h2>
  {'search'in def&&<form className="resource-search" onSubmit={event=>{event.preventDefault();setQuery({q:search});}}><TextField id={'search-'+id} label="Pesquisar" value={search} maxLength={100} onChange={event=>setSearch(event.target.value)}/><Button type="submit" kind="secondary">Pesquisar</Button></form>}
  {id==='management-metrics'&&<form className="resource-search" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);setQuery({from:String(data.get('from')),to:String(data.get('to'))});}}><TextField id="metrics-from" name="from" label="Desde (UTC)" type="date" required/><TextField id="metrics-to" name="to" label="Até (UTC, exclusivo)" type="date" required/><Button type="submit" kind="secondary">Aplicar período</Button></form>}
  {error?<MessageState title={error instanceof ApiError&&error.status===403?'Consulta não autorizada':error instanceof ApiError&&error.status===404?'Dados não disponíveis':'Serviço indisponível'} error>{errorMessage(error)}</MessageState>:view===null?<LoadingState/>:!view.rows.length?<MessageState title="Sem registos">O serviço não devolveu registos para esta consulta.</MessageState>:<ul className="resource-list">{view.rows.map((row,index)=><li key={row.id??index}>{row.title!==def.title&&<h3>{row.title}</h3>}{row.lines.length?row.lines.map((line,n)=><p key={n}>{line}</p>):<p className="muted">Sem detalhes disponíveis neste contrato.</p>}
   {id==='admin-users'&&row.id&&row.version&&row.id!==user.id&&<AdminRowActions row={row} onIntent={onIntent}/>}
   {id==='role-requests'&&row.id&&row.version&&row.status==='pending'&&<AdminRowActions row={row} onIntent={onIntent} approval/>}
   {(id==='cases'||id==='managed-services')&&<ManagementActions runtime={runtime} row={row} resource={id} onSaved={()=>setRefresh(value=>value+1)}/>}
   {id==='notifications'&&row.id&&<Button kind="secondary" disabled={mutating} onClick={()=>void notificationRead(row)}>Marcar como lida</Button>}
   <div className="card-actions">{rowActions(id,row).map(action=><Button key={action.label} kind="secondary" disabled={mutating||uncertain} onClick={()=>void perform(action.command)}>{action.label}</Button>)}</div>
  </li>)}</ul>}
  {!!writeError&&<p role="alert" className="auth-error">{writeError}</p>}
  <div className="card-actions"><Button kind="secondary" disabled={!view&&!error} onClick={()=>setRefresh(value=>value+1)}>Atualizar {def.title.toLowerCase()}</Button>
   {view?.page!==undefined&&view.rows.length>0&&<><Button kind="quiet" disabled={view.page<=1} onClick={()=>setQuery({...query,page:Math.max(1,(view.page??1)-1)})}>Anterior</Button><span>Página {view.page}{view.totalPages!==undefined&&view.totalPages>0?' de '+view.totalPages:''}</span><Button kind="quiet" disabled={view.totalPages===undefined||view.page>=view.totalPages} onClick={()=>setQuery({...query,page:(view.page??1)+1})}>Seguinte</Button></>}
   {view?.nextBefore&&<Button kind="secondary" onClick={()=>setQuery({...query,before:view.nextBefore!})}>Carregar página seguinte</Button>}{query.before&&<Button kind="quiet" onClick={()=>{const {before,...first}=query;setQuery(first);}}>Voltar à primeira página</Button>}
  </div>
 </Card>;
}
function AdminRowActions({row,onIntent,approval=false}:{row:ResourceRow;onIntent:(intent:AuthAdminIntent)=>void;approval?:boolean}){
 const [reason,setReason]=useState(''),[role,setRole]=useState<Role>('utilizador'),[failure,setFailure]=useState('');
 const prepare=(action:AuthAdminIntent['action'])=>{try{onIntent(authAdminIntent(action,row.id!,{version:row.version!,reasonCode:reason,...(action==='role.request'?{newRole:role}:{})}));setFailure('');}catch{setFailure('Indica um motivo de 3 a 64 caracteres: letras minúsculas, números ou sublinhado.');}};
 return <div className="admin-row-actions"><TextField id={'reason-'+row.id} label="Código do motivo" value={reason} maxLength={64} onChange={event=>setReason(event.target.value)}/>
  {approval?<div className="card-actions"><Button kind="secondary" onClick={()=>prepare('role.approve')}>Aprovar pedido</Button><Button kind="quiet" onClick={()=>prepare('role.reject')}>Rejeitar pedido</Button></div>:<><div className="card-actions"><Button kind="secondary" onClick={()=>prepare('user.suspend')}>Suspender conta</Button><Button kind="secondary" onClick={()=>prepare('user.reactivate')}>Reativar conta</Button><Button kind="secondary" onClick={()=>prepare('user.revoke')}>Revogar acessos</Button></div><label className="select-field">Papel a solicitar<select value={role} onChange={event=>setRole(event.target.value as Role)}>{(['utilizador','profissional','gestor','administrador'] as const).map(value=><option key={value} value={value}>{value}</option>)}</select></label><Button kind="secondary" onClick={()=>prepare('role.request')}>Solicitar alteração de papel</Button><p className="auth-limit">Exige MFA, step-up e aprovação independente no Auth. A seleção não atribui papéis.</p></>}
  {failure&&<p role="alert" className="auth-error">{failure}</p>}
 </div>;
}
