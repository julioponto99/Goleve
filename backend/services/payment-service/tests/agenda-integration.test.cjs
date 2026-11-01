const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const path = require('node:path');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { DemoClient, sign, verify, assertDemo, validQuote } = require('../dist/payment-demo/protocol');
const { IntegratedPaymentService } = require('../dist/payment-demo/service');
const { createPaymentModels, initializeModels: initPayments } = require('../dist/models');
const { MockBankProvider } = require('../dist/services/mock-bank.provider');
const pro = createRequire(path.resolve(__dirname, '../../professional-service/package.json'));
const agenda = createRequire(path.resolve(__dirname, '../../agenda-service/package.json'));

describe('Payment + Agenda + Professional: isolated contract and transaction integration', { skip: !process.env.PAYMENT_AGENDA_TEST_MONGO_URI }, () => {
  const root = new URL(process.env.PAYMENT_AGENDA_TEST_MONGO_URI), instance = randomBytes(8).toString('hex');
  assert(['127.0.0.1', 'localhost'].includes(root.hostname)); assert.equal(root.searchParams.get('replicaSet'), 'pay582');
  const uri = name => { const u = new URL(root); u.pathname = '/goleve_payagenda_' + instance + '_' + name; return u.toString(); };
  const connections = [], servers = [], identities = new Map(), tokens = new Map(), secret = randomBytes(48);
  const pairKeys = { agenda_payment: randomBytes(32), agenda_professional: randomBytes(32), payment_professional: randomBytes(32) };
  const origins = {}, config = service => ({ service, instance, origins, keys: Object.fromEntries(['agenda', 'payment', 'professional'].filter(p => p !== service).map(p => [p, pairKeys[[service, p].sort().join('_')]])) });
  let pc, ac, payc, pm, am, personal, billing, payments, bankCalls = 0, bankHandler, gateway, authUrl;
  const bank = { async authorize(id, fixture) { bankCalls++; return bankHandler ? bankHandler(id, fixture) : new MockBankProvider().authorize(id, fixture); } };
  async function listen(app) { const s = app.listen(0, '127.0.0.1'); servers.push(s); await once(s, 'listening'); return 'http://127.0.0.1:' + s.address().port; }
  const actor = role => { const id = new mongoose.Types.ObjectId().toHexString(); identities.set(id, role); tokens.set(id, jwt.sign({}, secret, { subject: id, issuer: 'goleve-auth', audience: 'goleve-api', expiresIn: 3600 })); return id; };
  async function request(base, route, { who, method = 'GET', body, key, tag, token } = {}) {
    const r = await fetch(base + route, { method, headers: { ...(who ? { Authorization: 'Bearer ' + tokens.get(who) } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(key ? { 'Idempotency-Key': key } : {}), ...(tag ? { 'If-Match': tag } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(25000) });
    return { status: r.status, body: await r.json(), tag: r.headers.get('etag') };
  }
  const post = (base, route, who, body = {}, extras = {}) => request(base, route, { who, method: 'POST', body, key: randomUUID(), ...extras });
  async function world(price = 25) {
    bankCalls = 0; bankHandler = null;
    const owner = actor('utilizador'), other = actor('utilizador'), professional = actor('profissional');
    const profile = await pm.Profile.create({ authUserId: professional, professionalName: 'Synthetic payment professional', countryCode: 'PT', languages: ['pt'] });
    const capability = await pm.Capability.create({ authUserId: professional, professionalId: profile._id, kind: 'personal_trainer', jurisdictionCountry: 'PT', serviceModes: ['online'] });
    // Explicit, isolated test fixture; no runtime provisioning or administrative approval route.
    await pm.Application.collection.insertOne({ authUserId: professional, professionalId: profile._id, status: 'approved', publicationEnabled: true, dataMode: 'synthetic', version: 1 });
    const service = await pm.Service.create({ authUserId: professional, professionalId: profile._id, capabilityId: capability._id, category: 'personal_trainer', name: 'Synthetic PT service', description: 'Fictitious test service only', priceEur: price, durationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 });
    const day = new Date(Date.now() + 5 * 86400000); day.setUTCHours(10, 0, 0, 0);
    const w = { owner, other, professional, professionalId: String(profile._id), capabilityId: String(capability._id), serviceId: String(service._id), start: day.getTime() };
    const r = await post(origins.agenda, '/agenda/professional/availability-rules', professional, { capabilityId: w.capabilityId, weekday: day.getUTCDay(), localStartTime: '08:00', localEndTime: '20:00', timezone: 'UTC', sessionModes: ['online'], environments: [], slotDurationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, validFrom: day.toISOString().slice(0, 10), validUntil: day.toISOString().slice(0, 10) });
    assert.equal(r.status, 201, JSON.stringify(r.body)); return w;
  }
  const booking = (w, start = w.start, serviceId = w.serviceId) => ({ professionalId: w.professionalId, capabilityId: w.capabilityId, ...(serviceId ? { serviceId } : {}), appointmentType: 'initial_session', mode: 'online', startAtUtc: new Date(start).toISOString(), endAtUtc: new Date(start + 3600000).toISOString(), timezone: 'UTC' });
  async function appointment(w, accept = true, serviceId = w.serviceId) {
    const r = await post(origins.agenda, '/agenda/professional-appointments', w.owner, booking(w, w.start, serviceId)); assert.equal(r.status, 201, JSON.stringify(r.body));
    if (!accept) return r;
    const accepted = await post(origins.agenda, '/agenda/professional/appointments/' + r.body.data.id + '/accept', w.professional, {}, { tag: r.tag }); assert.equal(accepted.status, 200, JSON.stringify(accepted.body)); return accepted;
  }
  async function payment(w, a, extras = {}) { const r = await post(gateway, '/payments/appointments/' + a.body.data.id, w.owner, {}, extras); assert.equal(r.status, 201, JSON.stringify(r.body)); return r.body.data; }
  const confirm = (w, p, extras = {}) => post(gateway, '/payments/appointment-payments/' + p.id + '/confirm', w.owner, {}, extras);
  const get = (w, p) => request(gateway, '/payments/appointment-payments/' + p.id, { who: w.owner });
  async function reschedule(w, a) {
    const child = await post(origins.agenda, '/agenda/professional-appointments/' + a.body.data.id + '/reschedule', w.owner, booking(w, w.start + 3 * 3600000), { tag: a.tag }); assert.equal(child.status, 201, JSON.stringify(child.body));
    const accepted = await post(origins.agenda, '/agenda/professional/appointments/' + child.body.data.id + '/accept', w.professional, {}, { tag: child.tag }); assert.equal(accepted.status, 200, JSON.stringify(accepted.body)); return accepted;
  }
  before(async () => {
    Object.assign(process.env, { NODE_ENV: 'test', PAYMENT_DEMO_ENABLED: 'true', PAYMENT_DEMO_BANK_OUTCOME: 'approve' });
    const auth = express(); auth.get('/auth/me', (req, res) => { try { const token = req.get('authorization')?.slice(7), c = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: 'goleve-auth', audience: 'goleve-api' }); const role = identities.get(c.sub); if (!role) throw Error(); res.json({ user: { id: c.sub, userType: role } }); } catch { res.status(401).json({ error: { code: 'INVALID_TOKEN' } }); } }); authUrl = await listen(auth);
    pc = await pro('mongoose').createConnection(uri('professional')).asPromise(); ac = await agenda('mongoose').createConnection(uri('agenda')).asPromise(); payc = await mongoose.createConnection(uri('payment')).asPromise(); connections.push(pc, ac, payc);
    const proModels = pro('./dist/models'); pm = proModels.createProfessionalModels(pc); await proModels.initializeModels(pm);
    origins.professional = await listen(pro('./dist/app').createApp({ authServiceUrl: authUrl, dataMode: 'synthetic', reviewMode: 'synthetic', reviewerIds: [], paymentDemo: config('professional') }, pc, pm));
    personal = agenda('./dist/models').createAgendaModels(ac); await agenda('./dist/models').initializeModels(personal);
    const module = agenda('./dist/professional/models'); am = module.createProfessionalAgendaModels(ac); await module.initializeProfessionalAgendaModels(am);
    assert.equal((await ac.db.admin().command({ hello: 1 })).setName, 'pay582'); billing = new (agenda('./dist/payment-demo/billing').AgendaBilling)(ac, am, config('agenda')); await billing.initialize();
    origins.agenda = await listen(agenda('./dist/app').createApp(authUrl, ac, personal, { models: am, settings: { enabled: true, professionalServiceUrl: origins.professional, paymentDemo: config('agenda') } }));
    const legacy = createPaymentModels(payc); await initPayments(legacy); payments = new IntegratedPaymentService(payc, config('payment'), bank); await payments.Model.init();
    origins.payment = await listen(await require('../dist/server').createApp(authUrl, payc, legacy, config('payment'), bank));
    process.env.PAYMENT_SERVICE_URL = origins.payment; const g = express(); g.use('/payments', require('../../../api-gateway/dist/routes/payment.routes').createPaymentRoutes()); g.use((_req, res) => res.status(404).json({ error: 'not found' })); gateway = await listen(g);
  });
  after(async () => { for (const s of servers.reverse()) { const done = new Promise(resolve => s.close(resolve)); s.closeAllConnections(); await done; } await Promise.all(connections.map(c => c.close())); });

  test('accepted reservation obtains a fifteen-minute authoritative quote and one approved mock payment', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a); assert.equal(p.quote.priceCents, 2500); assert.equal(p.quote.serviceId, w.serviceId); assert.ok(Date.parse(p.quote.expiresAt) > Date.now() + 895000);
    const r = await confirm(w, p); assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.data.state, 'approved', JSON.stringify(r.body)); assert.equal(bankCalls, 1);
  });
  test('pending, cancelled and foreign reservations cannot create a payment', async () => {
    const w = await world(), pending = await appointment(w, false), id = pending.body.data.id;
    assert.equal((await post(gateway, '/payments/appointments/' + id, w.owner)).status, 409);
    const accepted = await post(origins.agenda, '/agenda/professional/appointments/' + id + '/accept', w.professional, {}, { tag: pending.tag }); assert.equal(accepted.status, 200);
    assert.equal((await post(gateway, '/payments/appointments/' + id, w.other)).status, 404);
    await post(origins.agenda, '/agenda/professional-appointments/' + id + '/cancel', w.owner, {}, { tag: accepted.tag }); assert.equal((await post(gateway, '/payments/appointments/' + id, w.owner)).status, 409); assert.equal(bankCalls, 0);
  });
  test('client financial values or service identifiers are refused', async () => {
    const w = await world(), a = await appointment(w); for (const body of [{ priceCents: 1 }, { amountCents: 1 }, { serviceId: w.serviceId }, { outcome: 'approve' }]) assert.equal((await post(gateway, '/payments/appointments/' + a.body.data.id, w.owner, body)).status, 400); assert.equal(bankCalls, 0);
  });
  test('creation idempotency and concurrent different keys allow only one active payment', async () => {
    const w = await world(), a = await appointment(w), key = randomUUID(), p = await payment(w, a, { key }); assert.equal((await payment(w, a, { key })).id, p.id);
    const results = await Promise.all(Array.from({ length: 5 }, () => post(gateway, '/payments/appointments/' + a.body.data.id, w.owner))); assert(results.every(r => r.status === 409)); assert.equal(await payments.Model.countDocuments({ rootId: a.body.data.id }), 1);
  });
  test('simultaneous creation starts at most one active payment', async () => {
    const w = await world(), a = await appointment(w); const r = await Promise.all(Array.from({ length: 6 }, () => post(gateway, '/payments/appointments/' + a.body.data.id, w.owner))); assert.equal(r.filter(x => x.status === 201).length, 1); assert(r.every(x => [201, 409].includes(x.status)));
  });
  test('atomic confirmation claim precedes the bank and concurrent confirmations call it once', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a); bankHandler = async (id, fixture) => { assert.equal((await payments.Model.findById(id)).state, 'processing'); assert.equal((await billing.Ledger.findById(a.body.data.id)).state, 'processing'); await new Promise(r => setTimeout(r, 30)); return new MockBankProvider().authorize(id, fixture); };
    const r = await Promise.all(Array.from({ length: 6 }, () => confirm(w, p))); assert.equal(r.filter(x => x.body.data?.state === 'approved').length, 1); assert.equal(bankCalls, 1);
  });
  test('confirmation replay never calls the bank again and no second approved payment is created', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a), key = randomUUID(); assert.equal((await confirm(w, p, { key })).body.data.state, 'approved'); assert.equal((await confirm(w, p, { key })).body.data.state, 'approved'); assert.equal((await confirm(w, p)).status, 409); assert.equal((await payment(w, a)).id, p.id); assert.equal(bankCalls, 1);
  });
  test('expired quote cannot reach the bank', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a); await payments.Model.collection.updateOne({ _id: new mongoose.Types.ObjectId(p.id) }, { $set: { 'quote.expiresAt': new Date(Date.now() - 1).toISOString() } }); const r = await confirm(w, p); assert.equal(r.body.data.state, 'expired', JSON.stringify(r.body)); assert.equal(bankCalls, 0);
  });
  test('Professional quotation remains fixed for fifteen minutes despite a later catalogue price', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a); await pm.Service.updateOne({ _id: w.serviceId }, { $set: { priceEur: 40 }, $inc: { version: 1 } }); assert.equal((await confirm(w, p)).body.data.state, 'approved'); assert.equal((await get(w, p)).body.data.quote.priceCents, 2500);
  });
  test('revoked eligibility before confirmation blocks the bank', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a); await pm.Application.collection.updateOne({ professionalId: new mongoose.Types.ObjectId(w.professionalId) }, { $set: { status: 'suspended' } }); const r = await confirm(w, p); assert.equal(r.body.data.state, 'failed', JSON.stringify(r.body)); assert.equal(bankCalls, 0);
  });
  test('declined payment allows a new controlled attempt', async () => {
    const w = await world(), a = await appointment(w), first = await payment(w, a); bankHandler = async (id, f) => ({ outcome: 'decline', transactionReference: 'mock_declined_' + id }); assert.equal((await confirm(w, first)).body.data.state, 'declined'); bankHandler = null; const second = await payment(w, a); assert.notEqual(first.id, second.id); assert.equal((await confirm(w, second)).body.data.state, 'approved'); assert.equal(bankCalls, 2);
  });
  test('free service is settled without calling the bank', async () => { const w = await world(0), a = await appointment(w), p = await payment(w, a); assert.equal((await confirm(w, p)).body.data.state, 'free'); assert.equal(bankCalls, 0); });
  test('paid cancellation records a simulated refund pending and preserves approved financial history', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a); await confirm(w, p); const r = await post(origins.agenda, '/agenda/professional-appointments/' + a.body.data.id + '/cancel', w.owner, {}, { tag: a.tag }); assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal((await billing.Ledger.findById(a.body.data.id)).refundPending, true); const receipt = (await get(w, p)).body.data; assert.equal(receipt.state, 'approved'); assert.equal(receipt.refundPending, true); assert.ok(receipt.history.some(e => e.state === 'approved')); assert.equal(bankCalls, 1);
  });
  test('equal-service equal-price rescheduling preserves the same charge across the lineage', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a); await confirm(w, p); const child = await reschedule(w, a); const receipt = (await get(w, p)).body.data; assert.equal(receipt.state, 'approved'); assert.equal(receipt.settledAppointmentId, child.body.data.id); assert.equal(receipt.refundPending, false); assert.equal(receipt.reconciliationRequired, false); assert.equal((await payment(w, child)).id, p.id); assert.equal(bankCalls, 1);
  });
  test('changed-price rescheduling blocks automatic charge transfer and new payment', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a); await confirm(w, p); await pm.Service.updateOne({ _id: w.serviceId }, { $set: { priceEur: 35 }, $inc: { version: 1 } }); const child = await reschedule(w, a); const receipt = (await get(w, p)).body.data; assert.equal(receipt.state, 'approved'); assert.equal(receipt.reconciliationRequired, true); assert.equal((await post(gateway, '/payments/appointments/' + child.body.data.id, w.owner)).status, 409); assert.equal(bankCalls, 1);
  });
  test('legacy accepted reservation requires explicit validated service binding', async () => {
    const w = await world(), a = await appointment(w, true, null); assert.equal((await post(gateway, '/payments/appointments/' + a.body.data.id, w.owner)).body.error.code, 'SERVICE_ASSOCIATION_REQUIRED');
    assert.equal((await post(origins.agenda, '/agenda/professional-appointments/' + a.body.data.id + '/service', w.other, { serviceId: w.serviceId }, { tag: a.tag })).status, 404);
    const r = await post(origins.agenda, '/agenda/professional-appointments/' + a.body.data.id + '/service', w.owner, { serviceId: w.serviceId }, { tag: a.tag }); assert.equal(r.status, 200, JSON.stringify(r.body)); const p = await payment(w, a); assert.equal((await confirm(w, p)).body.data.state, 'approved');
  });
  test('bank timeout or unknown result is never automatically retried', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a), key = randomUUID(); bankHandler = () => new Promise(() => {}); const r = await confirm(w, p, { key }); assert.equal(r.body.data.state, 'unknown'); assert.equal(r.body.data.reconciliationRequired, true); assert.equal((await confirm(w, p, { key })).body.data.state, 'unknown'); assert.equal((await confirm(w, p)).status, 409); assert.equal((await post(gateway, '/payments/appointments/' + a.body.data.id, w.owner)).status, 409); assert.equal(bankCalls, 1);
    assert.equal((await post(gateway, '/payments/appointment-payments/' + p.id + '/reconcile', w.owner)).status, 409);
  });
  test('cancellation during bank authorization is serialized and later approval requests a simulated refund', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a); bankHandler = async (id, f) => { const cancel = await post(origins.agenda, '/agenda/professional-appointments/' + a.body.data.id + '/cancel', w.owner, {}, { tag: a.tag }); assert.equal(cancel.status, 200); return new MockBankProvider().authorize(id, f); }; const r = await confirm(w, p); assert.equal(r.body.data.state, 'approved'); assert.equal(r.body.data.refundPending, true); assert.equal(bankCalls, 1);
  });
  test('persisted Agenda receipt reconciles a lost local result without reauthorizing', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a); await confirm(w, p); await payments.Model.updateOne({ _id: p.id }, { $set: { state: 'unknown', reconciliationRequired: true } }); const r = await post(gateway, '/payments/appointment-payments/' + p.id + '/reconcile', w.owner); assert.equal(r.body.data.state, 'approved'); assert.equal(bankCalls, 1);
  });
  test('internal routes reject missing credentials, wrong audience, tampering and replay; no public proxy', async () => {
    const body = { actorId: actor('utilizador'), appointmentId: new mongoose.Types.ObjectId().toHexString() }, path = '/internal/v1/payment-demo/context', c = config('payment');
    assert.equal((await post(origins.agenda, path, body.actorId, body)).status, 401); assert.equal((await post(gateway, path, body.actorId, body)).status, 404);
    const token = sign(c, 'agenda', path, body); assert.equal((await request(origins.agenda, path, { method: 'POST', body, token: token.slice(7) })).status, 401);
    assert.throws(() => verify(config('agenda'), 'payment', path, { ...body, actorId: actor('utilizador') }, token));
    assert.throws(() => verify(config('professional'), 'payment', path, body, token));
    assert.throws(() => verify(config('agenda'), 'payment', path, body, sign(c, 'agenda', path, body, Date.now() - 20000)));
    const client = new DemoClient(c); await assert.rejects(client.call('agenda', 'context', body));
  });
  test('synthetic proof freshness and production guard cannot weaken the normal adapter', async () => {
    const w = await world(), client = new (agenda('./dist/payment-demo/eligibility').DemoEligibility)(config('agenda'), ac.name); const proof = await client.check({ capabilityId: w.capabilityId, professionalId: w.professionalId }); assert.equal(proof.authority, 'synthetic');
    const saved = process.env.NODE_ENV; try { process.env.NODE_ENV = 'production'; assert.throws(() => assertDemo(config('payment'), payc.name)); assert.throws(() => new (agenda('./dist/payment-demo/eligibility').DemoEligibility)(config('agenda'), ac.name)); } finally { process.env.NODE_ENV = saved; }
    const envFetch = global.fetch; try { global.fetch = async () => ({ ok: true, status: 200, headers: new Headers(), json: async () => ({ data: proof }) }); const normal = new (agenda('./dist/professional/eligibility').ProfessionalEligibilityClient)('http://normal.example.invalid', { activeId: 'test', keys: { test: randomBytes(32) } }); await assert.rejects(normal.check({ capabilityId: w.capabilityId }), { code: 'PROFESSIONAL_INELIGIBLE' }); } finally { global.fetch = envFetch; }
  });
  test('synthetic eligibility rejects expired authenticated proofs and response tampering', async () => {
    const w = await world(), client = new (agenda('./dist/payment-demo/eligibility').DemoEligibility)(config('agenda'), ac.name), original = global.fetch;
    const proof = pro('./dist/payment-demo/protocol').responseProof;
    for (const tampered of [false, true]) {
      try {
        global.fetch = async (url, options) => { const r = await original(url, options); if (!String(url).endsWith('/payment-demo/eligibility')) return r; const data = await r.json(); const headers = new Headers(r.headers); data.validUntilUtc = new Date(Date.now() - 1).toISOString(); if (!tampered) headers.set('x-payment-demo-proof', proof(config('professional'), 'agenda', data, options.headers.Authorization)); return new Response(JSON.stringify(data), { status: 200, headers }); };
        await assert.rejects(client.check({ capabilityId: w.capabilityId, professionalId: w.professionalId }));
      } finally { global.fetch = original; }
    }
    await pm.Capability.updateOne({ _id: w.capabilityId }, { $set: { status: 'suspended' } }); await assert.rejects(client.check({ capabilityId: w.capabilityId, professionalId: w.professionalId }));
  });
  test('a valid internal context request cannot be replayed', async () => {
    const w = await world(), a = await appointment(w), body = { actorId: w.owner, appointmentId: a.body.data.id }, route = '/internal/v1/payment-demo/context', authorization = sign(config('payment'), 'agenda', route, body);
    const call = () => fetch(origins.agenda + route, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: authorization }, body: JSON.stringify(body) });
    assert.equal((await call()).status, 200); assert.equal((await call()).status, 401);
  });
  test('malformed bank response is unknown, not a reusable declined attempt', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a); bankHandler = async () => ({ outcome: 'undetermined', transactionReference: '' }); assert.equal((await confirm(w, p)).body.data.state, 'unknown'); assert.equal((await post(gateway, '/payments/appointments/' + a.body.data.id, w.owner)).status, 409); assert.equal(bankCalls, 1);
  });
  test('failed billing history persistence rolls back the Agenda claim before bank authorization', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a), original = billing.Event.create; const snapshot = await am.Calendar.findById(w.professional).lean();
    billing.Event.create = async () => { throw Error('Synthetic billing audit unavailable'); };
    try { const r = await confirm(w, p); assert.equal(r.body.data.state, 'unknown'); assert.equal(bankCalls, 0); assert.equal(await billing.Ledger.countDocuments({ _id: a.body.data.id }), 0); assert.deepEqual(await am.Calendar.findById(w.professional).lean(), snapshot); } finally { billing.Event.create = original; }
  });
  test('missing, invalid and wrong-audience JWTs cannot initiate payments', async () => {
    const w = await world(), a = await appointment(w), route = '/payments/appointments/' + a.body.data.id;
    assert.equal((await post(gateway, route, undefined)).status, 401); assert.equal((await request(gateway, route, { method: 'POST', body: {}, key: randomUUID(), token: 'invalid.jwt' })).status, 401);
    const token = jwt.sign({}, secret, { subject: w.owner, issuer: 'goleve-auth', audience: 'another-service', expiresIn: 3600 }); assert.equal((await request(gateway, route, { method: 'POST', body: {}, key: randomUUID(), token })).status, 401); assert.equal(bankCalls, 0);
  });
  test('cancellation before the confirmation claim prevents bank authorization', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a); await post(origins.agenda, '/agenda/professional-appointments/' + a.body.data.id + '/cancel', w.owner, {}, { tag: a.tag }); assert.equal((await confirm(w, p)).body.data.state, 'failed'); assert.equal(bankCalls, 0);
  });
  test('inactive professional service is rejected at confirmation', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a); await pm.Service.updateOne({ _id: w.serviceId }, { $set: { active: false } }); assert.equal((await confirm(w, p)).body.data.state, 'failed'); assert.equal(bankCalls, 0);
  });
  test('quote expiring after the Agenda claim is released before invoking the bank', async () => {
    const w = await world(), a = await appointment(w), p = await payment(w, a), expiry = new Date(Date.now() + 700), original = payments.Model.updateOne;
    await pc.collection('professional_demo_payment_quotes').updateOne({ _id: new mongoose.Types.ObjectId(p.quote.quoteId) }, { $set: { expiresAt: expiry } });
    await payments.Model.collection.updateOne({ _id: new mongoose.Types.ObjectId(p.id) }, { $set: { 'quote.expiresAt': expiry.toISOString() } });
    payments.Model.updateOne = async function (filter, update, options) { const result = await original.call(this, filter, update, options); if (update.$set?.claimToken) await new Promise(resolve => setTimeout(resolve, Math.max(0, expiry.getTime() - Date.now() + 10))); return result; };
    try { const r = await confirm(w, p); assert.equal(r.body.data.state, 'expired', JSON.stringify(r.body)); assert.equal(bankCalls, 0); assert.equal((await billing.Ledger.findById(a.body.data.id)).state, 'expired'); } finally { payments.Model.updateOne = original; }
  });
});
