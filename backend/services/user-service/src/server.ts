import { localDemo } from './local-demo';
import 'dotenv/config';
localDemo.policy();
import { loadSettings } from './config/settings';
import { openDatabase } from './config/database';
import { createUserModels, initializeModels } from './models';
import { createApp } from './app';
import { Connection } from 'mongoose';

let connection: Connection | undefined;
async function start(): Promise<void> {
  const settings = loadSettings();
  connection = await openDatabase(process.env.MONGO_URI || '');
  const models = createUserModels(connection);
  await initializeModels(models);
  const server = createApp(settings, connection, models).listen(Number(process.env.PORT || 3002),
    () => console.log('user-service running'));
  const close = () => {
    server.close(() => { connection?.close().catch(() => { process.exitCode = 1; }); });
  };
  process.once('SIGTERM', close);
  process.once('SIGINT', close);
}
start().catch(async () => {
  console.error('user-service failed to start; check required configuration and MongoDB');
  await connection?.close();
  process.exitCode = 1;
});
