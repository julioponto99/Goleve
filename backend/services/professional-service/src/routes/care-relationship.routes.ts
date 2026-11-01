import { Router } from 'express';
import { CareRelationshipService } from '../services/care-relationship.service';
import { createCareRelationshipController } from '../controllers/care-relationship.controller';
export function createCareRelationshipRoutes(service: CareRelationshipService) {
  const router = Router(), controller = createCareRelationshipController(service);
  router.post('/', controller.create);
  router.get('/me', controller.list);
  router.get('/:relationshipId', controller.get);
  router.get('/:relationshipId/history', controller.history);
  router.post('/:relationshipId/accept', controller.command('accept'));
  router.post('/:relationshipId/decline', controller.command('decline'));
  router.post('/:relationshipId/cancel', controller.command('cancel'));
  router.post('/:relationshipId/end', controller.command('end'));
  return router;
}
