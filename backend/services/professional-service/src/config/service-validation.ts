import { invalid, integer, object, objectId, text } from './validation';
import { CAPABILITY_KINDS } from './catalog';
import { SERVICE_DURATIONS } from '../models/professional-service.model';
import { JsonObject } from './validation';

export const SERVICE_FIELDS = ['capabilityId', 'category', 'name', 'description', 'priceEur', 'durationMinutes', 'bufferBeforeMinutes', 'bufferAfterMinutes'] as const;
export const SERVICE_MUTABLE_FIELDS = ['name', 'description', 'priceEur', 'durationMinutes', 'bufferBeforeMinutes', 'bufferAfterMinutes'] as const;
export function validateService(body: unknown, partial = false): JsonObject {
  const data = object(body, partial ? SERVICE_MUTABLE_FIELDS : SERVICE_FIELDS);
  if (!Object.keys(data).length) invalid('At least one supported field is required');
  if (!partial && !('capabilityId' in data)) invalid('capabilityId is required');
  if (!partial && !('category' in data)) invalid('category is required');
  if ('capabilityId' in data) data.capabilityId = objectId(data.capabilityId);
  if ('category' in data && (typeof data.category !== 'string' || !CAPABILITY_KINDS.includes(data.category as typeof CAPABILITY_KINDS[number]))) invalid('Invalid service category');
  if ('name' in data) data.name = text(data.name, 2, 120); else if (!partial) invalid('name is required');
  if ('description' in data) data.description = text(data.description, 2, 1000); else if (!partial) invalid('description is required');
  if ('priceEur' in data) {
    if (typeof data.priceEur !== 'number' || !Number.isFinite(data.priceEur) || data.priceEur < 0 || data.priceEur > 1000) invalid('priceEur must be between 0 and 1000');
    data.priceEur = Math.round(data.priceEur * 100) / 100;
  } else if (!partial) invalid('priceEur is required');
  if ('durationMinutes' in data) data.durationMinutes = integer(data.durationMinutes, 30, 90), SERVICE_DURATIONS.includes(data.durationMinutes as typeof SERVICE_DURATIONS[number]) || invalid('Invalid service duration');
  else if (!partial) invalid('durationMinutes is required');
  for (const key of ['bufferBeforeMinutes', 'bufferAfterMinutes']) {
    if (key in data) data[key] = integer(data[key], 0, 120);
    else if (!partial) invalid(`${key} is required`);
  }
  return data;
}
