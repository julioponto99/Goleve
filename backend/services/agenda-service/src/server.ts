import 'dotenv/config';
import { openDatabase } from './config/database';
import { createAgendaModels, initializeModels } from './models';
import { createApp } from './app';

let connection: Awaited<ReturnType<typeof openDatabase>> | undefined;
async function start() {
  connection = await openDatabase(process.env.MONGO_URI || '');
  const models = createAgendaModels(connection);
  await initializeModels(models);
  const server = createApp(process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001', connection, models).listen(Number(process.env.PORT || 3004), () => console.log('agenda-service running'));
  const close = () => server.close(() => connection?.close().catch(() => { process.exitCode = 1; }));
  process.once('SIGTERM', close); process.once('SIGINT', close);
}
start().catch(async (error) => { console.error('agenda-service failed to start; check required configuration and MongoDB', error); await connection?.close(); process.exitCode = 1; });
