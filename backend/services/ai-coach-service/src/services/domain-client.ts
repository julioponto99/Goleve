import { ApiError, fail } from '../config/errors';
import { CoachSettings, Domain } from '../config/settings';
import { RequestContext, verifyIdentity } from '../middlewares/auth.middleware';
import { Category } from '../models';
import { ToolParameters, ValidatedTool } from './tools';
import { identifier } from '../config/validation';
export class DomainError extends ApiError { constructor(readonly ambiguous: boolean, status: number, code: string) { super(status, code, ambiguous ? 'Action outcome is unknown; reconciliation is required' : 'Domain operation was refused or unavailable'); } }
export interface PreparedAction { action: ValidatedTool; expectedVersion?: number }
type Json = Record<string, any>;
export class DomainClient {
  constructor(private readonly settings: CoachSettings) {}
  private async request(ctx: RequestContext, domain: Domain, path: string, method = 'GET', body?: unknown): Promise<Json> {
    const origin = this.settings.origins[domain]; if (!origin) return fail(503, 'DOMAIN_CONTRACT_UNAVAILABLE', 'Required domain service is not configured');
    try {
      const response = await fetch(origin + path, { method, redirect: 'error', signal: ctx.signal ? AbortSignal.any([ctx.signal, AbortSignal.timeout(3000)]) : AbortSignal.timeout(3000), headers: { Authorization: ctx.authorization, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
      if (!response.ok) throw new DomainError(method !== 'GET' && response.status >= 500, response.status === 401 || response.status === 403 ? response.status : 409, 'DOMAIN_OPERATION_REFUSED');
      if (!response.body) throw new Error();
      const reader = response.body.getReader(), chunks: Uint8Array[] = []; let size = 0;
      try { for (;;) { const r = await reader.read(); if (r.done) break; size += r.value.length; if (size > 65536) throw new Error(); chunks.push(r.value); } } finally { await reader.cancel().catch(() => undefined); }
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!payload || typeof payload.data !== 'object' || !payload.data) throw new Error();
      return payload.data;
    } catch (error) { if (error instanceof DomainError) throw error; throw new DomainError(method !== 'GET', 503, 'DOMAIN_RESPONSE_UNAVAILABLE'); }
  }
  async context(ctx: RequestContext, category: Category, timezone: string, goalIds: string[], now: Date): Promise<unknown> {
    const from = new Date(now.getTime() - 7 * 86400000).toISOString(), to = now.toISOString();
    if (category === 'preferences') { const d = await this.request(ctx, 'user', '/users/me/preferences'); return { locale: d.locale, timeZone: d.timeZone }; }
    if (category === 'selected_goals') {
      const goals = [];
      for (const id of goalIds) { const d = await this.request(ctx, 'user', '/users/me/goals/' + identifier(id)); if (!['daily_activity', 'fitness', 'hydration'].includes(d.goalType)) return fail(403, 'CONTEXT_CATEGORY_FORBIDDEN', 'Selected goal is outside the allowed wellbeing categories'); goals.push({ goalType: d.goalType, status: d.status, target: d.target && { metric: d.target.metric, value: d.target.value, unit: d.target.unit, period: d.target.period } }); }
      return { goals };
    }
    if (category === 'training') {
      const d = await this.request(ctx, 'training', '/training/exercises?page=1&pageSize=20');
      const sessions = await this.request(ctx, 'training', '/training/sessions?page=1&pageSize=20');
      return { exercises: (d.items || []).map((e: Json) => ({ exerciseId: e.id, environments: e.environments, difficulty: e.difficulty, type: e.type, equipmentCount: Array.isArray(e.equipment) ? e.equipment.length : 0 })), recentSessionStates: (sessions.items || []).map((s: Json) => s.status), sampleLimit: 20 };
    }
    if (category === 'hydration') {
      const d = await this.request(ctx, 'hydration', '/hydration/goal');
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map(p => [p.type, p.value]));
      const daily = await this.request(ctx, 'hydration', '/hydration/intakes/daily?' + new URLSearchParams({ date: parts.year + '-' + parts.month + '-' + parts.day, timezone }));
      return { targetMl: d.targetMl, timezone, version: d.version, consumedTodayMl: daily.totalMl };
    }
    if (category === 'activity') { const d = await this.request(ctx, 'performance', '/performance/steps/summary?' + new URLSearchParams({ from, to })); return { total: d.total, days: d.days, averageDaily: d.averageDaily, intervalDays: 7 }; }
    const d = await this.request(ctx, 'agenda', '/agenda/activities?' + new URLSearchParams({ from: to, to: new Date(now.getTime() + 7 * 86400000).toISOString(), pageSize: '20' }));
    return { activities: (d.items || []).map((a: Json) => ({ kind: a.kind, environment: a.environment, startAt: a.startAt, endAt: a.endAt, status: a.status })), sampleLimit: 20, timezone };
  }
  async prepare(ctx: RequestContext, action: ValidatedTool): Promise<PreparedAction> {
    if (await verifyIdentity(this.settings.authOrigin, ctx.authorization, ctx.signal) !== ctx.ownerId) return fail(401, 'IDENTITY_CHANGED', 'Identity changed');
    if (action.tool === 'hydration.set_goal') { const d = await this.request(ctx, 'hydration', '/hydration/goal'); if (!Number.isSafeInteger(d.version) || d.version < 1) return fail(409, 'DOMAIN_CONTRACT_INCOMPATIBLE', 'An existing versioned hydration goal is required'); return { action, expectedVersion: d.version }; }
    if (action.tool === 'training.create_plan') for (const e of action.parameters.exercises) await this.request(ctx, 'training', '/training/exercises/' + identifier(e.exerciseId));
    if (action.tool === 'user.create_activity_goal') { const d = await this.request(ctx, 'user', '/users/me'); if (['restricted', 'deletion_pending'].includes(d.profileStatus)) return fail(403, 'PROFILE_RESTRICTED', 'Profile does not allow this operation'); }
    return { action };
  }
  async execute(ctx: RequestContext, prepared: PreparedAction, beforeWrite: () => Promise<void>): Promise<Record<string, unknown>> {
    if (await verifyIdentity(this.settings.authOrigin, ctx.authorization, ctx.signal) !== ctx.ownerId) return fail(401, 'IDENTITY_CHANGED', 'Identity changed');
    const a = prepared.action; let data: Json; let advisory: Record<string, unknown> = {};
    if (a.tool === 'hydration.set_goal') {
      const current = await this.request(ctx, 'hydration', '/hydration/goal');
      if (current.version !== prepared.expectedVersion) return fail(409, 'DOMAIN_VERSION_CHANGED', 'Hydration goal changed since the proposal; request a new proposal');
      await beforeWrite();
      data = await this.request(ctx, 'hydration', '/hydration/goal', 'PUT', { ...a.parameters, source: 'custom', version: prepared.expectedVersion });
    } else { await beforeWrite();
      if (a.tool === 'training.create_plan') data = await this.request(ctx, 'training', '/training/plans', 'POST', a.parameters);
      else if (a.tool === 'user.create_activity_goal') data = await this.request(ctx, 'user', '/users/me/goals', 'POST', this.activityGoal(a.parameters));
      else { const response = await this.request(ctx, 'agenda', '/agenda/activities', 'POST', { ...a.parameters, status: 'planned' }); data = response.activity; advisory = { overlapWarning: response.overlapWarning === true, overlapCount: Array.isArray(response.overlaps) ? response.overlaps.length : 0 }; }
    }
    if (!data || typeof data.id !== 'string' || !/^[a-f0-9]{24}$/.test(data.id)) throw new DomainError(true, 503, 'DOMAIN_RESULT_INVALID');
    return { resourceId: data.id, ...(Number.isSafeInteger(data.version) ? { version: data.version } : {}), ...advisory, outcome: 'succeeded' };
  }
  private activityGoal(p: ToolParameters['user.create_activity_goal']) { return { goalType: 'daily_activity', title: p.title, status: 'active', target: { metric: p.metric, value: p.value, unit: p.metric === 'steps' ? 'steps' : 'minutes', period: 'day' } }; }
  async reconcile(ctx: RequestContext, prepared: PreparedAction, resourceId: string): Promise<Record<string, unknown>> {
    const a = prepared.action; let d: Json, matches = false;
    if (a.tool === 'hydration.set_goal') { d = await this.request(ctx, 'hydration', '/hydration/goal'); matches = d.id === resourceId && d.targetMl === a.parameters.targetMl && d.timezone === a.parameters.timezone && d.version === (prepared.expectedVersion || 0) + 1; }
    else if (a.tool === 'training.create_plan') { d = await this.request(ctx, 'training', '/training/plans/' + resourceId); matches = d.title === a.parameters.title && d.environment === a.parameters.environment && JSON.stringify((d.exercises || []).map((e: Json) => ({ exerciseId: e.exerciseId, sets: e.sets, repetitions: e.repetitions }))) === JSON.stringify(a.parameters.exercises); }
    else if (a.tool === 'user.create_activity_goal') { d = await this.request(ctx, 'user', '/users/me/goals/' + resourceId); matches = d.goalType === 'daily_activity' && d.title === a.parameters.title && d.target?.metric === a.parameters.metric && d.target?.value === a.parameters.value; }
    else { d = await this.request(ctx, 'agenda', '/agenda/activities/' + resourceId); matches = d.title === a.parameters.title && d.startAt === a.parameters.startAt && d.endAt === a.parameters.endAt; }
    if (!matches) return fail(409, 'RECONCILIATION_UNRESOLVED', 'The selected resource does not establish a matching result');
    return { resourceId, outcome: 'matching_resource_found', evidence: 'owner_selected_domain_resource', causalExecutionProven: false };
  }
}
