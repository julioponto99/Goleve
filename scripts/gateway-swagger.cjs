'use strict';
// Offline bundling: Docker's existing backend/ build context contains the generated
// TypeScript asset. Runtime never reads repository documents, env files or networks.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { generate, routes, validate } = require('./release-contracts.cjs');
const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'documentation/api');
const canonicalFile = path.join(directory, 'backend-release-v1.openapi.json');
const output = path.join(root, 'backend/api-gateway/src/generated/api-docs-document.ts');
const allowedFiles = new Set(['backend-release-v1', 'backend-integration-v1', 'administration-v1', 'management-v1'].map(n => n + '.openapi.json'));

function bundle() {
  const documents = new Map();
  function read(file) {
    assert(path.dirname(file) === directory && allowedFiles.has(path.basename(file)), 'Unapproved OpenAPI source');
    if (!documents.has(file)) documents.set(file, JSON.parse(fs.readFileSync(file, 'utf8')));
    return documents.get(file);
  }
  const original = read(canonicalFile);
  assert.deepEqual(original, generate().spec, 'Canonical OpenAPI drift; run docs:generate');
  validate(original, canonicalFile);
  const imported = {}, references = new Map();
  function rewrite(value, file) {
    if (Array.isArray(value)) return value.map(item => rewrite(item, file));
    if (!value || typeof value !== 'object') return value;
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      if (['x-source', 'x-owner-document', 'x-validation-source'].includes(key)) continue;
      if (key !== '$ref') { result[key] = rewrite(child, file); continue; }
      const [name, pointer] = child.split('#');
      const target = name ? path.resolve(path.dirname(file), name) : file;
      const parts = pointer?.split('/').slice(1).map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'));
      assert(parts?.[0] === 'components' && parts.length === 3, 'Only component references may be bundled');
      if (target === canonicalFile) { result[key] = '#' + pointer; continue; }
      const refKey = target + '#' + pointer;
      if (!references.has(refKey)) {
        const source = read(target), [, group, component] = parts;
        assert(Object.hasOwn(source.components?.[group] || {}, component), 'Unresolved component');
        const alias = path.basename(target, '.openapi.json').replace(/-/g, '_') + '__' + component;
        const localRef = '#/components/' + group + '/' + alias;
        references.set(refKey, localRef); // Before recursion: circular schemas stay references.
        imported[group] ??= {};
        imported[group][alias] = rewrite(source.components[group][component], target);
      }
      result[key] = references.get(refKey);
    }
    return result;
  }
  const document = rewrite(original, canonicalFile);
  for (const [group, values] of Object.entries(imported)) document.components[group] = { ...document.components[group], ...values };
  document.servers = [{ url: '/', description: 'Current development Gateway origin only' }];
  const pairs = [];
  for (const [url, operations] of Object.entries(document.paths)) {
    assert(!url.split('/').some(p => ['internal', '.', '..'].includes(p.toLowerCase())), 'Private path in public document');
    delete operations.servers;
    for (const [method, operation] of Object.entries(operations)) {
      delete operation.servers;
      pairs.push(method + ' ' + url);
    }
  }
  assert.deepEqual(pairs.sort(), routes().map(r => r.method + ' ' + r.path).sort(), 'Gateway operation mismatch');
  function check(value) {
    if (!value || typeof value !== 'object') return;
    if (value.$ref) {
      assert(value.$ref.startsWith('#/components/'), 'External reference in served document');
      let target = document;
      for (const part of value.$ref.slice(2).split('/')) target = target?.[part.replace(/~1/g, '/').replace(/~0/g, '~')];
      assert(target !== undefined, 'Unresolved bundled reference');
    }
    Object.values(value).forEach(check);
  }
  check(document);
  const hash = createHash('sha256');
  for (const [file] of [...documents].sort(([a], [b]) => a.localeCompare(b))) hash.update(path.basename(file)).update(Buffer.from(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')));
  const sourceHash = hash.digest('hex');
  const content = '// Generated from documentation/api/backend-release-v1.openapi.json and its local component references.\n'
    + '// Do not edit. Regenerate: node scripts/gateway-swagger.cjs --write\n'
    + '// Source SHA-256: ' + sourceHash + '\n'
    + 'export const apiDocsDocument = JSON.parse(' + JSON.stringify(JSON.stringify(document)) + ') as Record<string, unknown>;\n';
  return { document, content, operations: pairs.length, sourceHash };
}

function main() {
  const args = process.argv.slice(2);
  assert(args.length === 0 || args.length === 1 && args[0] === '--write', 'Use [--write]');
  const generated = bundle();
  if (args[0] === '--write') {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, generated.content);
  } else assert.equal(fs.readFileSync(output, 'utf8').replace(/\r\n/g,'\n'), generated.content, 'Bundled Swagger document drift; run docs:generate');
  console.log(JSON.stringify({ mode: args[0] || 'check', operations: generated.operations, paths: Object.keys(generated.document.paths).length, externalRefs: 0, sourceHash: generated.sourceHash }));
}
module.exports = { bundle };
if (require.main === module) main();
