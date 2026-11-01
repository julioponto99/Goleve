import 'dotenv/config';
import { openDatabase } from './config/database';
import { createAgendaModels, initializeModels } from './models';
import { createApp } from './app';
import { loadProfessionalAgendaSettings, requireReplicaSet } from './professional/settings';
import { createProfessionalAgendaModels, initializeProfessionalAgendaModels } from './professional/models';
import { ProfessionalAgendaService } from './professional/service';
import { ProfessionalEligibilityClient } from './professional/eligibility';
import { publishProfessionalOutbox } from './professional/outbox';
import { AgendaBilling } from './payment-demo/billing';

let connection: Awaited<ReturnType<typeof openDatabase>> | undefined;
async function start() {
  const settings = loadProfessionalAgendaSettings();
  connection = await openDatabase(process.env.MONGO_URI || '');
  if (settings.enabled) await requireReplicaSet(connection);
  const models = createAgendaModels(connection);
  await initializeModels(models);
  const professionalModels = settings.enabled ? createProfessionalAgendaModels(connection) : undefined;
  if (professionalModels) await initializeProfessionalAgendaModels(professionalModels);
  if(professionalModels&&settings.paymentDemo)await new AgendaBilling(connection,professionalModels,settings.paymentDemo).initialize();
  const server = createApp(process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001', connection, models, professionalModels ? { settings, models: professionalModels } : undefined).listen(Number(process.env.PORT || 3004), () => console.log('agenda-service running'));
  const timers: ReturnType<typeof setInterval>[] = [];
  if (professionalModels && (settings.keys || settings.paymentDemo)) {
    const billing=settings.paymentDemo?new AgendaBilling(connection!,professionalModels,settings.paymentDemo):undefined;
    const eligibility=billing?.eligibility||new ProfessionalEligibilityClient(settings.professionalServiceUrl,settings.keys!);
    const service = new ProfessionalAgendaService(connection, professionalModels, models, eligibility,undefined,billing);
    let expiring = false, publishing = false;
    timers.push(setInterval(() => { if (expiring) return; expiring = true; service.expireDue().catch(() => console.error('Agenda expiration batch failed')).finally(() => { expiring = false; }); }, 15000));
    if (settings.publishEvents && settings.rabbitUrl) timers.push(setInterval(() => { if (publishing) return; publishing = true; publishProfessionalOutbox(professionalModels, settings.rabbitUrl!).catch(() => console.error('Agenda outbox batch failed')).finally(() => { publishing = false; }); }, 5000));
  }
  const close = () => { timers.forEach(clearInterval); server.close(() => connection?.close().catch(() => { process.exitCode = 1; })); };
  process.once('SIGTERM', close); process.once('SIGINT', close);
}
start().catch(async () => { console.error('agenda-service failed to start; check required configuration and MongoDB'); await connection?.close(); process.exitCode = 1; });
