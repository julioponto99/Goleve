import express,{Router} from 'express';
import { Connection } from 'mongoose';
import { ApiError } from '../config/errors';
import { RequestContext } from '../middlewares/auth.middleware';
import { versionHeader } from '../professional/validation';
import { authenticateInternal,fields,oid,responseProof } from './protocol';
import { AgendaBilling } from './billing';
export function internalBillingRoutes(connection:Connection,billing:AgendaBilling){
  const r=Router();r.use(express.json({limit:'8kb'}));
  r.post('/:operation',async(req,res,next)=>{try{
    const operation=req.params.operation;if(!['context','claim','settle'].includes(operation))throw new ApiError(404,'NOT_FOUND','Contract not found');
    await authenticateInternal(connection,billing.config,'payment','/internal/v1/payment-demo/'+operation,req.body,req.get('authorization'));
    const b=fields(req.body,operation==='context'?['actorId','appointmentId']:operation==='claim'?['actorId','appointmentId','attemptId','appointmentVersion','quoteId']:['actorId','appointmentId','attemptId','claimToken','outcome']);
    let data:unknown;
    if(operation==='context')data=await billing.context(oid(b.actorId),oid(b.appointmentId));
    else if(operation==='claim')data=await billing.claim(b as unknown as Parameters<AgendaBilling['claim']>[0]);
    else data=await billing.settle(b as unknown as Parameters<AgendaBilling['settle']>[0]);
    res.set('Cache-Control','no-store').set('x-payment-demo-proof',responseProof(billing.config,'payment',data,req.get('authorization')!)).json(data);
  }catch(e){next(e);}});return r;
}
export function publicBillingRoutes(billing:AgendaBilling){
  const r=Router();r.post('/professional-appointments/:id/service',async(req,res,next)=>{try{
    const ctx=res.locals.context as RequestContext,b=fields(req.body,['serviceId']),id=oid(req.params.id);
    const data=await billing.associate(ctx.identity.id,id,oid(b.serviceId),versionHeader(req.get('if-match'),id));res.set('ETag','"'+data.id+':'+data.version+'"').json({data});
  }catch(e){next(e);}});return r;
}
