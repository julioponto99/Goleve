'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const cp = require('node:child_process');
const mongoose = require('mongoose');
const { paymentSchema } = require('../dist/models/payment.model');
const { PaymentService } = require('../dist/services/payment.service');
const { loadPaymentFixtures } = require('../dist/config/fixtures');
const { MAX_OUTBOX_EVENTS } = require('../dist/events/outbox');

const enabled = !!process.env.PAYMENT_CONFIRMATION_TEST_MONGO_URI;
const connections = [], fixtures = loadPaymentFixtures('fix-approve:2500:approve,fix-decline:999:decline');
const collection = 'payment_confirmation_tests_' + randomUUID().replaceAll('-', '');
let connection, models, peerModels;
const context = owner => ({ identity: { id: owner, userType: 'utilizador' }, requestId: 'fictional-confirmation-test' });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const receipt = () => ({ outcome: 'approve', transactionReference: 'mock_fix_' + randomUUID() });
const create = async (service, reference = 'fix-approve') => {
  const ctx = context(new mongoose.Types.ObjectId().toHexString());
  const payment = await service.create(ctx, { priceReference: reference, amountCents: reference === 'fix-decline' ? 999 : 2500, serviceReference: 'fictional-confirmation' }, randomUUID());
  return { ctx, payment };
};
const faulty = (target, method, handler) => new Proxy(target, { get(model, key) {
  if (key === method) return (...args) => handler(model[method].bind(model), ...args);
  const value = Reflect.get(model, key); return typeof value === 'function' ? value.bind(model) : value;
} });
before(async () => {
  if (!enabled) return;
  const uri = new URL(process.env.PAYMENT_CONFIRMATION_TEST_MONGO_URI), instance = process.env.PAYMENT_FIX_INSTANCE;
  assert.match(instance || '', /^[a-f0-9]{16}$/);
  assert.equal(uri.hostname, 'mongodb'); assert.equal(uri.username, 'integration_payment');
  assert.equal(uri.pathname, '/goleve_notification59_' + instance + '_payment');
  assert.equal(uri.searchParams.get('authSource'), uri.pathname.slice(1));
  connection = await mongoose.createConnection(uri.toString(), { serverSelectionTimeoutMS: 5000 }).asPromise();
  const peer = await mongoose.createConnection(uri.toString(), { serverSelectionTimeoutMS: 5000 }).asPromise();
  connections.push(connection, peer);
  models = { Payment: connection.model('ConfirmationCase', paymentSchema, collection) };
  peerModels = { Payment: peer.model('ConfirmationCase', paymentSchema, collection) };
  await models.Payment.init();
});
after(async () => { await Promise.all(connections.map(c => c.close())); });
const check = (name, work) => test(name, { skip: !enabled }, work);

check('two independent service instances and Mongo connections dispatch only once', async () => {
  let calls = 0, providerKey; const entered = deferred(), release = deferred();
  const bank = { async authorize(id, fixture, request) { calls++; providerKey = request.idempotencyKey; entered.resolve(); await release.promise; return receipt(); } };
  const a = new PaymentService(models, fixtures, bank), b = new PaymentService(peerModels, fixtures, bank);
  const { ctx, payment } = await create(a), first = a.confirm(ctx, payment.id, 'first-key');
  try {
    await entered.promise;
    const claimed = await models.Payment.findById(payment.id);
    assert.equal(claimed.bankAttempt.status, 'processing'); assert.equal(claimed.notificationOutbox.length, 0);
    await assert.rejects(b.confirm(ctx, payment.id, 'second-key'), { code: 'PAYMENT_PROCESSING', status: 409 });
    await assert.rejects(b.confirm(ctx, payment.id, 'first-key'), { code: 'PAYMENT_PROCESSING' });
    assert.equal(calls, 1); assert.equal(providerKey, 'goleve:payment:' + payment.id);
  } finally { release.resolve(); }
  assert.equal((await first).state, 'approved');
  const persisted = await models.Payment.findById(payment.id);
  assert.equal(persisted.history.filter(e => e.state === 'approved').length, 1);
  assert.equal(persisted.notificationOutbox.filter(e => e.type === 'payment.simulated.approved.v1').length, 1);
  assert.equal((await b.confirm(ctx, payment.id, 'first-key')).transactionReference, persisted.transactionReference);
  await assert.rejects(b.confirm(ctx, payment.id, 'second-key'), { code: 'INVALID_STATE' }); assert.equal(calls, 1);
});

