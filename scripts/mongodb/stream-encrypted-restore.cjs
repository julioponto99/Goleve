'use strict';

const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const { spawn } = require('node:child_process');

function spawnChecked(command, args) {
  const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  return {
    child,
    exit: new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (code, signal) => resolve({ code, signal }));
    }),
    stderr: () => stderr,
  };
}

async function runEncryptedRestore({
  encryptedArchive,
  identityFile,
  container = 'goleve-mongodb-restore-test-mongodb-restore-test-1',
  docker = 'docker',
  age = 'age',
  sink = { command: docker, args: ['exec', '-i', container, 'mongorestore', '--archive=-', '--gzip'] },
}) {
  const archive = path.resolve(encryptedArchive);
  if (!archive.endsWith('.age')) throw new Error('encryptedArchive must end with .age');
  if (container !== 'goleve-mongodb-restore-test-mongodb-restore-test-1') {
    throw new Error('restore container is restricted to the isolated restore test container');
  }
  if (!path.isAbsolute(identityFile)) throw new Error('identityFile must be absolute');
  await fsp.access(archive, fs.constants.R_OK);
  await fsp.access(identityFile, fs.constants.R_OK);
  const ageProcess = spawnChecked(age, ['--decrypt', '--identity', identityFile]);
  const sinkProcess = spawnChecked(sink.command, sink.args);
  try {
    const decryptToRestore = pipeline(ageProcess.child.stdout, sinkProcess.child.stdin);
    const archiveToDecrypt = pipeline(fs.createReadStream(archive), ageProcess.child.stdin);
    const results = await Promise.allSettled([
      ageProcess.exit,
      sinkProcess.exit,
      decryptToRestore,
      archiveToDecrypt,
    ]);
    const ageResult = results[0].status === 'fulfilled' ? results[0].value : null;
    const sinkResult = results[1].status === 'fulfilled' ? results[1].value : null;
    const streamFailure = results.slice(2).find((result) => result.status === 'rejected');
    if (streamFailure) throw streamFailure.reason;
    if (!ageResult || !sinkResult) throw new Error('restore subprocess failed to start');
    if (ageResult.code !== 0) throw new Error(`age decryption failed with exit code ${ageResult.code ?? 'unknown'}`);
    if (sinkResult.code !== 0) throw new Error(`restore process failed with exit code ${sinkResult.code ?? 'unknown'}`);
    return { restored: true, container };
  } catch (error) {
    for (const child of [ageProcess, sinkProcess]) {
      if (!child.child.killed) child.child.kill();
    }
    throw error;
  }
}

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
    if (!value.startsWith('--')) return pairs;
    pairs.push([value.slice(2), all[index + 1]]);
    return pairs;
  }, []));
  if (!args['encrypted-archive'] || !args['identity-file']) {
    throw new Error('Usage: node stream-encrypted-restore.cjs --encrypted-archive <file.age> --identity-file <absolute path>');
  }
  console.log(JSON.stringify(await runEncryptedRestore({
    encryptedArchive: args['encrypted-archive'],
    identityFile: args['identity-file'],
    container: args.container,
  })));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Encrypted restore failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { runEncryptedRestore };
