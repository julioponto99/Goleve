import { ApiError } from './errors';

export interface CreatePaymentInput { priceReference: string; amountCents: number; serviceReference: string }
export function validateCreate(body: unknown): CreatePaymentInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'VALIDATION_ERROR', 'A JSON object is required');
  const data = body as Record<string, unknown>;
  if (Object.keys(data).some((key) => !['priceReference', 'amountCents', 'serviceReference'].includes(key))) throw new ApiError(400, 'VALIDATION_ERROR', 'Unexpected fields');
  if (typeof data.priceReference !== 'string' || !/^[a-z0-9._-]{1,80}$/.test(data.priceReference)
    || typeof data.serviceReference !== 'string' || !/^[a-z0-9._-]{1,120}$/.test(data.serviceReference)
    || typeof data.amountCents !== 'number' || !Number.isSafeInteger(data.amountCents) || data.amountCents < 1 || data.amountCents > 100000000) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid payment details');
  }
  return { priceReference: data.priceReference, amountCents: data.amountCents, serviceReference: data.serviceReference };
}
export function pagination(query: unknown): { limit: number; before?: string } {
  const data = (query && typeof query === 'object' && !Array.isArray(query)) ? query as Record<string, unknown> : {};
  const limit = data.limit === undefined ? 20 : Number(data.limit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new ApiError(400, 'VALIDATION_ERROR', 'limit must be between 1 and 100');
  if (data.before !== undefined && (typeof data.before !== 'string' || !/^[a-f0-9]{24}$/i.test(data.before))) throw new ApiError(400, 'INVALID_ID', 'Invalid pagination cursor');
  return { limit, ...(data.before ? { before: data.before } : {}) };
}
