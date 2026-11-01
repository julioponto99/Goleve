#!/usr/bin/env node
'use strict';
// No shell interpolation, dependency installation, database updates or automatic preparation.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { randomBytes, randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), demoRoot = path.join(root, '.demo');
function save(file, data) { fs.writeFileSync(file, data, { flag: 'wx', mode: 0o600 }); }
async function freePort() {
  const server = net.createServer(); await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = server.address().port; await new Promise((resolve) => server.close(resolve));
  if (port === 3000) return freePort(); return port;
}
function context() {
  const state = JSON.parse(fs.readFileSync(path.join(demoRoot, 'current.json'), 'utf8'));
  if (!/^[a-f0-9]{16}$/.test(state.id) || !Number.isInteger(state.port) || state.port < 1024 || state.port > 65535 || state.port === 3000) throw new Error('Invalid demo descriptor');
  const dir = path.join(demoRoot, state.id);
  // Ignore ambient Compose interpolation settings: they must never select the main project or its data.
  const env = { ...process.env, DEMO_INSTANCE_ID: state.id, DEMO_ROOT: dir.replaceAll('\\', '/'), DEMO_PORT: String(state.port) };
  for (const key of Object.keys(env)) if (key.startsWith('COMPOSE_')) delete env[key];
  return { ...state, dir, env, project: 'goleve-demo-' + state.id, url: 'http://127.0.0.1:' + state.port };
}
function compose(ctx, args, capture = false) {
  const result = spawnSync('docker', ['compose', '--project-name', ctx.project, '--env-file', path.join(ctx.dir, 'compose.env'),
    '--file', path.join(root, 'compose.demo.yaml'), ...args], { cwd: root, env: ctx.env, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
  if (result.error || result.status !== 0) throw new Error('Isolated Docker Compose command failed');
  return capture ? result.stdout.trim() : undefined;
}
function dockerRead(args) {
  const result = spawnSync('docker', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' });
  if (result.error || result.status !== 0) throw new Error('Docker inspection failed');
  return result.stdout.trim();
}
function mainSnapshot() {
  const ids = dockerRead(['ps', '-aq', '--filter', 'label=com.docker.compose.project=goleve']).split(/\s+/).filter(Boolean);
  if (!ids.length) return [];
  return JSON.parse(dockerRead(['inspect', ...ids])).map((c) => ({ id: c.Id, service: c.Config.Labels['com.docker.compose.service'],
    state: c.State.Status, health: c.State.Health?.Status || null })).sort((a, b) => a.id.localeCompare(b.id));
}
function auditIsolation(ctx) {
  const ids = compose(ctx, ['ps', '-q'], true).split(/\s+/).filter(Boolean); assert.equal(ids.length, 5);
  const containers = JSON.parse(dockerRead(['inspect', ...ids]));
  const networkName = ctx.project + '_demo';
  const [network] = JSON.parse(dockerRead(['network', 'inspect', networkName])); assert.equal(network.Internal, true);
  const [edge] = JSON.parse(dockerRead(['network', 'inspect', ctx.project + '_gateway']));
  assert.equal(Object.values(edge.Containers).length, 1);
  const expected = ['api-gateway', 'auth-service', 'mongodb', 'professional-service', 'user-service'];
  assert.deepEqual(containers.map((c) => c.Config.Labels['com.docker.compose.service']).sort(), expected);
  for (const container of containers) {
    const service = container.Config.Labels['com.docker.compose.service'];
    assert.equal(container.Config.Labels['com.docker.compose.project'], ctx.project);
    assert.equal(container.State.Health?.Status, 'healthy');
    assert.deepEqual(Object.keys(container.NetworkSettings.Networks).sort(), (service === 'api-gateway' ? [networkName, ctx.project + '_gateway'] : [networkName]).sort());
    const ports = container.HostConfig.PortBindings || {};
    if (service === 'api-gateway') assert.deepEqual(ports, { '3000/tcp': [{ HostIp: '127.0.0.1', HostPort: String(ctx.port) }] });
    else assert.deepEqual(ports, {});
    assert.equal(container.Mounts.some((m) => m.Type === 'volume'), false);
    if (service === 'mongodb') {
      assert.deepEqual(Object.keys(container.HostConfig.Tmpfs).sort(), ['/data/configdb', '/data/db']);
    }
    if (service !== 'auth-service') assert.equal(container.Config.Env.some((v) => v.startsWith('JWT_SECRET=')), false);
    const credentialMount = container.Mounts.some((m) => m.Destination === '/run/secrets/demo_service_key');
    assert.equal(credentialMount, ['auth-service', 'professional-service'].includes(service));
  }
  const baseline = path.join(ctx.dir, 'main-baseline.json');
  if (fs.existsSync(baseline)) assert.deepEqual(mainSnapshot(), JSON.parse(fs.readFileSync(baseline, 'utf8')));
}
async function request(ctx, endpoint, options = {}) {
  const { body, token, headers = {}, method = 'GET' } = options;
  const response = await fetch(ctx.url + endpoint, { method, redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = {}; }
  return { status: response.status, data, tag: response.headers.get('etag') };
}
async function sessions(ctx) {
  const manifest = JSON.parse(fs.readFileSync(path.join(ctx.dir, 'fixtures.json'), 'utf8'));
  if (manifest.instanceId !== ctx.id || Date.parse(manifest.expiresAt) <= Date.now()) throw new Error('Fixture lifetime ended; initialize a new isolated demo');
  const result = {};
  for (const fixture of manifest.accounts) {
    const response = await request(ctx, '/auth/login', { method: 'POST', body: { email: fixture.email, password: fixture.password } });
    if (response.status !== 200 || response.data.user?.id !== fixture.id || response.data.user?.userType !== fixture.userType) throw new Error('Fictional login failed; run explicit preparation first');
    result[fixture.kind] = { ...fixture, token: response.data.accessToken };
  }
  return result;
}
async function init() {
  const id = randomBytes(8).toString('hex'), port = await freePort(), dir = path.join(demoRoot, id);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const accounts = ['user_a', 'user_b', 'personal_trainer', 'nutritionist'].map((kind) => ({ kind, id: randomBytes(12).toString('hex'),
    name: 'Synthetic Demo ' + kind, email: kind + '-' + id + '@example.invalid', password: randomBytes(32).toString('base64url'),
    userType: kind.startsWith('user_') ? 'utilizador' : 'profissional' }));
  save(path.join(dir, 'service.key'), randomBytes(32).toString('hex'));
  save(path.join(dir, 'user.key'), randomBytes(32).toString('hex'));
  save(path.join(dir, 'auth.env'), 'JWT_SECRET=' + randomBytes(48).toString('hex') + '\n');
  save(path.join(dir, 'fixtures.json'), JSON.stringify({ instanceId: id, expiresAt: new Date(Date.now() + 23 * 3600000).toISOString(), accounts }, null, 2));
  save(path.join(dir, 'compose.env'), '# Generated demo scope; no main environment is loaded.\n');
  // Selecting a new instance never removes the previous instance, its files or its containers.
  fs.writeFileSync(path.join(demoRoot, 'current.json'), JSON.stringify({ id, port }), { mode: 0o600 });
  console.log(JSON.stringify({ initialized: true, project: 'goleve-demo-' + id, gateway: 'http://127.0.0.1:' + port, credentials: 'ignored local files; never printed' }));
}
async function prepare(ctx) {
  compose(ctx, ['run', '--rm', '--no-deps', '-e', 'DEMO_PREPARE_ACK=create-new-fictional-identities', 'auth-service', 'node', 'dist/demo/prepare.js']);
  const actors = await sessions(ctx);
  for (const actor of Object.values(actors)) {
    const isUser = actor.kind.startsWith('user_'), endpoint = isUser ? '/users/me' : '/professionals/me';
    let current = await request(ctx, endpoint, { token: actor.token });
    if (current.status === 404) {
      const body = isUser ? { displayName: actor.name } : { professionalName: actor.name, countryCode: 'PT', languages: ['pt'], biography: 'Fictional local demonstration. Not verified.' };
      current = await request(ctx, endpoint, { method: 'PUT', body, token: actor.token, headers: { 'If-None-Match': '*' } });
      if (current.status !== 201) throw new Error('Fictional profile preparation failed');
    } else if (current.status !== 200) throw new Error('Cannot inspect fictional profile');
    if (!isUser) {
      const listed = await request(ctx, '/professionals/me/capabilities', { token: actor.token });
      if (listed.status !== 200) throw new Error('Cannot inspect fictional capabilities');
      if (!listed.data.data.items.length) {
        const created = await request(ctx, '/professionals/me/capabilities', { method: 'POST', token: actor.token,
          body: { kind: actor.kind, jurisdictionCountry: 'PT', serviceModes: ['online'], specializations: [] } });
        if (created.status !== 201) throw new Error('Fictional capability preparation failed');
      }
    }
  }
  console.log(JSON.stringify({ prepared: true, identities: 4, administrators: 0, professionalApproval: 'blocked', existingIdentitiesModified: false }));
}
async function check(ctx) {
  auditIsolation(ctx);
  const actors = await sessions(ctx), user = actors.user_a, pro = actors.personal_trainer;
  assert.equal((await request(ctx, '/health')).status, 200);
  assert.equal((await request(ctx, '/auth/me', { token: user.token })).data.user.id, user.id);
  assert.equal((await request(ctx, '/care-relationships/me', { token: 'invalid.jwt' })).status, 401);
  assert.equal((await request(ctx, '/care-relationships/me')).status, 401);
  assert.equal((await request(ctx, '/professionals/catalog')).data.data.items.length, 0);
  assert.equal((await request(ctx, '/professionals/eligible-capabilities', { token: user.token })).data.data.items.length, 0);
  const profile = await request(ctx, '/professionals/me', { token: pro.token });
  const caps = await request(ctx, '/professionals/me/capabilities', { token: pro.token });
  const result = await request(ctx, '/care-relationships', { method: 'POST', token: user.token, headers: { 'Idempotency-Key': randomUUID() },
    body: { professionalId: profile.data.data.id, capabilityId: caps.data.data.items[0].id, relationshipKind: 'personal_training' } });
  assert.equal(result.status, 404);
  assert.equal((await request(ctx, '/professional-applications', { token: pro.token })).status, 404); // Gateway does not expose internal/admin routes here.
  for (const endpoint of ['/internal/demo/identity', '/auth/internal/demo/identity']) assert.equal((await request(ctx, endpoint, { method: 'POST', body: { id: pro.id } })).status, 404);
  assert.equal((await request(ctx, '/users/' + user.id, { token: pro.token })).status, 404);
  const other = await request(ctx, '/users/me', { token: actors.user_b.token });
  assert.equal(JSON.stringify(other.data).includes(user.id), false);
  const probe = "const {loadSettings}=require('./dist/config/settings');const {DemoIdentityClient}=require('./dist/demo/identity-client');const c=loadSettings();new DemoIdentityClient(c.authServiceUrl,c.demoIdentity).read(process.argv[1]).then(r=>{if(!r||r.userType!=='profissional')process.exit(1);console.log('fixture identity confirmed; no approval granted')}).catch(()=>process.exit(1))";
  compose(ctx, ['exec', '-T', 'professional-service', 'node', '-e', probe, pro.id]);
  console.log(JSON.stringify({ checks: 'passed', realServices: 5, approval: 'blocked as required', positiveRelationshipFlow: 'automated tests only' }));
}
async function main(command = process.argv[2]) {
  if (command === 'init') return init();
  if (!['up', 'prepare', 'check', 'status', 'stop'].includes(command)) throw new Error('Usage: node scripts/demo.cjs init|up|prepare|check|status|stop');
  const ctx = context();
  if (command === 'up') {
    const baseline = path.join(ctx.dir, 'main-baseline.json');
    if (!fs.existsSync(baseline)) save(baseline, JSON.stringify(mainSnapshot()));
    compose(ctx, ['up', '-d', '--build', '--wait', '--wait-timeout', '180']);
  }
  if (command === 'prepare') await prepare(ctx);
  if (command === 'check') await check(ctx);
  if (command === 'status') { compose(ctx, ['ps']); console.log('Gateway: ' + ctx.url); }
  if (command === 'stop') compose(ctx, ['stop']);
}
module.exports = { context, request, sessions, main };
if (require.main === module) main().catch(() => { console.error('Demo command refused or failed. No main-project operation was requested. Check local scope and preparation; secrets are not printed.'); process.exitCode = 1; });
