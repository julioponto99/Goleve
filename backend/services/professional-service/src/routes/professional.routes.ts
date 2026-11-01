import { Router } from 'express';
import { catalogDto } from '../config/catalog';
import { createProfessionalController } from '../controllers/professional.controller';
import { ProfessionalService } from '../services/professional.service';
export function createProfessionalRoutes(service: ProfessionalService) {
  const router = Router(), controller = createProfessionalController(service);
  router.get('/catalog', (_req, res) => res.json({ data: catalogDto() }));
  router.get('/me', controller.getProfile);
  router.put('/me', controller.createProfile);
  router.patch('/me', controller.updateProfile);
  router.get('/me/capabilities', controller.listCapabilities);
  router.post('/me/capabilities', controller.createCapability);
  router.get('/me/capabilities/:capabilityId', controller.getCapability);
  router.patch('/me/capabilities/:capabilityId', controller.updateCapability);
  router.get('/me/qualifications', controller.listQualifications);
  router.post('/me/qualifications', controller.createQualification);
  router.get('/me/qualifications/:qualificationId', controller.getQualification);
  router.patch('/me/qualifications/:qualificationId', controller.updateQualification);
  router.get('/me/availability-declaration', controller.getAvailability);
  router.put('/me/availability-declaration', controller.createAvailability);
  router.patch('/me/availability-declaration', controller.updateAvailability);
  return router;
}
