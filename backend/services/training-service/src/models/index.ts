import { Connection } from 'mongoose';
import { exerciseSchema } from './exercise.model';
import { planSchema } from './plan.model';
import { sessionSchema } from './session.model';
import { outboxSchema } from './outbox.model';
export function createTrainingModels(connection: Connection) {
  return {
    Exercise: connection.model('TrainingExercise', exerciseSchema),
    Plan: connection.model('TrainingPlan', planSchema),
    Session: connection.model('TrainingSession', sessionSchema),
    Outbox: connection.model('TrainingOutbox', outboxSchema),
  };
}
export type TrainingModels = ReturnType<typeof createTrainingModels>;
export async function initializeModels(models: TrainingModels): Promise<void> {
  await Promise.all(Object.values(models).map((model) => model.init()));
}
