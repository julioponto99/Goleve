import { ApiError } from '../config/errors';
import { ServiceKeys, SERVICE_PATH, signServiceRequest } from './service-auth';
export interface EligibilityInput { capabilityId: string; professionalId?: string; subjectAuthUserId?: string; relationshipId?: string }
export interface EligibilityDecision {
  capabilityId: string; professionalId: string; professionalAuthUserId: string;
  relationshipKind: 'personal_training'|'nutrition'; eligible: boolean; canOfferAppointment: boolean;
  checkedAtUtc: string; validUntilUtc: string; authority: 'real'|'synthetic'|'unavailable';
  serviceModes: string[]; relationshipAccepted: boolean;
}
export interface AppointmentEligibility { check(input: EligibilityInput): Promise<EligibilityDecision> }
export class ProfessionalEligibilityClient implements AppointmentEligibility {
  constructor(private readonly origin: string, private readonly keys: ServiceKeys) {}
  async check(input: EligibilityInput): Promise<EligibilityDecision> {
    try {
      const response = await fetch(this.origin + SERVICE_PATH, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: signServiceRequest(input, this.keys) },
        body: JSON.stringify(input), signal: AbortSignal.timeout(3000), redirect: 'error' });
      if (response.status === 404) throw new ApiError(404, 'PROFESSIONAL_INELIGIBLE', 'Professional capability is unavailable');
      if (!response.ok || Number(response.headers.get('content-length') || '0') > 8192) throw new Error();
      const body = await response.json() as { data?: EligibilityDecision }, d = body?.data;
      if (!d || d.capabilityId !== input.capabilityId || (input.professionalId && d.professionalId !== input.professionalId)
        || !/^[a-f0-9]{24}$/.test(d.professionalId) || !/^[a-f0-9]{24}$/.test(d.professionalAuthUserId)
        || !['personal_training','nutrition'].includes(d.relationshipKind) || typeof d.eligible !== 'boolean' || typeof d.canOfferAppointment !== 'boolean'
        || typeof d.relationshipAccepted !== 'boolean' || !Array.isArray(d.serviceModes) || d.serviceModes.some(v=>!['online','in_person','home_visit'].includes(v))) throw new Error();
      const checked = Date.parse(d.checkedAtUtc), until = Date.parse(d.validUntilUtc), now = Date.now();
      if (!Number.isFinite(checked) || !Number.isFinite(until) || checked > now + 2000 || checked < now - 15000 || until <= now || until - checked > 15000) throw new Error();
      // No setting, environment variable or demo fixture can turn a synthetic decision into real eligibility.
      if (d.authority !== 'real' || !d.eligible || !d.canOfferAppointment) throw new ApiError(404, 'PROFESSIONAL_INELIGIBLE', 'Real professional eligibility is not confirmed');
      return d;
    } catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(503, 'PROFESSIONAL_UNAVAILABLE', 'Professional eligibility verification is unavailable'); }
  }
}
