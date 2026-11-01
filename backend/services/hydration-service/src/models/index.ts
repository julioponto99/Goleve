import { Connection } from 'mongoose';
import { goalSchema } from './goal.model';
import { intakeSchema } from './intake.model';
import { reminderSchema } from './reminder.model';
import { outboxSchema } from './outbox.model';
export function createHydrationModels(connection: Connection) {
  return {
    Goal: connection.model('HydrationGoal', goalSchema),
    Intake: connection.model('WaterIntake', intakeSchema),
    Reminder: connection.model('HydrationReminder', reminderSchema),
    Outbox: connection.model('HydrationOutbox', outboxSchema),
  };
}
export type HydrationModels = ReturnType<typeof createHydrationModels>;
export async function initializeModels(models: HydrationModels) {
  await Promise.all(Object.values(models).map((model) => model.init()));
}
