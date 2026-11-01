const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createConnection } = require('mongoose');
const v = require('../dist/config/validation');
const h = require('../dist/config/http');
const { loadSettings } = require('../dist/config/settings');
const { createProfessionalModels } = require('../dist/models');
const profile = { professionalName: 'Synthetic Professional', countryCode: 'pt', languages: ['pt-pt'] };
const capability = { kind: 'personal_trainer', jurisdictionCountry: 'PT', serviceModes: ['online'] };
const qualification = { qualificationType: 'degree', title: 'Synthetic diploma', issuerName: 'Synthetic issuer' };
const availability = { timeZone: 'Europe/Lisbon', preferredWeekdays: [1], windows: [{ weekday: 1, startMinute: 540, endMinute: 720 }], serviceModes: ['online', 'in_person'] };
test('profile validates declared contact separately from Auth identity and normalizes language/country', () => {
  assert.deepEqual(v.validateProfile({ ...profile, privateContactEmail: ' SYNTHETIC@EXAMPLE.INVALID ' }),
    { professionalName: 'Synthetic Professional', countryCode: 'PT', languages: ['pt-PT'], privateContactEmail: 'synthetic@example.invalid' });
});
for (const [label, patch] of [
  ['short name', { professionalName: 'A' }], ['HTML biography', { biography: '<script>alert(1)</script>' }],
  ['long biography', { biography: 'x'.repeat(2001) }], ['invalid country', { countryCode: 'XX' }],
  ['empty languages', { languages: [] }], ['duplicate language', { languages: ['pt-pt', 'pt-PT'] }],
  ['invalid language', { languages: ['fake language'] }], ['invalid private email', { privateContactEmail: 'bad' }],
  ['contact verified injection', { publicContacts: { email: 'synthetic@example.invalid', verified: true } }],
  ['invalid phone', { publicContacts: { phoneE164: '123' } }], ['owner injection', { authUserId: '507f1f77bcf86cd799439011' }],
  ['role injection', { userType: 'profissional' }], ['state injection', { profileStatus: 'active' }],
  ['directory publication', { directoryVisibility: 'public' }], ['password', { password: 'synthetic-not-a-real-password' }],
  ['credential number', { registrationNumber: 'SYNTHETIC-001' }], ['precise address', { address: 'Synthetic address' }],
  ['Mongo operator', { professionalName: { $ne: '' } }],
]) test('profile rejects ' + label, () => assert.throws(() => v.validateProfile({ ...profile, ...patch }), { statusCode: 400 }));
test('JSON object allowlists reject empty, array and primitive payloads', () => {
  for (const input of [undefined, null, [], 'text', {}, { unexpected: true }]) assert.throws(() => v.validateProfile(input), { statusCode: 400 });
});
for (const [label, patch] of [
  ['unknown kind', { kind: 'doctor' }], ['invalid jurisdiction', { jurisdictionCountry: 'ZZ' }],
  ['future experience', { experienceStartYear: 2999 }], ['fractional experience', { experienceStartYear: 2020.5 }],
  ['duplicate modes', { serviceModes: ['online', 'online'] }], ['empty modes', { serviceModes: [] }],
  ['verified state', { status: 'verified' }], ['reviewer', { verifiedByOperatorId: '507f1f77bcf86cd799439011' }],
  ['title exemption', { titleRequirement: 'not_required' }], ['policy exemption', { requirementPolicyVersion: 'approved' }],
]) test('capability rejects ' + label, () => assert.throws(() => v.validateCapability({ ...capability, ...patch }), { statusCode: 400 }));
test('synthetic specialization catalog is closed and separated by activity', () => {
  for (const kind of ['personal_trainer', 'nutritionist']) {
    const data = v.validateCapability({ ...capability, kind, specializations: [] }); v.validateCapabilityConsistency(data);
  }
  for (const code of ['unapproved', 'synthetic_nutrition_general']) assert.throws(() => v.validateCapabilityConsistency({ ...capability, specializations: [code] }), { statusCode: 400 });
  assert.throws(() => v.validateCapability({ kind: 'nutritionist' }, true), { statusCode: 400 });
  assert.throws(() => v.validateCapability({ jurisdictionCountry: 'ES' }, true), { statusCode: 400 });
});
test('qualification dates, catalog and fixed capability reference are consistent', () => {
  const data = v.validateQualification({ ...qualification, awardedOn: '2020-02-29', expiresOn: '2030-01-01' });
  v.validateQualificationConsistency(data);
  for (const input of [{ ...qualification, awardedOn: '2020-02-30' }, { ...qualification, awardedOn: '2999-01-01' },
    { ...qualification, verificationStatus: 'verified' }, { ...qualification, publishSummary: true }, { ...qualification, evidenceAssetId: '507f1f77bcf86cd799439011' }]) assert.throws(() => v.validateQualification(input), { statusCode: 400 });
  assert.throws(() => v.validateQualificationConsistency({ awardedOn: '2025-01-01', expiresOn: '2024-01-01' }), { statusCode: 400 });
  assert.throws(() => v.validateQualificationConsistency({ specializationCodes: ['synthetic_pt_strength'] }), { statusCode: 400 });
  assert.throws(() => v.validateQualification({ capabilityId: '507f1f77bcf86cd799439011' }, true), { statusCode: 400 });
});
test('availability is a bounded local declaration with explicit IANA zone, weekdays, windows and modes', () => {
  const result = v.validateAvailability(availability); v.validateAvailabilityConsistency(result);
  assert.equal(result.timeZone, 'Europe/Lisbon');
  for (const input of [
    { ...availability, timeZone: 'Mars/Olympus' }, { ...availability, preferredWeekdays: [7] },
    { ...availability, preferredWeekdays: [1, 1] }, { ...availability, serviceModes: ['home_visit'] },
    { ...availability, visibility: 'public' }, { ...availability, operational: true }, { ...availability, windows: [] },
    { ...availability, windows: [{ weekday: 1, startMinute: 720, endMinute: 540 }] },
  ]) assert.throws(() => v.validateAvailability(input), { statusCode: 400 });
  for (const input of [{ ...availability, preferredWeekdays: [2] },
    { ...availability, windows: [...availability.windows, { weekday: 1, startMinute: 600, endMinute: 780 }] }]) assert.throws(() => v.validateAvailabilityConsistency(input), { statusCode: 400 });
  v.validateAvailabilityConsistency({ ...availability, windows: [...availability.windows, { weekday: 1, startMinute: 720, endMinute: 780 }] });
});
test('strong ETags require exact resource/version, with no wildcard or weak-tag update bypass', () => {
  const id = '507f1f77bcf86cd799439011';
  assert.equal(h.expectedVersion(h.entityTag(id, 2), id), 2);
  assert.throws(() => h.expectedVersion(undefined, id), { statusCode: 428 });
  for (const tag of ['*', 'W/"' + id + ':2"', '"507f1f77bcf86cd799439012:2"', '"' + id + ':0"']) assert.throws(() => h.expectedVersion(tag, id), { statusCode: 412 });
  assert.throws(() => h.requireCreate(undefined), { statusCode: 428 }); h.requireCreate('*');
});
test('pagination and idempotency keys cannot carry Mongo operators or unbounded lists', () => {
  assert.deepEqual(h.pageOptions({ limit: '1', before: '507f1f77bcf86cd799439011' }), { limit: 1, before: '507f1f77bcf86cd799439011' });
  for (const q of [{ limit: '101' }, { limit: ['1'] }, { before: { $gt: '' } }, { authUserId: 'other' }]) assert.throws(() => h.pageOptions(q), { statusCode: 400 });
  for (const key of [undefined, 'spaces not allowed', 'x'.repeat(129)]) assert.throws(() => h.idempotencyKey(key), { statusCode: 400 });
});
test('settings reject real data mode and credential-bearing Auth URLs', () => {
  const previous = { ...process.env };
  try {
    delete process.env.PROFESSIONAL_DATA_MODE; process.env.AUTH_SERVICE_URL = 'http://127.0.0.1:3001';
    assert.equal(loadSettings().dataMode, 'disabled');
    process.env.PROFESSIONAL_DATA_MODE = 'synthetic'; assert.equal(loadSettings().dataMode, 'synthetic');
    for (const mode of ['real', 'production', 'true']) { process.env.PROFESSIONAL_DATA_MODE = mode; assert.throws(loadSettings, /supports only/); }
    process.env.PROFESSIONAL_DATA_MODE = 'disabled';
    for (const url of ['http://synthetic:password@localhost:3001', 'http://localhost:3001/path', 'file:///tmp/auth']) { process.env.AUTH_SERVICE_URL = url; assert.throws(loadSettings); }
  } finally {
    for (const key of ['PROFESSIONAL_DATA_MODE', 'AUTH_SERVICE_URL']) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
});
test('Mongoose schemas are strict, keep unverified defaults and have no credential or Auth collections', async () => {
  const connection = createConnection();
  try {
    const models = createProfessionalModels(connection), owner = '507f1f77bcf86cd799439011';
    const p = new models.Profile({ ...v.validateProfile(profile), authUserId: owner }); await p.validate();
    assert.equal(p.profileStatus, 'draft'); assert.equal(p.directoryVisibility, 'hidden');
    const c = new models.Capability({ ...capability, authUserId: owner, professionalId: p._id }); await c.validate();
    assert.equal(c.status, 'draft'); assert.equal(c.titleRequirement, 'pending_legal_assessment');
    const q = new models.Qualification({ ...qualification, professionalId: p._id, authUserId: owner, idempotencyKey: 'synthetic', inputFingerprint: 'synthetic' }); await q.validate();
    assert.equal(q.verificationStatus, 'unverified'); assert.equal(q.publishSummary, false);
    assert.equal(models.Qualification.schema.path('inputFingerprint').options.select, false);
    for (const name of ['passwordHash', 'registrationNumber', 'userType']) assert.equal(models.Profile.schema.path(name), undefined);
    assert.throws(() => new models.Profile({ ...profile, authUserId: owner, password: 'synthetic' }));
    const a = new models.Availability({ ...availability, authUserId: owner, professionalId: p._id, operational: true });
    await assert.rejects(a.validate());
  } finally { await connection.close(); }
});
