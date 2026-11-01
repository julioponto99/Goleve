import { RelationshipTransition } from '../models/care-relationship.model';
export function careRelationshipChanged(relationshipId: string, transition: RelationshipTransition) {
  return { eventId: transition.eventId, eventType: 'care.relationship.changed.v1' as const, schemaVersion: 1,
    aggregateId: relationshipId, aggregateVersion: transition.relationshipVersion,
    occurredAt: transition.occurredAt.toISOString(), producer: 'professional-service' as const, correlationId: transition.requestId,
    payload: { relationshipId, version: transition.relationshipVersion, status: transition.to } };
}
// Contract preparation only: no publisher, queue, outbox or delivery guarantee in phase 3.
