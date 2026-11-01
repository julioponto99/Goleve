import { Connection } from 'mongoose';
import { goalSchema } from './goal.model';
import { heartRateSchema } from './heart-rate.model';
import { measurementSchema } from './measurement.model';
import { stepsSchema } from './steps.model';
export function createPerformanceModels(connection: Connection) {
  return {
    Measurement: connection.model('PerformanceMeasurement', measurementSchema),
    Steps: connection.model('PerformanceSteps', stepsSchema),
    HeartRate: connection.model('PerformanceHeartRate', heartRateSchema),
    Goal: connection.model('PerformanceGoal', goalSchema),
  };
}
export type PerformanceModels = ReturnType<typeof createPerformanceModels>;
export async function initializeModels(models: PerformanceModels) { await Promise.all(Object.values(models).map((model) => model.init())); }