check('simultaneous confirmations with the same key have one durable winner', async () => {
  let calls = 0; const bank = { async authorize() { calls++; return receipt(); } };
  const a = new PaymentService(models, fixtures, bank), b = new PaymentService(peerModels, fixtures, bank);
  const { ctx, payment } = await create(a);
  const outcomes = await Promise.allSettled([a.confirm(ctx, payment.id, 'same-key'), b.confirm(ctx, payment.id, 'same-key')]);
  assert(outcomes.some(o => o.status === 'fulfilled')); assert.equal(calls, 1);
  for (const o of outcomes) if (o.status === 'rejected') assert.equal(o.reason.code, 'PAYMENT_PROCESSING');
  assert.equal((await a.confirm(ctx, payment.id, 'same-key')).state, 'approved'); assert.equal(calls, 1);
});

check('failure before claim persistence is safe to retry and never dispatches early', async () => {
  let calls = 0; const bank = { async authorize() { calls++; return receipt(); } };
  const service = new PaymentService(models, fixtures, bank), { ctx, payment } = await create(service);
  const failing = new PaymentService({ Payment: faulty(models.Payment, 'findOneAndUpdate', async () => { throw Error('synthetic pre-claim failure'); }) }, fixtures, bank);
  await assert.rejects(failing.confirm(ctx, payment.id, 'retry-key'), /synthetic pre-claim failure/);
  assert.equal(calls, 0); assert.equal((await models.Payment.findById(payment.id)).bankAttempt, undefined);
  assert.equal((await service.confirm(ctx, payment.id, 'retry-key')).state, 'approved'); assert.equal(calls, 1);
});

check('lost acknowledgement after durable claim never redispatches', async () => {
  let calls = 0; const bank = { async authorize() { calls++; return receipt(); } };
  const normal = new PaymentService(models, fixtures, bank), { ctx, payment } = await create(normal);
  const failing = new PaymentService({ Payment: faulty(models.Payment, 'findOneAndUpdate', async (original, ...args) => {
    await original(...args); throw Error('synthetic lost claim acknowledgement');
  }) }, fixtures, bank);
  await assert.rejects(failing.confirm(ctx, payment.id, 'lost-ack'), /synthetic lost claim acknowledgement/);
  assert.equal(calls, 0);
  const claimed = await models.Payment.findById(payment.id), restarted = new PaymentService(peerModels, fixtures, bank, { now: () => new Date(claimed.bankAttempt.deadlineAt.getTime() + 1) });
  const recovered = await restarted.get(ctx, payment.id);
  assert.equal(recovered.state, 'pending'); assert.equal(recovered.reconciliationRequired, true);
  await assert.rejects(restarted.confirm(ctx, payment.id, 'lost-ack'), { code: 'PAYMENT_RECONCILIATION_REQUIRED' });
  await assert.rejects(restarted.confirm(ctx, payment.id, 'another-key'), { code: 'PAYMENT_RECONCILIATION_REQUIRED' }); assert.equal(calls, 0);
});

check('timeout and late success stay unknown with one notification and no retry', async () => {
  let calls = 0, signal; const late = deferred();
  const bank = { async authorize(id, fixture, request) { calls++; signal = request.signal; return late.promise; } };
  const fixedNow = new Date();
  const service = new PaymentService(models, fixtures, bank, { bankTimeoutMs: 25, now: () => fixedNow }), { ctx, payment } = await create(service);
  await assert.rejects(service.confirm(ctx, payment.id, 'timeout-key'), { status: 503, code: 'PAYMENT_RECONCILIATION_REQUIRED' });
  assert.equal(signal.aborted, true); late.resolve(receipt()); await new Promise(r => setImmediate(r));
  for (let i = 0; i < 2; i++) {
    const restarted = new PaymentService(peerModels, fixtures, bank);
    await assert.rejects(restarted.confirm(ctx, payment.id, 'retry-' + i), { code: 'PAYMENT_RECONCILIATION_REQUIRED' });
    await assert.rejects(restarted.cancel(ctx, payment.id, 'cancel-' + i), { code: 'PAYMENT_RECONCILIATION_REQUIRED' });
  }
  const doc = await models.Payment.findById(payment.id);
  assert.equal(doc.state, 'pending'); assert.equal(doc.bankAttempt.status, 'unknown'); assert.equal(doc.transactionReference, undefined);
  assert.equal(doc.history.filter(e => e.state === 'approved').length, 0);
  assert.deepEqual(doc.notificationOutbox.map(e => e.type), ['payment.simulated.unknown.v1']); assert.equal(calls, 1);
});

