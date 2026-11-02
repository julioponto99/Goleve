const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'test-secret-for-goleve-unit-tests-only';
process.env.NODE_ENV = 'test';
const { signAccessToken, verifyAccessToken, getJwtSecret } = require('../dist/config/token');
const subject = '507f1f77bcf86cd799439011';
const options = { algorithm: 'HS256', subject, issuer: 'goleve-auth', audience: 'goleve-api', expiresIn: 3600 };

test('issued tokens expire in one hour and contain no user credentials', () => {
  const token = signAccessToken(subject);
  assert.equal(verifyAccessToken(token), subject);
  const payload = jwt.decode(token);
  assert.equal(payload.exp - payload.iat, 3600);
  assert.deepEqual(Object.keys(payload).sort(), ['aud', 'exp', 'iat', 'iss', 'sid', 'sub', 'sv']);
});

for (const [label, overrides, secret] of [
  ['expired token', { expiresIn: -1 }],
  ['wrong issuer', { issuer: 'another-service' }],
  ['wrong audience', { audience: 'another-api' }],
  ['wrong algorithm', { algorithm: 'HS384' }],
  ['invalid subject', { subject: 'not-an-object-id' }],
  ['wrong signature', {}, 'another-signing-key'],
]) {
  test('JWT verification rejects ' + label, () => {
    const token = jwt.sign({sid:'a'.repeat(64),sv:0}, secret || process.env.JWT_SECRET, { ...options, ...overrides });
    assert.throws(() => verifyAccessToken(token));
  });
}

test('JWT verification rejects tokens without expiration', () => {
  const { expiresIn, ...withoutExpiry } = options;
  assert.throws(() => verifyAccessToken(jwt.sign({sid:'a'.repeat(64),sv:0}, process.env.JWT_SECRET, withoutExpiry)));
});

test('JWT configuration refuses an empty signing secret', () => {
  const previous = process.env.JWT_SECRET;
  try {
    process.env.JWT_SECRET = '   ';
    assert.throws(getJwtSecret, /JWT_SECRET/);
  } finally {
    process.env.JWT_SECRET = previous;
  }
});
