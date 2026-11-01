import { Router } from 'express';
import { createPerformanceController } from '../controllers/performance.controller';
import { PerformanceService } from '../services/performance.service';
export function createPerformanceRoutes(service: PerformanceService) {
  const router = Router(), controller = createPerformanceController(service);
  router.post('/measurements', controller.createMeasurement);
  router.get('/measurements/evolution', controller.measurementEvolution);
  router.get('/measurements', controller.listMeasurements);
  router.patch('/measurements/:measurementId', controller.updateMeasurement);
  router.delete('/measurements/:measurementId', controller.deleteMeasurement);
  router.post('/steps', controller.createSteps);
  router.get('/steps/daily', controller.dailySteps);
  router.get('/steps/summary', controller.stepsSummary);
  router.get('/steps', controller.listSteps);
  router.post('/heart-rate', controller.createHeartRate);
  router.get('/heart-rate/summary', controller.heartRateSummary);
  router.get('/heart-rate', controller.heartRateHistory);
  router.get('/goals', controller.listGoals);
  router.put('/goals/:kind', controller.setGoal);
  router.get('/summary', controller.overview);
  return router;
}