check('provider rejection and malformed receipt are uncertain, never an invented decline', async () => {
  for (const authorize of [async () => { throw Error('synthetic network failure'); }, async () => ({ outcome: 'approve', transactionReference: 'invalid' })]) {
    let calls = 0; const bank = { async authorize(...args) { calls++; return authorize(...args); } };
    const service = new PaymentService(models, fixtures, bank), { ctx, payment } = await create(service);
    await assert.rejects(service.confirm(ctx, payment.id, 'unknown-key'), { code: 'PAYMENT_RECONCILIATION_REQUIRED' });
    await assert.rejects(service.confirm(ctx, payment.id, 'retry-key'), { code: 'PAYMENT_RECONCILIATION_REQUIRED' });
    assert.equal((await service.get(ctx, payment.id)).state, 'pending'); assert.equal(calls, 1);
  }
});

check('expired claim cannot be reacquired and a stale original worker cannot approve', async () => {
  let calls = 0, clock = new Date(); const entered = deferred(), release = deferred();
  const bank = { async authorize() { calls++; entered.resolve(); await release.promise; return receipt(); } };
  const original = new PaymentService(models, fixtures, bank, { now: () => clock }), { ctx, payment } = await create(original);
  const pending = original.confirm(ctx, payment.id, 'original-key');
  const rejected = assert.rejects(pending, { code: 'PAYMENT_RECONCILIATION_REQUIRED' });
  try {
    await entered.promise;
    const claimed = await models.Payment.findById(payment.id); clock = new Date(claimed.bankAttempt.deadlineAt.getTime() + 1);
    const restarted = new PaymentService(peerModels, fixtures, bank, { now: () => clock });
    await Promise.all([original.get(ctx, payment.id), restarted.get(ctx, payment.id)]);
    await assert.rejects(restarted.confirm(ctx, payment.id, 'fresh-key'), { code: 'PAYMENT_RECONCILIATION_REQUIRED' });
    assert.equal(calls, 1);
  } finally { release.resolve(); }
  await rejected;
  const doc = await models.Payment.findById(payment.id);
  assert.equal(doc.state, 'pending'); assert.equal(doc.bankAttempt.status, 'unknown');
  assert.deepEqual(doc.notificationOutbox.map(e => e.type), ['payment.simulated.unknown.v1']);
});

check('an unavailable database after dispatch keeps the durable fence for later recovery', async () => {
  let calls = 0; const bank = { async authorize() { calls++; return receipt(); } };
  const service = new PaymentService(models, fixtures, bank), { ctx, payment } = await create(service);
  const failing = new PaymentService({ Payment: faulty(models.Payment, 'updateOne', async (original, filter, changes, ...args) => {
    if (changes.$set?.state || changes.$set?.['bankAttempt.status']) throw Error('synthetic database outage');
    return original(filter, changes, ...args);
  }) }, fixtures, bank);
  await assert.rejects(failing.confirm(ctx, payment.id, 'outage-key'), { code: 'PAYMENT_RECONCILIATION_REQUIRED' });
  const claimed = await models.Payment.findById(payment.id); assert.equal(claimed.bankAttempt.status, 'processing');
  const restarted = new PaymentService(peerModels, fixtures, bank, { now: () => new Date(claimed.bankAttempt.deadlineAt.getTime() + 1) });
  assert.equal((await restarted.get(ctx, payment.id)).reconciliationRequired, true);
  await assert.rejects(restarted.confirm(ctx, payment.id, 'outage-key'), { code: 'PAYMENT_RECONCILIATION_REQUIRED' }); assert.equal(calls, 1);
  assert.deepEqual((await models.Payment.findById(payment.id)).notificationOutbox.map(e => e.type), ['payment.simulated.unknown.v1']);
});

