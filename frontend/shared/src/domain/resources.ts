import { ApiError } from '../api/errors';
import type { Runtime } from '../auth/runtime';
import type { Role } from '../contracts/domain';
type Field=readonly [string,string];
const personal=['utilizador'] as const,professional=['profissional'] as const,manager=['gestor'] as const,admin=['administrador'] as const,all=['utilizador','profissional','gestor','administrador'] as const;
// Reviewed public GETs only. No URLs, paths, ownership IDs or scope grants from UI.
export const resources={
 'hydration-today':{title:'Hidratação de hoje',path:'/hydration/intakes/daily',roles:personal,shape:'single',fields:[['totalMl','Consumo (ml)'],['targetMl','Meta (ml)'],['percentage','Percentagem'],['date','Dia'],['timezone','Fuso horário']]},
 'hydration-goal':{title:'Meta diária',path:'/hydration/goal',roles:personal,shape:'single',fields:[['targetMl','Meta (ml)'],['timezone','Fuso horário']]},
 'hydration-history':{title:'Histórico de hidratação',path:'/hydration/intakes',roles:personal,shape:'list',pagination:'page',fields:[['amountMl','Quantidade (ml)'],['consumedAt','Consumo'],['timezone','Fuso horário']]},
 plans:{title:'Planos de treino',path:'/training/plans',roles:personal,shape:'list',pagination:'page',fields:[['status','Estado'],['environment','Ambiente'],['description','Descrição']]},
 exercises:{title:'Exercícios',path:'/training/exercises',roles:personal,shape:'list',pagination:'page',fields:[['category','Categoria'],['muscleGroup','Grupo muscular'],['equipment','Equipamento'],['description','Descrição']]},
 'training-sessions':{title:'Sessões de treino',path:'/training/sessions',roles:personal,shape:'list',pagination:'page',fields:[['status','Estado'],['startedAt','Início'],['completedAt','Conclusão'],['environment','Ambiente']]},
 measurements:{title:'Medições e evolução',path:'/performance/measurements',roles:personal,shape:'list',pagination:'page',fields:[['kind','Medição'],['value','Valor'],['unit','Unidade'],['measuredAt','Data']]},
 performance:{title:'Medições recentes',path:'/performance/summary',roles:personal,shape:'measurements',fields:[['kind','Medição'],['value','Valor'],['unit','Unidade'],['measuredAt','Data']]},
 activities:{title:'Agenda pessoal',path:'/agenda/activities',roles:personal,shape:'list',pagination:'page',fields:[['status','Estado'],['kind','Tipo'],['environment','Ambiente'],['startAt','Início'],['endAt','Fim'],['timezone','Fuso horário']]},
 catalog:{title:'Serviços profissionais',path:'/professionals/services',roles:personal,shape:'list',pagination:'cursor',search:true,fields:[['category','Categoria'],['priceEur','Preço (EUR)'],['durationMinutes','Duração (min)'],['active','Ativo']]},
 bookings:{title:'As minhas reservas',path:'/agenda/professional-appointments',roles:personal,shape:'list',pagination:'cursor',fields:[['status','Estado'],['startAtUtc','Início'],['endAtUtc','Fim'],['serviceId','Serviço'],['rescheduleOfId','Reagendamento']]},
 payments:{title:'Pagamentos simulados',path:'/payments',roles:personal,shape:'list',pagination:'cursor',fields:[['state','Estado'],['amountCents','Valor (cêntimos)'],['currency','Moeda'],['serviceReference','Serviço'],['confirmationStatus','Confirmação'],['reconciliationRequired','Reconciliação necessária']]},
 profile:{title:'Perfil pessoal',path:'/users/me',roles:all,shape:'single',fields:[['displayName','Nome'],['countryCode','País'],['contactEmail','Email de contacto']]},
 preferences:{title:'Preferências',path:'/users/me/preferences',roles:all,shape:'single',fields:[['timeZone','Fuso horário'],['locale','Idioma'],['theme','Tema']]},
 'professional-profile':{title:'Perfil profissional',path:'/professionals/me',roles:professional,shape:'single',fields:[['professionalName','Nome'],['biography','Biografia'],['applicationStatus','Candidatura'],['administrativeStatus','Estado administrativo']]},
 'professional-status':{title:'Estado da candidatura',path:'/professionals/me/application-status',roles:professional,shape:'single',fields:[['status','Estado'],['submittedAt','Submissão'],['reviewedAt','Revisão']]},
 capabilities:{title:'Capacidades profissionais',path:'/professionals/me/capabilities',roles:professional,shape:'list',pagination:'cursor',fields:[['kind','Capacidade'],['status','Estado'],['verificationStatus','Verificação']]},
 qualifications:{title:'Qualificações',path:'/professionals/me/qualifications',roles:professional,shape:'list',pagination:'cursor',fields:[['title','Qualificação'],['issuerName','Instituição'],['verificationStatus','Verificação']]},
 'professional-services':{title:'Serviços e ofertas',path:'/professionals/me/services',roles:professional,shape:'list',pagination:'cursor',fields:[['category','Categoria'],['priceEur','Preço (EUR)'],['durationMinutes','Duração (min)'],['active','Ativo']]},
 'availability-rules':{title:'Regras de disponibilidade',path:'/agenda/professional/availability-rules',roles:professional,shape:'list',pagination:'cursor',fields:[['weekday','Dia da semana'],['localStartTime','Início (minutos)'],['localEndTime','Fim (minutos)'],['timezone','Fuso horário'],['active','Ativa']]},
 'availability-exceptions':{title:'Exceções de disponibilidade',path:'/agenda/professional/availability-exceptions',roles:professional,shape:'list',pagination:'cursor',fields:[['startAtUtc','Início'],['endAtUtc','Fim'],['type','Tipo']]},
 'professional-bookings':{title:'Reservas recebidas',path:'/agenda/professional/appointments',roles:professional,shape:'list',pagination:'cursor',fields:[['status','Estado'],['startAtUtc','Início'],['endAtUtc','Fim'],['serviceId','Serviço']]},
 'manager-identity':{title:'Âmbitos atribuídos',path:'/management/me',roles:manager,shape:'assignments',fields:[['scopeId','Âmbito'],['status','Estado'],['validFrom','Válido desde'],['validUntil','Válido até']]},
 'managed-services':{title:'Serviços sob gestão',path:'/management/services',roles:manager,shape:'list',pagination:'cursor',fields:[['active','Ativo'],['operationalStatus','Estado operacional'],['priceEur','Preço (EUR)']]},
 'managed-professionals':{title:'Profissionais no âmbito',path:'/management/professionals',roles:manager,shape:'list',pagination:'cursor',fields:[['administrativeStatus','Estado administrativo'],['applicationStatus','Candidatura']]},
 'managed-bookings':{title:'Reservas autorizadas',path:'/management/appointments',roles:manager,shape:'list',pagination:'cursor',fields:[['status','Estado'],['serviceId','Serviço'],['startAtUtc','Início']]},
 'managed-payments':{title:'Estados financeiros simulados',path:'/management/payments',roles:manager,shape:'list',pagination:'cursor',fields:[['status','Estado'],['serviceId','Serviço'],['simulated','Simulado']]},
 'management-metrics':{title:'Indicadores operacionais (UTC)',path:'/management/dashboard',roles:manager,shape:'metrics',fields:[]},
 cases:{title:'Casos de gestão',path:'/management/cases',roles:manager,shape:'list',pagination:'cursor',search:true,fields:[['caseType','Tipo'],['status','Estado'],['reasonCode','Motivo'],['serviceId','Serviço']]},
 'admin-users':{title:'Utilizadores e papéis',path:'/auth/administration/users',roles:admin,shape:'list',pagination:'cursor',search:true,fields:[['userType','Papel'],['accountStatus','Estado'],['email','Email']]},
 'role-requests':{title:'Pedidos de alteração de papel',path:'/auth/administration/role-requests',roles:admin,shape:'list',pagination:'cursor',fields:[['newRole','Papel solicitado'],['status','Estado'],['reasonCode','Motivo'],['requestedBy','Solicitante']]},
 'admin-operators':{title:'Gestores',path:'/management/operators',roles:admin,shape:'list',pagination:'cursor',fields:[['operatorStatus','Estado'],['currentRole','Papel atual'],['accountStatus','Estado da conta']]},
 'admin-scopes':{title:'Âmbitos operacionais',path:'/management/scopes',roles:admin,shape:'list',pagination:'cursor',fields:[['kind','Tipo']]},
 'admin-assignments':{title:'Atribuições e aprovações independentes',path:'/management/assignments',roles:admin,shape:'list',pagination:'cursor',fields:[['status','Estado'],['validUntil','Validade'],['requestedBy','Solicitante'],['approvedBy','Aprovado por']]},
 'admin-professionals':{title:'Supervisão profissional',path:'/management/administration/professionals',roles:admin,shape:'list',pagination:'cursor',fields:[['administrativeStatus','Estado administrativo'],['applicationStatus','Candidatura']]},
 'admin-applications':{title:'Candidaturas profissionais',path:'/management/administration/applications',roles:admin,shape:'list',pagination:'cursor',fields:[['status','Estado'],['submittedAt','Submissão']]},
 'admin-services':{title:'Serviços publicados',path:'/management/administration/services',roles:admin,shape:'list',pagination:'cursor',fields:[['active','Ativo'],['operationalStatus','Estado operacional']]},
 audit:{title:'Auditoria administrativa',path:'/auth/administration/audit',roles:admin,shape:'list',pagination:'cursor',fields:[['action','Ação'],['result','Resultado'],['occurredAt','Data UTC'],['reasonCode','Motivo'],['resourceId','Recurso']]},
 notifications:{title:'Notificações',path:'/notifications',roles:all,shape:'list',pagination:'page',fields:[['category','Categoria'],['body','Mensagem'],['readAt','Lida em'],['createdAt','Criada em']]},
} as const;
export type ResourceId=keyof typeof resources;
export interface ResourceRow{id?:string;version?:number;title:string;lines:readonly string[];status?:string}
export interface ResourceView{rows:ResourceRow[];nextBefore?:string;page?:number;totalPages?:number}
export const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const safe=(value:unknown):string|undefined=>typeof value==='string'?value.slice(0,300):typeof value==='number'&&Number.isFinite(value)?String(value):typeof value==='boolean'?(value?'Sim':'Não'):undefined;
function row(item:unknown,title:string,fields:readonly Field[]):ResourceRow{
 if(!record(item))throw new ApiError(502,'INVALID_RESPONSE');
 const id=typeof item.id==='string'&&/^[a-f0-9]{24}$/.test(item.id)?item.id:undefined;
 return {...(id?{id}:{}),...(Number.isSafeInteger(item.version)&&Number(item.version)>0?{version:Number(item.version)}:{}),title:safe(item.title)||safe(item.name)||safe(item.displayName)||safe(item.professionalName)||safe(item.kind)||title,
  lines:fields.flatMap(([key,label])=>{const value=safe(item[key]);return value===undefined?[]:[label+': '+value];}),...(typeof item.status==='string'?{status:item.status}:{})};
}
export function decodeResource(id:ResourceId,value:unknown):ResourceView{
 const def=resources[id],data=record(value)?value.data:undefined;if(!record(data))throw new ApiError(502,'INVALID_RESPONSE');
 if(def.shape==='metrics'){
  if(!Array.isArray(data.sources)||data.sources.length>3)throw new ApiError(502,'INVALID_RESPONSE');
  return {rows:data.sources.flatMap(source=>{
   if(!record(source)||!['professional','agenda','payment'].includes(String(source.source)))throw new ApiError(502,'INVALID_RESPONSE');
   const title=String(source.source),suffix=source.simulated===true?' · dados simulados':'';
   if(source.status!=='available')return [{title,lines:['Origem indisponível; não é apresentado zero.']}];
   if(!Array.isArray(source.series)||source.series.length>31)throw new ApiError(502,'INVALID_RESPONSE');
   if(!source.series.length)return [{title,lines:['Sem indicadores no período devolvido pelo serviço.'+suffix]}];
   return source.series.map(item=>{
    if(!record(item)||typeof item.day!=='string')throw new ApiError(502,'INVALID_RESPONSE');
    const range=record(item.range)?item.range:undefined;
    const count=item.suppressed===true?'Contagem suprimida para proteger a privacidade':range&&Number.isInteger(range.min)&&Number.isInteger(range.max)?`Intervalo: ${range.min}–${range.max}`:item.value===0?'Contagem: 0':'Contagem indisponível';
    return {title:title+' · '+item.day,lines:[count+suffix]};
   });
  })};
 }
 const pageData=def.shape==='assignments'?data.assignments:data;
 const items=def.shape==='single'?[data]:def.shape==='measurements'?data.latestMeasurements:record(pageData)?pageData.items:undefined;
 if(!Array.isArray(items)||items.length>100)throw new ApiError(502,'INVALID_RESPONSE');
 const view:ResourceView={rows:items.map(item=>row(item,def.title,def.fields))};
 if(record(pageData)&&typeof pageData.nextBefore==='string'){
  if(!/^[a-f0-9]{24}$/.test(pageData.nextBefore))throw new ApiError(502,'INVALID_RESPONSE');view.nextBefore=pageData.nextBefore;
 }
 if(Number.isInteger(data.page)&&Number(data.page)>0)view.page=Number(data.page);
 if(Number.isInteger(data.totalPages)&&Number(data.totalPages)>=0)view.totalPages=Number(data.totalPages);
 return view;
}
export interface ResourceQuery{page?:number;before?:string;q?:string;from?:string;to?:string}
export function resourceQuery(id:ResourceId,input:ResourceQuery,now=new Date()){
 const def=resources[id],query:Record<string,string|number>={};
 if(input.page!==undefined&&(!Number.isInteger(input.page)||input.page<1))throw new ApiError(400,'VALIDATION_ERROR','not-started');
 if('pagination'in def&&def.pagination==='page')query.page=input.page??1,query.pageSize=20;
 if('pagination'in def&&def.pagination==='cursor'){query.limit=20;if(input.before){if(!/^[a-f0-9]{24}$/.test(input.before))throw new ApiError(400,'VALIDATION_ERROR','not-started');query.before=input.before;}}
 if('search'in def&&input.q?.trim()){if(input.q.length>100)throw new ApiError(400,'VALIDATION_ERROR','not-started');query.q=input.q.trim();}
 if(id==='hydration-today'){query.timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;query.date=new Intl.DateTimeFormat('en-CA',{timeZone:query.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
 if(id==='management-metrics'){
  query.to=input.to??new Date(now.getTime()+86400000).toISOString().slice(0,10);query.from=input.from??new Date(now.getTime()-6*86400000).toISOString().slice(0,10);
  const start=Date.parse(query.from),end=Date.parse(query.to);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(query.from)||!/^\d{4}-\d{2}-\d{2}$/.test(query.to)||!Number.isFinite(start)||!Number.isFinite(end)||new Date(start).toISOString().slice(0,10)!==query.from||new Date(end).toISOString().slice(0,10)!==query.to||end<=start||end-start>31*86400000)throw new ApiError(400,'VALIDATION_ERROR','not-started');
 }
 return query;
}
export async function readResource(runtime:Runtime,id:ResourceId,query:ResourceQuery={},signal?:AbortSignal):Promise<ResourceView>{
 const before=runtime.session.getSnapshot(),token=runtime.session.currentToken(),def=resources[id];
 if(before.status!=='authenticated'||!token||!(def.roles as readonly Role[]).includes(before.user.userType))throw new ApiError(403,'FORBIDDEN','not-started');
 const response=await runtime.api.request('get',def.path,{query:resourceQuery(id,query),...(signal?{signal}:{})});
 const current=runtime.session.getSnapshot();if(signal?.aborted||current.status!=='authenticated'||current.user.id!==before.user.id||runtime.session.currentToken()!==token)throw new ApiError(401,'SESSION_CHANGED','not-started');
 return decodeResource(id,response.body);
}
export function resourcesForPage(role:Role,page:string):readonly ResourceId[]{
 if(page==='profile')return ['profile','preferences'];if(page==='notifications')return ['notifications'];
 if(page==='dashboard'||page==='dashboard-'+role)return role==='utilizador'?['hydration-today','plans','performance','activities']:role==='profissional'?['professional-status','professional-services','professional-bookings']:role==='gestor'?['manager-identity','management-metrics','cases']:['admin-users','role-requests','audit'];
 const pages:Record<string,readonly ResourceId[]>={hydration:['hydration-today','hydration-goal','hydration-history'],training:['plans','exercises','training-sessions'],measurements:['measurements'],history:['training-sessions','hydration-history','measurements'],agenda:['activities'],catalog:['catalog'],bookings:['bookings','payments'],'professional-profile':['professional-profile','professional-status','capabilities','qualifications'],'professional-services':['professional-services'],'professional-agenda':['professional-bookings'],'professional-availability':['availability-rules','availability-exceptions'],'manager-scopes':['manager-identity'],'manager-services':['managed-services','managed-professionals'],'manager-bookings':['managed-bookings','managed-payments'],'manager-cases':['cases'],'admin-users':['admin-users'],'admin-approvals':['role-requests'],'admin-managers':['admin-operators','admin-scopes','admin-assignments'],'admin-professionals':['admin-professionals','admin-applications','admin-services'],'admin-audit':['audit']};
 return (pages[page]??[]).filter(id=>(resources[id].roles as readonly Role[]).includes(role));
}
