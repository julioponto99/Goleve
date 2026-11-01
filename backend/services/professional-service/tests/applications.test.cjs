const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { validateSubmission, validateReview, applicationPage } = require('../dist/config/application-validation');
const { requireReviewer } = require('../dist/services/application.service');
const { loadSettings } = require('../dist/config/settings');

test('review configuration is disabled by default, strict, bounded and never echoes reviewer values', () => {
  const keys = ['AUTH_SERVICE_URL', 'PROFESSIONAL_DATA_MODE', 'PROFESSIONAL_REVIEW_MODE', 'PROFESSIONAL_REVIEWER_IDS'];
  const old = { ...process.env }, id = '507f1f77bcf86cd799439011';
  try {
    process.env.AUTH_SERVICE_URL = 'http://127.0.0.1:3001'; process.env.PROFESSIONAL_DATA_MODE = 'synthetic';
    delete process.env.PROFESSIONAL_REVIEW_MODE; delete process.env.PROFESSIONAL_REVIEWER_IDS;
    assert.equal(loadSettings().reviewMode, 'disabled'); assert.deepEqual(loadSettings().reviewerIds, []);
    process.env.PROFESSIONAL_REVIEW_MODE = 'synthetic'; assert.throws(loadSettings);
    process.env.PROFESSIONAL_REVIEWER_IDS = id; assert.deepEqual(loadSettings().reviewerIds, [id]);
    for (const value of ['SYNTHETIC_PRIVATE_INVALID_ID', id + ',', id + ',' + id, '*']) {
      process.env.PROFESSIONAL_REVIEWER_IDS = value;
      assert.throws(loadSettings, (error) => !error.message.includes(value));
    }
    process.env.PROFESSIONAL_REVIEWER_IDS = id; process.env.PROFESSIONAL_DATA_MODE = 'disabled'; assert.throws(loadSettings);
  } finally { for (const key of keys) { if (old[key] === undefined) delete process.env[key]; else process.env[key] = old[key]; } }
});
test('review authorization requires every condition and rejects malformed injected settings', () => {
  const id = '507f1f77bcf86cd799439011', ctx = { identity: { id, userType: 'administrador' }, requestId: 'synthetic' };
  const settings = { authServiceUrl: 'http://localhost:3001', dataMode: 'synthetic', reviewMode: 'synthetic', reviewerIds: [id] };
  requireReviewer(ctx, settings);
  for (const patch of [{ reviewMode: 'disabled' }, { reviewerIds: [] }, { reviewerIds: ['*'] }, { reviewerIds: [id, id] }, { dataMode: 'disabled' }]) assert.throws(() => requireReviewer(ctx, { ...settings, ...patch }), { statusCode: 403 });
  for (const userType of ['utilizador', 'profissional', 'gestor']) assert.throws(() => requireReviewer({ ...ctx, identity: { id, userType } }, settings), { statusCode: 403 });
});
test('submission, reasons, public opt-in and queue filters use strict allowlists', () => {
  assert.deepEqual(validateSubmission({}), { publicationRequested: false, publicQualificationIds: [] });
  for (const body of [{ userType: 'administrador' }, { status: 'approved' }, { publicationRequested: 'true' }, { publicQualificationIds: ['507f1f77bcf86cd799439011'] }]) assert.throws(() => validateSubmission(body), { statusCode: 400 });
  for (const action of ['reject', 'suspend']) for (const body of [{}, { reason: '' }, { reason: '<script>' }, { reason: 'x'.repeat(501) }, { reason: 'Synthetic', actorId: 'fake' }]) assert.throws(() => validateReview(action, body), { statusCode: 400 });
  assert.throws(() => validateReview('approve', {}), { statusCode: 400 });
  assert.deepEqual(applicationPage({}), { limit: 20, status: 'pending' });
  for (const query of [{ status: 'verified' }, { status: { $ne: '' } }, { authUserId: 'other' }]) assert.throws(() => applicationPage(query), { statusCode: 400 });
});

