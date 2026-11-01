const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { once } = require('node:events');
const mongoose = require('mongoose');
const express = require('express');

describe('Isolated fictional demo: real Auth, User, Professional and Gateway', { skip: !process.env.TEST_MONGO_URI }, () => {
  const instanceId = randomBytes(8).toString('hex'), serviceKey = randomBytes(32), signingKey = randomBytes(48).toString('hex');
  const accounts = ['user_a', 'user_b', 'personal_trainer', 'nutritionist'].map((kind) => ({ kind,
    id: randomBytes(12).toString('hex'), name: 'Synthetic Demo ' + kind, email: kind + '-' + instanceId + '@example.invalid',
    password: randomBytes(32).toString('base64url'), userType: kind.startsWith('user_') ? 'utilizador' : 'profissional' }));
  const manifest = { instanceId, expiresAt: new Date(Date.now() + 3600000).toISOString(), accounts };
  const baseUri = new URL(process.env.TEST_MONGO_URI), uri = (suffix) => { const value = new URL(baseUri); value.pathname = '/goleve_demo_' + instanceId + '_' + suffix; return value.toString(); };
  const servers = [], connections = [], sessions = {}, targets = [], states = new Map();
  let base, authBase, authApp, models, identityClient, normalBase, prepare, settings, preparedSnapshot;
  async function listen(app) { const server = app.listen(0, '127.0.0.1'); servers.push(server); await once(server, 'listening'); return 'http://127.0.0.1:' + server.address().port; }
  async function request(endpoint, { actor, method = 'GET', body, headers = {}, origin = base, token } = {}) {
    const response = await fetch(origin + endpoint, { method, redirect: 'error', signal: AbortSignal.timeout(15000), headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(actor ? { Authorization: 'Bearer ' + sessions[actor].accessToken } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    const raw = await response.text(); let data; try { data = JSON.parse(raw); } catch { data = {}; }
    return { status: response.status, data, tag: response.headers.get('etag'), headers: response.headers };
  }
  const internal = (id, credential = serviceKey.toString('hex'), extra = {}) => request('/internal/demo/identity', { origin: authBase, method: 'POST', body: { id, ...extra },
    headers: credential === null ? {} : { 'x-goleve-demo-service': credential } });
  const input = (t = targets[0]) => ({ professionalId: t.professionalId, capabilityId: t.capabilityId, relationshipKind: t.relationshipKind });
  const create = (actor = 'user_a', t = targets[0]) => request('/care-relationships', { actor, method: 'POST', body: input(t), headers: { 'Idempotency-Key': randomUUID() } });
  const act = (relation, action, actor) => request('/care-relationships/' + relation.data.data.id + '/' + action,
    { actor, method: 'POST', body: {}, headers: { 'If-Match': relation.tag, 'Idempotency-Key': randomUUID() } });
  function privateResponse(result) {
    const text = JSON.stringify(result.data);
    for (const forbidden of ['password', 'passwordHash', 'demoInstanceId', 'example.invalid', 'privateContact', 'weight', 'measurements', 'goals', serviceKey.toString('hex'), signingKey]) assert.equal(text.includes(forbidden), false, 'Private data leaked');
  }
  const mockedEligibility = {
    async check(professionalId, capabilityId) {
      const t = targets.find((v) => v.professionalId === professionalId && v.capabilityId === capabilityId);
      if (!t || states.get(capabilityId) !== 'approved-in-test-only') return { status: 'ineligible' };
      const identity = await identityClient.read(t.professionalAuthUserId);
      return identity?.userType === 'profissional' ? { status: 'eligible', capability: t } : { status: 'ineligible' };
    },
    async list() { const items = []; for (const t of targets) if ((await this.check(t.professionalId, t.capabilityId)).status === 'eligible') items.push(t); return { items, nextBefore: null }; },
    async authorizedCapabilities(identity) { const list = await this.list(); return list.items.filter((t) => identity.userType === 'profissional' && t.professionalAuthUserId === identity.id).map((t) => t.capabilityId); },
  };
  before(async () => {
    const temp = path.resolve(__dirname, '../../.demo/test-' + instanceId); fs.mkdirSync(temp, { recursive: true });
    fs.writeFileSync(path.join(temp, 'service.key'), serviceKey.toString('hex'), { mode: 0o600 });
    fs.writeFileSync(path.join(temp, 'fixtures.json'), JSON.stringify(manifest), { mode: 0o600 });
    Object.assign(process.env, { NODE_ENV: 'test', GOLEVE_DEMO_MODE: 'isolated', DEMO_INSTANCE_ID: instanceId, JWT_SECRET: signingKey,
      MONGO_URI: uri('auth'), DEMO_SERVICE_KEY_FILE: path.join(temp, 'service.key'), DEMO_FIXTURES_FILE: path.join(temp, 'fixtures.json'), DEMO_PREPARE_ACK: 'create-new-fictional-identities' });
    prepare = require('../services/auth-service/dist/demo/prepare').prepareDemoIdentities;
    await prepare();
    preparedSnapshot = await require('../services/auth-service/dist/models/auth-user.model').AuthUser.find().select('+passwordHash +demoInstanceId').lean();
    authApp = require('../services/auth-service/dist/app').createApp(); authBase = await listen(authApp);
    const { DemoIdentityClient } = require('../services/professional-service/dist/demo/identity-client');
    identityClient = new DemoIdentityClient(authBase, { instanceId, serviceKey });
    const userConnection = await require('../services/user-service/dist/config/database').openDatabase(uri('user')); connections.push(userConnection);
    const userModule = require('../services/user-service/dist/models'), userModels = userModule.createUserModels(userConnection); await userModule.initializeModels(userModels);
    const userBase = await listen(require('../services/user-service/dist/app').createApp({ authServiceUrl: authBase, dataMode: 'synthetic', encryptionKey: randomBytes(32) }, userConnection, userModels));
    const proConnection = await require('../services/professional-service/dist/config/database').openDatabase(uri('professional')); connections.push(proConnection);
    const module = require('../services/professional-service/dist/models'); models = module.createProfessionalModels(proConnection); await module.initializeModels(models);
    settings = { authServiceUrl: authBase, dataMode: 'synthetic', reviewMode: 'disabled', reviewerIds: [], demoIdentity: { instanceId, serviceKey } };
    normalBase = await listen(require('../services/professional-service/dist/app').createApp(settings, proConnection, models));
    // This dependency exists only in this test process; no fixture-approval adapter is installed in the server.
    const proBase = await listen(require('../services/professional-service/dist/app').createApp(settings, proConnection, models, { eligibility: mockedEligibility }));
    Object.assign(process.env, { AUTH_SERVICE_URL: authBase, USER_SERVICE_URL: userBase, PROFESSIONAL_SERVICE_URL: proBase });
    base = await listen(require('../api-gateway/dist/app').createApp());
    for (const fixture of accounts) {
      const login = await request('/auth/login', { method: 'POST', body: { email: fixture.email, password: fixture.password } });
      assert.equal(login.status, 200); sessions[fixture.kind] = login.data;
      const isUser = fixture.kind.startsWith('user_');
      const profile = await request(isUser ? '/users/me' : '/professionals/me', { actor: fixture.kind, method: 'PUT', headers: { 'If-None-Match': '*' },
        body: isUser ? { displayName: fixture.name } : { professionalName: fixture.name, countryCode: 'PT', languages: ['pt'] } });
      assert.equal(profile.status, 201);
      if (!isUser) {
        const capability = await request('/professionals/me/capabilities', { actor: fixture.kind, method: 'POST', body: { kind: fixture.kind, jurisdictionCountry: 'PT', serviceModes: ['online'] } });
        assert.equal(capability.status, 201);
        const t = { professionalId: profile.data.data.id, capabilityId: capability.data.data.id, professionalAuthUserId: fixture.id,
          relationshipKind: fixture.kind === 'personal_trainer' ? 'personal_training' : 'nutrition', professionalName: fixture.name };
        targets.push(t); states.set(t.capabilityId, 'approved-in-test-only');
      }
    }
  });
  after(async () => {
    for (const server of servers.reverse()) { const closed = new Promise((resolve) => server.close(resolve)); server.closeAllConnections(); await closed; }
    await Promise.all(connections.map((connection) => connection.close())); await mongoose.disconnect();
  });
  test('preparation is explicit, idempotent, creates no administrators and preserves all existing fixture values', async () => {
    assert.equal(await prepare(), 0);
    const { AuthUser } = require('../services/auth-service/dist/models/auth-user.model');
    assert.deepEqual(await AuthUser.find().select('+passwordHash +demoInstanceId').lean(), preparedSnapshot);
    assert.equal(await AuthUser.countDocuments({ userType: 'administrador' }), 0);
    delete process.env.DEMO_PREPARE_ACK; await assert.rejects(prepare(), /Explicit/); process.env.DEMO_PREPARE_ACK = 'create-new-fictional-identities';
  });
  test('internal contract returns only the authorized fixture ID and current role', async () => {
    for (const fixture of accounts) {
      const result = await internal(fixture.id); assert.equal(result.status, 200);
      assert.deepEqual(result.data, { identity: { id: fixture.id, userType: fixture.userType } }); privateResponse(result);
    }
  });
  test('missing, invalid, malformed or JWT-as-service credentials fail closed', async () => {
    for (const credential of [null, randomBytes(32).toString('hex'), 'invalid', sessions.user_a.accessToken]) assert.equal((await internal(accounts[0].id, credential)).status, 401);
  });
  test('identity scope, input allowlist and fixture validity are enforced', async () => {
    assert.equal((await internal(randomBytes(12).toString('hex'))).status, 404);
    for (const invalid of ['not-an-id', { $ne: null }, null]) assert.equal((await internal(invalid)).status, 400);
    assert.equal((await internal(accounts[0].id, serviceKey.toString('hex'), { userType: 'administrador' })).status, 400);
    const { DemoPreparation } = require('../services/auth-service/dist/demo/models');
    // Simulate time expiry only in the test fixture marker, then restore it for independent tests.
    await DemoPreparation.collection.updateOne({ instanceId }, { $set: { expiresAt: new Date(0) } });
    try { assert.equal((await internal(accounts[0].id)).status, 503); } finally { await DemoPreparation.collection.updateOne({ instanceId }, { $set: { expiresAt: new Date(manifest.expiresAt) } }); }
  });
  test('demo is off by default and production, remote databases and malformed configuration are rejected', async () => {
    const authConfig = require('../services/auth-service/dist/demo/config').loadDemoConfig;
    const proConfig = require('../services/professional-service/dist/demo/identity-client').loadDemoIdentityConfig;
    const env = { ...process.env };
    try {
      delete process.env.GOLEVE_DEMO_MODE; assert.equal(authConfig(), undefined); assert.equal(proConfig(authBase, 'synthetic', 'disabled', []), undefined);
      const disabled = await listen(require('../services/auth-service/dist/app').createApp()); assert.equal((await internal(accounts[0].id)).status, 200);
      assert.equal((await request('/internal/demo/identity', { origin: disabled, method: 'POST', body: { id: accounts[0].id } })).status, 404);
      process.env.GOLEVE_DEMO_MODE = 'isolated'; process.env.NODE_ENV = 'production'; assert.throws(authConfig); assert.throws(() => proConfig(authBase, 'synthetic', 'disabled', []));
      process.env.NODE_ENV = 'test'; process.env.MONGO_URI = uri('professional'); assert.ok(proConfig(authBase, 'synthetic', 'disabled', []));
      assert.throws(() => proConfig(authBase, 'synthetic', 'synthetic', [])); assert.throws(() => proConfig(authBase, 'synthetic', 'disabled', [accounts[0].id]));
      process.env.MONGO_URI = 'mongodb://mongodb:27017/goleve_auth'; assert.throws(authConfig); assert.throws(() => proConfig(authBase, 'synthetic', 'disabled', []));
      process.env.MONGO_URI = uri('auth');
      delete process.env.DEMO_SERVICE_KEY_FILE; assert.throws(authConfig);
    } finally { for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key]; Object.assign(process.env, env); }
  });
  test('gateway never forwards the internal contract, including auth-prefixed attempts', async () => {
    for (const endpoint of ['/internal/demo/identity', '/auth/internal/demo/identity']) assert.equal((await request(endpoint, { method: 'POST', body: { id: accounts[0].id }, headers: { 'x-goleve-demo-service': serviceKey.toString('hex') } })).status, 404);
  });
  test('the real demo refuses public registration and cannot accept client fixture tags or privileged roles', async () => {
    const result = await request('/auth/register', { method: 'POST', body: { name: 'Synthetic injection', email: 'outsider@example.invalid',
      password: randomBytes(32).toString('base64url'), userType: 'administrador', demoInstanceId: instanceId } });
    assert.equal(result.status, 403);
    assert.equal(await require('../services/auth-service/dist/models/auth-user.model').AuthUser.countDocuments({}), 4);
  });
  test('real server keeps approval blocked despite valid fictional professional role confirmation', async () => {
    assert.equal((await identityClient.read(accounts[2].id)).userType, 'profissional');
    const directory = await request('/professionals/eligible-capabilities', { actor: 'user_a', origin: normalBase }); assert.deepEqual(directory.data.data.items, []);
    const result = await request('/care-relationships', { actor: 'user_a', origin: normalBase, method: 'POST', body: input(), headers: { 'Idempotency-Key': randomUUID() } });
    assert.equal(result.status, 404);
    assert.equal((await request('/professional-applications', { actor: 'personal_trainer', origin: normalBase })).status, 403);
    assert.equal(await models.Application.countDocuments({ status: 'approved' }), 0);
    assert.equal(await models.Capability.countDocuments({ status: 'verified' }), 0);
  });
  test('full PT and nutrition flows use real JWT/current Auth identity and test-only eligibility', async () => {
    const directory = await request('/professionals/eligible-capabilities', { actor: 'user_a' }); assert.equal(directory.status, 200); assert.equal(directory.data.data.items.length, 2); privateResponse(directory);
    for (const [index, actor] of ['personal_trainer', 'nutritionist'].entries()) {
      const pending = await create('user_a', targets[index]); assert.equal(pending.status, 201); privateResponse(pending);
      const inbox = await request('/professionals/me/care-relationships', { actor }); assert.ok(inbox.data.data.items.some((row) => row.id === pending.data.data.id));
      const accepted = await act(pending, 'accept', actor); assert.equal(accepted.status, 200); assert.equal(accepted.data.data.status, 'accepted');
      const read = await request('/care-relationships/' + accepted.data.data.id, { actor: 'user_a' }); assert.equal(read.data.data.status, 'accepted'); assert.equal(read.data.data.sensitiveDataAuthorized, false); privateResponse(read);
      const ended = await act(accepted, 'end', 'user_a'); assert.equal(ended.status, 200); assert.equal(ended.data.data.status, 'ended');
    }
  });
  test('duplicate requests, foreign access, invalid JWT and suspension are rejected', async () => {
    const pending = await create(); assert.equal(pending.status, 201); assert.equal((await create()).status, 409);
    assert.equal((await request('/care-relationships/' + pending.data.data.id, { actor: 'user_b' })).status, 404);
    assert.equal((await act(pending, 'accept', 'nutritionist')).status, 404);
    assert.equal((await request('/care-relationships/me', { token: 'invalid.jwt' })).status, 401);
    assert.equal((await request('/care-relationships/me')).status, 401);
    states.set(targets[0].capabilityId, 'suspended');
    try { assert.equal((await create('user_b')).status, 404); assert.equal((await act(pending, 'accept', 'personal_trainer')).status, 404); }
    finally { states.set(targets[0].capabilityId, 'approved-in-test-only'); }
    assert.equal((await act(pending, 'cancel', 'user_a')).status, 200);
  });
  test('relationships confer no access to private User or professional data', async () => {
    const pending = await create(), accepted = await act(pending, 'accept', 'personal_trainer'); assert.equal(accepted.status, 200);
    assert.equal((await request('/users/' + accounts[0].id + '/weight-history', { actor: 'personal_trainer' })).status, 404);
    assert.equal((await request('/professionals/' + targets[0].professionalId, { actor: 'user_a' })).status, 404);
    const other = await request('/users/me', { actor: 'user_b' }); assert.equal(JSON.stringify(other.data).includes(accounts[0].id), false);
    privateResponse(await request('/care-relationships/' + accepted.data.data.id, { actor: 'personal_trainer' }));
    assert.equal((await act(accepted, 'end', 'personal_trainer')).status, 200);
  });
  test('internal client rejects outages and forged response shapes without leaking credentials', async () => {
    const { DemoIdentityClient } = require('../services/professional-service/dist/demo/identity-client');
    assert.equal(await identityClient.read('invalid'), null); assert.equal(await identityClient.read(randomBytes(12).toString('hex')), null);
    const app = express(); app.post('/internal/demo/identity', (_req, res) => res.json({ identity: { id: accounts[0].id, userType: 'administrador' }, secret: 'forged' }));
    const invalidBase = await listen(app);
    await assert.rejects(new DemoIdentityClient(invalidBase, { instanceId, serviceKey }).read(accounts[0].id), /^Error: Demo identity confirmation unavailable$/);
    await assert.rejects(new DemoIdentityClient(authBase, { instanceId, serviceKey: randomBytes(32) }).read(accounts[0].id), /confirmation unavailable/);
  });
  test('eligibility fails closed when current role confirmation fails, with no database privileges inferred', async () => {
    const { ProfessionalCareEligibility } = require('../services/professional-service/dist/services/care-eligibility.service');
    const target = targets[0];
    const failed = new ProfessionalCareEligibility(models, settings, { async read() { throw new Error('private transport error'); } });
    assert.deepEqual(await failed.check(target.professionalId, target.capabilityId), { status: 'unavailable' });
    const wrongRole = new ProfessionalCareEligibility(models, settings, { async read(id) { return { id, userType: 'utilizador' }; } });
    assert.deepEqual(await wrongRole.check(target.professionalId, target.capabilityId), { status: 'ineligible' });
  });
  test('manifest validation forbids privileged roles, real addresses and invalid lifetimes', () => {
    const validate = require('../services/auth-service/dist/demo/prepare').validateFixtureManifest;
    for (const changed of [{ userType: 'administrador' }, { email: 'real@example.com' }, { name: 'Real person' }]) {
      const value = structuredClone(manifest); Object.assign(value.accounts[0], changed); assert.throws(() => validate(value, instanceId));
    }
    assert.throws(() => validate({ ...manifest, expiresAt: new Date(Date.now() + 48 * 3600000).toISOString() }, instanceId));
  });
});