check('settlement persistence failure retains the claim and unknown event atomically', async () => {
  let calls = 0; const bank = { async authorize() { calls++; return receipt(); } };
  const service = new PaymentService(models, fixtures, bank), { ctx, payment } = await create(service);
  const failing = new PaymentService({ Payment: faulty(models.Payment, 'updateOne', async (original, filter, changes, ...args) => {
    if (changes.$set?.state === 'approved') throw Error('synthetic settlement unavailable');
    return original(filter, changes, ...args);
  }) }, fixtures, bank);
  await assert.rejects(failing.confirm(ctx, payment.id, 'persist-key'), { code: 'PAYMENT_RECONCILIATION_REQUIRED' });
  await assert.rejects(service.confirm(ctx, payment.id, 'retry'), { code: 'PAYMENT_RECONCILIATION_REQUIRED' });
  const doc = await models.Payment.findById(payment.id);
  assert.equal(doc.bankAttempt.status, 'unknown'); assert.equal(doc.notificationOutbox.length, 1); assert.equal(calls, 1);
});

check('lost settlement acknowledgement returns the already persisted receipt without another bank call', async () => {
  let calls = 0; const bank = { async authorize() { calls++; return receipt(); } };
  const service = new PaymentService(models, fixtures, bank), { ctx, payment } = await create(service);
  const failing = new PaymentService({ Payment: faulty(models.Payment, 'updateOne', async (original, filter, changes, ...args) => {
    const result = await original(filter, changes, ...args);
    if (changes.$set?.state === 'approved') throw Error('synthetic settlement acknowledgement lost');
    return result;
  }) }, fixtures, bank);
  assert.equal((await failing.confirm(ctx, payment.id, 'receipt-key')).state, 'approved');
  assert.equal((await service.confirm(ctx, payment.id, 'receipt-key')).state, 'approved');
  assert.equal((await models.Payment.findById(payment.id)).notificationOutbox.length, 1); assert.equal(calls, 1);
});

check('cancellation cannot win after dispatch claim and cannot reopen settled payments', async () => {
  let calls = 0; const entered = deferred(), release = deferred();
  const service = new PaymentService(models, fixtures, { async authorize() { calls++; entered.resolve(); await release.promise; return receipt(); } });
  const { ctx, payment } = await create(service), pending = service.confirm(ctx, payment.id, 'charge-key');
  try { await entered.promise; await assert.rejects(service.cancel(ctx, payment.id, 'cancel-key'), { code: 'PAYMENT_PROCESSING' }); }
  finally { release.resolve(); }
  assert.equal((await pending).state, 'approved'); await assert.rejects(service.cancel(ctx, payment.id, 'cancel-key'), { code: 'INVALID_STATE' }); assert.equal(calls, 1);
});

check('a cancellation before confirmation dispatches zero calls and preserves the cancellation event', async () => {
  let calls = 0; const service = new PaymentService(models, fixtures, { async authorize() { calls++; return receipt(); } });
  const { ctx, payment } = await create(service);
  assert.equal((await service.cancel(ctx, payment.id, 'cancel-key')).state, 'cancelled');
  await assert.rejects(service.confirm(ctx, payment.id, 'charge-key'), { code: 'INVALID_STATE' });
  assert.equal(calls, 0); assert.deepEqual((await models.Payment.findById(payment.id)).notificationOutbox.map(e => e.type), ['payment.simulated.cancelled.v1']);
});

check('foreign owners, full outbox and unavailable fixtures cannot acquire a bank claim', async () => {
  let calls = 0; const service = new PaymentService(models, fixtures, { async authorize() { calls++; return receipt(); } });
  const { ctx, payment } = await create(service);
  await assert.rejects(service.confirm(context(new mongoose.Types.ObjectId().toHexString()), payment.id, 'foreign-key'), { code: 'NOT_FOUND' });
  await assert.rejects(new PaymentService(models, new Map()).confirm(ctx, payment.id, 'missing-key'), { code: 'PRICE_NOT_AVAILABLE' });
  await models.Payment.updateOne({ _id: payment.id }, { $set: { notificationOutbox: Array.from({ length: MAX_OUTBOX_EVENTS }, () => ({ eventId: randomUUID(), status: 'pending' })) } });
  await assert.rejects(service.confirm(ctx, payment.id, 'full-key'), { code: 'NOTIFICATION_OUTBOX_FULL' });
  assert.equal((await models.Payment.findById(payment.id)).bankAttempt, undefined); assert.equal(calls, 0);
});

