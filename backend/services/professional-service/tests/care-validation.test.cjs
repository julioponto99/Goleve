const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');
const { validateRelationship, validateRelationshipCommand, relationshipPage } = require('../dist/config/relationship-validation');
const { loadSettings } = require('../dist/config/settings');
const { relationshipSchema } = require('../dist/models/care-relationship.model');
const { careRelationshipChanged } = require('../dist/events/care-relationship.events');
const input = { professionalId: '507f1f77bcf86cd799439011', capabilityId: '507f1f77bcf86cd799439012', relationshipKind: 'personal_training' };
test('relationship input accepts only a target and canonical activity, never participant identity or permissions', () => {
  assert.deepEqual(validateRelationship(input), input);
  for (const patch of [{ subjectAuthUserId: '507f1f77bcf86cd799439013' }, { professionalAuthUserId: '507f1f77bcf86cd799439014' },
    { userType: 'profissional' }, { status: 'accepted' }, { isOpen: true }, { sensitiveDataAuthorized: true }, { grant: '*' },
    { expiresAt: '2999-01-01' }, { history: [] }, { reason: 'Synthetic private health note' }, { relationshipKind: 'PT' },
    { professionalId: { $ne: '' } }, { capabilityId: 'bad' }]) assert.throws(() => validateRelationship({ ...input, ...patch }), { statusCode: 400 });
});
test('state commands reject arbitrary data and list filters cannot select another person', () => {
  validateRelationshipCommand({});
  for (const data of [null, [], { status: 'accepted' }, { reason: 'no clinical notes' }, { actor: 'other' }]) assert.throws(() => validateRelationshipCommand(data), { statusCode: 400 });
  assert.deepEqual(relationshipPage({ status: 'accepted', limit: '1' }), { limit: 1, status: 'accepted' });
  for (const query of [{ status: 'active' }, { status: 'rejected' }, { status: { $ne: '' } }, { subjectAuthUserId: 'other' }, { limit: '101' }]) assert.throws(() => relationshipPage(query), { statusCode: 400 });
});
test('request lifetime defaults to seven days and rejects invalid or unbounded server configuration', () => {
  const keys = ['AUTH_SERVICE_URL', 'PROFESSIONAL_DATA_MODE', 'PROFESSIONAL_REVIEW_MODE', 'PROFESSIONAL_REVIEWER_IDS', 'CARE_INVITATION_TTL_DAYS'];
  const before = { ...process.env };
  try {
    process.env.AUTH_SERVICE_URL = 'http://localhost:3001'; process.env.PROFESSIONAL_DATA_MODE = 'synthetic';
    delete process.env.PROFESSIONAL_REVIEW_MODE; delete process.env.PROFESSIONAL_REVIEWER_IDS; delete process.env.CARE_INVITATION_TTL_DAYS;
    assert.equal(loadSettings().careInvitationTtlDays, 7);
    process.env.CARE_INVITATION_TTL_DAYS = '30'; assert.equal(loadSettings().careInvitationTtlDays, 30);
    for (const value of ['0', '-1', '1.5', 'Infinity', '366', '7 days', ' 7']) { process.env.CARE_INVITATION_TTL_DAYS = value; assert.throws(loadSettings); }
  } finally { for (const key of keys) { if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key]; } }
});
test('relationship schema is strict, hides receipts/history, bounds events, and never declares a destructive TTL', async () => {
  const connection = mongoose.createConnection();
  try {
    const Model = connection.model('CareUnitFixture', relationshipSchema), now = new Date();
    const event = { eventId: randomUUID(), relationshipVersion: 1, action: 'created', to: 'pending', actorType: 'requester',
      actorAuthUserId: '507f1f77bcf86cd799439013', occurredAt: now, requestId: randomUUID(), reasonCode: 'request_created' };
    const data = { ...input, subjectAuthUserId: '507f1f77bcf86cd799439013', professionalAuthUserId: '507f1f77bcf86cd799439014',
      status: 'pending', isOpen: true, version: 1, expiresAt: new Date(now.getTime() + 86400000), history: [event], creationKeyHash: 'synthetic', creationFingerprint: 'synthetic' };
    await new Model(data).validate();
    await assert.rejects(new Model({ ...data, history: Array(9).fill(event) }).validate());
    assert.throws(() => new Model({ ...data, weight: 72000 }));
    for (const field of ['history', 'creationKeyHash', 'creationFingerprint']) assert.equal(Model.schema.path(field).options.select, false);
    assert.equal(Model.schema.indexes().some(([, options]) => 'expireAfterSeconds' in options), false);
    const unique = Model.schema.indexes().find(([keys, options]) => options.unique && keys.relationshipKind);
    assert.deepEqual(unique[0], { subjectAuthUserId: 1, professionalId: 1, relationshipKind: 1 });
    assert.deepEqual(unique[1].partialFilterExpression, { isOpen: true });
  } finally { await connection.close(); }
});
test('future RabbitMQ envelope is deterministic, minimal and contains no participants or payloads', () => {
  const event = { eventId: randomUUID(), relationshipVersion: 2, action: 'accept', from: 'pending', to: 'accepted', actorType: 'professional',
    actorAuthUserId: '507f1f77bcf86cd799439014', occurredAt: new Date('2026-01-01T10:00:00Z'), requestId: randomUUID(), reasonCode: 'professional_accepted',
    commandKeyHash: 'synthetic-secret-receipt' };
  const envelope = careRelationshipChanged('507f1f77bcf86cd799439015', event);
  assert.deepEqual(careRelationshipChanged('507f1f77bcf86cd799439015', event), envelope);
  assert.equal(envelope.eventType, 'care.relationship.changed.v1');
  assert.equal(JSON.stringify(envelope).includes(event.actorAuthUserId), false); assert.equal(JSON.stringify(envelope).includes('secret-receipt'), false);
  assert.deepEqual(Object.keys(envelope.payload).sort(), ['relationshipId', 'status', 'version']);
});
