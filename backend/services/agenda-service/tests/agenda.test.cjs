const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { AgendaService } = require('../dist/services/agenda.service');
const { authenticate } = require('../dist/middlewares/auth.middleware');

const userA = '507f1f77bcf86cd799439011';
const userB = '507f1f77bcf86cd799439012';
let clock;
let model;
let service;

class Document {
  constructor(value) { Object.assign(this, value); }
  toObject() { return { ...this }; }
}

class Query {
  constructor(value) { this.value = value; }
  sort() { return this; }
  skip(value) { this.value = this.value.slice(value); return this; }
  limit(value) { this.value = this.value.slice(0, value); return this; }
  lean() { return this; }
  then(resolve, reject) { return Promise.resolve(this.value).then(resolve, reject); }
}

function matches(document, query) {
  return Object.entries(query).every(([key, condition]) => {
    const actual = document[key];
    if (key === '_id' && actual && typeof actual.toHexString === 'function') {
      if (condition && condition.$ne) return actual.toHexString() !== condition.$ne;
      return actual.toHexString() === condition;
    }
    if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
      return Object.entries(condition).every(([operator, expected]) => ({
        $lt: actual < expected, $lte: actual <= expected, $gt: actual > expected,
        $gte: actual >= expected, $ne: actual !== expected,
      }[operator]));
    }
    return actual === condition;
  });
}

function updateDocument(document, update) {
  Object.assign(document, update.$set || {});
  for (const [key, value] of Object.entries(update.$inc || {})) document[key] += value;
}

beforeEach(() => {
  clock = new Date('2026-11-01T12:00:00.000Z');
  let sequence = 1;
  const documents = [];
  model = {
    create: async (value) => {
      const id = (sequence++).toString(16).padStart(24, '0');
      const document = new Document({ ...value, _id: { toHexString: () => id }, version: value.version || 1 });
      documents.push(document);
      return document;
    },
    find: (query) => new Query(documents.filter((item) => matches(item, query))),
    findOne: async (query) => documents.find((item) => matches(item, query)) || null,
    findOneAndUpdate: async (query, update) => {
      const document = documents.find((item) => matches(item, query));
      if (!document) return null;
      updateDocument(document, update);
      return document;
    },
    countDocuments: async (query) => documents.filter((item) => matches(item, query)).length,
  };
  service = new AgendaService({ Activity: model }, () => clock);
});

const context = (id = userA) => ({ identity: { id, userType: 'utilizador' }, requestId: 'test-request' });
const iso = (hours) => new Date(clock.getTime() + hours * 3600000).toISOString();
const create = (overrides = {}, owner = userA) => service.create(context(owner), {
  title: 'Atividade de teste', kind: 'personal', startAt: iso(2), endAt: iso(3), timezone: 'Europe/Lisbon', ...overrides,
});

test('creates future personal and workout activities', async () => {
  const personal = await create();
  const workout = await create({ title: 'Treino', kind: 'workout', environment: 'home' });
  assert.equal(personal.activity.status, 'planned');
  assert.equal(workout.activity.environment, 'home');
  assert.equal(personal.activity.timezone, 'Europe/Lisbon');
});

test('allows retroactive completed activities and rejects unfinished completion', async () => {
  const retroactive = await create({ startAt: '2026-10-31T10:00:00.000Z', endAt: '2026-10-31T11:00:00.000Z', status: 'completed' });
  assert.equal(retroactive.activity.status, 'completed');
  await assert.rejects(() => create({ startAt: iso(-2), endAt: iso(-1) }), { code: 'PAST_ACTIVITY_MUST_BE_COMPLETED' });
  const future = await create();
  await assert.rejects(() => service.complete(context(), future.activity.id), { code: 'ACTIVITY_NOT_FINISHED' });
});

test('allows overlaps with warnings but not consecutive activities', async () => {
  await create({ startAt: iso(2), endAt: iso(4) });
  const overlap = await create({ startAt: iso(3), endAt: iso(5) });
  const consecutive = await create({ startAt: iso(5), endAt: iso(6) });
  assert.equal(overlap.overlapWarning, true);
  assert.equal(consecutive.overlapWarning, false);
});

test('edits only before start and keeps final states closed', async () => {
  const activity = await create();
  const edited = await service.update(context(), activity.activity.id, { title: 'Editada' });
  assert.equal(edited.activity.title, 'Editada');
  clock = new Date('2026-11-01T14:00:00.000Z');
  await assert.rejects(() => service.update(context(), activity.activity.id, { title: 'Tarde' }), { code: 'ACTIVITY_STARTED' });
  const cancelled = await service.cancel(context(), activity.activity.id);
  assert.equal(cancelled.status, 'cancelled');
  await assert.rejects(() => service.cancel(context(), activity.activity.id), { code: 'ACTIVITY_FINAL' });
  const completed = await create({ startAt: '2026-10-31T10:00:00.000Z', endAt: '2026-10-31T11:00:00.000Z', status: 'completed' });
  await assert.rejects(() => service.update(context(), completed.activity.id, { title: 'Reabrir' }), { code: 'ACTIVITY_FINAL' });
});

test('cancels planned activities and atomically resolves completion versus cancellation', async () => {
  const cancelled = await create();
  const result = await service.cancel(context(), cancelled.activity.id);
  assert.equal(result.status, 'cancelled');
  const concurrent = await create();
  clock = new Date('2026-11-01T16:00:00.000Z');
  const results = await Promise.allSettled([
    service.complete(context(), concurrent.activity.id),
    service.cancel(context(), concurrent.activity.id),
  ]);
  assert.equal(results.filter((item) => item.status === 'fulfilled').length, 1);
  assert.equal(results.filter((item) => item.status === 'rejected').length, 1);
});

test('validates timezones, isolates users, and paginates filters', async () => {
  await assert.rejects(() => create({ timezone: 'Not/A_Timezone' }), { code: 'INVALID_TIMEZONE' });
  await create({ title: 'Casa', kind: 'workout', environment: 'home' });
  await create({ title: 'Exterior', kind: 'workout', environment: 'outdoor', startAt: iso(4), endAt: iso(5) });
  await create({ title: 'Outro utilizador' }, userB);
  const page = await service.list(context(), { page: 1, pageSize: 1, kind: 'workout', environment: 'home' });
  assert.equal(page.total, 1);
  assert.equal(page.items[0].title, 'Casa');
  const own = await service.list(context(), { page: 1, pageSize: 20 });
  assert.equal(own.total, 2);
});

test('requires a valid JWT authorization header', async () => {
  const originalFetch = global.fetch;
  try {
    let called = false;
    global.fetch = async () => { called = true; return { ok: true, status: 200, json: async () => ({ user: { id: userA, userType: 'utilizador' } }) }; };
    const run = (authorization) => new Promise((resolve) => {
      const req = { get: (name) => name === 'authorization' ? authorization : undefined };
      const res = { locals: {} };
      authenticate('http://auth.test')(req, res, (error) => resolve({ error, res }));
    });
    const missing = await run(undefined);
    assert.equal(missing.error.code, 'AUTHENTICATION_REQUIRED');
    assert.equal(called, false);
    const valid = await run('Bearer fictitious-token');
    assert.equal(valid.error, undefined);
    assert.equal(valid.res.locals.context.identity.id, userA);
  } finally {
    global.fetch = originalFetch;
  }
});