describe('simulated applications through Gateway, Management, Professional, mock Auth and isolated MongoDB', { skip: !process.env.TEST_MONGO_URI }, () => {
  const secret = 'synthetic-phase2-jwt-signing-key', roles = new Map();
  const actors = Object.fromEntries(['a', 'b', 'reviewer', 'manager', 'excludedAdmin', 'selfReviewer'].map((key) => [key, new mongoose.Types.ObjectId().toHexString()]));
  for (const [key, id] of Object.entries(actors)) roles.set(id, ['reviewer', 'excludedAdmin', 'selfReviewer'].includes(key) ? 'administrador' : key === 'manager' ? 'gestor' : 'utilizador');
  const sign = (id, options = {}) => jwt.sign({ sub: id }, secret, { issuer: 'goleve-auth', audience: 'goleve-api', expiresIn: '1h', ...options });
  const uri = new URL(process.env.TEST_MONGO_URI); uri.pathname = '/goleve_professional_phase2_' + randomUUID().replaceAll('-', '');
  let connection, models, authServer, professionalServer, managementServer, gatewayServer, professionalApp, managementApp;
  let authUrl, professionalUrl, managementUrl, gatewayUrl, authCalls = 0, authUnavailable = false;
  let candidateA, applicationA, candidateB, applicationB;
  const settings = { dataMode: 'synthetic', reviewMode: 'synthetic', reviewerIds: [actors.reviewer, actors.manager, actors.selfReviewer] };
  async function listen(app, port = 0) { const server = app.listen(port, '127.0.0.1'); await once(server, 'listening'); return server; }
  async function close(server) { if (!server?.listening) return; const done = new Promise((resolve) => server.close(resolve)); server.closeAllConnections(); await done; }
  async function request(path, { actor, method = 'GET', body, headers = {}, base = gatewayUrl, token } = {}) {
    const response = await fetch(base + path, { method, headers: { ...(actor ? { Authorization: 'Bearer ' + sign(actors[actor]) } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
    return { status: response.status, body: await response.json(), tag: response.headers.get('etag'), headers: response.headers };
  }
  const own = (path, options = {}) => request(path, { actor: 'a', ...options });
  const admin = (path, options = {}) => request('/management/professional-applications' + path, { actor: 'reviewer', ...options });
  const command = (path, actor, body, tag, key, options = {}) => request(path, { actor, method: 'POST', body,
    headers: { 'If-Match': tag, 'Idempotency-Key': key }, ...options });
  const decision = (app, action, body, key, actor = 'reviewer') => command('/management/professional-applications/' + app.body.data.id + '/' + action, actor, body, app.tag, key);
  async function candidate(actor, kinds = ['personal_trainer']) {
    const profile = await request('/professionals/me', { actor, method: 'PUT', headers: { 'If-None-Match': '*' }, body: {
      professionalName: 'Synthetic candidate ' + actor, countryCode: 'PT', languages: ['pt-PT'], biography: 'Synthetic public biography',
      privateContactEmail: 'private-' + actor + '@example.invalid', publicContacts: { email: 'unverified-' + actor + '@example.invalid' } } });
    assert.equal(profile.status, 201);
    const capabilities = [], qualifications = [];
    for (const kind of kinds) {
      const capability = await request('/professionals/me/capabilities', { actor, method: 'POST', body: { kind, jurisdictionCountry: 'PT', serviceModes: ['online'] } });
      assert.equal(capability.status, 201); capabilities.push(capability.body.data);
      const qualification = await request('/professionals/me/qualifications', { actor, method: 'POST', headers: { 'Idempotency-Key': 'synthetic-' + kind },
        body: { capabilityId: capability.body.data.id, qualificationType: 'degree', title: 'Synthetic public qualification ' + kind,
          issuerName: 'SYNTHETIC_PRIVATE_ISSUER', awardedOn: '2020-01-01' } });
      assert.equal(qualification.status, 201); qualifications.push(qualification.body.data);
    }
    return { capabilities, qualifications };
  }
  async function submit(actor, data, key, publish = true) {
    const profile = await request('/professionals/me', { actor });
    return command('/professionals/me/submit', actor, { publicationRequested: publish,
      publicQualificationIds: publish ? data.qualifications.map((q) => q.id) : [] }, profile.tag, key);
  }
  before(async () => {
    const fakeAuth = express();
    fakeAuth.get('/auth/me', (req, res) => {
      authCalls++;
      if (authUnavailable) { res.status(503).json({ error: 'synthetic outage' }); return; }
      try {
        const token = (req.get('authorization') || '').replace(/^Bearer /i, '');
        const claims = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: 'goleve-auth', audience: 'goleve-api' });
        if (!claims.exp || !roles.has(claims.sub)) throw new Error('invalid identity');
        res.json({ user: { id: claims.sub, userType: roles.get(claims.sub), name: 'Synthetic ignored name', email: 'ignored@example.invalid' } });
      } catch { res.status(401).json({ error: 'Invalid token' }); }
    });
    authServer = await listen(fakeAuth); authUrl = 'http://127.0.0.1:' + authServer.address().port;
    connection = await require('../dist/config/database').openDatabase(uri.toString());
    const module = require('../dist/models'); models = module.createProfessionalModels(connection); await module.initializeModels(models);
    settings.authServiceUrl = authUrl;
    professionalApp = require('../dist/app').createApp(settings, connection, models); professionalServer = await listen(professionalApp);
    professionalUrl = 'http://127.0.0.1:' + professionalServer.address().port;
    process.env.PROFESSIONAL_SERVICE_URL = professionalUrl;
    managementApp = require('../../management-service/dist/app').createApp(); managementServer = await listen(managementApp);
    managementUrl = 'http://127.0.0.1:' + managementServer.address().port;
    process.env.MANAGEMENT_SERVICE_URL = managementUrl; process.env.AUTH_SERVICE_URL = authUrl;
    gatewayServer = await listen(require('../../../api-gateway/dist/app').createApp()); gatewayUrl = 'http://127.0.0.1:' + gatewayServer.address().port;
  });
  after(async () => { await close(gatewayServer); await close(managementServer); await close(professionalServer); await close(authServer); await connection?.close(); });

  test('public catalog is empty; private application and administrative endpoints reject missing/invalid JWT', async () => {
    const catalog = await request('/professionals/catalog'); assert.equal(catalog.status, 200); assert.deepEqual(catalog.body.data.items, []);
    for (const path of ['/professionals/me/application-status', '/management/professional-applications']) {
      assert.equal((await request(path)).status, 401);
      assert.equal((await request(path, { token: 'invalid.token.value' })).status, 401);
      assert.equal((await request(path, { token: sign(actors.reviewer, { expiresIn: -1 }) })).status, 401);
    }
    assert.equal((await request('/professional-applications', { base: professionalUrl })).status, 401);
  });
  test('administrative read access requires current role AND server authorization through every entry point', async () => {
    for (const actor of ['a', 'manager', 'excludedAdmin']) {
      assert.equal((await admin('', { actor })).status, 403);
      assert.equal((await request('/management/professional-applications', { actor, base: managementUrl })).status, 403);
      assert.equal((await request('/professional-applications', { actor, base: professionalUrl })).status, 403);
      assert.equal((await admin('/507f1f77bcf86cd799439011/approve', { actor, method: 'POST', body: { publish: true },
        headers: { 'If-Match': '"507f1f77bcf86cd799439011:1"', 'Idempotency-Key': 'unauthorized-approve' } })).status, 403);
    }
    const before = authCalls; assert.equal((await admin('')).status, 200); assert.ok(authCalls > before);
  });
  test('missing reviewer configuration, disabled mode and malformed injected configuration fail closed', async () => {
    for (const patch of [{ reviewMode: 'disabled' }, { reviewerIds: [] }, { reviewerIds: ['*'] }]) {
      const server = await listen(require('../dist/app').createApp({ ...settings, ...patch }, connection, models));
      try { assert.equal((await request('/professional-applications', { actor: 'reviewer', base: 'http://127.0.0.1:' + server.address().port })).status, 403); }
      finally { await close(server); }
    }
  });
  test('incomplete submission cannot create a pending application or implicitly create a profile', async () => {
    assert.equal((await own('/professionals/me/application-status')).status, 404);
    await request('/professionals/me', { actor: 'a', method: 'PUT', headers: { 'If-None-Match': '*' }, body: { professionalName: 'Synthetic incomplete', countryCode: 'PT', languages: ['pt-PT'] } });
    const profile = await own('/professionals/me');
    const result = await command('/professionals/me/submit', 'a', {}, profile.tag, 'incomplete');
    assert.equal(result.status, 400); assert.equal(result.body.error.code, 'APPLICATION_INCOMPLETE');
    assert.equal(await models.Application.countDocuments({}), 0);
    assert.equal((await own('/professionals/me/application-status')).body.data.status, 'draft');
  });
  test('submission freezes a complete dual-activity snapshot and is idempotent under concurrency', async () => {
    // Complete the existing fixture rather than deleting its profile.
    const current = await own('/professionals/me');
    await own('/professionals/me', { method: 'PATCH', headers: { 'If-Match': current.tag }, body: { professionalName: 'Synthetic candidate a', biography: 'Synthetic public biography', privateContactEmail: 'private-a@example.invalid' } });
    candidateA = { capabilities: [], qualifications: [] };
    for (const kind of ['personal_trainer', 'nutritionist']) {
      const c = await own('/professionals/me/capabilities', { method: 'POST', body: { kind, jurisdictionCountry: 'PT', serviceModes: ['online'] } }); candidateA.capabilities.push(c.body.data);
      const q = await own('/professionals/me/qualifications', { method: 'POST', headers: { 'Idempotency-Key': kind }, body: { capabilityId: c.body.data.id,
        qualificationType: 'degree', title: 'Synthetic public ' + kind, issuerName: 'SYNTHETIC_PRIVATE_ISSUER' } }); candidateA.qualifications.push(q.body.data);
    }
    const profile = await own('/professionals/me');
    const body = { publicationRequested: true, publicQualificationIds: candidateA.qualifications.map((q) => q.id) };
    const results = await Promise.all([command('/professionals/me/submit', 'a', body, profile.tag, 'submit-a'), command('/professionals/me/submit', 'a', body, profile.tag, 'submit-a')]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 201]); applicationA = results.find((r) => r.status === 201);
    assert.equal(applicationA.body.data.status, 'pending'); assert.equal(await models.Application.countDocuments({ authUserId: actors.a }), 1);
    const doc = await models.Application.findOne({ authUserId: actors.a }).select('+history +snapshot'); assert.equal(doc.history.length, 1); assert.equal(doc.snapshot.capabilities.length, 2);
    assert.equal((await own('/professionals/me')).body.data.applicationStatus, 'pending');
    assert.equal((await request('/professionals/catalog')).body.data.items.length, 0);
  });
  test('pending applications cannot be edited; drafts and snapshots never leak through another owner', async () => {
    const profile = await own('/professionals/me');
    assert.equal((await own('/professionals/me', { method: 'PATCH', headers: { 'If-Match': profile.tag }, body: { biography: 'Blocked' } })).status, 403);
    assert.equal((await own('/professionals/me/capabilities', { method: 'POST', body: { kind: 'personal_trainer', jurisdictionCountry: 'ES', serviceModes: ['online'] } })).status, 403);
    assert.equal((await request('/professionals/' + profile.body.data.id, { actor: 'b' })).status, 404);
    assert.equal((await request('/professionals/me/application-status', { actor: 'b' })).status, 404);
    assert.equal((await admin('/' + applicationA.body.data.id, { actor: 'b' })).status, 403);
  });
  test('authorized administration sees only submitted professional information, not contacts or private hours', async () => {
    const list = await admin(''); assert.equal(list.status, 200); assert.equal(list.body.data.items.length, 1);
    assert.equal('submittedData' in list.body.data.items[0], false);
    const detail = await admin('/' + applicationA.body.data.id); assert.equal(detail.status, 200);
    assert.equal(detail.body.data.submittedData.capabilities.length, 2);
    const data = JSON.stringify(detail.body);
    for (const marker of ['private-a@example.invalid', 'preferredWeekdays', 'reviewerIds', 'JWT_SECRET', 'commandKeyHash', 'commandFingerprint']) assert.equal(data.includes(marker), false);
    assert.equal((await admin('?status[$ne]=draft')).status, 400);
  });
  test('approval is authorized, atomic, idempotent and does not assign a professional Auth role', async () => {
    const results = await Promise.all([decision(applicationA, 'approve', { publish: true }, 'approve-a'), decision(applicationA, 'approve', { publish: true }, 'approve-a')]);
    assert.ok(results.every((r) => r.status === 200)); assert.equal(results.filter((r) => r.headers.get('idempotency-replayed') === 'true').length, 1);
    applicationA = results[0]; assert.equal(applicationA.body.data.status, 'approved'); assert.equal(applicationA.body.data.professionalPrivileges, false);
    assert.equal(roles.get(actors.a), 'utilizador');
    const history = await admin('/' + applicationA.body.data.id + '/history'); assert.equal(history.status, 200);
    assert.deepEqual(history.body.data.items.map((e) => e.action), ['submit', 'approve']);
    assert.equal(history.body.data.items[1].actorAuthUserId, actors.reviewer);
    assert.equal(JSON.stringify(history.body).includes('commandKeyHash'), false);
  });
  test('public directory exposes only approved opt-in summaries and no private qualification details or identities', async () => {
    const result = await request('/professionals/catalog'); assert.equal(result.status, 200); assert.equal(result.body.data.items.length, 1);
    const entry = result.body.data.items[0]; assert.equal(entry.professionalName, 'Synthetic candidate a'); assert.equal(entry.capabilities.length, 2); assert.equal(entry.qualifications.length, 2);
    for (const marker of ['authUserId', actors.a, actors.reviewer, 'issuerName', 'SYNTHETIC_PRIVATE_ISSUER', 'publicContacts', 'privateContactEmail', 'preferredWeekdays', 'history', 'reviewerIds']) assert.equal(JSON.stringify(result.body).includes(marker), false);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.equal(entry.approvalType, 'simulated');
  });
  test('suspension requires a reason and immediately removes a published application from new directory reads', async () => {
    assert.equal((await decision(applicationA, 'suspend', {}, 'no-reason')).status, 400);
    applicationA = await decision(applicationA, 'suspend', { reason: 'Synthetic simulation suspension' }, 'suspend-a');
    assert.equal(applicationA.status, 200); assert.equal(applicationA.body.data.status, 'suspended');
    assert.equal((await request('/professionals/catalog')).body.data.items.length, 0);
    const status = await own('/professionals/me/application-status'); assert.equal(status.body.data.lastDecision.reason, 'Synthetic simulation suspension');
    assert.equal((await decision(applicationA, 'approve', { publish: true }, 'resume-unsupported')).status, 409);
  });
  test('rejected candidates see the reason, reopen explicitly, edit and resubmit without losing decision history', async () => {
    candidateB = await candidate('b'); applicationB = await submit('b', candidateB, 'submit-b'); assert.equal(applicationB.status, 201);
    assert.equal((await decision(applicationB, 'reject', {}, 'bad-reject')).status, 400);
    applicationB = await decision(applicationB, 'reject', { reason: 'Synthetic incomplete supporting information' }, 'reject-b');
    assert.equal(applicationB.body.data.status, 'rejected');
    const ownStatus = await request('/professionals/me/application-status', { actor: 'b' }); assert.equal(ownStatus.body.data.lastDecision.reason, 'Synthetic incomplete supporting information');
    assert.equal((await submit('b', candidateB, 'resubmit-too-early')).status, 409);
    const reopened = await command('/professionals/me/reopen', 'b', {}, ownStatus.tag, 'reopen-b'); assert.equal(reopened.status, 200); assert.equal(reopened.body.data.status, 'draft');
    const profile = await request('/professionals/me', { actor: 'b' });
    assert.equal((await request('/professionals/me', { actor: 'b', method: 'PATCH', headers: { 'If-Match': profile.tag }, body: { biography: 'Synthetic corrected biography' } })).status, 200);
    applicationB = await submit('b', candidateB, 'submit-b-2'); assert.equal(applicationB.status, 201);
    const history = await admin('/' + applicationB.body.data.id + '/history');
    assert.deepEqual(history.body.data.items.map((e) => e.action), ['submit', 'reject', 'reopen', 'submit']);
  });
  test('competing decisions with different commands cannot overwrite each other', async () => {
    const results = await Promise.all([decision(applicationB, 'approve', { publish: true }, 'race-approve'), decision(applicationB, 'reject', { reason: 'Synthetic race rejection' }, 'race-reject')]);
    assert.equal(results.filter((r) => r.status === 200).length, 1); assert.ok(results.some((r) => [409, 412].includes(r.status)));
    const history = await admin('/' + applicationB.body.data.id + '/history'); assert.equal(history.body.data.items.length, 5);
    assert.equal(new Set(history.body.data.items.map((e) => e.version)).size, 5);
  });
  test('administrators cannot inspect or approve their own application, even if allowlisted', async () => {
    const ownCandidate = await candidate('selfReviewer'); const application = await submit('selfReviewer', ownCandidate, 'self-submit'); assert.equal(application.status, 201);
    for (const action of ['approve', 'reject', 'suspend']) assert.equal((await decision(application, action, action === 'approve' ? { publish: true } : { reason: 'Synthetic self attempt' }, 'self-' + action, 'selfReviewer')).status, 403);
    assert.equal((await admin('/' + application.body.data.id, { actor: 'selfReviewer' })).status, 403);
    const list = await admin('', { actor: 'selfReviewer' }); assert.ok(list.body.data.items.every((item) => item.id !== application.body.data.id));
  });
  test('current Auth role is rechecked on list, detail, history and every administrative command', async () => {
    const app = await models.Application.findOne({ authUserId: actors.selfReviewer });
    roles.set(actors.reviewer, 'gestor');
    try {
      for (const suffix of ['', '/' + app._id, '/' + app._id + '/history']) assert.equal((await admin(suffix)).status, 403);
      for (const action of ['approve', 'reject', 'suspend']) assert.equal((await admin('/' + app._id + '/' + action, { method: 'POST', body: {} })).status, 403);
      assert.equal((await admin('', { headers: { 'X-User-Role': 'administrador', 'X-User-Id': actors.selfReviewer } })).status, 403);
    } finally { roles.set(actors.reviewer, 'administrador'); }
  });
  test('candidate opt-in is required for publication even after authorized approval', async () => {
    const data = await candidate('excludedAdmin'), application = await submit('excludedAdmin', data, 'private-submit', false);
    assert.equal((await decision(application, 'approve', { publish: true }, 'forced-publish')).status, 400);
    const approved = await decision(application, 'approve', { publish: false }, 'private-approve'); assert.equal(approved.status, 200);
    const catalog = await request('/professionals/catalog'); assert.ok(catalog.body.data.items.every((item) => item.professionalName !== 'Synthetic candidate excludedAdmin'));
  });
  test('missing preconditions, reused command keys and forbidden state changes are rejected', async () => {
    const doc = await models.Application.findOne({ authUserId: actors.selfReviewer }); const id = doc._id.toHexString();
    assert.equal((await admin('/' + id + '/approve', { method: 'POST', body: { publish: true }, headers: { 'Idempotency-Key': 'missing-tag' } })).status, 428);
    assert.equal((await admin('/' + id + '/approve', { method: 'POST', body: { publish: true }, headers: { 'If-Match': '"' + id + ':999"', 'Idempotency-Key': 'stale-tag' } })).status, 412);
    assert.equal((await admin('/' + id + '/approve', { method: 'POST', body: { publish: true, userType: 'administrador' } })).status, 400);
    assert.equal((await command('/professionals/me/submit', 'a', {}, '"' + id + ':1"', 'submit-a')).status, 409);
    assert.equal((await own('/professionals/me/approve', { method: 'POST', body: {} })).status, 404);
  });
  test('audit unavailability prevents decisions; business history is atomic with the persisted state', async () => {
    const original = models.Audit.create, doc = await models.Application.findOne({ authUserId: actors.selfReviewer });
    models.Audit.create = async () => { throw new Error('SYNTHETIC_PRIVATE_AUDIT_ERROR'); };
    try {
      const result = await admin('/' + doc._id + '/approve', { method: 'POST', body: { publish: true }, headers: { 'If-Match': '"' + doc._id + ':' + doc.version + '"', 'Idempotency-Key': 'audit-failure' } });
      assert.equal(result.status, 503); assert.equal(JSON.stringify(result.body).includes('PRIVATE_AUDIT_ERROR'), false);
      const latest = await models.Application.findById(doc._id).select('+history'); assert.equal(latest.status, 'pending'); assert.equal(latest.history.length, 1);
    } finally { models.Audit.create = original; }
    const logs = await models.Audit.find().lean(); const serialized = JSON.stringify(logs);
    for (const marker of ['example.invalid', 'SYNTHETIC_PRIVATE_ISSUER', 'Synthetic corrected biography', 'reviewerIds', secret]) assert.equal(serialized.includes(marker), false);
  });
  test('draft mutation and submission are serialized; an old profile tag cannot freeze a stale qualification', async () => {
    const data = await candidate('manager'), profile = await request('/professionals/me', { actor: 'manager' });
    const qualification = await request('/professionals/me/qualifications/' + data.qualifications[0].id, { actor: 'manager' });
    const original = models.Qualification.findOneAndUpdate;
    let enter, release;
    const entered = new Promise((resolve) => { enter = resolve; });
    const paused = new Promise((resolve) => { release = resolve; });
    models.Qualification.findOneAndUpdate = async function (...args) { enter(); await paused; return original.apply(this, args); };
    let write, submission;
    try {
      write = request('/professionals/me/qualifications/' + data.qualifications[0].id, { actor: 'manager', method: 'PATCH',
        headers: { 'If-Match': qualification.tag }, body: { title: 'Synthetic latest qualification' } });
      await entered;
      submission = command('/professionals/me/submit', 'manager', {}, profile.tag, 'concurrent-submit');
      release();
      assert.equal((await write).status, 200); assert.equal((await submission).status, 412);
    } finally { release(); models.Qualification.findOneAndUpdate = original; await Promise.allSettled([write, submission].filter(Boolean)); }
    const submitted = await submit('manager', data, 'fresh-submit', false); assert.equal(submitted.status, 201);
    const detail = await admin('/' + submitted.body.data.id); assert.equal(detail.body.data.submittedData.qualifications[0].title, 'Synthetic latest qualification');
  });
  test('an abandoned draft write lock never expires into an unsafe concurrent writer', async () => {
    // Only isolated fictional fixtures: no recovery command is exposed by the API.
    const owner = actors.manager;
    await models.Profile.updateOne({ authUserId: owner }, { $set: { draftWriteToken: 'synthetic-abandoned-operation' } });
    try {
      const result = await request('/professionals/me/submit', { actor: 'manager', method: 'POST', body: {}, headers: { 'Idempotency-Key': 'abandoned-lock' } });
      assert.equal(result.status, 409); assert.equal(result.body.error.code, 'APPLICATION_BUSY');
      assert.equal((await models.Profile.findOne({ authUserId: owner }).select('+draftWriteToken')).draftWriteToken, 'synthetic-abandoned-operation');
    } finally { await models.Profile.updateOne({ authUserId: owner }, { $unset: { draftWriteToken: '' } }); }
  });
  test('bounded history reserves capacity for suspension and never discards old decisions', async () => {
    const doc = await models.Application.findOne({ authUserId: actors.selfReviewer }).select('+history');
    const history = Array.from({ length: 49 }, (_, index) => ({ ...doc.history[0].toObject(), eventId: randomUUID(), version: index + 1,
      commandKeyHash: 'synthetic-key-' + index, commandFingerprint: 'synthetic-fingerprint-' + index }));
    await models.Application.updateOne({ _id: doc._id }, { $set: { version: 49, history } });
    const app = { tag: '"' + doc._id + ':49"', body: { data: { id: doc._id.toHexString() } } };
    assert.equal((await decision(app, 'approve', { publish: true }, 'history-full')).status, 409);
    // A pre-existing approved fixture with the reserved final slot can still be suspended.
    await models.Application.updateOne({ _id: doc._id }, { $set: { status: 'approved', publicationEnabled: true } });
    const suspended = await decision(app, 'suspend', { reason: 'Synthetic reserved suspension' }, 'reserved-suspension'); assert.equal(suspended.status, 200);
    const latest = await models.Application.findById(doc._id).select('+history'); assert.equal(latest.history.length, 50); assert.equal(latest.history[49].action, 'suspend');
  });
  test('MongoDB and Auth outages fail closed through both proxies and recover', async () => {
    authUnavailable = true;
    try { assert.equal((await admin('')).status, 503); assert.equal((await own('/professionals/me/application-status')).status, 503); }
    finally { authUnavailable = false; }
    await connection.close(); assert.equal((await admin('')).status, 503); assert.equal((await request('/professionals/catalog')).status, 503);
    await connection.openUri(uri.toString()); assert.equal((await admin('')).status, 200);
  });
  test('Management and Professional upstream failures return safe proxy errors without bypass', async () => {
    let port = managementServer.address().port; await close(managementServer);
    assert.equal((await admin('')).body.error.code, 'MANAGEMENT_SERVICE_UNAVAILABLE');
    managementServer = await listen(managementApp, port);
    port = professionalServer.address().port; await close(professionalServer);
    assert.equal((await admin('')).body.error.code, 'PROFESSIONAL_SERVICE_UNAVAILABLE');
    professionalServer = await listen(professionalApp, port); assert.equal((await admin('')).status, 200);
  });
});
