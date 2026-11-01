import { enumeration, object, objectId } from './validation';
import { pageOptions, PageOptions } from './http';
import { RELATIONSHIP_KINDS, RELATIONSHIP_STATES, RelationshipKind, RelationshipState } from '../models/care-relationship.model';
export interface RelationshipInput { professionalId: string; capabilityId: string; relationshipKind: RelationshipKind }
export function validateRelationship(body: unknown): RelationshipInput {
  const data = object(body, ['professionalId', 'capabilityId', 'relationshipKind']);
  return { professionalId: objectId(data.professionalId), capabilityId: objectId(data.capabilityId),
    relationshipKind: enumeration(data.relationshipKind, RELATIONSHIP_KINDS) as RelationshipKind };
}
export function validateRelationshipCommand(body: unknown): void { object(body, []); }
export function relationshipPage(query: unknown): PageOptions & { status?: RelationshipState } {
  const data = object(query, ['limit', 'before', 'status']); const { status, ...page } = data;
  return { ...pageOptions(page), ...(status !== undefined ? { status: enumeration(status, RELATIONSHIP_STATES) as RelationshipState } : {}) };
}
