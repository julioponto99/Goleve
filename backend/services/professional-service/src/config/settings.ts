import { DemoIdentityConfig, loadDemoIdentityConfig } from '../demo/identity-client';
import { ServiceKeys, loadServiceKeys } from '../internal/agenda-service-auth';
import { DemoConfig, loadDemo } from '../payment-demo/protocol';
export interface ProfessionalSettings {
  paymentDemo?: DemoConfig;
  agendaServiceKeys?: ServiceKeys;
  demoIdentity?: DemoIdentityConfig;
  authServiceUrl: string;
  dataMode: 'disabled' | 'synthetic';
  reviewMode?: 'disabled' | 'synthetic';
  reviewerIds?: readonly string[];
  demoEligibilityEnabled?: boolean;
  careInvitationTtlDays?: number;
}
export function loadSettings(): ProfessionalSettings {
  const url = new URL(process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001');
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('AUTH_SERVICE_URL must be an HTTP(S) origin without credentials');
  }
  const dataMode = process.env.PROFESSIONAL_DATA_MODE || 'disabled';
  if (dataMode !== 'disabled' && dataMode !== 'synthetic') {
    throw new Error('PROFESSIONAL_DATA_MODE supports only disabled or synthetic');
  }
  const reviewMode = process.env.PROFESSIONAL_REVIEW_MODE || 'disabled';
  const rawIds = process.env.PROFESSIONAL_REVIEWER_IDS || '';
  const reviewerIds = rawIds ? rawIds.split(',').map((id) => id.trim()) : [];
  if (!['disabled', 'synthetic'].includes(reviewMode) || reviewerIds.length > 50
    || reviewerIds.some((id) => !/^[a-f0-9]{24}$/.test(id)) || new Set(reviewerIds).size !== reviewerIds.length
    || (reviewMode === 'synthetic' && (dataMode !== 'synthetic' || !reviewerIds.length))) {
    throw new Error('Invalid professional review configuration; administrative review is unavailable');
  }
  const ttl = process.env.CARE_INVITATION_TTL_DAYS || '7';
  if (!/^[1-9]\d*$/.test(ttl) || Number(ttl) > 365) throw new Error('CARE_INVITATION_TTL_DAYS must be an integer from 1 to 365');
  const demoIdentity = loadDemoIdentityConfig(url.origin, dataMode, reviewMode, reviewerIds);
  const agendaFlag = process.env.PROFESSIONAL_AGENDA_CONTRACT_ENABLED || 'false';
  if (!['false','true'].includes(agendaFlag)) throw new Error('Invalid Agenda service contract flag');
  if (agendaFlag === 'true' && (!['test','development'].includes(process.env.NODE_ENV || '') || process.env.AGENDA_PROFESSIONAL_MODE !== 'isolated')) throw new Error('Agenda contract requires isolated local mode');
  const agendaServiceKeys = agendaFlag === 'true' ? loadServiceKeys() : undefined;
  const demoEligibility = process.env.PROFESSIONAL_DEMO_ELIGIBILITY_ENABLED || 'false';
  if (!['false', 'true'].includes(demoEligibility)
    || (demoEligibility === 'true' && (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test'
      || dataMode !== 'synthetic' || reviewMode !== 'synthetic' || agendaFlag !== 'true'))) {
    throw new Error('Demo eligibility requires explicit isolated synthetic Agenda configuration');
  }
  const paymentDemo=loadDemo('professional');
  if(paymentDemo&&(dataMode!=='synthetic'||reviewMode!=='synthetic'))throw new Error('Payment demonstration requires synthetic Professional data and review');
  return { paymentDemo,authServiceUrl: url.origin, dataMode, reviewMode: reviewMode as 'disabled' | 'synthetic', reviewerIds,
    careInvitationTtlDays: Number(ttl), demoEligibilityEnabled: demoEligibility === 'true',
    ...(demoIdentity ? { demoIdentity } : {}), ...(agendaServiceKeys ? { agendaServiceKeys } : {}) };
}
