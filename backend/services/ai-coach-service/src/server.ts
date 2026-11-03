import { localDemo } from './local-demo';
import 'dotenv/config';
localDemo.policy();
import { loadSettings } from './config/settings';
import { openDatabase } from './config/database';
import { createCoachModels, initializeModels } from './models';
import { createApp } from './app';
async function start() {
  const settings = loadSettings();
  const connection = settings.enabled ? await openDatabase(process.env.MONGO_URI || '') : undefined;
  try {
    if (connection && !(await connection.db?.admin().command({ hello: 1 }))?.setName) throw new Error('AI Coach persistence requires an isolated replica set');
    const models = connection ? createCoachModels(connection) : undefined;
    if (models) await initializeModels(models);
    const server = createApp(settings, connection, models).listen(Number(process.env.PORT || 3011), () => console.log('ai-coach-service running'));
    const close = () => server.close(() => { void connection?.close(); }); process.once('SIGINT', close); process.once('SIGTERM', close);
  } catch (error) { await connection?.close(); throw error; }
}
if (require.main === module) void start().catch(() => { console.error('ai-coach-service startup failed; check isolated configuration'); process.exitCode = 1; });
