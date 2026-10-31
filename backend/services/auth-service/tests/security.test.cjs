const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const mongoose = require('mongoose');
const { getJwtSecret, signAccessToken, verifyAccessToken } = require('../dist/config/token');
const { errorHandler } = require('../dist/middlewares/error.middleware');

function withProductionSecret(secret, callback) {
  const previous = { secret: process.env.JWT_SECRET, mode: process.env.NODE_ENV };
  try {
    process.env.NODE_ENV = 'production';
    if (secret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secret;
    callback();
  } finally {
    if (previous.secret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous.secret;
    if (previous.mode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous.mode;
  }
}

for (const [label, value] of [
  ['missing', undefined], ['empty', ''], ['blank', '   '],
  ['short', 'not-enough-signing-key'],
  ['Compose development default', 'development-only-change-me'],
  ['long development placeholder', 'development-only-change-me'.repeat(3)],
  ['long example placeholder', 'example-secret-that-must-not-be-used-in-production'],
  ['one repeated character', 'a'.repeat(64)],
  ['repeated pattern', '0123456789abcdef'.repeat(4)],
  ['surrounding whitespace', ' ' + randomBytes(32).toString('hex')],
]) {
  test('production rejects ' + label + ' JWT secret without exposing it', () => {
    withProductionSecret(value, () => {
      assert.throws(getJwtSecret, (error) => {
        assert.match(error.message, /JWT_SECRET/);
        if (value?.trim()) assert.equal(error.message.includes(value), false);
        return true;
      });
    });
  });
}

test('a randomly generated production secret signs and verifies tokens', () => {
  withProductionSecret(randomBytes(32).toString('hex'), () => {
    assert.equal(verifyAccessToken(signAccessToken('507f1f77bcf86cd799439011')), '507f1f77bcf86cd799439011');
  });
});

test('MongoDB connection event logs do not expose raw driver errors', () => {
  require('../dist/config/database');
  const original = console.error;
  const logs = [];
  try {
    console.error = (...parts) => logs.push(parts.join(' '));
    mongoose.connection.emit('error', new Error('mongodb://CANARY_USER:CANARY_PASSWORD@host/db CANARY_JWT'));
  } finally {
    console.error = original;
  }
  assert.ok(logs.length);
  assert.equal(logs.join('\n').includes('CANARY'), false);
});

test('unexpected errors expose neither details in responses nor arbitrary error names in logs', () => {
  const error = new Error('CANARY_PASSWORD CANARY_JWT');
  error.name = 'CANARY_CONNECTION_STRING';
  const original = console.error;
  const logs = [];
  let status, body;
  const response = { headersSent: false, status(value) { status = value; return this; }, json(value) { body = value; } };
  try {
    console.error = (...parts) => logs.push(parts.join(' '));
    errorHandler(error, {}, response, () => assert.fail('Unexpected next()'));
  } finally {
    console.error = original;
  }
  assert.equal(status, 500);
  assert.equal(JSON.stringify(body).includes('CANARY'), false);
  assert.equal(logs.join('\n').includes('CANARY'), false);
});

test('duplicate-key errors do not expose stored email values', () => {
  let status, body;
  const response = { headersSent: false, status(value) { status = value; return this; }, json(value) { body = value; } };
  errorHandler({ code: 11000, keyValue: { email: 'CANARY_EMAIL@example.com' } }, {}, response, () => assert.fail('Unexpected next()'));
  assert.equal(status, 409);
  assert.equal(JSON.stringify(body).includes('CANARY'), false);
});

test('production startup rejects weak configuration without opening HTTP or logging credentials', async () => {
  const marker = 'CANARY_WEAK_SECRET';
  const child = spawn(process.execPath, ['dist/server.js'], {
    cwd: require('node:path').resolve(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: marker, MONGO_URI: 'mongodb://CANARY_USER:CANARY_PASSWORD@127.0.0.1:1/db', PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', (part) => { logs += part; });
  child.stderr.on('data', (part) => { logs += part; });
  const timeout = setTimeout(() => child.kill('SIGKILL'), 10000);
  try {
    const [code] = await once(child, 'close');
    assert.equal(code, 1);
    assert.equal(logs.includes('running on'), false);
    assert.equal(logs.includes('CANARY'), false);
    assert.ok(logs.includes('auth-service failed to start'));
  } finally {
    clearTimeout(timeout);
  }
});

test('gateway throttles public auth routes and ignores spoofed client IP headers', async () => {
  const express = require('express');
  const upstreamApp = express();
  let forwarded = 0;
  upstreamApp.use((_req, res) => { forwarded++; res.json({ ok: true }); });
  const upstream = upstreamApp.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  const previousUrl = process.env.AUTH_SERVICE_URL;
  process.env.AUTH_SERVICE_URL = 'http://127.0.0.1:' + upstream.address().port;
  const gateway = require('../../../api-gateway/dist/app').createApp().listen(0, '127.0.0.1');
  await once(gateway, 'listening');
  const base = 'http://127.0.0.1:' + gateway.address().port;
  try {
    for (let attempt = 0; attempt < 30; attempt++) {
      const response = await fetch(base + (attempt % 2 ? '/auth/login' : '/auth/register'), { method: 'POST' });
      assert.equal(response.status, 200);
      await response.text();
    }
    for (const headers of [{}, { 'X-Forwarded-For': '203.0.113.42', Forwarded: 'for=203.0.113.42' }]) {
      const blocked = await fetch(base + '/auth/login', { method: 'POST', headers });
      assert.equal(blocked.status, 429);
      assert.equal((await blocked.json()).error.code, 'AUTH_RATE_LIMITED');
      assert.ok(Number(blocked.headers.get('retry-after')) > 0);
      assert.equal(blocked.headers.get('cache-control'), 'no-store');
    }
    assert.equal(forwarded, 30);
    for (const path of ['/health', '/auth/me']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200);
      await response.text();
    }
  } finally {
    if (previousUrl === undefined) delete process.env.AUTH_SERVICE_URL;
    else process.env.AUTH_SERVICE_URL = previousUrl;
    await Promise.all([upstream, gateway].map((server) => {
      const closed = new Promise((resolve) => server.close(resolve));
      server.closeAllConnections();
      return closed;
    }));
  }
});
