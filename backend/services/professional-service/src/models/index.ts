import { Connection } from 'mongoose';
import { profileSchema } from './professional-profile.model';
import { capabilitySchema } from './professional-capability.model';
import { qualificationSchema } from './professional-qualification.model';
import { auditSchema } from './audit-access.model';
import { availabilitySchema } from './availability-declaration.model';
import { applicationSchema } from './professional-application.model';
import { relationshipSchema } from './care-relationship.model';
export function createProfessionalModels(connection: Connection) {
  return { Profile: connection.model('ProfessionalProfile', profileSchema),
    Capability: connection.model('ProfessionalCapability', capabilitySchema),
    Qualification: connection.model('ProfessionalQualification', qualificationSchema),
    Audit: connection.model('ProfessionalAuditAccessRecord', auditSchema),
    Availability: connection.model('ProfessionalAvailabilityDeclaration', availabilitySchema),
    Application: connection.model('ProfessionalApplication', applicationSchema),
    Relationship: connection.model('CareRelationship', relationshipSchema) };
}
export type ProfessionalModels = ReturnType<typeof createProfessionalModels>;
export async function initializeModels(models: ProfessionalModels): Promise<void> {
  await Promise.all(Object.values(models).map((model) => model.init()));
}
