const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { once } = require('node:events');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const { createRequire } = require('node:module');
const path = require('node:path');
const { createCoachModels, initializeModels } = require('../dist/models');
const { createApp } = require('../dist/app');
const { UnavailableProvider } = require('../dist/providers/provider');
const { createEncryption } = require('../dist/config/encryption');
const { CoachService } = require('../dist/services/coach.service');
const { DomainClient } = require('../dist/services/domain-client');
const { openDatabase } = require('../dist/config/database');

describe('AI Coach: isolated Mongo replica set, real Auth/domain APIs/Gateway and test-only model', { skip: !process.env.AI_TEST_MONGO_URI }, () => {
  const seed = randomBytes(8).toString('hex'), root = new URL(process.env.AI_TEST_MONGO_URI);
  assert(['127.0.0.1', 'localhost'].includes(root.hostname)); assert.equal(root.searchParams.get('replicaSet'), 'coach57');
  const uri = suffix => { const u = new URL(root); u.pathname = '/goleve_ai_test_' + seed + '_' + suffix; return u.toString(); };
  const servers = [], connections = [], tokens = new Map(), key = randomBytes(32);
  let clock = Date.now(), models, connection, settings, base, direct, disabled, unavailable, authModel, service;
  const domains = {};
  const provider = { name: 'test-only-synthetic', model: 'fixture-v1', calls: [], handler: null, async generate(input) { this.calls.push(input); return this.handler ? this.handler(input) : { reply: 'Synthetic wellbeing guidance', recommendations: [{ category: 'consistency', text: 'Synthetic reminder to plan an activity' }], proposals: [] }; } };
  async function listen(app) { const s = app.listen(0, '127.0.0.1'); servers.push(s); await once(s, 'listening'); return 'http://127.0.0.1:' + s.address().port; }
  async function request(path, { actor, method = 'GET', body, headers = {}, at = base, token, signal } = {}) {
    const r = await fetch(at + path, { method, headers: { ...(actor ? { Authorization: 'Bearer ' + tokens.get(actor) } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers }, body: body === undefined ? undefined : JSON.stringify(body), signal: signal || AbortSignal.timeout(25000) });
    return { status: r.status, body: await r.json(), headers: r.headers };
  }
  const post = (actor, path, body, options = {}) => request(path, { actor, method: 'POST', body, headers: { 'Idempotency-Key': randomUUID(), ...(options.headers || {}) }, ...options });
  async function actor() { const id = new mongoose.Types.ObjectId().toHexString(); await authModel.create({ _id: id, name: 'Synthetic Coach User', email: id + '@example.invalid', passwordHash: 'synthetic-unused-hash-not-a-login-credential', userType: 'utilizador' }); tokens.set(id, require('../../auth-service/dist/config/token').signAccessToken(id)); return id; }
  async function world() {
    clock = Date.now(); provider.handler = null; provider.calls.length = 0;
    const owner = await actor(), other = await actor();
    for (const id of [owner, other]) {
      const p = await request('/users/me', { at: domains.user, actor: id, method: 'PUT', body: { displayName: 'Synthetic display name' }, headers: { 'If-None-Match': '*' } }); assert.equal(p.status, 201, JSON.stringify(p.body));
    }
    return { owner, other };
  }
  async function conversation(w, overrides = {}, at = base) {
    const r = await post(w.owner, '/ai-coach/conversations', { purpose: 'organisation', timezone: 'UTC', categories: [], allowedTools: [], ...overrides }, { at });
    assert.equal(r.status, 201, JSON.stringify(r.body)); return r.body.data;
  }
  const send = (w, c, options = {}) => post(w.owner, '/ai-coach/conversations/' + c.id + '/messages', { content: 'Synthetic request ' + randomUUID() }, options);
  const confirm = (w, p, options = {}) => post(w.owner, '/ai-coach/proposals/' + p.id + '/confirm', { confirm: true, version: p.version }, options);
  const future = () => { const start = new Date(Date.now() + 3 * 86400000); start.setUTCSeconds(0, 0); return { title: 'Synthetic personal activity', kind: 'personal', startAt: start.toISOString(), endAt: new Date(start.getTime() + 3600000).toISOString(), timezone: 'UTC' }; };
  function propose(tool, parameters) { provider.handler = () => ({ reply: 'Synthetic proposal awaiting confirmation', recommendations: [], proposals: [{ tool, parameters }] }); }
  async function proposal(w, tool, parameters, options = {}) { const c = await conversation(w, { allowedTools: [tool] }, options.at); propose(tool, parameters); const r = await send(w, c, options); assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.data.actionsExecuted, false); return { c, p: r.body.data.proposals[0] }; }
  function safe(r) { const s = JSON.stringify(r.body); for (const word of ['ownerId', 'authorization', 'passwordHash', 'ciphertext', 'authenticationTag', 'JWT_SECRET']) assert.equal(s.includes(word), false, word); assert.equal(r.headers.get('cache-control'), 'no-store'); }

  before(async () => {
    Object.assign(process.env, { NODE_ENV: 'test', GOLEVE_DEMO_MODE: 'disabled', OUTBOX_ENABLED: 'false', JWT_SECRET: randomBytes(48).toString('hex') });
    await mongoose.connect(uri('auth')); authModel = require('../../auth-service/dist/models/auth-user.model').AuthUser; await authModel.init();
    const authOrigin = await listen(require('../../auth-service/dist/app').createApp());
    async function domain(name) { const ownRequire = createRequire(path.resolve(__dirname, '../../' + name + '-service/package.json')); const c = await ownRequire('mongoose').createConnection(uri(name)).asPromise(); connections.push(c); const m = ownRequire('./dist/models'); const models = m[Object.keys(m).find(k => /^create.*Models$/.test(k))](c); await m.initializeModels(models); return { connection: c, models }; }
    const u = await domain('user'); domains.user = await listen(require('../../user-service/dist/app').createApp({ authServiceUrl: authOrigin, dataMode: 'synthetic', encryptionKey: randomBytes(32) }, u.connection, u.models));
    for (const name of ['training', 'hydration', 'performance']) { const d = await domain(name); domains[name] = await listen(await require('../../' + name + '-service/dist/server').createApp(authOrigin, d.connection, d.models)); }
    const a = await domain('agenda'); domains.agenda = await listen(require('../../agenda-service/dist/app').createApp(authOrigin, a.connection, a.models));
    connection = await openDatabase(uri('coach')); connections.push(connection); assert.equal((await connection.db.admin().command({ hello: 1 })).setName, 'coach57');
    models = createCoachModels(connection); await initializeModels(models);
    settings = { enabled: true, authOrigin, origins: domains, key, provider: new UnavailableProvider() };
    direct = await listen(createApp(settings, connection, models, { provider, now: () => new Date(clock) }));
    unavailable = await listen(createApp(settings, connection, models)); disabled = await listen(createApp({ ...settings, enabled: false }));
    service = new CoachService(connection, models, createEncryption(key), provider, new DomainClient(settings), () => new Date(clock));
    Object.assign(process.env, { AUTH_SERVICE_URL: authOrigin, USER_SERVICE_URL: domains.user, TRAINING_SERVICE_URL: domains.training, HYDRATION_SERVICE_URL: domains.hydration, PERFORMANCE_SERVICE_URL: domains.performance, AGENDA_SERVICE_URL: domains.agenda, AI_COACH_SERVICE_URL: direct });
    base = await listen(require('../../../api-gateway/dist/app').createApp());
  });
  after(async () => { for (const s of servers.reverse()) { const closed = new Promise(resolve => s.close(resolve)); s.closeAllConnections(); await closed; } await Promise.all(connections.map(c => c.close())); await mongoose.disconnect(); });

  test('health and default-disabled mode are explicit; independent domain APIs remain usable', async () => {
    const w = await world(); assert.equal((await request('/health', { at: direct })).status, 200); assert.equal((await request('/health', { at: disabled })).body.mode, 'disabled');
    assert.equal((await request('/ai-coach/conversations', { actor: w.owner, at: disabled })).status, 503);
    assert.equal((await post(w.owner, '/agenda/activities', future(), { at: domains.agenda })).status, 201);
  });
  test('real JWT required via Gateway and direct HTTP; incorrect audience/issuer/signature/expiry denied', async () => {
    const w = await world();
    for (const at of [base, direct]) { assert.equal((await request('/ai-coach/conversations', { at })).status, 401); assert.equal((await request('/ai-coach/conversations', { at, token: 'invalid.jwt' })).status, 401); }
    for (const patch of [{ audience: 'wrong-service' }, { issuer: 'untrusted' }, { expiresIn: -1 }, { algorithm: 'HS384' }]) { const token = jwt.sign({}, process.env.JWT_SECRET, { algorithm: 'HS256', issuer: 'goleve-auth', audience: 'goleve-api', subject: w.owner, expiresIn: 3600, ...patch }); assert.equal((await request('/ai-coach/conversations', { token })).status, 401); }
    const token = jwt.sign({}, randomBytes(32), { subject: w.owner, issuer: 'goleve-auth', audience: 'goleve-api', expiresIn: 3600 }); assert.equal((await request('/ai-coach/conversations', { token })).status, 401);
  });
  test('conversation creation is owned, bounded, idempotent and rejects unapproved context', async () => {
    const w = await world(), key = randomUUID(), input = { purpose: 'organisation', timezone: 'UTC', categories: [], allowedTools: [] };
    const a = await post(w.owner, '/ai-coach/conversations', input, { headers: { 'Idempotency-Key': key } }); assert.equal(a.status, 201);
    const b = await post(w.owner, '/ai-coach/conversations', input, { headers: { 'Idempotency-Key': key } }); assert.equal(b.status, 200); assert.equal(a.body.data.id, b.body.data.id);
    assert.equal((await post(w.owner, '/ai-coach/conversations', { ...input, purpose: 'training' }, { headers: { 'Idempotency-Key': key } })).status, 409);
    for (const patch of [{ categories: ['health'] }, { categories: ['selected_goals'] }, { ownerId: w.other }, { allowedTools: ['payment.create'] }, { purpose: 'diagnosis' }]) assert.equal((await post(w.owner, '/ai-coach/conversations', { ...input, ...patch })).status, 400);
    assert.equal((await request('/ai-coach/conversations', { actor: w.other })).body.data.items.length, 0);
  });
  test('messages persist encrypted, history paginates and a repeated message never regenerates', async () => {
    const w = await world(), c = await conversation(w), key = randomUUID(), path = '/ai-coach/conversations/' + c.id + '/messages';
    const content = 'SYNTHETIC-CONVERSATION-PRIVATE-CANARY';
    let r = await post(w.owner, path, { content }, { headers: { 'Idempotency-Key': key } }); assert.equal(r.status, 200); safe(r);
    assert.equal((await post(w.owner, path, { content }, { headers: { 'Idempotency-Key': key } })).body.data.replayed, true); assert.equal(provider.calls.length, 1);
    assert.equal((await post(w.owner, path, { content: 'Different synthetic message' }, { headers: { 'Idempotency-Key': key } })).status, 409);
    const raw = await models.Message.find({ conversationId: c.id }).lean(); assert.equal(raw.length, 2); assert.equal(JSON.stringify(raw).includes(content), false); assert.equal(JSON.stringify(await models.Audit.find({ conversationId: c.id }).lean()).includes(content), false);
    const h = await request(path + '?limit=1', { actor: w.owner }); assert.equal(h.body.data.items.length, 1); assert.ok(h.body.data.nextBefore);
    const next = await request(path + '?limit=1&before=' + h.body.data.nextBefore, { actor: w.owner }); assert.equal(next.body.data.items[0].content, content);
    assert.equal((await request('/ai-coach/conversations/' + c.id + '/recommendations', { actor: w.owner })).body.data.items.length, 1);
  });
  test('all conversation, message, proposal and deletion routes isolate users', async () => {
    const w = await world(), { c, p } = await proposal(w, 'agenda.create_activity', future());
    for (const suffix of ['messages', 'proposals', 'recommendations', 'actions']) assert.equal((await request('/ai-coach/conversations/' + c.id + '/' + suffix, { actor: w.other })).status, 404);
    assert.equal((await request('/ai-coach/conversations/' + c.id, { actor: w.other, method: 'DELETE' })).status, 404);
    assert.equal((await post(w.other, '/ai-coach/proposals/' + p.id + '/confirm', { confirm: true, version: 1 })).status, 404);
  });
  test('no provider gives explicit 503, no invented answer and no domain context reads', async () => {
    const w = await world(), c = await conversation(w, { categories: ['hydration'] });
    const r = await send(w, c, { at: unavailable }); assert.equal(r.status, 503); assert.equal(r.body.error.code, 'AI_PROVIDER_UNAVAILABLE');
    assert.equal(await models.Message.countDocuments({ conversationId: c.id, role: 'assistant' }), 0); assert.equal(await models.Audit.countDocuments({ conversationId: c.id, action: 'context.read' }), 0);
  });
  test('only selected context categories reach the model; tokens and identifiers never do', async () => {
    const w = await world(); await request('/users/me/preferences', { actor: w.owner, at: domains.user, method: 'PUT', body: { timeZone: 'Europe/Lisbon', locale: 'pt-PT' }, headers: { 'If-None-Match': '*' } });
    const c = await conversation(w, { categories: ['preferences', 'activity'] }), r = await send(w, c); assert.equal(r.status, 200, JSON.stringify(r.body));
    const sent = provider.calls[0]; assert.deepEqual(Object.keys(sent.context).sort(), ['activity', 'preferences']);
    const raw = JSON.stringify(sent); for (const value of [tokens.get(w.owner), w.owner, 'example.invalid', 'Synthetic display name']) assert.equal(raw.includes(value), false);
    const audits = await models.Audit.find({ conversationId: c.id, action: 'context.read', outcome: 'completed' }); assert.deepEqual(audits.map(a => a.service).sort(), ['performance', 'user']);
  });
  test('selected-goal scope requires an owned supported goal and never expands to foreign data', async () => {
    const w = await world(); const g = await post(w.other, '/users/me/goals', { goalType: 'daily_activity', title: 'Synthetic other goal', status: 'active', target: { metric: 'steps', value: 5000, unit: 'steps', period: 'day' } }, { at: domains.user }); assert.equal(g.status, 201);
    const c = await conversation(w, { categories: ['selected_goals'], selectedGoalIds: [g.body.data.id] }); const r = await send(w, c); assert.notEqual(r.status, 200); assert.equal(provider.calls.length, 0);
  });
  test('model cannot introduce arbitrary tools, URLs, identities or unauthorised actions', async () => {
    const w = await world(), c = await conversation(w);
    for (const p of [{ tool: 'http.request', parameters: { url: 'http://synthetic.invalid' } }, { tool: 'agenda.create_activity', parameters: future() }, { tool: 'agenda.create_activity', parameters: { ...future(), ownerId: w.other } }]) { provider.handler = () => ({ reply: 'Synthetic', recommendations: [], proposals: [p] }); assert.notEqual((await send(w, c)).status, 200); }
    assert.equal(await models.Proposal.countDocuments({ conversationId: c.id }), 0);
  });
  test('confirmation executes real personal Agenda once; replay and changed parameters cannot execute again', async () => {
    const w = await world(), { c, p } = await proposal(w, 'agenda.create_activity', future()), path = '/ai-coach/proposals/' + p.id + '/confirm', key = randomUUID();
    assert.equal((await post(w.owner, path, { confirm: false, version: 1 })).status, 400);
    assert.equal((await post(w.owner, path, { confirm: true, version: 1, parameters: future() })).status, 400);
    const r = await confirm(w, p, { headers: { 'Idempotency-Key': key } }); assert.equal(r.body.data.status, 'succeeded', JSON.stringify(r.body)); safe(r);
    assert.equal((await confirm(w, p, { headers: { 'Idempotency-Key': key } })).body.data.replayed, true);
    assert.equal((await confirm(w, p)).status, 409);
    const a = await request('/agenda/activities', { actor: w.owner, at: domains.agenda }); assert.equal(a.body.data.items.length, 1);
    const history = await request('/ai-coach/conversations/' + c.id + '/messages', { actor: w.owner }); assert.ok(history.body.data.items.some(m => m.role === 'action' && m.outcome === 'succeeded'));
  });
  test('concurrent confirmations produce exactly one domain creation', async () => {
    const w = await world(), { p } = await proposal(w, 'agenda.create_activity', future());
    const results = await Promise.all(Array.from({ length: 6 }, () => confirm(w, p))); assert.equal(results.filter(r => r.body.data?.status === 'succeeded').length, 1); assert.ok(results.every(r => r.status === 200 || r.status === 409));
    assert.equal((await request('/agenda/activities', { actor: w.owner, at: domains.agenda })).body.data.items.length, 1);
  });
  test('reject and expiry are terminal and never write to the domain', async () => {
    const w = await world(); let v = await proposal(w, 'agenda.create_activity', future());
    assert.equal((await post(w.owner, '/ai-coach/proposals/' + v.p.id + '/reject', { version: 1 })).body.data.status, 'rejected'); assert.equal((await confirm(w, v.p)).status, 409);
    v = await proposal(w, 'agenda.create_activity', future()); clock = Date.parse(v.p.expiresAt); assert.equal((await confirm(w, v.p)).body.error.code, 'PROPOSAL_EXPIRED');
    assert.equal((await request('/agenda/activities', { actor: w.owner, at: domains.agenda })).body.data.items.length, 0);
  });
  test('changing conversation permissions invalidates pending proposals and old versions', async () => {
    const w = await world(), { c, p } = await proposal(w, 'agenda.create_activity', future());
    const current = (await request('/ai-coach/conversations', { actor: w.owner })).body.data.items.find(i => i.id === c.id);
    const r = await request('/ai-coach/conversations/' + c.id + '/permissions', { actor: w.owner, method: 'PATCH', body: { categories: [], allowedTools: [], version: current.version } }); assert.equal(r.status, 200);
    assert.equal((await confirm(w, p)).status, 409); assert.equal((await request('/ai-coach/conversations/' + c.id + '/proposals', { actor: w.owner })).body.data.items[0].status, 'rejected');
  });
  test('hydration change uses real optimistic version and refuses a stale proposal', async () => {
    const w = await world(); assert.equal((await request('/hydration/goal', { actor: w.owner, at: domains.hydration, method: 'PUT', body: { targetMl: 1800, timezone: 'UTC' } })).status, 200);
    let v = await proposal(w, 'hydration.set_goal', { targetMl: 2000, timezone: 'UTC' }); assert.equal((await confirm(w, v.p)).body.data.status, 'succeeded');
    assert.equal((await request('/hydration/goal', { actor: w.owner, at: domains.hydration })).body.data.targetMl, 2000);
    v = await proposal(w, 'hydration.set_goal', { targetMl: 2200, timezone: 'UTC' }); await request('/hydration/goal', { actor: w.owner, at: domains.hydration, method: 'PUT', body: { targetMl: 2100, timezone: 'UTC' } });
    const r = await confirm(w, v.p); assert.equal(r.body.data.status, 'failed'); assert.equal(r.body.data.result.code, 'DOMAIN_VERSION_CHANGED');
  });
  test('training plan creation uses only accessible exercises and preserves foreign ownership', async () => {
    const w = await world(); const e = await post(w.owner, '/training/exercises', { name: 'Synthetic exercise', muscleGroup: 'legs', equipment: [], environments: ['home'], difficulty: 'beginner', type: 'strength', instructions: 'Synthetic test instructions' }, { at: domains.training }); assert.equal(e.status, 201);
    const parameters = { title: 'Synthetic autonomous plan', environment: 'home', goals: ['Synthetic consistency'], days: ['Monday'], exercises: [{ exerciseId: e.body.data.id, sets: 2, repetitions: 8 }] };
    const { p } = await proposal(w, 'training.create_plan', parameters); assert.equal((await confirm(w, p)).body.data.status, 'succeeded');
    assert.equal((await request('/training/plans', { actor: w.owner, at: domains.training })).body.data.items.length, 1);
    const c = await conversation({ owner: w.other }, { allowedTools: ['training.create_plan'] }); propose('training.create_plan', parameters); assert.notEqual((await send({ owner: w.other }, c)).status, 200);
  });
  test('activity objective is created only in the real User Service after confirmation', async () => {
    const w = await world(), { p } = await proposal(w, 'user.create_activity_goal', { title: 'Synthetic daily steps', metric: 'steps', value: 5000 });
    assert.equal((await confirm(w, p)).body.data.status, 'succeeded'); const result = await request('/users/me/goals', { actor: w.owner, at: domains.user }); assert.equal(result.body.data.items.length, 1); assert.equal(result.body.data.items[0].target.metric, 'steps');
  });
  test('real token is revalidated before action execution and revoked identity cannot execute', async () => {
    const w = await world(), { p } = await proposal(w, 'agenda.create_activity', future()); await authModel.deleteOne({ _id: w.owner });
    assert.equal((await confirm(w, p)).status, 401); assert.equal((await models.Proposal.findById(p.id)).status, 'pending');
  });
  test('simultaneous messages cannot generate conflicting turns', async () => {
    const w = await world(), c = await conversation(w); provider.handler = async () => { await new Promise(r => setTimeout(r, 100)); return { reply: 'Synthetic delayed response', recommendations: [], proposals: [] }; };
    const results = await Promise.all([send(w, c), send(w, c), send(w, c)]); assert.deepEqual(results.map(r => r.status).sort(), [200, 409, 409]); assert.equal(provider.calls.length, 1);
  });
  test('conversation deletion physically removes all content and retains only minimal audit', async () => {
    const w = await world(), { c } = await proposal(w, 'agenda.create_activity', future()); assert.equal((await request('/ai-coach/conversations/' + c.id, { actor: w.owner, method: 'DELETE' })).status, 200);
    assert.equal(await models.Conversation.countDocuments({ _id: c.id }), 0); assert.equal(await models.Message.countDocuments({ conversationId: c.id }), 0); assert.equal(await models.Proposal.countDocuments({ conversationId: c.id }), 0);
    const audits = await models.Audit.find({ conversationId: c.id }).lean(); assert.ok(audits.length); const raw = JSON.stringify(audits); for (const v of ['Synthetic proposal', 'content', 'ciphertext', tokens.get(w.owner)]) assert.equal(raw.includes(v), false);
  });
  test('seven-day retention physically purges content and thirty-day audit retention is effective', async () => {
    const w = await world(), { c } = await proposal(w, 'agenda.create_activity', future()); clock = Date.parse(c.expiresAt); await service.purgeExpired(w.owner);
    for (const model of [models.Conversation, models.Message, models.Proposal]) assert.equal(await model.countDocuments(model === models.Conversation ? { _id: c.id } : { conversationId: c.id }), 0);
    assert.ok(await models.Audit.countDocuments({ ownerId: w.owner })); clock += 31 * 86400000; await service.purgeExpired(w.owner); assert.equal(await models.Audit.countDocuments({ ownerId: w.owner }), 0);
  });
  test('audit failure rolls back message claim and prevents any model call', async () => {
    const w = await world(), c = await conversation(w), original = models.Audit.create; models.Audit.create = async () => { throw Error('Synthetic audit unavailable'); };
    try { assert.equal((await send(w, c)).status, 500); assert.equal(provider.calls.length, 0); assert.equal(await models.Message.countDocuments({ conversationId: c.id }), 0); } finally { models.Audit.create = original; }
  });
  test('ambiguous transport after real domain commit never repeats and can reconcile by owned resource', async () => {
    const w = await world(); let writes = 0, resourceId;
    const app = express(); app.use(express.json()); app.all('/agenda/*', async (req, res) => {
      const r = await fetch(domains.agenda + req.originalUrl, { method: req.method, headers: { Authorization: req.get('authorization'), 'Content-Type': 'application/json' }, body: req.method === 'GET' ? undefined : JSON.stringify(req.body) }); const body = await r.json();
      if (req.method === 'POST') { writes++; resourceId = body.data.activity.id; req.socket.destroy(); } else res.status(r.status).json(body);
    });
    const fault = await listen(app), coach = await listen(createApp({ ...settings, origins: { ...domains, agenda: fault } }, connection, models, { provider, now: () => new Date(clock) }));
    const { c, p } = await proposal(w, 'agenda.create_activity', future(), { at: coach }), key = randomUUID();
    let r = await confirm(w, p, { at: coach, headers: { 'Idempotency-Key': key } }); assert.equal(r.body.data.status, 'unknown'); assert.equal(writes, 1);
    r = await confirm(w, p, { at: coach, headers: { 'Idempotency-Key': key } }); assert.equal(r.body.data.status, 'unknown'); assert.equal(writes, 1);
    assert.equal((await confirm(w, p, { at: coach })).status, 409);
    const resolved = await post(w.owner, '/ai-coach/proposals/' + p.id + '/reconcile', { version: r.body.data.version, resourceId }, { at: coach }); assert.equal(resolved.status, 200); assert.equal(resolved.body.data.status, 'reconciled'); assert.equal(resolved.body.data.result.causalExecutionProven, false); assert.equal(writes, 1);
    assert.equal((await request('/ai-coach/conversations/' + c.id + '/actions', { actor: w.owner, at: coach })).body.data.items[0].status, 'reconciled');
  });
  test('revoked context is not reused from older assistant or user messages', async () => {
    const w = await world(); await request('/hydration/goal', { actor: w.owner, at: domains.hydration, method: 'PUT', body: { targetMl: 1800, timezone: 'UTC' } });
    const c = await conversation(w, { categories: ['hydration'] }); provider.handler = () => ({ reply: 'SYNTHETIC-OLD-CONTEXT-CANARY', recommendations: [], proposals: [] }); assert.equal((await send(w, c)).status, 200);
    const current = (await request('/ai-coach/conversations', { actor: w.owner })).body.data.items[0];
    assert.equal((await request('/ai-coach/conversations/' + c.id + '/permissions', { actor: w.owner, method: 'PATCH', body: { categories: [], allowedTools: [], version: current.version } })).status, 200);
    provider.handler = null; assert.equal((await send(w, c)).status, 200); const latest = provider.calls.at(-1); assert.deepEqual(latest.context, {}); assert.equal(JSON.stringify(latest.messages).includes('SYNTHETIC-OLD-CONTEXT-CANARY'), false);
  });
  test('context is bounded to eight previous messages and recommendation categories remain distinct from actions', async () => {
    const w = await world(), c = await conversation(w); provider.handler = () => ({ reply: 'Synthetic guidance', recommendations: ['training', 'hydration', 'goals', 'consistency', 'organisation'].map(category => ({ category, text: 'Synthetic ' + category + ' suggestion' })), proposals: [] });
    for (let i = 0; i < 6; i++) assert.equal((await send(w, c)).status, 200);
    assert.equal(provider.calls.at(-1).messages.length, 9); assert.equal((await request('/ai-coach/conversations/' + c.id + '/recommendations', { actor: w.owner })).body.data.items[0].recommendations.length, 5);
    assert.equal(await models.Proposal.countDocuments({ conversationId: c.id }), 0);
  });
  test('diagnostic model output fails closed without storing an assistant diagnosis', async () => {
    const w = await world(), c = await conversation(w); provider.handler = () => ({ reply: 'Diagnóstico: condição fictícia', recommendations: [], proposals: [] }); assert.notEqual((await send(w, c)).status, 200); assert.equal(await models.Message.countDocuments({ conversationId: c.id, role: 'assistant' }), 0);
  });
  test('permissions are checked again after the confirmation request has already authenticated', async () => {
    const w = await world(), { p } = await proposal(w, 'agenda.create_activity', future()), original = global.fetch; let verified = 0;
    try {
      global.fetch = async (url, options) => { const r = await original(url, options); if (String(url) === settings.authOrigin + '/auth/me' && ++verified === 1) await authModel.deleteOne({ _id: w.owner }); return r; };
      const r = await confirm(w, p); assert.equal(r.status, 200); assert.equal(r.body.data.status, 'failed'); assert.equal(r.body.data.result.code, 'INVALID_TOKEN'); assert.ok(verified >= 2);
    } finally { global.fetch = original; }
  });
  test('domain denial during execution is final and does not claim successful execution', async () => {
    const w = await world(), app = express(); let calls = 0; app.post('/agenda/activities', (_req, res) => { calls++; res.status(403).json({ error: { code: 'SYNTHETIC_DENIED' } }); });
    const fault = await listen(app), coach = await listen(createApp({ ...settings, origins: { ...domains, agenda: fault } }, connection, models, { provider, now: () => new Date(clock) }));
    const { p } = await proposal(w, 'agenda.create_activity', future(), { at: coach }); const r = await confirm(w, p, { at: coach }); assert.equal(r.body.data.status, 'failed'); assert.equal(calls, 1); assert.equal((await confirm(w, p, { at: coach })).status, 409);
  });
  test('timeout after a real write becomes unknown with no automatic retry', async () => {
    const w = await world(), app = express(); let writes = 0; app.use(express.json());
    app.post('/agenda/activities', async (req, _res) => { const r = await fetch(domains.agenda + '/agenda/activities', { method: 'POST', headers: { Authorization: req.get('authorization'), 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) }); await r.json(); writes++; });
    const fault = await listen(app), coach = await listen(createApp({ ...settings, origins: { ...domains, agenda: fault } }, connection, models, { provider, now: () => new Date(clock) }));
    const { p } = await proposal(w, 'agenda.create_activity', future(), { at: coach }), key = randomUUID();
    const r = await confirm(w, p, { at: coach, headers: { 'Idempotency-Key': key } }); assert.equal(r.body.data.status, 'unknown'); assert.equal(r.body.data.result.requiresReconciliation, true); assert.equal(writes, 1);
    assert.equal((await confirm(w, p, { at: coach, headers: { 'Idempotency-Key': key } })).body.data.status, 'unknown'); assert.equal(writes, 1);
  });
  test('a failed local audit after domain success cannot cause a second domain write', async () => {
    const w = await world(), { p } = await proposal(w, 'agenda.create_activity', future()), original = models.Audit.create;
    models.Audit.create = async function (docs, options) { if (docs.some(d => d.action === 'action.execute' && d.outcome === 'succeeded')) throw Error('Synthetic audit completion failure'); return original.call(this, docs, options); };
    try { assert.equal((await confirm(w, p)).status, 500); } finally { models.Audit.create = original; }
    assert.equal((await models.Proposal.findById(p.id)).status, 'unknown'); assert.equal((await confirm(w, p)).status, 409); assert.equal((await request('/agenda/activities', { actor: w.owner, at: domains.agenda })).body.data.items.length, 1);
  });
  test('mixed confirmed proposals retain per-action results without pretending a distributed rollback', async () => {
    const w = await world(); await request('/hydration/goal', { actor: w.owner, at: domains.hydration, method: 'PUT', body: { targetMl: 1800, timezone: 'UTC' } });
    const c = await conversation(w, { allowedTools: ['agenda.create_activity', 'hydration.set_goal'] }); provider.handler = () => ({ reply: 'Synthetic two proposals', recommendations: [], proposals: [{ tool: 'agenda.create_activity', parameters: future() }, { tool: 'hydration.set_goal', parameters: { targetMl: 2000, timezone: 'UTC' } }] });
    const r = await send(w, c); assert.equal(r.status, 200); const a = r.body.data.proposals.find(p => p.tool === 'agenda.create_activity'), h = r.body.data.proposals.find(p => p.tool === 'hydration.set_goal'); await request('/hydration/goal', { actor: w.owner, at: domains.hydration, method: 'PUT', body: { targetMl: 1900, timezone: 'UTC' } });
    const completed = await confirm(w, a); assert.equal(completed.body.data.status, 'succeeded', JSON.stringify(completed.body)); assert.equal((await confirm(w, h)).body.data.status, 'failed');
    const actions = await request('/ai-coach/conversations/' + c.id + '/actions', { actor: w.owner }); assert.deepEqual(actions.body.data.items.map(p => p.status).sort(), ['failed', 'succeeded']);
  });
  test('all approved context adapters use real APIs and minimise their DTOs', async () => {
    const w = await world();
    await request('/users/me/preferences', { actor: w.owner, at: domains.user, method: 'PUT', body: { timeZone: 'UTC', locale: 'pt-PT' }, headers: { 'If-None-Match': '*' } });
    const goal = await post(w.owner, '/users/me/goals', { goalType: 'daily_activity', title: 'SYNTHETIC-PRIVATE-GOAL-TITLE', status: 'active', target: { metric: 'steps', value: 5000, unit: 'steps', period: 'day' } }, { at: domains.user }); assert.equal(goal.status, 201);
    await request('/hydration/goal', { actor: w.owner, at: domains.hydration, method: 'PUT', body: { targetMl: 1800, timezone: 'UTC' } });
    await post(w.owner, '/hydration/intakes', { amountMl: 250, timezone: 'UTC', consumedAt: new Date().toISOString(), idempotencyKey: randomUUID() }, { at: domains.hydration });
    await post(w.owner, '/agenda/activities', { ...future(), title: 'SYNTHETIC-PRIVATE-AGENDA-TITLE' }, { at: domains.agenda });
    const categories = ['preferences', 'selected_goals', 'training', 'hydration', 'activity', 'agenda'];
    const c = await conversation(w, { categories, selectedGoalIds: [goal.body.data.id] }); const r = await send(w, c); assert.equal(r.status, 200, JSON.stringify(r.body));
    const context = provider.calls[0].context; assert.deepEqual(Object.keys(context).sort(), categories.sort()); assert.equal(context.hydration.consumedTodayMl, 250); assert.equal(context.selected_goals.goals[0].target.value, 5000);
    const data = JSON.stringify(context); for (const forbidden of ['SYNTHETIC-PRIVATE-GOAL-TITLE', 'SYNTHETIC-PRIVATE-AGENDA-TITLE', w.owner, 'ownerId', 'authUserId', 'email']) assert.equal(data.includes(forbidden), false);
  });
  test('confirmed Agenda actions preserve non-blocking overlap warnings', async () => {
    const w = await world(), parameters = future(); assert.equal((await post(w.owner, '/agenda/activities', parameters, { at: domains.agenda })).status, 201);
    const { p } = await proposal(w, 'agenda.create_activity', parameters); const r = await confirm(w, p); assert.equal(r.body.data.status, 'succeeded'); assert.equal(r.body.data.result.overlapWarning, true); assert.equal(r.body.data.result.overlapCount, 1);
  });
});
