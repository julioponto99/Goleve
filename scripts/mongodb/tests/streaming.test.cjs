'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = fs.promises;
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { runEncryptedBackup } = require('../stream-encrypted-backup.cjs');
const { runEncryptedRestore } = require('../stream-encrypted-restore.cjs');

const ageRoot = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages',
  'FiloSottile.age_Microsoft.Winget.Source_8wekyb3d8bbwe', 'age');
const age = path.join(ageRoot, 'age.exe');
const keygen = path.join(ageRoot, 'age-keygen.exe');
const node = process.execPath;

async function command(command, args, options = {}) {
  const { spawn } = require('node:child_process');
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    child.once('error', reject);
    child.once('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function fixture() {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'goleve-stream-test-'));
  const key = path.join(root, 'test-key.txt');
  const recipient = path.join(root, 'recipient.txt');
  await command(keygen, ['-o', key]);
  const derived = await command(keygen, ['-y', key]);
  await fsp.writeFile(recipient, derived.stdout.trim());
  return { root, key, recipient };
}

function sourceFor(bytes, delay = 0) {
  const script = [
    'const { once } = require("node:events");',
    `const data = Buffer.alloc(${bytes}, 0x5a);`,
    'process.stdout.write(data);',
    delay ? `setTimeout(() => process.exit(0), ${delay});` : 'process.exit(0);',
  ].join('');
  return { command: node, args: ['-e', script] };
}

test('streams synthetic binary data, encrypts it, and does not replace output', async () => {
  const { root, key, recipient } = await fixture();
  try {
    const first = await runEncryptedBackup({ outputRoot: root, recipientFile: recipient, age, source: sourceFor(1024 * 1024) });
    const second = await runEncryptedBackup({ outputRoot: root, recipientFile: recipient, age, source: sourceFor(1024 * 1024) });
    assert.notEqual(first.archive, second.archive);
    assert.equal((await fsp.stat(first.archive)).size > 0, true);
    assert.equal(await fsp.readFile(first.manifestPath, 'utf8').then((value) => value.includes(first.sha256)), true);
  } finally {
    await fsp.rm(root, { recursive: true, force: true });
  }
});

test('restores decrypted bytes through a binary sink without plaintext files', async () => {
  const { root, key, recipient } = await fixture();
  try {
    const backup = await runEncryptedBackup({ outputRoot: root, recipientFile: recipient, age, source: sourceFor(4096) });
    const sink = {
      command: node,
      args: ['-e', 'let n=0; process.stdin.on("data", b => n += b.length); process.stdin.on("end", () => process.exit(n === 4096 ? 0 : 7));'],
    };
    const result = await runEncryptedRestore({ encryptedArchive: backup.archive, identityFile: key, age, sink });
    assert.equal(result.restored, true);
    const files = await fsp.readdir(root, { recursive: true });
    assert.equal(files.some((name) => String(name).endsWith('.partial')), false);
  } finally {
    await fsp.rm(root, { recursive: true, force: true });
  }
});

test('cleans its partial directory after a source failure and supports WhatIf', async () => {
  const { root, recipient } = await fixture();
  try {
    const before = await fsp.readdir(root);
    const plan = await runEncryptedBackup({ outputRoot: root, recipientFile: recipient, age, source: sourceFor(1), whatIf: true });
    assert.equal(plan.whatIf, true);
    assert.deepEqual(await fsp.readdir(root), before);
    await assert.rejects(
      runEncryptedBackup({ outputRoot: root, recipientFile: recipient, age, source: { command: node, args: ['-e', 'process.exit(9)'] } }),
      /dump process failed/,
    );
    assert.deepEqual(await fsp.readdir(root), before);
  } finally {
    await fsp.rm(root, { recursive: true, force: true });
  }
});

test('cleans its output when age fails', async () => {
  const { root, recipient } = await fixture();
  try {
    await assert.rejects(
      runEncryptedBackup({
        outputRoot: root,
        recipientFile: recipient,
        age: node,
        source: sourceFor(1024),
      }),
      /age process failed|stream subprocess failed/,
    );
    assert.deepEqual((await fsp.readdir(root)).filter((name) => name.startsWith('backup-')), []);
  } finally {
    await fsp.rm(root, { recursive: true, force: true });
  }
});

test('rejects cancellation and leaves no partial output', async () => {
  const { root, recipient } = await fixture();
  const controller = new AbortController();
  try {
    const operation = runEncryptedBackup({
      outputRoot: root,
      recipientFile: recipient,
      age,
      source: sourceFor(1024 * 1024, 5000),
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(), 50);
    await assert.rejects(operation);
    const remaining = await fsp.readdir(root);
    assert.deepEqual(remaining.filter((name) => name.startsWith('backup-')), []);
  } finally {
    await fsp.rm(root, { recursive: true, force: true });
  }
});
