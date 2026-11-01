const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const { createServer } = require('node:http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

describe('Professional phase 1 with real Auth, Gateway and isolated MongoDB', { skip: !process.env.TEST_MONGO_URI }, () => {
  let authServer, professionalServer, gatewayServer, authApp, professionalApp, connection, models;
  let authUrl, professionalUrl, gatewayUrl, userA, userB, profileA, profileB, ptA, nutritionA, ptB, qualificationA, availabilityA;
  const suffix = randomUUID().replaceAll('-', ''), signingKey = 'synthetic-professional-integration-signing-key';
  const professionalUri = new URL(process.env.TEST_MONGO_URI), authUri = new URL(process.env.TEST_MONGO_URI);
  professionalUri.pathname = '/goleve_professional_test_' + suffix;
  authUri.pathname = '/goleve_auth_professional_test_' + suffix;
  async function listen(app, port = 0) { const server = app.listen(port, '127.0.0.1'); await once(server, 'listening'); return server; }
  async function close(server) {
    if (!server?.listening) return;
    const done = new Promise((resolve) => server.close(resolve)); server.closeAllConnections(); await done;
  }
  async function request(path, options = {}) {
    const response = await fetch((options.base || gatewayUrl) + path, { method: options.method || 'GET',
      headers: { ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(options.token ? { Authorization: 'Bearer ' + options.token } : {}), ...options.headers },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined, signal: AbortSignal.timeout(15000) });
    return { status: response.status, body: await response.json(), tag: response.headers.get('etag'), headers: response.headers };
  }
  const own = (path, options = {}) => request(path, { token: userA.accessToken, ...options });
  const create = (path, body, token = userA.accessToken) => request(path, { token, method: 'PUT', body, headers: { 'If-None-Match': '*' } });
  const post = (path, body, options = {}) => own(path, { method: 'POST', body, ...options });
  const patch = (path, body, tag, token = userA.accessToken) => request(path, { token, method: 'PATCH', body, headers: { 'If-Match': tag } });
  const profileBody = { professionalName: 'Synthetic Candidate A', countryCode: 'PT', languages: ['pt-PT'], biography: 'Fictitious application biography',
    privateContactEmail: 'private-a@example.invalid', publicContacts: { email: 'candidate-a@example.invalid', phoneE164: '+351910000000' } };
  const ptBody = { kind: 'personal_trainer', jurisdictionCountry: 'PT', serviceModes: ['online', 'in_person'], specializations: ['synthetic_pt_strength'], experienceStartYear: 2020 };
  const qualificationBody = () => ({ capabilityId: ptA.body.data.id, qualificationType: 'certification', title: 'Synthetic qualification',
    issuerName: 'Synthetic institution', awardedOn: '2020-01-01', specializationCodes: ['synthetic_pt_strength'] });
  const availabilityBody = { preferredWeekdays: [1, 3], windows: [{ weekday: 1, startMinute: 540, endMinute: 720 },
    { weekday: 3, startMinute: 900, endMinute: 1020 }], timeZone: 'Europe/Lisbon', serviceModes: ['in_person', 'online'] };
  function safe(result) {
    for (const field of ['passwordHash', 'inputFingerprint', 'idempotencyKey', 'JWT_SECRET', 'registrationNumber', 'accessToken']) assert.equal(JSON.stringify(result.body).includes(field), false);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.equal(result.headers.get('x-professional-data-mode'), 'synthetic');
  }
  before(async () => {
    process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = signingKey;
    await mongoose.connect(authUri.toString(), { serverSelectionTimeoutMS: 5000 });
    await require('../../auth-service/dist/models/auth-user.model').AuthUser.init();
    authApp = require('../../auth-service/dist/app').createApp(); authServer = await listen(authApp);
    authUrl = 'http://127.0.0.1:' + authServer.address().port;
    connection = await require('../dist/config/database').openDatabase(professionalUri.toString());
    const module = require('../dist/models'); models = module.createProfessionalModels(connection); await module.initializeModels(models);
    professionalApp = require('../dist/app').createApp({ authServiceUrl: authUrl, dataMode: 'synthetic' }, connection, models);
    professionalServer = await listen(professionalApp); professionalUrl = 'http://127.0.0.1:' + professionalServer.address().port;
    process.env.AUTH_SERVICE_URL = authUrl; process.env.PROFESSIONAL_SERVICE_URL = professionalUrl;
    gatewayServer = await listen(require('../../../api-gateway/dist/app').createApp()); gatewayUrl = 'http://127.0.0.1:' + gatewayServer.address().port;
    for (const who of ['a', 'b']) {
      const result = await request('/auth/register', { method: 'POST', body: { name: 'Synthetic Candidate ' + who,
        email: 'synthetic-professional-' + who + '@example.invalid', password: 'synthetic-password-123' } });
      assert.equal(result.status, 201); if (who === 'a') userA = result.body; else userB = result.body;
    }
  });
  after(async () => { await close(gatewayServer); await close(professionalServer); await close(authServer); await connection?.close(); await mongoose.disconnect(); });

  test('health checks and all private route families require identity even without Gateway', async () => {
    assert.equal((await request('/health')).status, 200);
    const health = await request('/health', { base: professionalUrl }); assert.equal(health.status, 200); assert.equal(health.body.database, 'connected');
    for (const [method, path] of [['GET', '/professionals/me'], ['PUT', '/professionals/me'], ['PATCH', '/professionals/me'],
      ['GET', '/professionals/catalog'], ['POST', '/professionals/me/capabilities'], ['GET', '/professionals/me/capabilities'],
      ['GET', '/professionals/me/qualifications'], ['POST', '/professionals/me/qualifications'],
      ['GET', '/professionals/me/availability-declaration'], ['PUT', '/professionals/me/availability-declaration'], ['PATCH', '/professionals/me/availability-declaration']]) {
      for (const base of [gatewayUrl, professionalUrl]) assert.equal((await request(path, { method, base })).status, 401);
    }
  });
  for (const [label, makeToken] of [
    ['expired', (id) => jwt.sign({ sub: id, exp: 1 }, signingKey, { issuer: 'goleve-auth', audience: 'goleve-api' })],
    ['wrong signature', (id) => jwt.sign({ sub: id }, 'synthetic-wrong-key', { issuer: 'goleve-auth', audience: 'goleve-api', expiresIn: '1h' })],
    ['wrong algorithm', (id) => jwt.sign({ sub: id }, signingKey, { issuer: 'goleve-auth', audience: 'goleve-api', algorithm: 'HS384', expiresIn: '1h' })],
    ['no expiration', (id) => jwt.sign({ sub: id }, signingKey, { issuer: 'goleve-auth', audience: 'goleve-api' })],
    ['wrong issuer', (id) => jwt.sign({ sub: id }, signingKey, { issuer: 'synthetic-wrong-issuer', audience: 'goleve-api', expiresIn: '1h' })],
    ['wrong audience', (id) => jwt.sign({ sub: id }, signingKey, { issuer: 'goleve-auth', audience: 'synthetic-wrong-audience', expiresIn: '1h' })],
    ['unknown identity', () => jwt.sign({ sub: new mongoose.Types.ObjectId().toHexString() }, signingKey, { issuer: 'goleve-auth', audience: 'goleve-api', expiresIn: '1h' })],
  ]) test('real Auth rejects ' + label + ' JWT for Professional', async () => {
    assert.equal((await own('/professionals/me', { token: makeToken(userA.user.id) })).status, 401);
  });
  test('profile is explicit onboarding; current account may read the synthetic catalog without a profile', async () => {
    assert.equal((await own('/professionals/me')).status, 404);
    assert.equal(await models.Profile.countDocuments({}), 0);
    const result = await own('/professionals/catalog'); assert.equal(result.status, 200); safe(result);
    assert.equal(result.body.data.grantsProfessionalPrivileges, false); assert.equal(result.body.data.version, 'synthetic-v1');
  });
  test('normal users create only hidden draft candidacies without modifying their Auth account', async () => {
    profileA = await create('/professionals/me', profileBody);
    profileB = await create('/professionals/me', { ...profileBody, professionalName: 'Synthetic Candidate B' }, userB.accessToken);
    for (const result of [profileA, profileB]) { assert.equal(result.status, 201); safe(result); assert.ok(result.tag);
      assert.equal(result.body.data.profileStatus, 'draft'); assert.equal(result.body.data.directoryVisibility, 'hidden');
      assert.equal(result.body.data.professionalPrivileges, false); assert.equal(result.body.data.contactsPublicationStatus, 'unpublished'); }
    const auth = await own('/auth/me'); assert.equal(auth.body.user.userType, 'utilizador');
    const stored = await models.Profile.findOne({ authUserId: userA.user.id }).lean();
    for (const key of ['email', 'password', 'passwordHash', 'userType']) assert.equal(key in stored, false);
  });
  test('singleton creation and optimistic profile updates prevent replacement and concurrent overwrite', async () => {
    assert.equal((await own('/professionals/me', { method: 'PUT', body: profileBody })).status, 428);
    assert.equal((await create('/professionals/me', profileBody)).status, 412);
    assert.equal((await own('/professionals/me', { method: 'PATCH', body: { biography: 'Synthetic update' } })).status, 428);
    const results = await Promise.all(['one', 'two'].map((value) => patch('/professionals/me', { biography: 'Synthetic ' + value }, profileA.tag)));
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 412]); profileA = results.find((r) => r.status === 200);
    assert.equal((await patch('/professionals/me', { biography: 'Synthetic conflict' }, profileB.tag)).status, 412);
    profileA = await patch('/professionals/me', { privateContactEmail: null }, profileA.tag); assert.equal(profileA.status, 200);
    assert.equal('privateContactEmail' in profileA.body.data, false);
  });
  test('privileged profile fields, client identity headers and role claims cannot promote a candidate', async () => {
    for (const input of [{ authUserId: userB.user.id }, { userType: 'profissional' }, { profileStatus: 'active' }, { directoryVisibility: 'public' },
      { publishedAt: new Date().toISOString() }, { publicationVersion: 5 }, { moderationReasonCode: 'approved' }, { verified: true }]) {
      assert.equal((await patch('/professionals/me', input, profileA.tag)).status, 400);
    }
    const result = await own('/professionals/me', { headers: { 'X-User-Id': userB.user.id, 'X-User-Role': 'administrador' } });
    assert.equal(result.body.data.authUserId, userA.user.id);
    const extraClaims = jwt.sign({ sub: userA.user.id, userType: 'profissional', role: 'administrador' }, signingKey,
      { issuer: 'goleve-auth', audience: 'goleve-api', expiresIn: '1h' });
    const claimed = await own('/professionals/me', { token: extraClaims });
    assert.equal(claimed.status, 200); assert.equal(claimed.body.data.professionalPrivileges, false);
    assert.equal((await own('/auth/me', { token: extraClaims })).body.user.userType, 'utilizador');
  });
  test('one identity can declare both PT and nutrition capabilities independently without verification', async () => {
    ptA = await post('/professionals/me/capabilities', ptBody);
    nutritionA = await post('/professionals/me/capabilities', { kind: 'nutritionist', jurisdictionCountry: 'PT', serviceModes: ['online'], specializations: ['synthetic_nutrition_general'] });
    ptB = await post('/professionals/me/capabilities', ptBody, { token: userB.accessToken });
    for (const result of [ptA, nutritionA, ptB]) { assert.equal(result.status, 201); safe(result);
      assert.equal(result.body.data.status, 'draft'); assert.equal(result.body.data.titleRequirement, 'pending_legal_assessment');
      assert.equal(result.body.data.eligibleForProfessionalActions, false); }
    assert.notEqual(ptA.body.data.id, nutritionA.body.data.id);
    assert.equal(ptA.body.data.professionalId, nutritionA.body.data.professionalId);
    assert.equal((await post('/professionals/me/capabilities', ptBody)).status, 409);
    const foreignJurisdiction = await post('/professionals/me/capabilities', { ...ptBody, jurisdictionCountry: 'ES' });
    assert.equal(foreignJurisdiction.status, 201); assert.equal(foreignJurisdiction.body.data.eligibleForProfessionalActions, false);
  });
  test('concurrent duplicate capabilities create exactly one record', async () => {
    const body = { ...ptBody, jurisdictionCountry: 'FR' };
    const results = await Promise.all([post('/professionals/me/capabilities', body), post('/professionals/me/capabilities', body)]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    assert.equal(await models.Capability.countDocuments({ authUserId: userA.user.id, jurisdictionCountry: 'FR' }), 1);
  });
  test('capability updates use own IDs and versions; kinds, jurisdiction and approval fields are immutable to clients', async () => {
    const route = '/professionals/me/capabilities/' + ptA.body.data.id;
    assert.equal((await request(route, { token: userB.accessToken })).status, 404);
    assert.equal((await patch(route, { experienceStartYear: 2019 }, ptA.tag, userB.accessToken)).status, 404);
    for (const body of [{ kind: 'nutritionist' }, { jurisdictionCountry: 'ES' }, { status: 'verified' }, { titleRequirement: 'not_required' }, { verifiedAt: new Date().toISOString() },
      { specializations: ['synthetic_nutrition_general'] }]) assert.equal((await patch(route, body, ptA.tag)).status, 400);
    const results = await Promise.all([2018, 2019].map((year) => patch(route, { experienceStartYear: year }, ptA.tag)));
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 412]); ptA = results.find((r) => r.status === 200);
  });
  test('bounded capability pagination stays within the current owner', async () => {
    const first = await own('/professionals/me/capabilities?limit=1'); assert.equal(first.status, 200); safe(first);
    assert.equal(first.body.data.items.length, 1); assert.ok(first.body.data.nextBefore);
    const second = await own('/professionals/me/capabilities?limit=1&before=' + first.body.data.nextBefore);
    assert.notEqual(first.body.data.items[0].id, second.body.data.items[0].id);
    assert.ok(second.body.data.items.every((item) => item.authUserId === userA.user.id));
    for (const query of ['limit=101', 'before=bad', 'authUserId=' + userB.user.id, 'before[$gt]=0']) assert.equal((await own('/professionals/me/capabilities?' + query)).status, 400);
  });
  test('qualifications are separate, private, unverified and idempotent under concurrent requests', async () => {
    const headers = { 'Idempotency-Key': 'synthetic-qualification-a' };
    const results = await Promise.all([post('/professionals/me/qualifications', qualificationBody(), { headers }), post('/professionals/me/qualifications', qualificationBody(), { headers })]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 201]); qualificationA = results.find((r) => r.status === 201);
    for (const result of results) { safe(result); assert.equal(result.body.data.verificationStatus, 'unverified'); assert.equal(result.body.data.publishSummary, false); }
    assert.equal(results[0].body.data.id, results[1].body.data.id);
    assert.equal(await models.Qualification.countDocuments({ authUserId: userA.user.id }), 1);
    assert.equal((await post('/professionals/me/qualifications', { ...qualificationBody(), title: 'Different synthetic title' }, { headers })).status, 409);
    assert.equal((await post('/professionals/me/qualifications', qualificationBody())).status, 400);
    const independent = await post('/professionals/me/qualifications', { ...qualificationBody(), capabilityId: ptB.body.data.id }, { token: userB.accessToken, headers });
    assert.equal(independent.status, 201); assert.notEqual(independent.body.data.id, qualificationA.body.data.id);
  });
  test('qualification links and reads never cross owners or specialization domains', async () => {
    const route = '/professionals/me/qualifications/' + qualificationA.body.data.id;
    assert.equal((await request(route, { token: userB.accessToken })).status, 404);
    assert.equal((await patch(route, { title: 'Unauthorized synthetic change' }, qualificationA.tag, userB.accessToken)).status, 404);
    assert.equal((await post('/professionals/me/qualifications', { ...qualificationBody(), capabilityId: ptB.body.data.id }, { headers: { 'Idempotency-Key': 'foreign' } })).status, 404);
    assert.equal((await post('/professionals/me/qualifications', { ...qualificationBody(), capabilityId: nutritionA.body.data.id }, { headers: { 'Idempotency-Key': 'wrong-specialization' } })).status, 400);
    for (const body of [{ verificationStatus: 'verified' }, { publishSummary: true }, { capabilityId: nutritionA.body.data.id }]) assert.equal((await patch(route, body, qualificationA.tag)).status, 400);
    const oldTag = qualificationA.tag;
    qualificationA = await patch(route, { title: 'Updated synthetic qualification', expiresOn: '2030-01-01' }, oldTag); assert.equal(qualificationA.status, 200);
    assert.equal((await patch(route, { title: 'Stale change' }, oldTag)).status, 412);
    const list = await own('/professionals/me/qualifications?limit=1'); assert.equal(list.status, 200); safe(list);
  });
  test('approved private availability declaration supports weekdays, windows, both modes and time zone', async () => {
    const route = '/professionals/me/availability-declaration';
    assert.equal((await own(route)).status, 404); availabilityA = await create(route, availabilityBody);
    assert.equal(availabilityA.status, 201); safe(availabilityA);
    assert.equal(availabilityA.body.data.visibility, 'private'); assert.equal(availabilityA.body.data.operational, false);
    assert.deepEqual(availabilityA.body.data.serviceModes, ['in_person', 'online']);
    assert.equal((await create(route, availabilityBody)).status, 412);
    assert.equal((await request(route, { token: userB.accessToken })).status, 404);
    assert.equal((await patch(route, { timeZone: 'UTC' }, availabilityA.tag, userB.accessToken)).status, 404);
    for (const body of [{ visibility: 'public' }, { operational: true }, { preferredWeekdays: [2] }]) assert.equal((await patch(route, body, availabilityA.tag)).status, 400);
    const results = await Promise.all(['UTC', 'Europe/Madrid'].map((zone) => patch(route, { timeZone: zone }, availabilityA.tag)));
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 412]); availabilityA = results.find((r) => r.status === 200);
    const stored = await models.Availability.findOne({ authUserId: userA.user.id }).lean(); assert.equal(stored.operational, false);
  });
  test('no directory, review, role promotion, reservations, clients, consultations, plans or payment endpoints exist', async () => {
    for (const [method, path] of [['GET', '/professionals'], ['GET', '/professionals/directory'], ['POST', '/professionals/me/submit'],
      ['POST', '/professionals/me/verify'], ['POST', '/professionals/me/publish'], ['GET', '/professionals/me/clients'],
      ['POST', '/professionals/me/appointments'], ['POST', '/professionals/me/nutrition-plans'], ['POST', '/professionals/me/payments'],
      ['POST', '/professionals/me/ai-consents'], ['GET', '/professionals/' + profileB.body.data.id], ['DELETE', '/professionals/me']]) {
      assert.equal((await own(path, { method })).status, 404);
    }
    assert.equal((await own('/auth/me')).body.user.userType, 'utilizador');
  });
  test('a professional Auth role alone still cannot grant eligibility or self-verification', async () => {
    const { AuthUser } = require('../../auth-service/dist/models/auth-user.model');
    await AuthUser.updateOne({ _id: userA.user.id }, { $set: { userType: 'profissional' } });
    try {
      assert.equal((await own('/auth/me')).body.user.userType, 'profissional');
      assert.equal((await own('/professionals/me')).body.data.professionalPrivileges, false);
      assert.equal((await own('/professionals/me/capabilities/' + ptA.body.data.id)).body.data.eligibleForProfessionalActions, false);
      assert.equal((await patch('/professionals/me/capabilities/' + ptA.body.data.id, { status: 'verified' }, ptA.tag)).status, 400);
    } finally { await AuthUser.updateOne({ _id: userA.user.id }, { $set: { userType: 'utilizador' } }); }
  });
  test('reviewed or suspended states cannot be overwritten through draft editing endpoints', async () => {
    await models.Profile.updateOne({ authUserId: userA.user.id }, { $set: { profileStatus: 'suspended' } });
    try {
      assert.equal((await patch('/professionals/me', { biography: 'Blocked' }, profileA.tag)).status, 403);
      assert.equal((await patch('/professionals/me/availability-declaration', { timeZone: 'UTC' }, availabilityA.tag)).status, 403);
    } finally { await models.Profile.updateOne({ authUserId: userA.user.id }, { $set: { profileStatus: 'draft' } }); }
    await models.Capability.updateOne({ _id: ptA.body.data.id }, { $set: { status: 'verified' } });
    try { assert.equal((await patch('/professionals/me/capabilities/' + ptA.body.data.id, { experienceStartYear: 2010 }, ptA.tag)).status, 403); }
    finally { await models.Capability.updateOne({ _id: ptA.body.data.id }, { $set: { status: 'draft' } }); }
    await models.Qualification.updateOne({ _id: qualificationA.body.data.id }, { $set: { verificationStatus: 'verified' } });
    try { assert.equal((await patch('/professionals/me/qualifications/' + qualificationA.body.data.id, { title: 'Blocked' }, qualificationA.tag)).status, 403); }
    finally { await models.Qualification.updateOne({ _id: qualificationA.body.data.id }, { $set: { verificationStatus: 'unverified' } }); }
  });
  test('auditing stores metadata only and unavailable auditing prevents mutation', async () => {
    const audit = await models.Audit.find({ actorId: userA.user.id }).lean(); assert.ok(audit.length > 10);
    const serialized = JSON.stringify(audit);
    for (const secret of ['Synthetic Candidate', 'example.invalid', userA.accessToken, 'Synthetic qualification', 'JWT_SECRET']) assert.equal(serialized.includes(secret), false);
    const original = models.Audit.create;
    models.Audit.create = async () => { throw new Error('SYNTHETIC_AUDIT_PRIVATE_ERROR'); };
    try {
      const before = await models.Profile.findOne({ authUserId: userA.user.id });
      const result = await patch('/professionals/me', { biography: 'Must not persist' }, '"' + before._id + ':' + before.version + '"');
      assert.equal(result.status, 503); assert.equal(JSON.stringify(result.body).includes('PRIVATE_ERROR'), false);
      assert.equal((await models.Profile.findOne({ authUserId: userA.user.id })).biography, before.biography);
    } finally { models.Audit.create = original; }
  });
  test('malformed/oversized JSON and invalid identifiers return controlled errors', async () => {
    const response = await fetch(gatewayUrl + '/professionals/me', { method: 'PUT', headers: { Authorization: 'Bearer ' + userA.accessToken,
      'Content-Type': 'application/json', 'If-None-Match': '*' }, body: '{' }); assert.equal(response.status, 400);
    assert.equal((await own('/professionals/me', { method: 'PATCH', body: { biography: 'x'.repeat(20000) } })).status, 413);
    assert.equal((await own('/professionals/me/capabilities/not-an-id')).status, 400);
  });
  test('disabled mode rejects authenticated collection and still has a healthy process', async () => {
    const server = await listen(require('../dist/app').createApp({ authServiceUrl: authUrl, dataMode: 'disabled' }, connection, models));
    const base = 'http://127.0.0.1:' + server.address().port;
    try {
      const result = await own('/professionals/me', { base }); assert.equal(result.status, 503); assert.equal(result.body.error.code, 'PROFESSIONAL_DATA_DISABLED');
      assert.equal((await request('/health', { base })).status, 200);
    } finally { await close(server); }
  });
  test('Auth failures, invalid identity responses and redirects fail closed without logging payloads', async () => {
    for (const mode of ['unavailable', 'invalid-json', 'invalid-identity', 'redirect']) {
      const fake = createServer((_req, res) => {
        if (mode === 'redirect') { res.writeHead(302, { Location: authUrl + '/auth/me' }); res.end(); }
        else if (mode === 'unavailable') { res.writeHead(503); res.end('SYNTHETIC_PRIVATE_RESPONSE'); }
        else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(mode === 'invalid-json' ? 'not-json' : JSON.stringify({ user: { id: userA.user.id, userType: 'invented' } })); }
      });
      await new Promise((resolve) => fake.listen(0, '127.0.0.1', resolve));
      const server = await listen(require('../dist/app').createApp({ authServiceUrl: 'http://127.0.0.1:' + fake.address().port, dataMode: 'synthetic' }, connection, models));
      try { const result = await own('/professionals/me', { base: 'http://127.0.0.1:' + server.address().port });
        assert.equal(result.status, 503); assert.equal(JSON.stringify(result.body).includes('PRIVATE_RESPONSE'), false); }
      finally { await close(server); await close(fake); }
    }
    const port = authServer.address().port; await close(authServer);
    assert.equal((await own('/professionals/me')).status, 503); authServer = await listen(authApp, port);
    assert.equal((await own('/professionals/me')).status, 200);
  });
  test('MongoDB disconnection affects readiness and data, keeps Auth working, and recovers', async () => {
    await connection.close();
    assert.equal((await request('/health', { base: professionalUrl })).status, 503);
    assert.equal((await own('/professionals/me')).status, 503); assert.equal((await own('/auth/me')).status, 200);
    await connection.openUri(professionalUri.toString());
    assert.equal((await request('/health', { base: professionalUrl })).status, 200);
    assert.equal((await own('/professionals/me')).status, 200);
  });
  test('gateway returns safe 502 when Professional is unavailable and recovers', async () => {
    const port = professionalServer.address().port; await close(professionalServer);
    const result = await own('/professionals/me'); assert.equal(result.status, 502); assert.equal(result.body.error.code, 'PROFESSIONAL_SERVICE_UNAVAILABLE');
    professionalServer = await listen(professionalApp, port); assert.equal((await own('/professionals/me')).status, 200);
  });
});
