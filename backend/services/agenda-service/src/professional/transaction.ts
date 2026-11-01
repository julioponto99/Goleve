import { ClientSession, Connection } from 'mongoose';
import { ApiError } from '../config/errors';
import { ProfessionalAgendaModels } from './models';
import { requireReplicaSet } from './settings';
export async function calendarTransaction<T>(connection: Connection, models: ProfessionalAgendaModels, owner: string, operation: (session: ClientSession) => Promise<T>): Promise<T> {
  await requireReplicaSet(connection);
  for (let attempt = 0; attempt < 5; attempt++) {
    const session = await connection.startSession();
    try {
      session.startTransaction({ readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, readPreference: 'primary', maxCommitTimeMS: 5000 });
      // Every write path touches this same document FIRST. Snapshot reads alone cannot prevent write skew.
      await models.Calendar.findOneAndUpdate({ _id: owner }, { $inc: { version: 1 } }, { upsert: true, session });
      const result = await operation(session);
      for (let commitAttempt = 0; ; commitAttempt++) {
        try { await session.commitTransaction(); break; }
        catch (error) {
          if ((error as {hasErrorLabel?:(label:string)=>boolean}).hasErrorLabel?.('UnknownTransactionCommitResult')) {
            if (commitAttempt < 2) continue;
            throw new ApiError(503,'COMMIT_OUTCOME_UNKNOWN','Read the resource or retry with the same idempotency key');
          }
          throw error;
        }
      }
      return result;
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction().catch(() => undefined);
      const e = error as { code?:number; message?:string; hasErrorLabel?:(label:string)=>boolean };
      const retry = e.code === 112 || e.code === 251 || e.hasErrorLabel?.('TransientTransactionError')
        || (e.code === 11000 && e.message?.includes('agenda_professional_calendars'));
      if (!retry) { if(e.code===11000)throw new ApiError(409,'IDEMPOTENCY_CONFLICT','Concurrent command already persisted; retry or use a new key'); throw error; }
      if (attempt === 4) throw new ApiError(409,'CALENDAR_BUSY','Concurrent calendar change; retry with the same idempotency key');
      await new Promise(resolve => setTimeout(resolve, 10 * (attempt + 1)));
    } finally { await session.endSession(); }
  }
  throw new ApiError(409,'CALENDAR_BUSY','Calendar temporarily busy');
}
