import { Connection } from 'mongoose';
import { profileSchema } from './user-profile.model';
import { preferencesSchema } from './user-preferences.model';
import { habitSchema } from './habit-profile.model';
import { measurementSchema } from './body-measurement.model';
import { goalSchema } from './user-goal.model';
import { auditSchema } from './audit-access.model';

export function createUserModels(connection: Connection) {
  return {
    Profile: connection.model('UserProfile', profileSchema),
    Preferences: connection.model('UserPreferences', preferencesSchema),
    Habit: connection.model('HabitProfile', habitSchema),
    Measurement: connection.model('BodyMeasurement', measurementSchema),
    Goal: connection.model('UserGoal', goalSchema),
    Audit: connection.model('AuditAccessRecord', auditSchema),
  };
}
export type UserModels = ReturnType<typeof createUserModels>;

export async function initializeModels(models: UserModels): Promise<void> {
  // init/createIndexes only create required indexes; never call syncIndexes or drop indexes.
  await Promise.all(Object.values(models).map((model) => model.init()));
}
