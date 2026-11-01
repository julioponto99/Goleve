import 'dotenv/config';
import { createApp } from './app';
try {
  const server = createApp().listen(Number(process.env.PORT || 3008), () => console.log('management-service running'));
  const close = () => server.close(); process.once('SIGTERM', close); process.once('SIGINT', close);
} catch { console.error('management-service failed to start; check required configuration'); process.exitCode = 1; }
