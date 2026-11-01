// Local synthetic fixtures, not an approved legal/professional taxonomy.
export const CATALOG_VERSION = 'synthetic-v1';
export const CAPABILITY_KINDS = ['personal_trainer', 'nutritionist'] as const;
export type CapabilityKind = typeof CAPABILITY_KINDS[number];
export const SPECIALIZATIONS: Record<CapabilityKind, readonly string[]> = {
  personal_trainer: ['synthetic_pt_strength', 'synthetic_pt_mobility'],
  nutritionist: ['synthetic_nutrition_general', 'synthetic_nutrition_sport'],
};
export const SERVICE_MODES = ['online', 'in_person', 'home_visit'] as const;
export const QUALIFICATION_TYPES = ['degree', 'certification', 'continuing_education'] as const;
export function catalogDto() {
  return { version: CATALOG_VERSION, dataMode: 'synthetic', capabilities: CAPABILITY_KINDS.map((kind) => ({
    kind, specializations: [...SPECIALIZATIONS[kind]],
  })), serviceModes: [...SERVICE_MODES], qualificationTypes: [...QUALIFICATION_TYPES], grantsProfessionalPrivileges: false };
}
