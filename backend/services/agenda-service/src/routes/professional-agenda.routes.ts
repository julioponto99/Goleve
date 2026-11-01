import { Router } from 'express';
import { ProfessionalAgendaService } from '../professional/service';
import { createProfessionalAgendaController } from '../controllers/professional-agenda.controller';
export function createProfessionalAgendaRoutes(service?:ProfessionalAgendaService) {
  const router=Router();
  router.use(['/professional','/professional-appointments','/professionals'],(_req,res,next)=>{
    res.set('Cache-Control','no-store');res.set('X-Agenda-Professional-Mode',service?'isolated':'disabled');
    if(!service){res.status(503).json({error:{code:'PROFESSIONAL_AGENDA_DISABLED',message:'Professional Agenda is disabled'}});return;}next();
  });
  if(!service)return router;
  const c=createProfessionalAgendaController(service);
  router.post('/professional/availability-rules',c.createRule);
  router.get('/professional/availability-rules',c.rules);
  router.patch('/professional/availability-rules/:id',c.updateRule);
  router.delete('/professional/availability-rules/:id',c.removeRule);
  router.post('/professional/availability-exceptions',c.createException);
  router.get('/professional/availability-exceptions',c.exceptions);
  router.delete('/professional/availability-exceptions/:id',c.removeException);
  router.get('/professionals/:professionalId/availability',c.availability);
  router.post('/professional-appointments',c.request);
  router.get('/professional-appointments',c.own);
  router.get('/professional/appointments',c.received);
  router.get('/professional-appointments/:id/history',c.history);
  router.get('/professional-appointments/:id',c.get);
  for(const action of ['accept','decline','cancel','complete'] as const)router.post('/professional/appointments/:id/'+action,c.resolve(action));
  router.post('/professional-appointments/:id/cancel',c.resolve('cancel'));
  router.post('/professional-appointments/:id/reschedule',c.reschedule);
  return router;
}
