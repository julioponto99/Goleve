import 'dotenv/config';
import { Connection } from 'mongoose';
import { loadSettings } from './config/settings';
import { openDatabase } from './config/database';
import { createProfessionalModels, initializeModels } from './models';
import { createApp } from './app';
let connection: Connection | undefined;
async function start(): Promise<void> {
  const settings = loadSettings(); connection = await openDatabase(process.env.MONGO_URI || '');
  const models = createProfessionalModels(connection); await initializeModels(models);
  const server = createApp(settings, connection, models).listen(Number(process.env.PORT || 3007), () => console.log('professional-service running'));
  const close = () => { server.close(() => { connection?.close().catch(() => { process.exitCode = 1; }); }); };
  process.once('SIGTERM', close); process.once('SIGINT', close);
}
start().catch(async () => {
  console.error('professional-service failed to start; check required configuration and MongoDB');
  await connection?.close(); process.exitCode = 1;
});
