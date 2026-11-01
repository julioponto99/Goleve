import { NextFunction, Request, Response } from 'express';
import { RequestContext } from '../middlewares/auth.middleware';
import { ProfessionalAgendaService } from '../professional/service';
import { commandKey, object, objectId, versionHeader } from '../professional/validation';
const handle = (fn:(req:Request,res:Response)=>Promise<void>) => (req:Request,res:Response,next:NextFunction) => { fn(req,res).catch(next); };
const context = (res:Response) => res.locals.context as RequestContext;
const key = (req:Request) => commandKey(req.get('idempotency-key'));
const id = (req:Request) => objectId(req.params.id);
const version = (req:Request) => versionHeader(req.get('if-match'),id(req));
function send(res:Response,result:{data:Record<string,unknown>;replayed:boolean},created=false) {
  res.set('ETag','"'+result.data.id+':'+result.data.version+'"');
  if(result.replayed)res.set('Idempotency-Replayed','true');
  res.status(created&&!result.replayed?201:200).json({data:result.data});
}
export function createProfessionalAgendaController(service:ProfessionalAgendaService) {
  return {
    createRule:handle(async(req,res)=>send(res,await service.createRule(context(res),req.body,key(req)),true)),
    rules:handle(async(req,res)=>{res.json({data:await service.list(context(res),req.query,true,'rules')});}),
    updateRule:handle(async(req,res)=>send(res,await service.updateRule(context(res),id(req),req.body,version(req),key(req)))),
    removeRule:handle(async(req,res)=>{object(req.body||{},[]);send(res,await service.updateRule(context(res),id(req),{},version(req),key(req),true));}),
    createException:handle(async(req,res)=>send(res,await service.createException(context(res),req.body,key(req)),true)),
    exceptions:handle(async(req,res)=>{res.json({data:await service.list(context(res),req.query,true,'exceptions')});}),
    removeException:handle(async(req,res)=>{object(req.body||{},[]);send(res,await service.removeException(context(res),id(req),version(req),key(req)));}),
    availability:handle(async(req,res)=>{res.json({data:await service.availability(context(res),objectId(req.params.professionalId),req.query)});}),
    request:handle(async(req,res)=>send(res,await service.request(context(res),req.body,key(req)),true)),
    own:handle(async(req,res)=>{res.json({data:await service.list(context(res),req.query)});}),
    received:handle(async(req,res)=>{res.json({data:await service.list(context(res),req.query,true)});}),
    history:handle(async(req,res)=>{res.json({data:await service.history(context(res),id(req))});}),
    get:handle(async(req,res)=>{const data=await service.get(context(res),id(req));res.set('ETag','"'+data.id+':'+data.version+'"');res.json({data});}),
    resolve:(action:'accept'|'decline'|'cancel'|'complete')=>handle(async(req,res)=>send(res,await service.transition(context(res),id(req),action,version(req),key(req),req.body))),
    reschedule:handle(async(req,res)=>send(res,await service.request(context(res),req.body,key(req),id(req),version(req)),true)),
  };
}
