'use strict';

// Local configuration only: this command never starts Docker, seeds or migrates.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const dotenv = require('../backend/node_modules/dotenv');
const ROOT = path.resolve(__dirname, '..');
const services = [
  ['auth', 3001, 'auth'], ['user', 3002, 'user'], ['training', 3003, 'training'],
  ['agenda', 3004, 'agenda'], ['performance', 3005, 'performance'], ['hydration', 3006, 'hydration'],
  ['professional', 3007, 'professional'], ['management', 3008, 'management'],
  ['payment', 3009, 'payment'], ['notification', 3010, 'notification'], ['ai-coach', 3011, 'ai_coach'],
];
const secret = () => crypto.randomBytes(32).toString('hex');
function readEnv(file) { return fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {}; }
function assertIgnored(root, file) {
  const rel = path.relative(root, file);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw Error('Configuration outside official repository refused');
  const r = cp.spawnSync('git', ['check-ignore', '--quiet', '--no-index', '--', rel], { cwd: root, windowsHide: true });
  if (r.status !== 0) throw Error('Sensitive output is not ignored by Git: ' + rel);
  const tracked = cp.spawnSync('git', ['ls-files', '--error-unmatch', '--', rel], { cwd: root, windowsHide: true, stdio: 'ignore' });
  if (tracked.status === 0) throw Error('Sensitive output is already tracked: ' + rel);
}
function appendMissing(file, defaults, validate = () => {}) {
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const keys = [...old.matchAll(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm)].map(m => m[1]);
  if (new Set(keys).size !== keys.length) throw Error('Duplicate environment keys: ' + path.basename(file));
  const values = dotenv.parse(old), add = Object.keys(defaults).filter(k => !Object.hasOwn(values, k));
  const result = { ...defaults, ...values }; validate(result);
  if (add.length) {
    const content = (old && !old.endsWith('\n') ? '\n' : '') + add.map(k => k + '=' + JSON.stringify(String(defaults[k]))).join('\n') + '\n';
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (fs.existsSync(file)) {
      if (fs.readFileSync(file, 'utf8') !== old) throw Error('Concurrent environment edit; existing values preserved');
      fs.appendFileSync(file, content, { mode: 0o600 });
    } else fs.writeFileSync(file, content, { mode: 0o600, flag: 'wx' });
  }
  return { values: result, added: add.length };
}
function prepare(root = ROOT) {
  const rootFile = path.join(root, '.env'); assertIgnored(root, rootFile);
  const original = readEnv(rootFile);
  // Reuse the current Rabbit credentials from root configuration, never silently rotate them.
  let rabbit;
  if (original.RABBITMQ_URL) { try { rabbit = new URL(original.RABBITMQ_URL); } catch { throw Error('Existing Rabbit configuration invalid; values preserved'); } }
  const rootDefaults = {
    COMPOSE_PROJECT_NAME: 'goleve', API_GATEWAY_PORT: '3000', MONGO_PORT: '27019',
    RABBITMQ_PORT: '5672', RABBITMQ_MANAGEMENT_PORT: '15672', MONGO_DB_PREFIX: 'goleve',
    RABBITMQ_USER: original.RABBITMQ_USER || (rabbit && decodeURIComponent(rabbit.username)) || 'goleve',
    RABBITMQ_PASSWORD: original.RABBITMQ_PASSWORD || (rabbit && decodeURIComponent(rabbit.password)) || secret(),
    MONGO_EXPRESS_USERNAME: 'goleve-tools', MONGO_EXPRESS_PASSWORD: secret(),
    JWT_SECRET: secret(), USER_DATA_KEY_PATH: './.secrets/user-data-key.key',
  };
  const state = appendMissing(rootFile, rootDefaults, e => {
    if (!/^[a-z0-9][a-z0-9_-]{0,47}$/.test(e.COMPOSE_PROJECT_NAME) || !/^[a-z][a-z0-9_]*$/.test(e.MONGO_DB_PREFIX)) throw Error('Unexpected official project or database prefix');
    if (!e.JWT_SECRET || e.JWT_SECRET.length < 32 || /development-only|change-me/i.test(e.JWT_SECRET)) throw Error('Existing JWT configuration is insecure; not overwritten');
  }).values;
  const keyDir = path.join(root, '.secrets', 'local-runtime');
  for (const name of ['mfa', 'management_auth', 'management_professional', 'management_agenda', 'management_payment', 'agenda', 'payment_agenda', 'payment_professional', 'agenda_professional']) {
    const file = path.join(keyDir, name + '.key'); assertIgnored(root, file);
    if (!fs.existsSync(file)) { fs.mkdirSync(keyDir, { recursive: true }); fs.writeFileSync(file, secret() + '\n', { flag: 'wx', mode: 0o600 }); }
    else if (!fs.lstatSync(file).isFile() || fs.lstatSync(file).isSymbolicLink()) throw Error('Unsafe existing key path');
  }
  const userKey = path.resolve(root, state.USER_DATA_KEY_PATH); assertIgnored(root, userKey);
  if (!fs.existsSync(userKey)) { fs.mkdirSync(path.dirname(userKey), { recursive: true }); fs.writeFileSync(userKey, secret() + '\n', { flag: 'wx', mode: 0o600 }); }
  const peerUrls = Object.fromEntries(services.map(([name, port]) => [name.replaceAll('-', '_').toUpperCase() + '_SERVICE_URL', 'http://' + name + '-service:' + port]));
  const rabbitUrl = 'amqp://' + encodeURIComponent(state.RABBITMQ_USER) + ':' + encodeURIComponent(state.RABBITMQ_PASSWORD) + '@rabbitmq:5672';
  const files = [];
  function emit(relative, values) { const file = path.join(root, relative); assertIgnored(root, file); const r = appendMissing(file, values); files.push({ file: relative, variablesAdded: r.added }); }
  for (const [name, port, database] of services) {
    const e = { NODE_ENV: 'development', GOLEVE_LOCAL_DEMO_ENABLED: 'false', PORT: String(port), AUTH_SERVICE_URL: peerUrls.AUTH_SERVICE_URL,
      MONGO_URI: 'mongodb://mongodb:27017/' + state.MONGO_DB_PREFIX + '_' + database + '?replicaSet=goleveV1&retryWrites=true&w=majority',
      RABBITMQ_URL: rabbitUrl };
    if (name === 'auth') Object.assign(e, { JWT_SECRET: state.JWT_SECRET, AUTH_BOOTSTRAP_ENABLED: 'false', AUTH_MFA_ENCRYPTION_KEY_FILE: '/run/secrets/mfa' });
    if (name === 'user') Object.assign(e, { USER_DATA_MODE: state.USER_DATA_MODE || 'disabled', USER_DATA_KEY_FILE: '/run/secrets/user_data_key' });
    if (name === 'professional') Object.assign(e, { PROFESSIONAL_DATA_MODE: state.PROFESSIONAL_DATA_MODE || 'disabled', PROFESSIONAL_REVIEW_MODE: 'disabled', PROFESSIONAL_REVIEWER_IDS: '', CARE_INVITATION_TTL_DAYS: '7', ...peerUrls });
    if (['auth', 'professional', 'agenda', 'payment', 'management'].includes(name)) {
      Object.assign(e, { MANAGEMENT_CONTRACT_ENABLED: 'true', MANAGEMENT_SERVICE_URL: 'http://management-service:3008' });
      for (const peer of ['auth', 'professional', 'agenda', 'payment']) if (name === 'management' || peer === name) e['MANAGEMENT_' + peer.toUpperCase() + '_KEY_FILE'] = '/run/secrets/management_' + peer;
    }
    if (name === 'management') Object.assign(e, peerUrls);
    if (name === 'agenda') Object.assign(e, { AGENDA_PROFESSIONAL_ENABLED: 'false', PROFESSIONAL_SERVICE_URL: peerUrls.PROFESSIONAL_SERVICE_URL });
    if (name === 'payment') Object.assign(e, { PAYMENT_DEMO_ENABLED: 'true', PAYMENT_AGENDA_DEMO_ENABLED: 'false', PAYMENT_NOTIFICATION_EVENTS_ENABLED: 'false' });
    if (name === 'notification') e.NOTIFICATION_DEMO_EVENTS_ENABLED = 'false';
    if (name === 'ai-coach') Object.assign(e, { AI_COACH_ENABLED: 'false', AI_COACH_PROVIDER: 'none' });
    emit('backend/services/' + name + '-service/.env', e);
  }
  emit('backend/api-gateway/.env', { NODE_ENV: 'development', GOLEVE_LOCAL_DEMO_ENABLED: 'false', PORT: '3000', ...peerUrls,
    CORS_ALLOWED_ORIGINS: 'http://127.0.0.1:5173,http://localhost:5173', GATEWAY_API_DOCS_ENABLED: 'true',
    GATEWAY_API_DOCS_ORIGIN: 'http://127.0.0.1:' + state.API_GATEWAY_PORT, GATEWAY_API_DOCS_TRY_IT_OUT: 'false' });
  // Backend-only setup does not create frontend workspaces or configuration.
  return { prepared: files, secrets: 'generated only when absent; never printed', infrastructureChanged: false, accountsCreated: 0 };
}
function environmentInventory(root = ROOT) {
  const result = [];
  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.isSymbolicLink()) continue;
      if (item.isDirectory()) { if (!['node_modules', '.git', '.expo', '.cache', '.secrets', '.demo', '.integration', '.local', 'protected-backups', 'session-artifacts', 'dist'].includes(item.name)) walk(path.join(dir, item.name)); }
      else if (/^(?:.*\.)?env(?:\..*)?$/.test(item.name)) {
        const file = path.join(dir, item.name); result.push({ file: path.relative(root, file), operational: item.name === '.env', keys: Object.keys(readEnv(file)) });
      }
    }
  } walk(root); return result;
}
function dockerAudit(root = ROOT) {
  const run = args => {
    const r = cp.spawnSync('docker', args, { encoding: 'utf8', windowsHide: true, maxBuffer: 8e6 });
    if (r.status !== 0) throw Error('Docker read failed; no infrastructure was changed'); return r.stdout;
  };
  const ids = run(['ps', '-aq']).trim().split(/\s+/).filter(Boolean);
  const containers = ids.length ? JSON.parse(run(['inspect', ...ids])) : [];
  const official = path.resolve(root, 'compose.yaml').toLowerCase();
  return containers.map(c => {
    const labels = c.Config.Labels || {}, config = labels['com.docker.compose.project.config_files'] || '';
    const env = Object.fromEntries((c.Config.Env || []).map(v => { const i = v.indexOf('='); return [v.slice(0, i), v.slice(i + 1)]; }));
    let database; try { database = new URL(env.MONGO_URI).pathname.slice(1); } catch { /* no URI values in reports */ }
    return { id: c.Id, name: c.Name, service: labels['com.docker.compose.service'], project: labels['com.docker.compose.project'],
      official: config.split(',').some(v => path.resolve(v).toLowerCase() === official), composeFiles: config,
      image: c.Image, state: c.State.Status, health: c.State.Health?.Status, exitCode: c.State.ExitCode, oomKilled: c.State.OOMKilled,
      database, environmentKeys: Object.keys(env), mounts: c.Mounts.map(m => ({ type: m.Type, name: m.Name, source: m.Source, destination: m.Destination })),
      ports: c.HostConfig.PortBindings };
  });
}
if (require.main === module) {
  try {
    const action = process.argv[2];
    if (action === 'prepare') console.log(JSON.stringify(prepare(), null, 2));
    else if (action === 'env-audit') console.log(JSON.stringify(environmentInventory(), null, 2));
    else if (action === 'docker-audit') {
      const report = { recordedAt: new Date().toISOString(), containers: dockerAudit() }, file = path.join(ROOT, '.local/runtime-audit.json');
      assertIgnored(ROOT, file); fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(report, null, 2), { mode: 0o600 });
      console.log(JSON.stringify({ saved: '.local/runtime-audit.json', total: report.containers.length, official: report.containers.filter(c => c.official).map(c => ({ service: c.service, state: c.state, database: c.database })) }, null, 2));
    } else throw Error('Usage: node scripts/local-runtime.cjs prepare|env-audit|docker-audit');
  } catch { console.error('Local runtime operation refused; check configuration, ignored paths and Docker access. No secret values are printed.'); process.exitCode = 1; }
}
module.exports = { appendMissing, environmentInventory, dockerAudit, prepare, assertIgnored, services };
