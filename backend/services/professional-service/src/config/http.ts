import { ApiError } from './errors';
import { invalid, object, objectId } from './validation';
export function entityTag(id: string, version: number): string { return '"' + id + ':' + version + '"'; }
export function expectedVersion(header: string | undefined, id: string): number {
  if (!header) throw new ApiError(428, 'PRECONDITION_REQUIRED', 'If-Match is required for updates');
  const match = /^"([a-f0-9]{24}):([1-9]\d*)"$/.exec(header);
  if (!match || match[1] !== id || !Number.isSafeInteger(Number(match[2]))) throw new ApiError(412, 'VERSION_CONFLICT', 'Resource version does not match');
  return Number(match[2]);
}
export function requireCreate(header: string | undefined): void {
  if (header !== '*') throw new ApiError(428, 'PRECONDITION_REQUIRED', 'If-None-Match: * is required for creation');
}
export function idempotencyKey(header?: string): string {
  if (!header || !/^[A-Za-z0-9._-]{1,128}$/.test(header)) invalid('A valid Idempotency-Key is required');
  return header;
}
export interface PageOptions { limit: number; before?: string }
export function pageOptions(query: unknown): PageOptions {
  const input = object(query, ['limit', 'before']); let limit = 20;
  if (input.limit !== undefined) {
    if (typeof input.limit !== 'string' || !/^[1-9]\d*$/.test(input.limit) || Number(input.limit) > 100) invalid('limit must be between 1 and 100');
    limit = Number(input.limit);
  }
  return { limit, ...(input.before !== undefined ? { before: objectId(input.before) } : {}) };
}
