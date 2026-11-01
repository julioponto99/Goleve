'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const { spawn } = require('node:child_process');

const DEFAULT_APPLICATION_DATABASES = [
  'goleve_auth',
  'goleve_user',
  'goleve_agenda',
  'goleve_professional',
];
const INTERNAL_DATABASES = new Set(['admin', 'config', 'local']);

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (!value.startsWith('--')) throw new Error(`Unexpected argument: ${value}`);
    const key = value.slice(2);
    if (key === 'help') return { help: true };
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) throw new Error(`Missing value for --${key}`);
    result[key] = next;
    i += 1;
  }
  return result;
}

function spawnChecked(command, args, options = {}) {
  const { captureStdout = false, ...spawnOptions } = options;
  const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, ...spawnOptions });
  let stderr = '';
  let stdout = '';
  if (captureStdout) {
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
  }
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  return {
    child,
    stdout: () => stdout,
    stderr: () => stderr,
    exit: new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (code, signal) => resolve({ code, signal }));
    }),
  };
}

async function assertDatabasesExist({ docker, container, databases }) {
  const process = spawnChecked(docker, [
    'exec', container, 'mongosh', '--quiet', '--eval',
    'print(JSON.stringify(db.adminCommand({listDatabases:1,nameOnly:true}).databases.map(d => d.name)))',
  ], { captureStdout: true });
  const result = await process.exit;
  if (result.code !== 0) throw new Error(`database inventory failed with exit code ${result.code ?? 'unknown'}`);
  let existing;
  try {
    existing = JSON.parse(process.stdout().trim().split(/\r?\n/).pop());
  } catch {
    throw new Error('database inventory returned invalid JSON');
  }
  const missing = databases.filter((database) => !existing.includes(database));
  if (missing.length > 0) throw new Error(`configured databases do not exist: ${missing.join(', ')}`);
  const unselectedApplicationDatabases = existing.filter((database) =>
    database.startsWith('goleve_') && !databases.includes(database));
  if (unselectedApplicationDatabases.length > 0) {
    throw new Error(`application databases are not selected: ${unselectedApplicationDatabases.join(', ')}`);
  }
  return { existing, internal: existing.filter((database) => INTERNAL_DATABASES.has(database)) };
}

function utcName() {
  return `${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}-${crypto.randomBytes(6).toString('hex')}`;
}

async function ensureSafeRecipient({ recipient, recipientFile }) {
  const value = recipient
    ? recipient.trim()
    : (await fsp.readFile(path.resolve(recipientFile), 'utf8')).trim();
  if (!value || value.includes('\n') || !value.startsWith('age1')) {
    throw new Error('AGE_RECIPIENT or recipient file must contain one valid age public recipient');
  }
  return value;
}

function assertPlainDirectory(directory, label) {
  const item = fs.lstatSync(directory);
  if (!item.isDirectory() || item.isSymbolicLink()) {
    throw new Error(`${label} must be a real directory without a symbolic link`);
  }
}

