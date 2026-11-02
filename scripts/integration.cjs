#!/usr/bin/env node
'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), net = require('node:net');
const cp = require('node:child_process'), { randomBytes } = require('node:crypto');
const root = path.resolve(__dirname, '..'), runtime = path.join(root, '.integration'), active = path.join(runtime, 'active.json');
const apps = ['auth', 'user', 'training', 'agenda', 'performance', 'hydration', 'professional', 'management', 'payment', 'notification', 'ai-coach'];
const services = ['mongodb', 'rabbitmq', ...apps.map(n => n + '-service'), 'api-gateway', 'mongo-init'];
const format = '{"id":{{json .Id}},"name":{{json .Name}},"image":{{json .Image}},"state":{{json .State.Status}},"started":{{json .State.StartedAt}},"health":{{json (index .State "Health")}},"mounts":{{json .Mounts}},"networks":{{json .NetworkSettings.Networks}},"labels":{{json .Config.Labels}}}';
const docker = (...args) => cp.execFileSync('docker', args, { encoding: 'utf8', timeout: 90000, maxBuffer: 4000000 }).trim();
function inspect(id) { const x = JSON.parse(docker('inspect', '--format', format, id)); x.health = x.health?.Status || null; return x; }
function load() {
  const s = JSON.parse(fs.readFileSync(active, 'utf8'));
  if (!/^[a-f0-9]{16}$/.test(s.id) || s.project !== 'goleve-integration-v1-' + s.id || path.resolve(s.directory) !== path.join(runtime, s.id) || !Number.isInteger(s.port) || s.port < 1024 || s.port > 65535) throw Error('Invalid integration identity');
  return s;
}
function compose(s, args, inherit = false) {
  const argv = ['compose', '--project-directory', root, '--env-file', path.join(s.directory, 'compose.env'), '-p', s.project, '-f', path.join(root, 'compose.integration.yaml'), ...args];
  const env = { ...process.env, INTEGRATION_ROOT: s.directory.replace(/\\/g, '/'), INTEGRATION_INSTANCE: s.id, INTEGRATION_PROJECT: s.project, INTEGRATION_PORT: String(s.port) };
  if (inherit) { const r = cp.spawnSync('docker', argv, { cwd: root, env, stdio: 'inherit' }); if (r.status !== 0) throw Error('Integration Compose operation failed'); return; }
  return cp.execFileSync('docker', argv, { cwd: root, env, encoding: 'utf8', timeout: 90000, maxBuffer: 2000000 }).trim();
}
function own(s, service, required = true) {
  if (!services.includes(service)) throw Error('Unknown integration component');
  const ids = docker('ps', '-aq', '--filter', 'label=com.docker.compose.project=' + s.project, '--filter', 'label=com.docker.compose.service=' + service).split(/\s+/).filter(Boolean);
  if (ids.length !== 1) { if (!required && ids.length === 0) return; throw Error('Expected one exclusively owned integration component'); }
  const c = inspect(ids[0]);
  if (s.baseline.some(x => x.id === c.id) || c.labels['com.docker.compose.project'] !== s.project || c.labels['com.docker.compose.service'] !== service) throw Error('Refusing a preexisting or foreign component');
  return c;
}
async function available(port) {
  await new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(port, '127.0.0.1', () => server.close(resolve)); });
}
async function preflight(port) {
  await available(port);
  const disk = fs.statfsSync(root), info = JSON.parse(docker('info', '--format', '{"memory":{{.MemTotal}},"cpus":{{.NCPU}}}'));
  if (disk.bavail * disk.bsize < 4 * 1024 ** 3 || os.freemem() < 1.2 * 1024 ** 3 || info.memory < 6 * 1024 ** 3) throw Error('Insufficient free disk or memory; no infrastructure started');
  console.log('Preflight: loopback port free; disk/memory thresholds passed; Docker CPUs=' + info.cpus);
}
async function initialize(port = 64344) {
  if (fs.existsSync(active)) throw Error('Integration state already exists; use status/up without rotating secrets');
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Invalid loopback port');
  await preflight(port);
  const id = randomBytes(8).toString('hex'), project = 'goleve-integration-v1-' + id, directory = path.join(runtime, id);
  for (const kind of ['network', 'volume']) if (docker(kind, 'ls', '--format', '{{.Name}}').split(/\r?\n/).some(n => n.startsWith(project))) throw Error('Integration namespace collision');
  if (docker('ps', '-a', '--format', '{{.Names}}').split(/\r?\n/).some(n => n.startsWith(project))) throw Error('Container name collision');
  const baseline = docker('ps', '-aq').split(/\s+/).filter(Boolean).map(inspect);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const write = (name, value) => fs.writeFileSync(path.join(directory, name), value, { flag: 'wx', mode: 0o600 });
  const secret = () => randomBytes(32).toString('hex'), rabbitPassword = secret();
  write('mongo.env', 'MONGO_INITDB_ROOT_USERNAME=integration_root\nMONGO_INITDB_ROOT_PASSWORD=' + secret() + '\n');
  write('rabbit.env', 'RABBITMQ_DEFAULT_USER=integration\nRABBITMQ_DEFAULT_PASS=' + rabbitPassword + '\n');
  const rabbit = 'amqp://integration:' + rabbitPassword + '@rabbitmq:5672';
  write('events.env', 'RABBITMQ_URL=' + rabbit + '\nAGENDA_PROFESSIONAL_RABBITMQ_URL=' + rabbit + '\nPAYMENT_NOTIFICATION_RABBITMQ_URL=' + rabbit + '\n');
  write('notification-service.env', 'RABBITMQ_URL=' + rabbit + '\n');
  write('replica.key', randomBytes(756).toString('base64'));
  for (const key of ['mfa', 'user_key', 'agenda_key', 'management_auth', 'management_professional', 'management_agenda', 'management_payment']) write(key + '.key', secret());
  const catalogue = [];
  for (const name of [...apps, 'auth-test']) {
    const database = name === 'agenda' ? 'goleve_agenda_professional_local_' + id
      : ['notification', 'payment'].includes(name) ? 'goleve_notification59_' + id + '_' + name
      : name === 'auth-test' ? 'goleve_administration511_' + id + '_auth'
      : name === 'ai-coach' ? 'goleve_ai_local_' + id : 'goleve_integration_' + id + '_' + name;
    const username = 'integration_' + name.replace(/-/g, '_'), password = secret();
    const uri = 'mongodb://' + username + ':' + password + '@mongodb:27017/' + database + '?authSource=' + database + '&replicaSet=goleveIntegrationV1&retryWrites=true&w=majority';
    catalogue.push({ database, username, password });
    const filename = name === 'auth-test' ? 'auth-test.env' : name + '-service.env';
    const body = 'MONGO_URI=' + uri + '\n' + (name === 'auth' ? 'JWT_SECRET=' + secret() + '\n' : '');
    if (name === 'notification') fs.appendFileSync(path.join(directory, filename), body); else write(filename, body);
  }
  write('databases.json', JSON.stringify({ instance: id, databases: catalogue }));
  write('compose.env', 'INTEGRATION_ROOT=' + directory.replace(/\\/g, '/') + '\nINTEGRATION_INSTANCE=' + id + '\nINTEGRATION_PROJECT=' + project + '\nINTEGRATION_PORT=' + port + '\n');
  const state = { id, project, directory, port, baseline };
  fs.writeFileSync(active, JSON.stringify(state), { flag: 'wx', mode: 0o600 });
  compose(state, ['config', '--quiet']);
  console.log('Prepared independent integration instance ' + id + '; secrets generated locally and not printed.');
}
function verifyBaseline(s) {
  const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value;
  const main = [];
  for (const old of s.baseline) {
    const current = inspect(old.id);
    for (const key of ['id', 'image', 'name', 'started', 'mounts', 'networks']) if (JSON.stringify(stable(old[key])) !== JSON.stringify(stable(current[key]))) throw Error('Preexisting resource changed: ' + old.name);
    if (/^\/goleve-(mongodb|rabbitmq|api-gateway|auth-service|user-service|professional-service|agenda-service|training-service|hydration-service|performance-service|payment-service|notification-service|ai-coach-service|management-service)-1$/.test(current.name)) {
      if (current.health !== 'healthy') throw Error('Main component no longer healthy: ' + current.name); main.push(current.name);
    }
  }
  if (main.length !== 14) throw Error('Expected all 14 main components in baseline');
  return { preexistingPreserved: s.baseline.length, mainHealthy: main.length };
}
function exec(s, service, script, input) {
  const c = own(s, service);
  return cp.execFileSync('docker', ['exec', '-i', c.id, 'node', '/integration/' + script], { input: JSON.stringify(input || {}), encoding: 'utf8', timeout: 180000, maxBuffer: 2000000 });
}
async function main() {
  const [action, argument] = process.argv.slice(2);
  if (action === 'init') return initialize(argument === undefined ? 64344 : Number(argument));
  const s = load();
  if (action === 'up') {
    if (!own(s, 'api-gateway', false)) await preflight(s.port);
    for (const name of [...apps.map(n => n + '-service'), 'api-gateway']) { console.log('Building isolated image: ' + name); compose(s, ['build', name], true); }
    compose(s, ['up', '-d', '--no-build', '--wait', '--wait-timeout', '300'], true);
    const initializer = own(s, 'mongo-init'); if (initializer.state !== 'exited') throw Error('Initializer did not complete');
    compose(s, ['rm', '-f', 'mongo-init']);
    console.log(JSON.stringify(verifyBaseline(s)));
    console.log('Gateway: http://127.0.0.1:' + s.port + '; only fictional development data.'); return;
  }
  if (action === 'status') {
    for (const name of services.filter(n => n !== 'mongo-init')) { const c = own(s, name, false); console.log(name + ': ' + (c ? c.state + ' / ' + c.health : 'not-created')); }
    console.log(JSON.stringify(verifyBaseline(s))); return;
  }
  if (action === 'stop') {
    for (const n of services.filter(n => n !== 'mongo-init')) own(s, n);
    compose(s, ['stop', ...services.filter(n => n !== 'mongo-init')], true); return;
  }
  if (action === 'start') {
    for (const n of services.filter(n => n !== 'mongo-init')) own(s, n);
    compose(s, ['up', '-d', '--no-build', '--wait', '--wait-timeout', '300'], true);
    const initializer = own(s, 'mongo-init');
    if (initializer.state !== 'exited') throw Error('Initializer did not complete');
    compose(s, ['rm', '-f', 'mongo-init']);
    console.log(JSON.stringify(verifyBaseline(s))); return;
  }
  if (action === 'test') { await require('./integration/smoke.cjs').run(s, { own, docker, compose, exec, verifyBaseline }); return; }
  throw Error('Use init [port], up, status, test, stop or start. No volume/network deletion command is provided.');
}
module.exports = { load, own, docker, compose, exec, verifyBaseline, initialize };
if (require.main === module) void main().catch(error => { console.error('Integration operation failed: ' + (error.code || error.name || 'unknown') + '; inspect the documented checks. No preexisting resources were changed by this command.'); process.exitCode = 1; });
