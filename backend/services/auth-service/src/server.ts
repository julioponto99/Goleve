import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { AuthUser } from './models/auth-user.model';
import { initializeSecurityModels } from './administration/models';

async function startServer(): Promise<void> {
  const app = createApp();
  await connectDatabase();
  // Wait for the unique email index before accepting concurrent registrations.
  await AuthUser.init();
  await initializeSecurityModels();

  const port = Number(process.env.PORT || 3001);
  app.listen(port, () => console.log(`auth-service running on ${port}`));
}

startServer().catch(async () => {
  console.error('auth-service failed to start; check required environment configuration and MongoDB connectivity');
  await mongoose.disconnect();
  process.exitCode = 1;
});
