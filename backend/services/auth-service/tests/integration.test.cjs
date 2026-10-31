const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

describe('authentication HTTP integration through API Gateway', { skip: !process.env.TEST_MONGO_URI }, () => {
  let authServer, gatewayServer, baseUrl, session;
  let AuthUser, connectDatabase;
  const password = 'safe-password-123';
  const email = 'ana@example.com';

  async function listen(app) {
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    return server;
  }

  async function close(server) {
    if (!server?.listening) return;
    const closed = new Promise((resolve) => server.close(resolve));
    server.closeAllConnections();
    await closed;
  }

  async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
    const response = await fetch(baseUrl + path, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    return { status: response.status, body: await response.json(), headers: response.headers };
  }

  function noSecrets(body) {
    const serialized = JSON.stringify(body);
    for (const forbidden of ['"password"', '"passwordHash"', '$2b$', password]) {
      assert.equal(serialized.includes(forbidden), false, 'Response leaked credentials');
    }
  }

  before(async () => {
    // A new database name is always used; existing databases are never modified or dropped.
    const uri = new URL(process.env.TEST_MONGO_URI);
    uri.pathname = '/goleve_auth_test_' + randomUUID().replaceAll('-', '');
    process.env.MONGO_URI = uri.toString();
    process.env.JWT_SECRET = 'isolated-integration-test-signing-key';
    ({ connectDatabase } = require('../dist/config/database'));
    ({ AuthUser } = require('../dist/models/auth-user.model'));
    await connectDatabase();
    await AuthUser.init();
    authServer = await listen(require('../dist/app').createApp());
    process.env.AUTH_SERVICE_URL = 'http://127.0.0.1:' + authServer.address().port;
    gatewayServer = await listen(require('../../../api-gateway/dist/app').createApp());
    baseUrl = 'http://127.0.0.1:' + gatewayServer.address().port;
  });

  after(async () => {
    await close(gatewayServer);
    await close(authServer);
    await mongoose.disconnect();
  });

  test('gateway and database health checks return 200', async () => {
    assert.equal((await request('/health')).status, 200);
    const response = await fetch(process.env.AUTH_SERVICE_URL + '/health');
    assert.equal(response.status, 200);
    assert.equal((await response.json()).database, 'connected');
  });

  test('POST /auth/register creates a normal user with a JWT and timestamps', async () => {
    const result = await request('/auth/register', { method: 'POST', body: { name: '  Ana Silva  ', email: ' ANA@EXAMPLE.COM ', password } });
    assert.equal(result.status, 201);
    session = result.body;
    assert.equal(session.user.userType, 'utilizador');
    assert.equal(session.user.email, email);
    assert.equal(session.user.name, 'Ana Silva');
    assert.match(session.user.id, /^[a-f0-9]{24}$/);
    assert.ok(!Number.isNaN(Date.parse(session.user.createdAt)));
    assert.ok(!Number.isNaN(Date.parse(session.user.updatedAt)));
    assert.equal(session.tokenType, 'Bearer');
    assert.equal(session.expiresIn, 3600);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    noSecrets(session);
  });

  test('database stores a bcrypt hash with cost 12 and excludes it by default', async () => {
    const user = await AuthUser.findOne({ email });
    assert.equal(user.passwordHash, undefined);
    const stored = await AuthUser.findOne({ email }).select('+passwordHash');
    assert.notEqual(stored.passwordHash, password);
    assert.equal(bcrypt.getRounds(stored.passwordHash), 12);
    assert.equal(await bcrypt.compare(password, stored.passwordHash), true);
    const index = (await AuthUser.collection.indexes()).find((i) => i.key.email === 1);
    assert.equal(index.unique, true);
  });

  test('POST /auth/login accepts normalized email and correct password', async () => {
    const result = await request('/auth/login', { method: 'POST', body: { email: ' ANA@EXAMPLE.COM ', password } });
    assert.equal(result.status, 200);
    assert.equal(result.body.user.id, session.user.id);
    assert.ok(result.body.accessToken);
    noSecrets(result.body);
  });

  test('GET /auth/me accepts a Bearer token and preserves the full proxy path and query', async () => {
    const result = await request('/auth/me?source=gateway', { token: session.accessToken });
    assert.equal(result.status, 200);
    assert.equal(result.body.user.id, session.user.id);
    noSecrets(result.body);
  });

  test('email duplicates are rejected after normalization', async () => {
    const result = await request('/auth/register', { method: 'POST', body: { name: 'Another Ana', email: ' ANA@example.com ', password } });
    assert.equal(result.status, 409);
    assert.equal(result.body.error.code, 'EMAIL_ALREADY_REGISTERED');
    noSecrets(result.body);
  });

  test('concurrent registrations cannot create duplicate emails', async () => {
    const input = { method: 'POST', body: { name: 'Concurrent User', email: 'race@example.com', password } };
    const results = await Promise.all([request('/auth/register', input), request('/auth/register', input)]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    assert.equal(await AuthUser.countDocuments({ email: 'race@example.com' }), 1);
  });

  test('equal passwords have different bcrypt salts for different accounts', async () => {
    const users = await AuthUser.find({ email: { $in: [email, 'race@example.com'] } }).select('+passwordHash');
    assert.equal(users.length, 2);
    assert.notEqual(users[0].passwordHash, users[1].passwordHash);
  });

  for (const userType of ['utilizador', 'profissional', 'gestor', 'administrador']) {
    test('public registration rejects supplied userType=' + userType, async () => {
      const result = await request('/auth/register', { method: 'POST', body: { name: 'Role Attack', email: userType + '@example.com', password, userType } });
      assert.equal(result.status, 400);
      assert.equal(await AuthUser.countDocuments({ email: userType + '@example.com' }), 0);
    });
  }

  test('role, hash and nested MongoDB query injection are rejected', async () => {
    for (const extra of [{ role: 'administrador' }, { passwordHash: 'injected' }]) {
      assert.equal((await request('/auth/register', { method: 'POST', body: { name: 'Test User', email: 'inject@example.com', password, ...extra } })).status, 400);
    }
    assert.equal((await request('/auth/login', { method: 'POST', body: { email: { $ne: null }, password } })).status, 400);
  });

  test('wrong password and unknown email return identical generic errors', async () => {
    const wrong = await request('/auth/login', { method: 'POST', body: { email, password: 'wrong-password' } });
    const missing = await request('/auth/login', { method: 'POST', body: { email: 'unknown@example.com', password } });
    assert.equal(wrong.status, 401);
    assert.equal(missing.status, 401);
    assert.deepEqual(wrong.body, missing.body);
  });

  for (const [label, body] of [
    ['empty body', {}], ['invalid email', { name: 'Test User', email: 'invalid', password }],
    ['short password', { name: 'Test User', email: 'short@example.com', password: '123' }],
    ['long password', { name: 'Test User', email: 'long@example.com', password: 'a'.repeat(73) }],
    ['array body', []], ['null body', null],
  ]) {
    test('registration returns 400 for ' + label, async () => {
      const result = await request('/auth/register', { method: 'POST', body });
      assert.equal(result.status, 400);
    });
  }

  test('malformed JSON returns a controlled 400 response through the gateway', async () => {
    const response = await fetch(baseUrl + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'INVALID_JSON');
  });

  test('oversized JSON returns 413', async () => {
    assert.equal((await request('/auth/register', { method: 'POST', body: { name: 'x'.repeat(20000) } })).status, 413);
  });

  test('GET /auth/me requires a token and rejects malformed authorization', async () => {
    assert.equal((await request('/auth/me')).status, 401);
    for (const authorization of ['Basic abc', 'Bearer invalid', 'Bearer a.b.c', 'Bearer ' + session.accessToken + ',other']) {
      assert.equal((await request('/auth/me', { headers: { Authorization: authorization } })).status, 401);
    }
  });

  for (const [label, overrides, secret] of [
    ['expired', { expiresIn: -1 }], ['wrong issuer', { issuer: 'other' }],
    ['wrong audience', { audience: 'other' }], ['wrong algorithm', { algorithm: 'HS384' }],
    ['wrong signature', {}, 'different-signing-secret'], ['invalid subject', { subject: 'invalid' }],
  ]) {
    test('GET /auth/me rejects ' + label + ' JWT', async () => {
      const token = jwt.sign({}, secret || process.env.JWT_SECRET, {
        algorithm: 'HS256', issuer: 'goleve-auth', audience: 'goleve-api', subject: session.user.id, expiresIn: 3600, ...overrides,
      });
      assert.equal((await request('/auth/me', { token })).status, 401);
    });
  }

  test('a valid JWT for a nonexistent user is rejected', async () => {
    const token = require('../dist/config/token').signAccessToken(new mongoose.Types.ObjectId().toHexString());
    assert.equal((await request('/auth/me', { token })).status, 401);
  });

  test('userType is read from MongoDB rather than trusting a role claim in JWT', async () => {
    const token = jwt.sign({ userType: 'administrador' }, process.env.JWT_SECRET, {
      algorithm: 'HS256', issuer: 'goleve-auth', audience: 'goleve-api', subject: session.user.id, expiresIn: 3600,
    });
    const result = await request('/auth/me', { token });
    assert.equal(result.status, 200);
    assert.equal(result.body.user.userType, 'utilizador');
  });

  test('unknown auth endpoints return JSON 404', async () => {
    assert.equal((await request('/auth/unknown')).status, 404);
  });

  test('database disconnection returns 503 and recovers after reconnecting', async () => {
    try {
      await mongoose.disconnect();
      const result = await request('/auth/login', { method: 'POST', body: { email, password } });
      assert.equal(result.status, 503);
      assert.equal(result.body.error.code, 'DATABASE_UNAVAILABLE');
      assert.equal((await fetch(process.env.AUTH_SERVICE_URL + '/health')).status, 503);
    } finally {
      await connectDatabase();
    }
    assert.equal((await request('/auth/me', { token: session.accessToken })).status, 200);
  });

  test('gateway returns controlled 502 when auth-service is unavailable', async () => {
    await close(authServer);
    const result = await request('/auth/me', { token: session.accessToken });
    assert.equal(result.status, 502);
    assert.equal(result.body.error.code, 'AUTH_SERVICE_UNAVAILABLE');
  });
});
