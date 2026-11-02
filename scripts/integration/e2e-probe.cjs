'use strict';
// Private test process inside an existing integration container. No public endpoint is added.
const fs = require('node:fs'), path = require('node:path'), { createRequire } = require('node:module');
const local = createRequire(path.join(process.cwd(), 'package.json'));
const oid = value => typeof value === 'string' && /^[a-f0-9]{24}$/.test(value);
async function main() {
  const input = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (!/^[a-f0-9]{16}$/.test(input.instance || '')) throw Error('Explicit integration instance required');
  const uri = new URL(process.env.MONGO_URI);
  if (uri.hostname !== 'mongodb' || !uri.pathname.includes(input.instance)) throw Error('Foreign database refused');
  if (input.action === 'mode') return {
    nodeEnv: process.env.NODE_ENV, mongoDockerHost: uri.hostname === 'mongodb',
    integratedPayment: process.env.PAYMENT_AGENDA_DEMO_ENABLED === 'true',
    professionalReview: process.env.PROFESSIONAL_REVIEW_MODE || 'disabled',
    coachEnabled: process.env.AI_COACH_ENABLED === 'true',
    bootstrapEnabled: process.env.AUTH_BOOTSTRAP_ENABLED === 'true',
  };
  if (input.action === 'payment-block') {
    const peer = path.basename(process.cwd()).replace('-service', '');
    if (!['agenda', 'payment', 'professional'].includes(peer)) throw Error('Wrong protocol owner');
    const { loadDemo, assertDemo } = local('./dist/payment-demo/protocol');
    const saved = { ...process.env }; let loopbackRejected = false, productionRejected = false;
    try {
      process.env.PAYMENT_AGENDA_DEMO_ENABLED = 'true'; process.env.PAYMENT_AGENDA_DEMO_INSTANCE = input.instance;
      try { loadDemo(peer); } catch (e) { loopbackRejected = e.message === 'Isolated loopback MongoDB required'; }
      process.env.NODE_ENV = 'production';
      try { assertDemo({ service: peer, instance: input.instance, origins: {}, keys: {} }, 'goleve_payagenda_' + input.instance + '_' + peer); } catch { productionRejected = true; }
      return { loopbackRejected, productionRejected, correctDatabaseNamespace: uri.pathname === '/goleve_payagenda_' + input.instance + '_' + peer,
        pairKeysConfigured: ['agenda', 'payment', 'professional'].filter(p => p !== peer).every(p => !!saved['PAYMENT_DEMO_KEY_' + [p, peer].sort().join('_').toUpperCase() + '_FILE']) };
    } finally { for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k]; Object.assign(process.env, saved); }
  }
  if (input.action === 'eligibility') {
    if (!oid(input.capabilityId) || !oid(input.professionalId)) throw Error('Fictional capability required');
    const { signServiceRequest, loadServiceKeys } = local('./dist/professional/service-auth');
    const body = { capabilityId: input.capabilityId, professionalId: input.professionalId }, url = process.env.PROFESSIONAL_SERVICE_URL + '/internal/v1/agenda/eligibility';
    const authorization = signServiceRequest(body, loadServiceKeys());
    const request = credential => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: credential }, body: JSON.stringify(body), signal: AbortSignal.timeout(5000) });
    const r = await request(authorization), data = await r.json();
    const replay = await request(authorization); await replay.body?.cancel();
    const invalid = await request('AgendaService invalid.invalid'); await invalid.body?.cancel();
    return { status: r.status, eligible: data.data?.eligible, authority: data.data?.authority, replayStatus: replay.status, invalidStatus: invalid.status };
  }
  if (input.action === 'owner-contract') {
    if (!oid(input.owner)) throw Error('Owner required');
    const { ContractClient, loadContract } = local('./dist/management-contract');
    let status;
    try { await new ContractClient(loadContract('management')).call('auth', 'identity', { authUserId: input.owner }, input.bearer); status = 200; }
    catch (e) { status = e.statusCode; }
    return { status };
  }
  const mongoose = local('mongoose'), c = await mongoose.createConnection(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).asPromise();
  try {
    if (input.action === 'payment-concurrency') {
      if (!oid(input.owner) || !oid(input.id) || path.basename(process.cwd()) !== 'payment-service') throw Error('Own fictitious payment required');
      const { createPaymentModels } = local('./dist/models'), { PaymentService } = local('./dist/services/payment.service'), { loadPaymentFixtures } = local('./dist/config/fixtures');
      const models = createPaymentModels(c), fixture = await models.Payment.findOne({ _id: input.id, ownerId: input.owner, state: 'pending' });
      if (!fixture) throw Error('Expected a new pending fixture');
      let calls = 0, release; const barrier = new Promise(r => { release = r; });
      const timer = setTimeout(() => release(), 5000);
      const bank = { async authorize() { calls++; if (calls === 2) release(); await barrier; return { outcome: 'approve', transactionReference: 'mock_e2e_' + require('node:crypto').randomUUID() }; } };
      const service = new PaymentService(models, loadPaymentFixtures(), bank), context = { identity: { id: input.owner, userType: 'utilizador' }, requestId: 'fictional-e2e-concurrency' };
      const out = await Promise.allSettled([service.confirm(context, input.id, 'e2e-confirm-one'), service.confirm(context, input.id, 'e2e-confirm-two')]);
      clearTimeout(timer);
      const stored = await models.Payment.findById(input.id);
      return { bankCalls: calls, approvedTransitions: stored.history.filter(e => e.state === 'approved').length, resultingState: stored.state, fulfilled: out.filter(x => x.status === 'fulfilled').length };
    }
    if (input.action === 'processed-event') {
      if (!oid(input.owner) || typeof input.eventId !== 'string' || input.eventId.length > 128) throw Error('Own event required');
      return { processed: !!await c.db.collection('notification_processed_events').findOne({ eventId: input.eventId }), notifications: await c.db.collection('notifications').countDocuments({ ownerId: input.owner, eventId: input.eventId }) };
    }
    if (input.action === 'measurement-encryption') {
      if (!oid(input.owner) || !oid(input.id)) throw Error('Own fixture required');
      const d = await c.db.collection('body_measurements').findOne({ _id: new mongoose.Types.ObjectId(input.id), authUserId: input.owner });
      return { exists: !!d, encrypted: !!d && typeof d.value?.ciphertext === 'string' && d.value.algorithmVersion === 'aes-256-gcm-v1' };
    }
    if (input.action === 'outbox') {
      if (!oid(input.owner) || !oid(input.aggregateId)) throw Error('Own training aggregate required');
      const rows = await c.db.collection('training_outbox').find({ aggregateId: input.aggregateId, recipientUserId: input.owner }, { projection: { eventId: 1, status: 1, attempts: 1 } }).toArray();
      return { count: rows.length, events: rows.map(d => ({ eventId: d.eventId, status: d.status, attempts: d.attempts })) };
    }
    if (input.action === 'manager-audit') {
      if (!oid(input.owner)) throw Error('Own actor required');
      const names = (await c.db.listCollections().toArray()).map(d => d.name), audits = names.filter(n => n.includes('audit'));
      let denied = 0, shapeValid = true;
      for (const name of audits) for (const row of await c.db.collection(name).find({ actorId: input.owner }).toArray()) {
        if (['denied', 'failed'].includes(row.result)) denied++;
        shapeValid &&= typeof row.actionCode === 'string' && row.occurredAt instanceof Date && typeof row.requestId === 'string';
      }
      return { denied, shapeValid };
    }
    if (input.action === 'no-administrators') return { administrators: await c.db.collection('auth_users').countDocuments({ userType: 'administrador' }) };
    throw Error('Unknown read-only evidence probe');
  } finally { await c.close(); }
}
void main().then(value => console.log(JSON.stringify(value))).catch(e => { console.error('E2E evidence probe failed: ' + (e.code || e.name)); process.exitCode = 1; });
