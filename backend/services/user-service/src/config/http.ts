import { ApiError } from './errors';
import { invalid, JsonObject, object, objectId, instant, enumeration } from './validation';

export function entityTag(id: string, version: number): string { return '"' + id + ':' + version + '"'; }
export function expectedVersion(header: string | undefined, id: string): number {
  if (!header) throw new ApiError(428, 'PRECONDITION_REQUIRED', 'If-Match is required for updates');
  const match = /^"([a-f0-9]{24}):([1-9]\d*)"$/.exec(header);
  if (!match || match[1] !== id || !Number.isSafeInteger(Number(match[2]))) {
    throw new ApiError(412, 'VERSION_CONFLICT', 'Resource version does not match');
  }
  return Number(match[2]);
}
export function requireCreate(header: string | undefined): void {
  if (header !== '*') throw new ApiError(428, 'PRECONDITION_REQUIRED', 'If-None-Match: * is required for creation');
}
export function idempotencyKey(header: string | undefined): string {
  if (!header || !/^[A-Za-z0-9._-]{1,128}$/.test(header)) invalid('A valid Idempotency-Key is required');
  return header;
}

export interface PageOptions { limit: number; cursor?: { at: Date; id: string }; filter?: string }
export function pageOptions(query: unknown, owner: string, type: 'measurements' | 'goals', fixedFilter?: string): PageOptions {
  const filterKey = type === 'measurements' ? 'kind' : 'status';
  const input = object(query, ['limit', 'cursor', filterKey]);
  let limit = 20;
  if (input.limit !== undefined) {
    if (typeof input.limit !== 'string' || !/^[1-9]\d*$/.test(input.limit) || Number(input.limit) > 100) invalid('limit must be between 1 and 100');
    limit = Number(input.limit);
  }
  let filter = fixedFilter;
  if (input[filterKey] !== undefined) {
    const values = type === 'measurements'
      ? ['weight', 'height', 'waist', 'hip', 'chest', 'upper_arm', 'thigh', 'calf']
      : ['proposed', 'active', 'paused', 'achieved', 'archived'];
    const supplied = enumeration(input[filterKey], values);
    if (fixedFilter && supplied !== fixedFilter) invalid('Filter conflicts with this endpoint');
    filter = supplied;
  }
  let cursor: PageOptions['cursor'];
  if (input.cursor !== undefined) {
    if (typeof input.cursor !== 'string' || input.cursor.length > 1024 || !/^[A-Za-z0-9_-]+$/.test(input.cursor)) invalid('Invalid cursor');
    let data: JsonObject;
    try { data = object(JSON.parse(Buffer.from(input.cursor, 'base64url').toString('utf8')), ['owner', 'type', 'filter', 'at', 'id']); }
    catch { return invalid('Invalid cursor'); }
    if (data.owner !== owner || data.type !== type || data.filter !== (filter || null)) invalid('Cursor does not belong to this query');
    cursor = { at: instant(data.at), id: objectId(data.id) };
  }
  return { limit, filter, cursor };
}
export function nextCursor(owner: string, type: string, filter: string | undefined, at: Date, id: string): string {
  return Buffer.from(JSON.stringify({ owner, type, filter: filter || null, at: at.toISOString(), id })).toString('base64url');
}
