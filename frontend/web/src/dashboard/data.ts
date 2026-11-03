import { ApiError, record } from '@goleve/shared';
import type { PublicPath, Runtime } from '@goleve/shared';
export interface HydrationSummary{totalMl:number;targetMl:number|null;percentage:number|null;date?:string}
export interface WeightPoint{value:number;at:string}
export interface PlanSummary{title:string;environment?:string;exerciseCount?:number}
export interface ActivitySummary{id:string;title:string;startAt:string;endAt:string;timezone:string;kind:string}
export interface DashboardData{hydration:HydrationSummary|null;weights:WeightPoint[];plan:PlanSummary|null;activities:ActivitySummary[];activityTotal:number|null;trainingStatus:string|null;errors:Partial<Record<'hydration'|'weights'|'plan'|'activities'|'trainingStatus',string>>}
const invalid=():never=>{throw new ApiError(502,'INVALID_RESPONSE');};
const finite=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value);
const text=(value:unknown)=>typeof value==='string'&&value.length>0?value.slice(0,160):undefined;
function data(value:unknown){if(!record(value)||!record(value.data))return invalid();return value.data;}
function list(value:unknown){const d=data(value);if(!Array.isArray(d.items)||d.items.length>100||d.items.some(item=>!record(item)))return invalid();return d.items as Record<string,unknown>[];}
export function hydrationSummary(value:unknown):HydrationSummary{
 const d=data(value);if(!finite(d.totalMl)||d.totalMl<0||d.targetMl!==null&&(!finite(d.targetMl)||d.targetMl<=0)||d.percentage!==null&&(!finite(d.percentage)||d.percentage<0))return invalid();
 return {totalMl:d.totalMl,targetMl:d.targetMl as number|null,percentage:d.percentage as number|null,...(typeof d.date==='string'?{date:d.date}:{})};
}
export function weightPoints(value:unknown):WeightPoint[]{
 return list(value).filter(item=>item.kind==='weight'&&item.unit==='kg'&&finite(item.value)&&item.value>0&&typeof item.measuredAt==='string'&&Number.isFinite(Date.parse(item.measuredAt))).map(item=>({value:Number(item.value),at:String(item.measuredAt)})).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
}
export function planSummary(value:unknown):PlanSummary|null{
 const p=list(value).find(item=>item.status==='active');if(!p)return null;const title=text(p.title);if(!title)return invalid();
 return {title,...(text(p.environment)?{environment:String(p.environment)}:{}),...(Array.isArray(p.exercises)?{exerciseCount:p.exercises.length}:{})};
}
export function activitySummary(value:unknown,now:number):ActivitySummary[]{
 return list(value).filter(item=>item.status==='planned'&&typeof item.startAt==='string'&&Date.parse(item.startAt)>=now).map(item=>{
  if(typeof item.id!=='string'||!/^[a-f0-9]{24}$/.test(item.id)||!text(item.title)||typeof item.endAt!=='string'||!Number.isFinite(Date.parse(item.endAt))||typeof item.timezone!=='string')return invalid();
  return {id:item.id,title:String(item.title).slice(0,160),startAt:String(item.startAt),endAt:item.endAt,timezone:item.timezone,kind:String(item.kind)};
 }).sort((a,b)=>Date.parse(a.startAt)-Date.parse(b.startAt));
}
export async function loadDashboard(runtime:Runtime,signal:AbortSignal,now=Date.now()):Promise<DashboardData>{
 const start=runtime.session.getSnapshot(),token=runtime.session.currentToken();if(start.status!=='authenticated'||start.user.userType!=='utilizador'||!token)throw new ApiError(403,'FORBIDDEN');
 const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const read=async(path:PublicPath,query:Record<string,string|number>)=>{
  const result=await runtime.api.request('get',path,{query,signal});const current=runtime.session.getSnapshot();
  if(signal.aborted||current.status!=='authenticated'||current.user.id!==start.user.id||runtime.session.currentToken()!==token)throw new ApiError(401,'SESSION_CHANGED');return result.body;
 };
 const result:DashboardData={hydration:null,weights:[],plan:null,activities:[],activityTotal:null,trainingStatus:null,errors:{}};
 await Promise.all([
  read('/hydration/intakes/daily',{date:day,timezone:zone}).then(value=>{result.hydration=hydrationSummary(value);}).catch(()=>{result.errors.hydration='Hidratação indisponível';}),
  read('/performance/measurements',{page:1,pageSize:100}).then(value=>{result.weights=weightPoints(value);}).catch(()=>{result.errors.weights='Medições indisponíveis';}),
  read('/training/plans',{page:1,pageSize:5,status:'active'}).then(value=>{result.plan=planSummary(value);}).catch(()=>{result.errors.plan='Planos indisponíveis';}),
  read('/training/sessions',{page:1,pageSize:20}).then(value=>{const active=list(value).find(item=>item.status==='running'||item.status==='paused');result.trainingStatus=active?String(active.status):null;}).catch(()=>{result.errors.trainingStatus='Sessões indisponíveis';}),
  read('/agenda/activities',{page:1,pageSize:20,status:'planned',from:new Date(now).toISOString(),to:new Date(now+7*86400000).toISOString()}).then(value=>{result.activities=activitySummary(value,now);const total=data(value).total;result.activityTotal=Number.isInteger(total)&&Number(total)>=0?Number(total):null;}).catch(()=>{result.errors.activities='Agenda indisponível';})
 ]);
 const end=runtime.session.getSnapshot();if(signal.aborted||end.status!=='authenticated'||end.user.id!==start.user.id||runtime.session.currentToken()!==token)throw new ApiError(401,'SESSION_CHANGED');return result;
}