async function runEncryptedBackup({
  outputRoot,
  recipient,
  recipientFile,
  container = 'goleve-mongodb-1',
  sourceContainer = container,
  docker = 'docker',
  age = 'age',
  databases = DEFAULT_APPLICATION_DATABASES,
  source,
  whatIf = false,
  signal,
}) {
  if (!path.isAbsolute(outputRoot)) throw new Error('outputRoot must be absolute');
  if (!recipient && !recipientFile && !process.env.AGE_RECIPIENT) {
    throw new Error('AGE_RECIPIENT, recipient, or recipientFile is required');
  }
  const approvedContainers = ['goleve-mongodb-1', 'goleve-mongodb-restore-test-mongodb-restore-test-1'];
  if (!approvedContainers.includes(container)) throw new Error('backup container is not approved');
  if (!approvedContainers.includes(sourceContainer)) {
    throw new Error('source container is not an approved MongoDB container');
  }
  if (!Array.isArray(databases) || databases.length === 0 || databases.some((database) => !/^[a-zA-Z0-9_-]+$/.test(database))) {
    throw new Error('databases must contain one or more valid database names');
  }
  if (process.env.MONGO_BACKUP_URI) {
    throw new Error('MONGO_BACKUP_URI is not supported by this binary pipeline; configure a protected mongodump credential mechanism first');
  }
  const validatedRecipient = await ensureSafeRecipient({
    recipient: recipient || process.env.AGE_RECIPIENT,
    recipientFile,
  });
  const directory = path.join(path.resolve(outputRoot), `backup-${utcName()}`);
  const partial = path.join(directory, '.mongodb.archive.age.partial');
  const archive = path.join(directory, 'mongodb.archive.age');
  const hashPath = path.join(directory, 'mongodb.archive.age.sha256');
  const manifestPath = path.join(directory, 'manifest.json');
  assertPlainDirectory(path.dirname(path.resolve(outputRoot)), 'output root parent');
  if (fs.existsSync(outputRoot)) assertPlainDirectory(path.resolve(outputRoot), 'output root');
  if (!source) await assertDatabasesExist({ docker, container: sourceContainer, databases });
  if (whatIf) return { directory, archive, whatIf: true };

  await fsp.mkdir(directory, { recursive: false });
  let sourceProcess;
  let ageProcess;
  let created = true;
  try {
    const dumpSource = source || {
      command: docker,
      args: ['exec', sourceContainer, 'mongodump', '--archive', '--gzip', ...databases.flatMap((database) => ['--nsInclude', `${database}.*`])],
    };
    sourceProcess = spawnChecked(dumpSource.command, dumpSource.args);
    ageProcess = spawnChecked(age, ['-r', validatedRecipient]);
    const abort = () => {
      sourceProcess.child.kill();
      ageProcess.child.kill();
    };
    if (signal) {
      if (signal.aborted) abort();
      else signal.addEventListener('abort', abort, { once: true });
    }
    const output = fs.createWriteStream(partial, { flags: 'wx' });
    const sourceToAge = pipeline(sourceProcess.child.stdout, ageProcess.child.stdin);
    const ageToDisk = pipeline(ageProcess.child.stdout, output);
    const results = await Promise.allSettled([
      sourceProcess.exit,
      ageProcess.exit,
      sourceToAge,
      ageToDisk,
    ]);
    const sourceResult = results[0].status === 'fulfilled' ? results[0].value : null;
    const ageResult = results[1].status === 'fulfilled' ? results[1].value : null;
    const streamFailure = results.slice(2).find((result) => result.status === 'rejected');
    if (streamFailure) throw streamFailure.reason;
    if (!sourceResult || !ageResult) throw new Error('stream subprocess failed to start');
    if (sourceResult.code !== 0) throw new Error(`dump process failed with exit code ${sourceResult.code ?? 'unknown'}`);
    if (ageResult.code !== 0) throw new Error(`age process failed with exit code ${ageResult.code ?? 'unknown'}`);
    if (signal?.aborted) throw new Error('backup operation was cancelled');
    const stat = await fsp.stat(partial);
    if (stat.size === 0) throw new Error('encrypted archive is empty');
    const hash = crypto.createHash('sha256');
    await pipeline(fs.createReadStream(partial), hash);
    const digest = hash.digest('hex');
    const manifest = {
      createdAtUtc: new Date().toISOString(),
      archive: path.basename(archive),
      sha256: digest,
      container,
      databases,
      encrypted: true,
      consistency: 'Requires approved write-quiescence window; mongodump is not cross-database atomic',
    };
    await fsp.writeFile(hashPath, `${digest}  ${path.basename(archive)}\n`, { flag: 'wx' });
    await fsp.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
    await fsp.rename(partial, archive);
    created = false;
    return { directory, archive, hashPath, manifestPath, sha256: digest };
  } catch (error) {
    for (const child of [sourceProcess, ageProcess]) {
      if (child?.child && !child.child.killed) child.child.kill();
    }
    if (created) await fsp.rm(directory, { recursive: true, force: true });
    throw error;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node stream-encrypted-backup.cjs --output-root <absolute> (--recipient <age-recipient> | --recipient-file <path> | AGE_RECIPIENT) [--container <name>]');
    return;
  }
  const result = await runEncryptedBackup({
    outputRoot: args['output-root'],
    recipient: args.recipient || process.env.AGE_RECIPIENT,
    recipientFile: args['recipient-file'],
    container: args.container,
    databases: args.databases ? args.databases.split(',') : DEFAULT_APPLICATION_DATABASES,
    whatIf: args.whatIf === 'true',
  });
  console.log(JSON.stringify(result));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Encrypted backup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { DEFAULT_APPLICATION_DATABASES, runEncryptedBackup };
