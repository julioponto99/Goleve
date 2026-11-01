import { ClientSession, Connection } from 'mongoose';
import { fail } from '../config/errors';
export async function transaction<T>(connection: Connection, operation: (session: ClientSession) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const session = await connection.startSession();
    try {
      session.startTransaction({ readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, maxCommitTimeMS: 5000 });
      const result = await operation(session);
      for (let commit = 0; ; commit++) {
        try { await session.commitTransaction(); break; }
        catch (e) { if ((e as { hasErrorLabel?: (s: string) => boolean }).hasErrorLabel?.('UnknownTransactionCommitResult')) { if (commit < 2) continue; return fail(503, 'COMMIT_OUTCOME_UNKNOWN', 'Read the resource before retrying the same command'); } throw e; }
      }
      return result;
    } catch (e) {
      if (session.inTransaction()) await session.abortTransaction().catch(() => undefined);
      if (!(e as { hasErrorLabel?: (s: string) => boolean }).hasErrorLabel?.('TransientTransactionError')) throw e;
      if (attempt === 3) return fail(409, 'CONCURRENT_OPERATION', 'Concurrent operation; retry the same command');
    } finally { await session.endSession(); }
  }
  return fail(409, 'CONCURRENT_OPERATION', 'Concurrent operation');
}
