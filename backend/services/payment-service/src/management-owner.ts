import { localDemo } from './local-demo';
import express,{Router} from 'express';
import { Connection } from 'mongoose';
import { ApiError } from './config/errors';
import { ContractClient,ContractConfig,verifyService } from './management-contract';
export function managementOwnerRoutes(connection:Connection,config:ContractConfig,handler:(op:string,b:Record<string,any>,actorId:string)=>Promise<unknown>){
 const r=Router();r.use(express.json({limit:'16kb'}));r.post('/:operation',async(req,res,next)=>{try{
  const bearer=req.get('x-management-user-authorization')||'',op=req.params.operation;
  await verifyService(connection,config,'management','/internal/v1/management/'+op,req.body,bearer,req.get('authorization'));
  const b=req.body;if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!['serviceIds','permission','limit','before','q','status','serviceId','version','reasonCode','resourceId','from','to'].includes(k))||!Array.isArray(b.serviceIds)||b.serviceIds.length<1||b.serviceIds.length>500||new Set(b.serviceIds).size!==b.serviceIds.length||b.serviceIds.some((id:unknown)=>typeof id!=='string'||!/^[a-f0-9]{24}$/.test(id)))throw new ApiError(400,'VALIDATION_ERROR','Canonical scope identifiers required');
  const expected=config.peer==='professional'?{validate:'scope.validate',services:'services.read',professionals:'professionals.read',suspend:'services.suspend',reactivate:'services.reactivate',resource:'cases.write',metrics:'dashboard.read'}:config.peer==='agenda'?{appointments:'appointments.read',resource:'cases.write',metrics:'dashboard.read'}:{payments:'payments.read',resource:'cases.write',metrics:'dashboard.read'};
  if(expected[op as keyof typeof expected]!==b.permission)throw new ApiError(403,'PERMISSION_FORBIDDEN','Operation permission mismatch');
  const grant=await new ContractClient(config).call<{actorId:string;serviceIds:string[];permission:string;authority?:string;demoInstanceId?:string}>('management','authorize',{serviceIds:b.serviceIds,permission:b.permission},bearer);
  if(!grant||grant.permission!==b.permission||!/^[a-f0-9]{24}$/.test(grant.actorId)||JSON.stringify([...grant.serviceIds].sort())!==JSON.stringify([...b.serviceIds].sort()))throw new ApiError(403,'SCOPE_FORBIDDEN','Current authorization required');
  const demo=localDemo.policy();if(grant.authority==='local-demo'){if(!demo||grant.demoInstanceId!==demo.instance||!demo.accounts.some((a:any)=>a.id===grant.actorId&&['gestor','administrador'].includes(a.role))||b.serviceIds.some((id:string)=>![demo.resources.ptService,demo.resources.nutritionService].includes(id)))throw new ApiError(403,'LOCAL_DEMO_AUTHORITY_REQUIRED','Fixture scope unavailable');}else if(demo?.accounts.some((a:any)=>a.id===grant.actorId))throw new ApiError(403,'AUTHORITY_MISMATCH','Explicit fixture authority required');
  const data=await handler(op,b,grant.actorId);res.set('Cache-Control','no-store').json(data);
 }catch(e){next(e);}});return r;
}
export function ownerPage(b:Record<string,any>){const limit=b.limit??20;if(!Number.isInteger(limit)||limit<1||limit>100||b.before!==undefined&&!/^[a-f0-9]{24}$/.test(b.before)||b.q!==undefined&&(typeof b.q!=='string'||b.q.length>80))throw new ApiError(400,'VALIDATION_ERROR','Invalid pagination');return{limit,before:b.before,q:b.q};}
export function escaped(value:string){const special=new Set([92,94,36,46,42,43,63,40,41,91,93,123,125,124]);return Array.from(value,c=>special.has(c.charCodeAt(0))?String.fromCharCode(92)+c:c).join('');}
export async function metrics(Model:any,filter:Record<string,unknown>,b:Record<string,any>,simulated=false){
 const from=new Date(b.from),to=new Date(b.to);if(typeof b.from!=='string'||typeof b.to!=='string'||!Number.isFinite(from.getTime())||!Number.isFinite(to.getTime())||from.getUTCHours()||from.getUTCMinutes()||from.getUTCSeconds()||from.getUTCMilliseconds()||to.getUTCHours()||to.getUTCMinutes()||to.getUTCSeconds()||to.getUTCMilliseconds()||to<=from||to.getTime()-from.getTime()>31*86400000)throw new ApiError(400,'VALIDATION_ERROR','UTC daily period of at most 31 days required');
 const rows=await Model.aggregate([{$match:{...filter,createdAt:{$gte:from,$lt:to}}},{$group:{_id:{$dateToString:{date:'$createdAt',format:'%Y-%m-%d',timezone:'UTC'}},count:{$sum:1}}},{$sort:{_id:1}}]);
 const suppress=rows.some((r:any)=>r.count>0&&r.count<5);
 return{simulated,computedAt:new Date().toISOString(),policy:'utc-daily-portfolio-ranges-v1',series:rows.map((r:any)=>({day:r._id,value:null,suppressed:suppress,range:suppress?null:{min:Math.floor(r.count/5)*5,max:Math.floor(r.count/5)*5+4}}))};
}
