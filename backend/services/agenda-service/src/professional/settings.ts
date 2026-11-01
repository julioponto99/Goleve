import { Connection } from 'mongoose';
import { loadServiceKeys, ServiceKeys } from './service-auth';
export interface ProfessionalAgendaSettings { enabled: boolean; professionalServiceUrl: string; keys?: ServiceKeys; publishEvents?: boolean; rabbitUrl?: string }
export function loadProfessionalAgendaSettings(): ProfessionalAgendaSettings {
  const flag = process.env.AGENDA_PROFESSIONAL_ENABLED || 'false';
  if (!['true','false'].includes(flag)) throw new Error('Invalid Agenda professional feature flag');
  if (flag === 'false') return { enabled: false, professionalServiceUrl: '' };
  if (!['development','test'].includes(process.env.NODE_ENV || '') || process.env.AGENDA_PROFESSIONAL_MODE !== 'isolated') throw new Error('Professional Agenda requires explicit isolated local mode');
  const uri = new URL(process.env.MONGO_URI || '');
  if (!/^\/goleve_(agenda56_test_|agenda_professional_local_)[a-f0-9_]+$/.test(uri.pathname)) throw new Error('Professional Agenda requires its own isolated database');
  const url = new URL(process.env.PROFESSIONAL_SERVICE_URL || 'http://professional-service:3007');
  if (!['http:','https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid Professional service origin');
  const publish = process.env.AGENDA_PROFESSIONAL_PUBLISH_EVENTS || 'false';
  if (!['true','false'].includes(publish) || (publish === 'true' && !process.env.AGENDA_PROFESSIONAL_RABBITMQ_URL)) throw new Error('Isolated Agenda event configuration required');
  return { enabled: true, professionalServiceUrl: url.origin, keys: loadServiceKeys(), publishEvents: publish === 'true', rabbitUrl: process.env.AGENDA_PROFESSIONAL_RABBITMQ_URL };
}
export async function requireReplicaSet(connection: Connection) {
  const hello = await connection.db?.admin().command({ hello: 1 });
  if (!hello?.setName) throw new Error('Professional Agenda requires a MongoDB replica set; standalone is forbidden');
}
