const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { createEncryption } = require('../dist/config/encryption');
const { safeText } = require('../dist/config/privacy');
const { object, identifier, instant, pagination } = require('../dist/config/validation');
const { UnavailableProvider, HttpJsonProvider } = require('../dist/providers/provider');

test('AI payload encryption is authenticated and bound to owner, collection and resource', () => {
  const encryption = createEncryption(randomBytes(32)), binding = 'message:synthetic-owner:synthetic-resource';
  const payload = { content: 'Synthetic activity question' }, envelope = encryption.encrypt(payload, binding);
  assert.equal(JSON.stringify(envelope).includes(payload.content), false);
  assert.deepEqual(encryption.decrypt(envelope, binding), payload);
  assert.throws(() => encryption.decrypt(envelope, binding + ':other-owner'));
  assert.throws(() => createEncryption(randomBytes(32)).decrypt(envelope, binding));
  assert.notEqual(encryption.encrypt(payload, binding).iv, envelope.iv);
});
test('AI input rejects credential-shaped text and removes contact details', () => {
  for (const value of ['Bearer synthetic-token', 'password=synthetic-secret', 'mongodb://synthetic-host/db', '-----BEGIN PRIVATE KEY-----']) assert.throws(() => safeText(value, 2000));
  assert.equal(safeText('Synthetic contact demo@example.invalid +351 900 000 000', 2000).includes('example.invalid'), false);
});
test('strict validation rejects arbitrary fields, invalid calendar dates and pagination', () => {
  assert.throws(() => object({ ownerId: 'untrusted' }, [])); assert.throws(() => identifier('arbitrary'));
  assert.throws(() => instant('2027-02-30T10:00:00Z')); assert.throws(() => instant('2027-01-01T10:00:00'));
  assert.equal(instant('2027-01-01T11:00:00+01:00').toISOString(), '2027-01-01T10:00:00.000Z');
  assert.throws(() => pagination({ limit: ['1', '2'] })); assert.throws(() => pagination({ limit: '51' }));
});
test('missing provider is explicitly unavailable and never synthesises an answer', async () => {
  await assert.rejects(new UnavailableProvider().generate({}), { code: 'AI_PROVIDER_UNAVAILABLE' });
});
test('HTTP model adapter has a bounded response and does not forward a human JWT', async () => {
  const original = global.fetch; let captured;
  try {
    global.fetch = async (url, options) => { captured = { url, options }; return new Response(JSON.stringify({ reply: 'Synthetic response', recommendations: [], proposals: [] })); };
    const provider = new HttpJsonProvider('https://model.example.invalid/generate', 'synthetic-model');
    const result = await provider.generate({ purpose: 'organisation', messages: [], context: {}, tools: [] });
    assert.equal(result.reply, 'Synthetic response'); assert.equal(captured.options.headers.Authorization, undefined);
    assert.equal(JSON.parse(captured.options.body).store, false);
    global.fetch = async () => new Response('x'.repeat(32769)); await assert.rejects(provider.generate({}), { code: 'AI_PROVIDER_UNAVAILABLE' });
    global.fetch = async () => { throw Error('Synthetic private transport detail'); }; await assert.rejects(provider.generate({}), { code: 'AI_PROVIDER_UNAVAILABLE' });
  } finally { global.fetch = original; }
});

test('closed tool catalogue rejects arbitrary destinations, roles, fields and clinical goal types', () => {
  const { validateTool } = require('../dist/services/tools');
  for (const tool of ['http.request', 'mongo.update', 'payment.create', 'auth.assign_role', 'professional.approve']) assert.throws(() => validateTool(tool, {}));
  assert.throws(() => validateTool('hydration.set_goal', { targetMl: 2000, timezone: 'UTC', url: 'https://synthetic.invalid' }));
  assert.throws(() => validateTool('user.create_activity_goal', { title: 'Synthetic', metric: 'body_weight', value: 70 }));
  assert.throws(() => validateTool('training.create_plan', { title: 'Synthetic', environment: 'home', exercises: [{ exerciseId: '507f1f77bcf86cd799439011', sets: 1, repetitions: 8, ownerId: 'forged' }] }));
});
test('clinical-looking output and medication doses are refused rather than presented as advice', () => {
  const { wellbeingOutput } = require('../dist/config/privacy');
  for (const content of ['Diagnóstico: condição fictícia', 'Synthetic prescription 20 mg', 'I diagnose a synthetic illness']) assert.throws(() => wellbeingOutput(content, 4000));
  assert.equal(wellbeingOutput('Synthetic suggestion to organise a walk', 4000), 'Synthetic suggestion to organise a walk');
});
test('default configuration is disabled without reading keys; production and mock providers fail closed', () => {
  const env = { ...process.env }, { loadSettings } = require('../dist/config/settings');
  try {
    delete process.env.AI_COACH_ENABLED; process.env.AI_COACH_DATA_KEY_FILE = 'synthetic-nonexistent-file'; assert.equal(loadSettings().enabled, false);
    process.env.AI_COACH_ENABLED = 'true'; process.env.AI_COACH_MODE = 'isolated'; process.env.NODE_ENV = 'production'; assert.throws(() => loadSettings(), /restricted/);
    process.env.AI_COACH_ENABLED = 'maybe'; assert.throws(() => loadSettings());
    assert.throws(() => require('../dist/app').createApp({ enabled: false }, { name: 'goleve_ai_test_0000000000000000' }, {}, { provider: {} }), /isolated automated test/);
  } finally { for (const k of Object.keys(process.env)) if (!(k in env)) delete process.env[k]; Object.assign(process.env, env); }
});
test('AI database guard rejects principal database names and non-local hosts before connecting', () => {
  const { validateDatabaseUri } = require('../dist/config/database');
  for (const uri of ['mongodb://127.0.0.1:27017/goleve_ai_coach', 'mongodb://mongodb:27017/goleve_ai_test_0000000000000000', 'mongodb://127.0.0.1:27017/goleve', 'mongodb://127.0.0.1:27017/goleve_ai_test_../../main']) assert.throws(() => validateDatabaseUri(uri));
  assert.doesNotThrow(() => validateDatabaseUri('mongodb://127.0.0.1:33333/goleve_ai_test_0000000000000000_coach?replicaSet=coach57'));
});
test('even a permissive Auth stub cannot waive the Coach audience contract', async () => {
  const fetch = global.fetch, { verifyIdentity } = require('../dist/middlewares/auth.middleware');
  const id = '507f1f77bcf86cd799439011', claims = { sub: id, iss: 'goleve-auth', aud: 'another-service', exp: Math.floor(Date.now() / 1000) + 3600 };
  const token = 'Bearer e30.' + Buffer.from(JSON.stringify(claims)).toString('base64url') + '.synthetic';
  try { global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ user: { id } }) }); await assert.rejects(verifyIdentity('http://auth.example.invalid', token), { code: 'INVALID_TOKEN' }); }
  finally { global.fetch = fetch; }
});
