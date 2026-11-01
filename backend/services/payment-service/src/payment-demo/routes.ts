import { Router,Request,Response,NextFunction } from 'express';
import { RequestContext } from '../middlewares/auth.middleware';
import { fields } from './protocol';
import { IntegratedPaymentService } from './service';
const work=(fn:(req:Request,res:Response)=>Promise<unknown>)=>(req:Request,res:Response,next:NextFunction)=>{fn(req,res).catch(next);};
export function integratedPaymentRoutes(service:IntegratedPaymentService){
  const r=Router(),ctx=(res:Response)=>res.locals.context as RequestContext,key=(req:Request)=>req.get('idempotency-key')||'';
  r.post('/appointments/:appointmentId',work(async(req,res)=>{fields(req.body||{},[]);res.status(201).json({data:await service.create(ctx(res),req.params.appointmentId,key(req))});}));
  r.get('/appointment-payments/:id',work(async(req,res)=>res.json({data:await service.get(ctx(res),req.params.id)})));
  for(const action of ['confirm','cancel','reconcile'] as const)r.post('/appointment-payments/:id/'+action,work(async(req,res)=>{fields(req.body||{},[]);res.json({data:action==='reconcile'?await service.reconcile(ctx(res),req.params.id):await service[action](ctx(res),req.params.id,key(req))});}));
  return r;
}
