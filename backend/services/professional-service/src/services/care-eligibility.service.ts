import { ProfessionalModels } from '../models';
import { ProfessionalSettings } from '../config/settings';
import { PageOptions } from '../config/http';
import { RelationshipKind } from '../models/care-relationship.model';
import { DemoIdentityReader } from '../demo/identity-client';
export interface EligibleCareCapability {
  professionalId: string; capabilityId: string; professionalAuthUserId: string;
  relationshipKind: RelationshipKind; professionalName: string;
}
export type CareEligibilityDecision = { status: 'eligible'; capability: EligibleCareCapability } | { status: 'ineligible' | 'unavailable' };
export interface CareEligibilityProvider {
  check(professionalId: string, capabilityId: string): Promise<CareEligibilityDecision>;
  list(page: PageOptions): Promise<{ items: EligibleCareCapability[]; nextBefore: string | null }>;
  authorizedCapabilities(identity: { id: string; userType: string }): Promise<string[]>;
}
export class ProfessionalCareEligibility implements CareEligibilityProvider {
  constructor(private readonly models: ProfessionalModels, private readonly settings: ProfessionalSettings, private readonly demoIdentity?: DemoIdentityReader) {}
  async check(professionalId: string, capabilityId: string): Promise<CareEligibilityDecision> {
    if (this.settings.dataMode !== 'synthetic' || (!this.demoIdentity && this.settings.reviewMode !== 'synthetic')) return { status: 'ineligible' };
    const [profile, capability, application] = await Promise.all([
      this.models.Profile.findById(professionalId),
      this.models.Capability.findOne({ _id: capabilityId, professionalId }),
      this.models.Application.findOne({ professionalId, status: 'approved', publicationEnabled: true }),
    ]);
    if (!profile || !capability || capability.authUserId !== profile.authUserId) return { status: 'ineligible' };
    if (this.demoIdentity) {
      try {
        const identity = await this.demoIdentity.read(profile.authUserId);
        if (!identity || identity.userType !== 'profissional') return { status: 'ineligible' };
      } catch { return { status: 'unavailable' }; }
    }
    if (this.settings.reviewMode !== 'synthetic' || !application
      || ['suspended', 'archived'].includes(profile.profileStatus) || capability.status !== 'verified'
      || capability.titleRequirement === 'pending_legal_assessment') return { status: 'ineligible' };
    // Phase 2 supplies neither verified professional credentials/review validity nor
    // a production Auth contract for third-party roles. Demo role confirmation alone never grants eligibility.
    return { status: 'unavailable' };
  }
  async list(_page: PageOptions) {
    // The simulated public catalog is not an eligibility authority. No real positive decision is possible yet.
    return { items: [] as EligibleCareCapability[], nextBefore: null };
  }
  async authorizedCapabilities(_identity: { id: string; userType: string }): Promise<string[]> { return []; }
}
