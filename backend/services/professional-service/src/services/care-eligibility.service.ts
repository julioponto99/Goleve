import { ProfessionalModels } from '../models';
import { ProfessionalSettings } from '../config/settings';
import { PageOptions } from '../config/http';
import { RelationshipKind } from '../models/care-relationship.model';
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
  constructor(private readonly models: ProfessionalModels, private readonly settings: ProfessionalSettings) {}
  async check(professionalId: string, capabilityId: string): Promise<CareEligibilityDecision> {
    if (this.settings.dataMode !== 'synthetic' || this.settings.reviewMode !== 'synthetic') return { status: 'ineligible' };
    const [profile, capability, application] = await Promise.all([
      this.models.Profile.findById(professionalId),
      this.models.Capability.findOne({ _id: capabilityId, professionalId }),
      this.models.Application.findOne({ professionalId, status: 'approved', publicationEnabled: true }),
    ]);
    if (!profile || !capability || !application || capability.authUserId !== profile.authUserId
      || ['suspended', 'archived'].includes(profile.profileStatus) || capability.status !== 'verified'
      || capability.titleRequirement === 'pending_legal_assessment') return { status: 'ineligible' };
    // Phase 2 supplies neither verified professional credentials/review validity nor
    // an authorized Auth contract for the current role of a third party. Never infer eligibility.
    return { status: 'unavailable' };
  }
  async list(_page: PageOptions) {
    // The simulated public catalog is not an eligibility authority. No real positive decision is possible yet.
    return { items: [] as EligibleCareCapability[], nextBefore: null };
  }
  async authorizedCapabilities(_identity: { id: string; userType: string }): Promise<string[]> { return []; }
}
