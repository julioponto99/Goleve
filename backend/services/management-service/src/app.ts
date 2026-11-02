import express from 'express';
import { createProfessionalApplicationRoutes } from './routes/professional-applications.routes';
import { ManagementService } from './services/management.service';
import { authenticate } from './middlewares/auth.middleware';
import { managementRoutes,authorizationRoutes } from './routes/management.routes';
import { ContractConfig } from './management-contract';
import { ApiError } from './config/errors';
import { administrativeAuthorization } from './middlewares/administration.middleware';
import { administrationOwnerAuthorization,administrationPublicRoutes } from './routes/administration.routes';
export function createApp(runtime?:{service:ManagementService;config:ContractConfig;authOrigin:string}) {
  const app = express(); app.disable('x-powered-by');
  app.get('/health', (_req, res) => res.json({ service: 'management-service', status: 'ok' }));
  // Professional is the authority: validates the current Auth role and reviewer grant on every forwarded request.
  app.use('/management/professional-applications', createProfessionalApplicationRoutes());
  if(runtime){
    app.get('/ready',async(_req,res)=>{try{await runtime.service.connection.db!.admin().ping();res.json({status:'ok'});}catch{res.status(503).json({status:'unavailable'});}});
    app.use('/internal/v1/management',authorizationRoutes(runtime.service,runtime.config,runtime.authOrigin));
    app.use('/internal/v1/management',administrationOwnerAuthorization(runtime.service,runtime.config,runtime.authOrigin));
    app.use('/management/administration',authenticate(runtime.authOrigin),express.json({limit:'16kb'}),administrativeAuthorization(runtime.service),administrationPublicRoutes(runtime.service));
    app.use('/management',authenticate(runtime.authOrigin),express.json({limit:'16kb'}),administrativeAuthorization(runtime.service),(_req,res,next)=>{res.set('Cache-Control','no-store');next();},managementRoutes(runtime.service));
  }else app.use('/management',(_req,res)=>res.status(503).json({error:{code:'MANAGEMENT_UNAVAILABLE',message:'Persistent Management runtime required'}}));
  app.use((error:unknown,req:express.Request,res:express.Response,_next:express.NextFunction)=>{void(async()=>{
    const e=error instanceof ApiError?error:undefined,context=res.locals.context;
    if(runtime&&context)try{await runtime.service.audit(context,'request.denied','operator',context.identity.id,e?.statusCode===403?'denied':'failed',undefined,undefined,undefined,e?.code);}catch{res.status(503).json({error:{code:'AUDIT_UNAVAILABLE',message:'Operation could not be audited'}});return;}
    res.status(e?.statusCode||500).json({error:{code:e?.code||'INTERNAL_ERROR',message:e?.message||'Operation unavailable'}});
  })().catch(()=>{if(!res.headersSent)res.status(503).json({error:{code:'MANAGEMENT_UNAVAILABLE'}});});});
  app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }));
  return app;
}