check('a legacy pending document without bankAttempt remains compatible and an explicit decline stays final', async () => {
  const service = new PaymentService(models, fixtures), { ctx, payment } = await create(service, 'fix-decline');
  assert.equal((await models.Payment.findById(payment.id)).bankAttempt, undefined);
  const declined = await service.confirm(ctx, payment.id, 'decline-key'); assert.equal(declined.state, 'declined');
  assert.equal((await service.confirm(ctx, payment.id, 'decline-key')).transactionReference, declined.transactionReference);
  assert.deepEqual((await models.Payment.findById(payment.id)).notificationOutbox.map(e => e.type), ['payment.simulated.declined.v1']);
});

for (const stage of ['after-claim', 'after-bank']) check('actual child process exit ' + stage + ' recovers without redispatch', async () => {
  assert.equal(process.env.PAYMENT_FIX_PRELOAD, '1', 'Run with the isolated integration launcher');
  const service = new PaymentService(models, fixtures), { ctx, payment } = await create(service);
  const worker = cp.spawnSync(process.execPath, ['--require', '/integration/payment-confirmation.cjs', '-e', `
    const mongoose=require('mongoose'), {PaymentService}=require(process.cwd()+'/dist/services/payment.service'), {paymentSchema}=require(process.cwd()+'/dist/models/payment.model');
    const {loadPaymentFixtures}=require(process.cwd()+'/dist/config/fixtures');
    void(async()=>{const c=await mongoose.createConnection(process.env.PAYMENT_CONFIRMATION_TEST_MONGO_URI).asPromise();
      const Payment=c.model('CrashCase',paymentSchema,process.env.PAYMENT_FIX_COLLECTION), original=Payment.findOneAndUpdate.bind(Payment);
      if(process.env.PAYMENT_FIX_STAGE==='after-claim')Payment.findOneAndUpdate=async(...args)=>{await original(...args);process.exit(77);};
      const bank={async authorize(){await c.db.collection(process.env.PAYMENT_FIX_COLLECTION+'_receipts').insertOne({paymentId:process.env.PAYMENT_FIX_PAYMENT});process.exit(78);}};
      await new PaymentService({Payment},loadPaymentFixtures('fix-approve:2500:approve'),bank).confirm({identity:{id:process.env.PAYMENT_FIX_OWNER,userType:'utilizador'},requestId:'fictional-crash'},process.env.PAYMENT_FIX_PAYMENT,'crash-key');
    })().catch(()=>process.exit(79));
  `], { env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=32', PAYMENT_FIX_STAGE: stage, PAYMENT_FIX_PAYMENT: payment.id, PAYMENT_FIX_OWNER: ctx.identity.id, PAYMENT_FIX_COLLECTION: collection }, encoding: 'utf8', timeout: 15000 });
  assert.equal(worker.status, stage === 'after-claim' ? 77 : 78, worker.stderr);
  const doc = await models.Payment.findById(payment.id); assert.equal(doc.bankAttempt.status, 'processing');
  let retries = 0; const restarted = new PaymentService(peerModels, fixtures, { async authorize() { retries++; return receipt(); } }, { now: () => new Date(doc.bankAttempt.deadlineAt.getTime() + 1) });
  await Promise.all([restarted.get(ctx, payment.id), restarted.list(ctx, 10)]);
  await assert.rejects(restarted.confirm(ctx, payment.id, 'crash-key'), { code: 'PAYMENT_RECONCILIATION_REQUIRED' });
  assert.equal(retries, 0);
  assert.equal(await connection.db.collection(collection + '_receipts').countDocuments({ paymentId: payment.id }), stage === 'after-bank' ? 1 : 0);
  assert.deepEqual((await models.Payment.findById(payment.id)).notificationOutbox.map(e => e.type), ['payment.simulated.unknown.v1']);
});
