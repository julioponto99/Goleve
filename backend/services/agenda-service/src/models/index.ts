import { Connection } from 'mongoose';
import { activitySchema } from './activity.model';
export function createAgendaModels(connection: Connection) {
  return { Activity: connection.model('AgendaActivity', activitySchema) };
}
export type AgendaModels = ReturnType<typeof createAgendaModels>;
export async function initializeModels(models: AgendaModels): Promise<void> {
  await Promise.all(Object.values(models).map((model) => model.init()));
}
