const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createEncryption } = require('../dist/config/encryption');
const { loadSettings } = require('../dist/config/settings');
const context = { collection: 'body_measurements', authUserId: '507f1f77bcf86cd799439011', id: '507f1f77bcf86cd799439012', version: 1 };

test('authenticated encryption round-trips, uses distinct IVs and never stores plaintext', () => {
  const encryption = createEncryption(randomBytes(32));
  const value = { note: 'SYNTHETIC_PRIVATE_MARKER', value: 75000 };
  const first = encryption.encrypt(value, context), second = encryption.encrypt(value, context);
  assert.notEqual(first.iv, second.iv);
  assert.notEqual(first.ciphertext, second.ciphertext);
  assert.deepEqual(encryption.decrypt(first, context), value);
  assert.equal(JSON.stringify(first).includes(value.note), false);
});
for (const [label, patch] of [
  ['owner', { authUserId: '507f1f77bcf86cd799439099' }],
  ['record', { id: '507f1f77bcf86cd799439098' }],
  ['collection', { collection: 'user_goals' }],
  ['version', { version: 2 }],
]) {
  test('ciphertext cannot be moved across ' + label, () => {
    const encryption = createEncryption(randomBytes(32)), envelope = encryption.encrypt(75000, context);
    assert.throws(() => encryption.decrypt(envelope, { ...context, ...patch }));
  });
}
test('tampering, wrong key and unsupported envelope versions fail closed', () => {
  const encryption = createEncryption(randomBytes(32)), envelope = encryption.encrypt(75000, context);
  const tampered = Buffer.from(envelope.ciphertext, 'base64'); tampered[0] ^= 1;
  assert.throws(() => encryption.decrypt({ ...envelope, ciphertext: tampered.toString('base64') }, context));
  assert.throws(() => createEncryption(randomBytes(32)).decrypt(envelope, context));
  assert.throws(() => encryption.decrypt({ ...envelope, keyId: 'unknown' }, context));
  assert.throws(() => createEncryption(Buffer.alloc(1)));
});
test('fingerprints are deterministic per key but cannot be compared across keys', () => {
  const encryption = createEncryption(randomBytes(32));
  assert.equal(encryption.fingerprint({ value: 75000 }), encryption.fingerprint({ value: 75000 }));
  assert.notEqual(encryption.fingerprint({ value: 75000 }), createEncryption(randomBytes(32)).fingerprint({ value: 75000 }));
});
test('app initialization cannot bypass the encryption-key requirement', () => {
  const { createApp } = require('../dist/app');
  assert.throws(() => createApp({ authServiceUrl: 'http://127.0.0.1:3001', dataMode: 'synthetic' }, {}, {}), /requires an encryption key/);
});
test('only disabled or explicit synthetic mode is accepted and key material stays out of settings errors', () => {
  const previous = { ...process.env };
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'goleve-user-key-'));
  const file = path.join(directory, 'synthetic.key');
  try {
    process.env.AUTH_SERVICE_URL = 'http://127.0.0.1:3001';
    delete process.env.USER_DATA_MODE; delete process.env.USER_DATA_KEY_FILE;
    assert.equal(loadSettings().dataMode, 'disabled');
    process.env.USER_DATA_MODE = 'real';
    assert.throws(loadSettings, /supports only/);
    process.env.USER_DATA_MODE = 'synthetic';
    assert.throws(loadSettings, /USER_DATA_KEY_FILE/);
    process.env.USER_DATA_KEY_FILE = file;
    fs.writeFileSync(file, 'CANARY_KEY');
    assert.throws(loadSettings, (error) => !error.message.includes('CANARY'));
    fs.writeFileSync(file, randomBytes(32).toString('hex'));
    assert.equal(loadSettings().encryptionKey.length, 32);
    process.env.AUTH_SERVICE_URL = 'http://user:password@127.0.0.1:3001';
    assert.throws(loadSettings, /without credentials/);
  } finally {
    for (const key of ['AUTH_SERVICE_URL', 'USER_DATA_MODE', 'USER_DATA_KEY_FILE']) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
    // Remove only this test-created file/directory; no project data or volumes.
    fs.unlinkSync(file);
    fs.rmdirSync(directory);
  }
});
