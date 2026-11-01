import { invalid, object, objectId, text } from './validation';
import { APPLICATION_STATES, ApplicationAction, ApplicationState } from '../models/professional-application.model';
import { pageOptions, PageOptions } from './http';
export interface SubmissionInput { publicationRequested: boolean; publicQualificationIds: string[] }
export function validateSubmission(body: unknown): SubmissionInput {
  const data = object(body, ['publicationRequested', 'publicQualificationIds']);
  if (data.publicationRequested !== undefined && typeof data.publicationRequested !== 'boolean') invalid('publicationRequested must be boolean');
  const publicationRequested = data.publicationRequested === true;
  const ids = data.publicQualificationIds === undefined ? [] : data.publicQualificationIds;
  if (!Array.isArray(ids) || ids.length > 20) invalid('At most twenty public qualification summaries are allowed');
  const publicQualificationIds = ids.map(objectId).sort();
  if (new Set(publicQualificationIds).size !== ids.length || (!publicationRequested && ids.length)) invalid('Invalid public qualification selection');
  return { publicationRequested, publicQualificationIds };
}
export function validateReview(action: ApplicationAction, body: unknown): { publish?: boolean; reason?: string } {
  if (action === 'approve') {
    const data = object(body, ['publish']);
    if (typeof data.publish !== 'boolean') invalid('publish must be explicitly selected');
    return { publish: data.publish };
  }
  if (action === 'reject' || action === 'suspend') {
    const data = object(body, ['reason']); return { reason: text(data.reason, 2, 500) };
  }
  object(body, []); return {};
}
export function applicationPage(query: unknown): PageOptions & { status: ApplicationState } {
  const data = object(query, ['limit', 'before', 'status']);
  const status = data.status === undefined ? 'pending' : data.status;
  if (typeof status !== 'string' || !APPLICATION_STATES.includes(status as ApplicationState)) invalid('Invalid application state');
  const { status: _status, ...page } = data;
  return { ...pageOptions(page), status: status as ApplicationState };
}
