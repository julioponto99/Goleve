const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');

describe('Care relationships with isolated MongoDB, Gateway and simulated Auth/eligibility', { skip: !process.env.TEST_MONGO_URI }, () => {
  const id = () => new mongoose.Types.ObjectId().toHexString(), roles = new Map();
  const newActor = (role = 'utilizador') => { const value = id(); roles.set(value, role); return value; };
  const pt = newActor('profissional'), nutrition = newActor('profissional'), dual = newActor('profissional'), otherPt = newActor('profissional');
  const outsider = newActor(), admin = newActor('administrador'), manager = newActor('gestor');
  const target = (owner, kind, profile = id()) => ({ professionalId: profile, capabilityId: id(), professionalAuthUserId: owner,
    relationshipKind: kind, professionalName: 'Synthetic professional', privateContactEmail: 'private@example.invalid', measurements: 'SYNTHETIC_PRIVATE_DATA' });
  const ptTarget = target(pt, 'personal_training'), ptAlternate = target(pt, 'personal_training', ptTarget.professionalId);
  const nutritionTarget = target(nutrition, 'nutrition'), dualPt = target(dual, 'personal_training'), dualNutrition = target(dual, 'nutrition', dualPt.professionalId);
  const otherTarget = target(otherPt, 'personal_training');
  const targets = new Map([ptTarget, ptAlternate, nutritionTarget, dualPt, dualNutrition, otherTarget].map((t) => [t.capabilityId, t]));
  const eligibilityStates = new Map(); let eligibilityFailure = false, authFailure = false, onCheck;
  let currentTime = Date.now(), authCalls = 0;
  const secret = 'synthetic-care-jwt-key-not-a-real-secret';
  const token = (actor, options = {}) => jwt.sign({ sub: actor }, secret, { issuer: 'goleve-auth', audience: 'goleve-api', expiresIn: '1h', ...options });
  const eligible = (t) => (eligibilityStates.get(t.capabilityId) || 'eligible') === 'eligible' && roles.get(t.professionalAuthUserId) === 'profissional';
  const provider = {
    async check(professionalId, capabilityId) {
      if (eligibilityFailure) throw new Error('SYNTHETIC_PRIVATE_ELIGIBILITY_FAILURE');
      if (onCheck) { const callback = onCheck; onCheck = undefined; callback(); }
      const t = targets.get(capabilityId);
      if (!t || t.professionalId !== professionalId || !eligible(t)) return { status: 'ineligible' };
      return { status: 'eligible', capability: { ...t } };
    },
    async list(page) {
      if (eligibilityFailure) throw new Error('Synthetic outage');
      const rows = [...targets.values()].filter(eligible).filter((t) => !page.before || t.capabilityId < page.before).sort((a, b) => b.capabilityId.localeCompare(a.capabilityId));
      const selected = rows.slice(0, page.limit);
      return { items: selected, nextBefore: rows.length > page.limit ? selected.at(-1).capabilityId : null };
    },
    async authorizedCapabilities(identity) {
      if (eligibilityFailure) throw new Error('Synthetic outage');
      return [...targets.values()].filter((t) => t.professionalAuthUserId === identity.id && eligible(t)).map((t) => t.capabilityId);
    },
  };
  const uri = new URL(process.env.TEST_MONGO_URI); uri.pathname = '/goleve_care_test_' + randomUUID().replaceAll('-', '');
  let connection, models, authServer, professionalServer, gatewayServer, authUrl, professionalUrl, gatewayUrl;
  const settings = { dataMode: 'synthetic', reviewMode: 'disabled', reviewerIds: [], careInvitationTtlDays: 7 };
  async function listen(app) { const server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); return server; }
  async function close(server) { if (!server?.listening) return; const done = new Promise((resolve) => server.close(resolve)); server.closeAllConnections(); await done; }
  async function request(path, { actor, method = 'GET', body, headers = {}, base = gatewayUrl, authorization } = {}) {
    const response = await fetch(base + path, { method, headers: { ...(actor ? { Authorization: 'Bearer ' + token(actor) } : {}),
      ...(authorization ? { Authorization: authorization } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
    return { status: response.status, body: await response.json(), tag: response.headers.get('etag'), headers: response.headers };
  }
  const input = (t) => ({ professionalId: t.professionalId, capabilityId: t.capabilityId, relationshipKind: t.relationshipKind });
  const create = (subject, t = ptTarget, key = randomUUID(), options = {}) => request('/care-relationships', { actor: subject, method: 'POST',
    body: input(t), headers: { 'Idempotency-Key': key }, ...options });
  async function fresh(t = ptTarget, subject = newActor()) {
    const result = await create(subject, t); assert.equal(result.status, 201, JSON.stringify(result.body)); return { result, subject, target: t };
  }
  const act = (fixture, action, actor, key = randomUUID(), tag = fixture.result.tag) => request('/care-relationships/' + fixture.result.body.data.id + '/' + action,
    { actor, method: 'POST', body: {}, headers: { 'If-Match': tag, 'Idempotency-Key': key } });
  const read = (fixture, actor = fixture.subject, suffix = '') => request('/care-relationships/' + fixture.result.body.data.id + suffix, { actor });
  function minimal(result) {
    const data = JSON.stringify(result.body);
    for (const value of ['subjectAuthUserId', 'professionalAuthUserId', 'professionalId', 'capabilityId', 'actorAuthUserId', 'creationKeyHash', 'creationFingerprint',
      'commandKeyHash', 'commandFingerprint', 'password', 'accessToken', 'example.invalid', 'SYNTHETIC_PRIVATE', 'weight', 'measurements', 'goals']) assert.equal(data.includes(value), false, value);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.equal(result.headers.get('x-professional-data-mode'), 'synthetic');
  }
  before(async () => {
    const auth = express(); auth.get('/auth/me', (req, res) => {
      authCalls++;
      if (authFailure) { res.status(503).end(); return; }
      try {
        const value = jwt.verify((req.get('authorization') || '').replace(/^Bearer /i, ''), secret, { algorithms: ['HS256'], issuer: 'goleve-auth', audience: 'goleve-api' });
        if (!value.exp || !roles.has(value.sub)) throw new Error('Unknown synthetic actor');
        res.json({ user: { id: value.sub, userType: roles.get(value.sub) } });
      } catch { res.status(401).json({ error: 'Invalid synthetic token' }); }
    });
    authServer = await listen(auth); authUrl = 'http://127.0.0.1:' + authServer.address().port;
    connection = await require('../dist/config/database').openDatabase(uri.toString());
    const module = require('../dist/models'); models = module.createProfessionalModels(connection); await module.initializeModels(models);
    settings.authServiceUrl = authUrl;
    professionalServer = await listen(require('../dist/app').createApp(settings, connection, models, { eligibility: provider, now: () => new Date(currentTime) }));
    professionalUrl = 'http://127.0.0.1:' + professionalServer.address().port;
    process.env.PROFESSIONAL_SERVICE_URL = professionalUrl; process.env.AUTH_SERVICE_URL = authUrl;
    gatewayServer = await listen(require('../../../api-gateway/dist/app').createApp()); gatewayUrl = 'http://127.0.0.1:' + gatewayServer.address().port;
  });
  after(async () => { await close(gatewayServer); await close(professionalServer); await close(authServer); await connection?.close(); });

  test('all new endpoints authenticate through Gateway and directly, without exposing data', async () => {
    for (const [method, path] of [['POST', '/care-relationships'], ['GET', '/care-relationships/me'], ['GET', '/professionals/me/care-relationships'],
      ['GET', '/professionals/eligible-capabilities'], ['GET', '/care-relationships/' + id()], ['POST', '/care-relationships/' + id() + '/accept']]) {
      for (const base of [gatewayUrl, professionalUrl]) assert.equal((await request(path, { method, base })).status, 401);
    }
    for (const authorization of ['Bearer invalid.token.value', 'Bearer ' + token(outsider, { expiresIn: -1 }), 'Bearer ' + token(outsider, { audience: 'synthetic-wrong-audience' })]) {
      assert.equal((await request('/care-relationships/me', { authorization })).status, 401);
    }
  });
  test('default runtime never treats simulated approval as eligibility and does not enable administrative review', async () => {
    const server = await listen(require('../dist/app').createApp(settings, connection, models)); const base = 'http://127.0.0.1:' + server.address().port;
    try {
      const listed = await request('/professionals/eligible-capabilities', { actor: outsider, base }); assert.equal(listed.status, 200); assert.deepEqual(listed.body.data.items, []);
      assert.equal((await create(outsider, ptTarget, randomUUID(), { base })).status, 404);
      assert.equal((await request('/professional-applications', { actor: admin, base })).status, 403);
      assert.equal((await request('/professionals/me/care-relationships', { actor: pt, base })).body.data.items.length, 0);
    } finally { await close(server); }
    for (const model of [models.Profile, models.Capability, models.Qualification, models.Application]) assert.equal(await model.countDocuments({}), 0);
  });
  test('eligible listing exposes only approved capability identifiers and selected public fields from the authority', async () => {
    const result = await request('/professionals/eligible-capabilities?limit=1', { actor: outsider }); assert.equal(result.status, 200);
    assert.equal(result.body.data.items.length, 1); assert.ok(result.body.data.nextBefore);
    const entry = result.body.data.items[0]; assert.deepEqual(Object.keys(entry).sort(), ['capabilityId', 'professionalId', 'professionalName', 'relationshipKind']);
    const next = await request('/professionals/eligible-capabilities?limit=1&before=' + result.body.data.nextBefore, { actor: outsider });
    assert.notEqual(next.body.data.items[0].capabilityId, entry.capabilityId);
    assert.equal(JSON.stringify(result.body).includes('SYNTHETIC_PRIVATE'), false);
  });
  test('creation binds the actual requester, stores expiry, and writes initial state/version/history in one document', async () => {
    const fixture = await fresh(); minimal(fixture.result);
    const data = fixture.result.body.data; assert.equal(data.status, 'pending'); assert.equal(data.version, 1); assert.equal(data.sensitiveDataAuthorized, false);
    assert.equal(new Date(data.expiresAt).getTime() - new Date(data.createdAt).getTime(), 7 * 86400000);
    const doc = await models.Relationship.findById(data.id).select('+history');
    assert.equal(doc.subjectAuthUserId, fixture.subject); assert.equal(doc.professionalAuthUserId, pt); assert.equal(doc.isOpen, true);
    assert.equal(doc.history.length, 1); assert.equal(doc.history[0].actorAuthUserId, fixture.subject);
  });
  test('nonexistent, suspended or unavailable professionals cannot receive requests', async () => {
    const subject = newActor();
    assert.equal((await create(subject, { ...ptTarget, professionalId: id() })).status, 404);
    eligibilityStates.set(ptTarget.capabilityId, 'suspended');
    try { assert.equal((await create(subject)).status, 404); } finally { eligibilityStates.delete(ptTarget.capabilityId); }
    eligibilityFailure = true;
    try { const result = await create(subject); assert.equal(result.status, 503); assert.equal(JSON.stringify(result.body).includes('PRIVATE'), false); }
    finally { eligibilityFailure = false; }
    assert.equal(await models.Relationship.countDocuments({ subjectAuthUserId: subject }), 0);
  });
  test('self-association, identity injection, mismatched activities and sensitive free text are rejected', async () => {
    assert.equal((await create(pt)).status, 403);
    const subject = newActor();
    for (const extra of [{ subjectAuthUserId: outsider }, { professionalAuthUserId: outsider }, { status: 'accepted' }, { scopes: ['health'] }, { notes: 'Synthetic diagnosis' }]) {
      assert.equal((await create(subject, ptTarget, randomUUID(), { body: { ...input(ptTarget), ...extra } })).status, 400);
    }
    assert.equal((await create(subject, ptTarget, randomUUID(), { body: { ...input(ptTarget), relationshipKind: 'nutrition' } })).status, 400);
    const actual = await create(subject, ptTarget, randomUUID(), { headers: { 'Idempotency-Key': randomUUID(), 'X-User-Id': outsider } });
    assert.equal(actual.status, 201); assert.equal((await models.Relationship.findById(actual.body.data.id)).subjectAuthUserId, subject);
  });
  test('simultaneous duplicate creation is idempotent with the same key and exclusive across different keys', async () => {
    let subject = newActor(); const key = randomUUID();
    let results = await Promise.all(Array.from({ length: 8 }, () => create(subject, ptTarget, key)));
    assert.deepEqual(results.map((r) => r.status).sort(), [...Array(7).fill(200), 201]); assert.equal(new Set(results.map((r) => r.body.data.id)).size, 1);
    assert.equal(await models.Relationship.countDocuments({ subjectAuthUserId: subject }), 1);
    subject = newActor(); results = await Promise.all([create(subject), create(subject, ptAlternate)]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    assert.equal(await models.Relationship.countDocuments({ subjectAuthUserId: subject, isOpen: true }), 1);
  });
  test('uniqueness spans jurisdictions of the same activity while allowing different professionals and PT/nutrition', async () => {
    const fixture = await fresh();
    assert.equal((await create(fixture.subject, ptAlternate)).status, 409);
    fixture.result = await act(fixture, 'accept', pt); assert.equal(fixture.result.status, 200);
    assert.equal((await create(fixture.subject)).status, 409);
    assert.equal((await create(fixture.subject, otherTarget)).status, 201);
    assert.equal((await create(fixture.subject, dualPt)).status, 201);
    assert.equal((await create(fixture.subject, dualNutrition)).status, 201);
  });
  test('only the targeted authorized professional can accept or reject, with role checked in Auth each time', async () => {
    let fixture = await fresh(); const before = authCalls;
    assert.equal((await act(fixture, 'accept', fixture.subject)).status, 403);
    for (const actor of [nutrition, outsider, admin, manager]) assert.equal((await act(fixture, 'accept', actor)).status, 404);
    const accepted = await act(fixture, 'accept', pt); assert.equal(accepted.status, 200); assert.equal(accepted.body.data.status, 'accepted'); minimal(accepted);
    assert.ok(authCalls > before);
    fixture = await fresh(nutritionTarget); const declined = await act(fixture, 'decline', nutrition); assert.equal(declined.status, 200); assert.equal(declined.body.data.status, 'declined');
    assert.equal((await act({ ...fixture, result: declined }, 'accept', nutrition)).status, 409);
  });
  test('only the requester can cancel a pending request; a replacement has a new ID and preserves the old history', async () => {
    const fixture = await fresh(); assert.equal((await act(fixture, 'cancel', pt)).status, 403);
    const cancelled = await act(fixture, 'cancel', fixture.subject); assert.equal(cancelled.status, 200); assert.equal(cancelled.body.data.status, 'cancelled');
    assert.equal((await act({ ...fixture, result: cancelled }, 'accept', pt)).status, 409);
    const replacement = await create(fixture.subject); assert.equal(replacement.status, 201); assert.notEqual(replacement.body.data.id, cancelled.body.data.id);
    const historical = await read(fixture, fixture.subject, '/history'); assert.deepEqual(historical.body.data.items.map((e) => e.action), ['created', 'cancel']);
  });
  test('either participant can end an accepted relationship; terminal records cannot be reopened', async () => {
    for (const endAsProfessional of [false, true]) {
      const fixture = await fresh(); assert.equal((await act(fixture, 'end', fixture.subject)).status, 409);
      fixture.result = await act(fixture, 'accept', pt);
      const ended = await act(fixture, 'end', endAsProfessional ? pt : fixture.subject); assert.equal(ended.status, 200); assert.equal(ended.body.data.status, 'ended');
      for (const action of ['accept', 'decline', 'cancel', 'end']) assert.equal((await act({ ...fixture, result: ended }, action, action === 'cancel' || action === 'end' ? fixture.subject : pt)).status, 409);
      assert.equal((await request('/care-relationships/' + ended.body.data.id + '/reopen', { actor: fixture.subject, method: 'POST', body: {} })).status, 404);
      assert.equal((await create(fixture.subject)).status, 201);
    }
  });
  test('ownership prevents reading, updating or expiring someone else\'s relationship, even for administrators', async () => {
    const fixture = await fresh();
    for (const actor of [outsider, admin, manager, nutrition]) {
      assert.equal((await read(fixture, actor)).status, 404); assert.equal((await read(fixture, actor, '/history')).status, 404);
      assert.equal((await act(fixture, 'cancel', actor)).status, 404);
      const own = await request('/care-relationships/me', { actor }); assert.ok(own.body.data.items.every((item) => item.id !== fixture.result.body.data.id));
    }
    assert.equal((await models.Relationship.findById(fixture.result.body.data.id)).version, 1);
  });
  test('inbox is restricted to current capabilities; lost eligibility keeps only participant metadata and termination', async () => {
    const ptFixture = await fresh(dualPt), nutritionFixture = await fresh(dualNutrition);
    ptFixture.result = await act(ptFixture, 'accept', dual);
    const before = await models.Relationship.findById(ptFixture.result.body.data.id).select('+history').lean();
    eligibilityStates.set(dualPt.capabilityId, 'revoked');
    try {
      const inbox = await request('/professionals/me/care-relationships', { actor: dual }); assert.equal(inbox.status, 200);
      assert.ok(inbox.body.data.items.some((row) => row.id === nutritionFixture.result.body.data.id));
      assert.ok(inbox.body.data.items.every((row) => row.id !== ptFixture.result.body.data.id));
      const metadata = await read(ptFixture, dual); assert.equal(metadata.status, 200); minimal(metadata);
      const unchanged = await models.Relationship.findById(ptFixture.result.body.data.id).select('+history').lean(); assert.deepEqual(unchanged.history, before.history);
      const otherSubject = newActor(); assert.equal((await create(otherSubject, dualPt)).status, 404);
      const ended = await act(ptFixture, 'end', dual); assert.equal(ended.status, 200); assert.equal(ended.body.data.status, 'ended'); ptFixture.result = ended;
    } finally { eligibilityStates.delete(dualPt.capabilityId); }
    assert.equal((await read(ptFixture, dual)).body.data.status, 'ended');
    assert.equal((await act(ptFixture, 'accept', dual)).status, 409);
  });
  test('suspension and a revoked Auth role block acceptance; recovery does not resurrect cancelled relationships', async () => {
    const fixture = await fresh();
    eligibilityStates.set(ptTarget.capabilityId, 'suspended');
    try { assert.equal((await act(fixture, 'accept', pt)).status, 404); minimal(await read(fixture, pt)); }
    finally { eligibilityStates.delete(ptTarget.capabilityId); }
    roles.set(pt, 'utilizador');
    try {
      assert.equal((await act(fixture, 'accept', pt)).status, 403);
      assert.equal((await request('/professionals/me/care-relationships', { actor: pt })).status, 403);
      minimal(await read(fixture, pt));
    } finally { roles.set(pt, 'profissional'); }
    const cancelled = await act(fixture, 'cancel', fixture.subject); assert.equal(cancelled.status, 200); fixture.result = cancelled;
    assert.equal((await act(fixture, 'accept', pt)).status, 409); assert.equal((await read(fixture)).body.data.status, 'cancelled');
  });
  test('unknown eligibility denies privileged operations but does not prevent participants ending an existing active relationship', async () => {
    const pending = await fresh(), active = await fresh(nutritionTarget); active.result = await act(active, 'accept', nutrition);
    eligibilityFailure = true;
    try {
      assert.equal((await act(pending, 'accept', pt)).status, 503);
      assert.equal((await request('/professionals/me/care-relationships', { actor: pt })).status, 503);
      assert.equal((await request('/professionals/eligible-capabilities', { actor: pending.subject })).status, 503);
      minimal(await read(active, nutrition)); assert.equal((await act(active, 'end', nutrition)).status, 200);
    } finally { eligibilityFailure = false; }
  });
  test('commands need a current resource ETag and reject new payloads or owner changes', async () => {
    const fixture = await fresh(), path = '/care-relationships/' + fixture.result.body.data.id + '/accept';
    assert.equal((await request(path, { actor: pt, method: 'POST', body: {}, headers: { 'Idempotency-Key': randomUUID() } })).status, 428);
    assert.equal((await request(path, { actor: pt, method: 'POST', body: { subjectAuthUserId: outsider }, headers: { 'Idempotency-Key': randomUUID(), 'If-Match': fixture.result.tag } })).status, 400);
    assert.equal((await act(fixture, 'accept', pt, randomUUID(), '"' + id() + ':1"')).status, 412);
    const key = randomUUID(); const accepted = await act(fixture, 'accept', pt, key); assert.equal(accepted.status, 200);
    assert.equal((await act({ ...fixture, result: accepted }, 'end', pt, key)).status, 409);
  });
  test('concurrent identical accept commands are idempotent and append exactly one event', async () => {
    const fixture = await fresh(), key = randomUUID();
    const results = await Promise.all([act(fixture, 'accept', pt, key), act(fixture, 'accept', pt, key)]);
    assert.ok(results.every((r) => r.status === 200)); assert.equal(results.filter((r) => r.headers.get('idempotency-replayed') === 'true').length, 1);
    const doc = await models.Relationship.findById(fixture.result.body.data.id).select('+history'); assert.equal(doc.version, 2); assert.equal(doc.history.length, 2);
  });
  test('competing acceptance/cancellation cannot both succeed and previous events are never replaced', async () => {
    const fixture = await fresh();
    const before = await models.Relationship.findById(fixture.result.body.data.id).select('+history').lean();
    const results = await Promise.all([act(fixture, 'accept', pt), act(fixture, 'cancel', fixture.subject)]);
    assert.equal(results.filter((r) => r.status === 200).length, 1); assert.ok(results.some((r) => [409, 412].includes(r.status)));
    const doc = await models.Relationship.findById(fixture.result.body.data.id).select('+history').lean();
    assert.equal(doc.version, 2); assert.equal(doc.history.length, 2); assert.deepEqual(doc.history[0], before.history[0]);
    assert.equal(new Date(doc.updatedAt).getTime(), new Date(doc.history[1].occurredAt).getTime());
  });
  test('expiry is passive, atomic under concurrent reads, historical and never accepts or rejects an expired request', async () => {
    const fixture = await fresh(); const deadline = new Date(fixture.result.body.data.expiresAt).getTime(); currentTime = deadline;
    assert.equal((await models.Relationship.findById(fixture.result.body.data.id)).status, 'pending');
    const results = await Promise.all(Array.from({ length: 6 }, () => read(fixture)));
    assert.ok(results.every((r) => r.status === 200 && r.body.data.status === 'expired' && r.body.data.version === 2));
    const doc = await models.Relationship.findById(fixture.result.body.data.id).select('+history'); assert.deepEqual(doc.history.map((e) => e.action), ['created', 'expire']); assert.equal(doc.isOpen, false);
    for (const action of ['accept', 'decline']) assert.equal((await act({ ...fixture, result: results[0] }, action, pt)).status, 409);
    const own = await request('/care-relationships/me?status=expired', { actor: fixture.subject }); assert.equal(own.body.data.items[0].status, 'expired');
    assert.equal(await models.Relationship.countDocuments({ _id: doc._id }), 1);
  });
  test('expiry during eligibility validation defeats a stale acceptance and records one expiration', async () => {
    const fixture = await fresh(); onCheck = () => { currentTime = new Date(fixture.result.body.data.expiresAt).getTime(); };
    const accepted = await act(fixture, 'accept', pt); assert.equal(accepted.status, 409); assert.equal(accepted.body.error.code, 'RELATIONSHIP_EXPIRED');
    const doc = await models.Relationship.findById(fixture.result.body.data.id).select('+history'); assert.equal(doc.status, 'expired'); assert.equal(doc.history.length, 2);
  });
  test('new requests expire the old open request before claiming uniqueness and keep retries tied to their original ID', async () => {
    const subject = newActor(), key = randomUUID(), old = await create(subject, ptTarget, key); assert.equal(old.status, 201);
    currentTime = new Date(old.body.data.expiresAt).getTime() + 1;
    const results = await Promise.all([create(subject, ptTarget, 'new-1'), create(subject, ptTarget, 'new-2')]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    const oldDoc = await models.Relationship.findById(old.body.data.id).select('+history'); assert.equal(oldDoc.status, 'expired'); assert.equal(oldDoc.history.length, 2);
    const retry = await create(subject, ptTarget, key); assert.equal(retry.status, 200); assert.equal(retry.body.data.id, old.body.data.id); assert.equal(retry.body.data.status, 'expired');
    assert.equal(await models.Relationship.countDocuments({ subjectAuthUserId: subject }), 2);
  });
  test('history limit denies a ninth transition including expiry without modifying the current state or old events', async () => {
    const fixture = await fresh();
    const original = await models.Relationship.findById(fixture.result.body.data.id).select('+history');
    const history = [original.history[0].toObject(), ...Array.from({ length: 7 }, (_, i) => ({ ...original.history[0].toObject(), eventId: randomUUID(), relationshipVersion: i + 2 }))];
    // Seed a boundary fixture by appending only; even test setup preserves the original event.
    await models.Relationship.updateOne({ _id: original._id }, { $set: { version: 8 }, $push: { history: { $each: history.slice(1) } } });
    const full = { ...fixture, result: { ...fixture.result, tag: '"' + original._id + ':8"' } };
    assert.equal((await act(full, 'accept', pt)).body.error.code, 'RELATIONSHIP_HISTORY_LIMIT');
    currentTime = original.expiresAt.getTime(); const expired = await read(fixture); assert.equal(expired.status, 409); assert.equal(expired.body.error.code, 'RELATIONSHIP_HISTORY_LIMIT');
    const latest = await models.Relationship.findById(original._id).select('+history'); assert.equal(latest.status, 'pending'); assert.equal(latest.version, 8);
    assert.deepEqual(latest.history.toObject(), history);
  });
  test('pagination never crosses participants and filters process pending expiry without deleting history', async () => {
    const subject = newActor(); await fresh(ptTarget, subject); await fresh(nutritionTarget, subject);
    const first = await request('/care-relationships/me?limit=1', { actor: subject }); assert.equal(first.body.data.items.length, 1); assert.ok(first.body.data.nextBefore); minimal(first);
    const next = await request('/care-relationships/me?limit=1&before=' + first.body.data.nextBefore, { actor: subject }); assert.notEqual(next.body.data.items[0].id, first.body.data.items[0].id);
    for (const query of ['subjectAuthUserId=' + outsider, 'limit=101', 'status[$ne]=ended', 'before[$gt]=0']) assert.equal((await request('/care-relationships/me?' + query, { actor: subject })).status, 400);
  });
  test('audit failure prevents creation or transitions and never leaks dependency errors', async () => {
    const fixture = await fresh(), subject = newActor(), original = models.Audit.create;
    models.Audit.create = async () => { throw new Error('SYNTHETIC_PRIVATE_AUDIT_ERROR'); };
    try {
      assert.equal((await create(subject)).status, 503); const result = await act(fixture, 'accept', pt); assert.equal(result.status, 503); assert.equal(JSON.stringify(result.body).includes('PRIVATE'), false);
      const current = await models.Relationship.findById(fixture.result.body.data.id).select('+history'); assert.equal(current.version, 1); assert.equal(current.history.length, 1);
      assert.equal(await models.Relationship.countDocuments({ subjectAuthUserId: subject }), 0);
    } finally { models.Audit.create = original; }
  });
  test('Auth or eligibility outage never authorizes privileged operations, and MongoDB outage returns 503', async () => {
    const fixture = await fresh(); authFailure = true;
    try { assert.equal((await read(fixture)).status, 503); assert.equal((await act(fixture, 'accept', pt)).status, 503); }
    finally { authFailure = false; }
    await connection.close(); assert.equal((await read(fixture)).status, 503); await connection.openUri(uri.toString()); assert.equal((await read(fixture)).status, 200);
  });
  test('sensitive data remains unauthorized after acceptance and no approved professional or Auth account was inserted', async () => {
    const fixture = await fresh(); const accepted = await act(fixture, 'accept', pt); assert.equal(accepted.body.data.sensitiveDataAuthorized, false); minimal(accepted);
    for (const suffix of ['/health', '/weight-history', '/measurements', '/goals', '/grants', '/ai-consents']) assert.equal((await request('/care-relationships/' + accepted.body.data.id + suffix, { actor: pt })).status, 404);
    for (const model of [models.Profile, models.Capability, models.Qualification, models.Application]) assert.equal(await model.countDocuments({}), 0);
    const audit = JSON.stringify(await models.Audit.find().lean());
    for (const value of ['Synthetic professional', 'example.invalid', 'SYNTHETIC_PRIVATE', secret]) assert.equal(audit.includes(value), false);
  });
});
