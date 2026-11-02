'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createApp } = require('../dist/app');

async function fixture(options = {}) {
  const saved = { ...process.env }, seen = [];
  const upstream = http.createServer((req, res) => {
    seen.push({ path: req.url, authorization: req.headers.authorization });
    res.writeHead(req.headers.authorization ? 201 : 401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(req.headers.authorization ? { data: { fictional: true } } : { error: { code: 'AUTHENTICATION_REQUIRED' } }));
  });
  upstream.listen(0, '127.0.0.1'); await once(upstream, 'listening');
  const server = http.createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = 'http://127.0.0.1:' + server.address().port;
  Object.assign(process.env, {
    NODE_ENV: 'development', GATEWAY_API_DOCS_ENABLED: 'true', GATEWAY_API_DOCS_TRY_IT_OUT: 'false',
    CORS_ALLOWED_ORIGINS: url, GATEWAY_API_DOCS_ORIGIN: url, GATEWAY_API_RATE_LIMIT: '1000',
    AGENDA_SERVICE_URL: 'http://127.0.0.1:' + upstream.address().port,
    JWT_SECRET: 'fictional-secret-canary-never-in-document',
    MONGO_URI: 'mongodb://fictional:canary-only@unused.invalid/test',
    ...options.env,
  });
  server.on('request', createApp());
  async function close() {
    for (const resource of [server, upstream]) {
      const closed = new Promise(resolve => resource.close(resolve)); resource.closeAllConnections(); await closed;
    }
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
  return { url, seen, close };
}

function initialization(script, origin) {
  let options;
  const browser = { location: { origin, href: origin + '/api-docs' }, SwaggerUIBundle: value => { options = value; return {}; } };
  vm.runInNewContext(script, { globalThis: browser, URL });
  return options;
}

for (const [label, env] of [
  ['disabled by default', { NODE_ENV: 'development', GATEWAY_API_DOCS_ENABLED: 'false' }],
  ['production despite flags', { NODE_ENV: 'production', GATEWAY_API_DOCS_ENABLED: 'true', GATEWAY_API_DOCS_TRY_IT_OUT: 'true' }],
  ['test environment', { NODE_ENV: 'test' }],
  ['unspecified environment', { NODE_ENV: '' }],
]) test('documentation and all assets remain inaccessible: ' + label, async () => {
  const f = await fixture({ env });
  try {
    for (const resource of ['', '/openapi.json', '/init.js', '/swagger-ui.css', '/swagger-ui-bundle.js']) {
      const response = await fetch(f.url + '/api-docs' + resource);
      assert.equal(response.status, 404); assert.equal((await response.json()).error.code, 'NOT_FOUND');
    }
    assert.equal((await fetch(f.url + '/health')).status, 200);
  } finally { await f.close(); }
});

test('development UI serves real local assets and restrictive browser headers', async () => {
  const f = await fixture();
  try {
    for (const suffix of ['', '/']) {
      const response = await fetch(f.url + '/api-docs' + suffix), html = await response.text();
      assert.equal(response.status, 200); assert.match(html, /id="swagger-ui"/);
      assert.match(html, /Try it out: desativado/); assert.doesNotMatch(html, /https?:\/\//);
      assert.match(response.headers.get('content-security-policy'), /connect-src 'self'/);
      assert.match(response.headers.get('content-security-policy'), /script-src 'self'/);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(response.headers.get('set-cookie'), null);
    }
    const js = await fetch(f.url + '/api-docs/swagger-ui-bundle.js');
    assert.equal(js.status, 200); assert.match(await js.text(), /SwaggerUIBundle/);
    const css = await fetch(f.url + '/api-docs/swagger-ui.css');
    assert.equal(css.status, 200); assert.match(await css.text(), /swagger-ui/);
  } finally { await f.close(); }
});

test('served OpenAPI matches actual public routes, groups all services and resolves every reference locally', async () => {
  const f = await fixture();
  try {
    const response = await fetch(f.url + '/api-docs/openapi.json'), document = await response.json();
    assert.equal(response.status, 200); assert.equal(document.openapi, '3.1.0');
    assert.equal(Object.keys(document.paths).length, 170);
    assert.deepEqual(document.servers.map(s => s.url), ['/']);
    const { routes } = require('../../../scripts/release-contracts.cjs');
    const actual = Object.entries(document.paths).flatMap(([p, methods]) => Object.keys(methods).map(m => m + ' ' + p));
    assert.equal(actual.length, 215);
    assert.deepEqual(actual.sort(), routes().map(r => r.method + ' ' + r.path).sort());
    assert.deepEqual(document.tags.map(t => t.name).sort(), ['agenda', 'auth', 'coach', 'gateway', 'hydration', 'management', 'notification', 'payment', 'performance', 'professional', 'training', 'user']);
    const visit = value => {
      if (!value || typeof value !== 'object') return;
      if (value.$ref) {
        assert(value.$ref.startsWith('#/components/'));
        let target = document;
        for (const part of value.$ref.slice(2).split('/')) target = target?.[part.replace(/~1/g, '/').replace(/~0/g, '~')];
        assert.notEqual(target, undefined);
      }
      assert.equal(value['x-source'], undefined);
      Object.values(value).forEach(visit);
    };
    visit(document);
    assert(!Object.keys(document.paths).some(p => p.split('/').includes('internal')));
  } finally { await f.close(); }
});

test('readonly configuration cannot execute requests or redirect the spec through query settings', async () => {
  const f = await fixture();
  try {
    const r = await fetch(f.url + '/api-docs/init.js?configUrl=https://untrusted.invalid/schema&tryItOutEnabled=true');
    const options = initialization(await r.text(), f.url);
    assert.equal(options.supportedSubmitMethods.length, 0);
    assert.equal(options.tryItOutEnabled, false); assert.equal(options.queryConfigEnabled, false);
    assert.equal(options.persistAuthorization, false); assert.equal(options.validatorUrl, null);
    assert.equal(options.withCredentials, false); assert.equal(options.useUnsafeMarkdown, false);
    const spec = options.requestInterceptor({ url: f.url + options.url, headers: { Authorization: 'Bearer fictional' } });
    assert.equal(spec.headers.Authorization, undefined); assert.equal(spec.credentials, 'omit');
    assert.throws(() => options.requestInterceptor({ url: f.url + '/health' }), /disabled/);
    assert.throws(() => options.requestInterceptor({ url: f.url + '/auth/register', method: 'POST' }), /disabled/);
    assert.throws(() => options.requestInterceptor({ url: 'https://untrusted.invalid/openapi.json' }), /current Gateway/);
  } finally { await f.close(); }
});

test('authorized Try it out stays within the public contract and preserves upstream authentication', async () => {
  const f = await fixture({ env: { GATEWAY_API_DOCS_TRY_IT_OUT: 'true' } });
  try {
    const options = initialization(await (await fetch(f.url + '/api-docs/init.js')).text(), f.url);
    assert.equal(options.supportedSubmitMethods.length, 5);
    for (const url of ['https://untrusted.invalid/auth/me', 'http://fictional:password@127.0.0.1/auth/me']) {
      assert.throws(() => options.requestInterceptor({ url, method: 'GET' }), /current Gateway/);
    }
    for (const [url, method] of [['/auth/internal/test', 'GET'], ['/api-docs/package.json', 'GET'], ['/unknown', 'POST'], ['/health', 'TRACE'], ['/auth/%69nternal/test', 'GET']]) {
      assert.throws(() => options.requestInterceptor({ url: f.url + url, method }), /not in the public contract/);
    }
    const denied = await fetch(f.url + '/agenda/activities', { method: 'POST', headers: { Origin: f.url, 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(denied.status, 401); await denied.text();
    const request = options.requestInterceptor({ url: f.url + '/agenda/activities', method: 'POST', headers: { Authorization: 'Bearer fictional-session' } });
    assert.equal(request.credentials, 'omit');
    const accepted = await fetch(request.url, { method: request.method, headers: { ...request.headers, Origin: f.url, 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(accepted.status, 201); await accepted.text();
    assert.equal(f.seen.at(-1).authorization, 'Bearer fictional-session');
    assert.equal(f.seen.at(-1).path, '/agenda/activities');
  } finally { await f.close(); }
});

test('only approved assets are served; private paths and service credentials stay blocked', async () => {
  const f = await fixture();
  try {
    for (const p of ['/api-docs/package.json', '/api-docs/.env', '/api-docs/swagger-ui-bundle.js.map', '/api-docs/administration-v1.openapi.json', '/api-docs/%69nternal/test', '/auth/internal/test']) {
      const r = await fetch(f.url + p); assert.equal(r.status, 404); await r.text();
    }
    const technical = await fetch(f.url + '/api-docs/openapi.json', { headers: { Authorization: 'Service fictional' } });
    assert.equal(technical.status, 404); await technical.text(); assert.equal(f.seen.length, 0);
  } finally { await f.close(); }
});

test('Try it out pins the configured loopback host and the global CORS policy remains effective', async () => {
  const f = await fixture({ env: { GATEWAY_API_DOCS_TRY_IT_OUT: 'true' } });
  try {
    // Node fetch normalizes Host; raw HTTP is needed to send the adversarial value.
    const host = await new Promise((resolve, reject) => {
      http.get(f.url + '/api-docs', { headers: { Host: 'untrusted.invalid' } }, response => {
        let body = ''; response.on('data', chunk => { body += chunk; });
        response.on('end', () => resolve({ status: response.statusCode, body: JSON.parse(body) }));
      }).on('error', reject);
    });
    assert.equal(host.status, 403); assert.equal(host.body.error.code, 'API_DOCS_ORIGIN_FORBIDDEN');
    const origin = await fetch(f.url + '/api-docs', { headers: { Origin: 'https://untrusted.invalid' } });
    assert.equal(origin.status, 403); assert.equal((await origin.json()).error.code, 'ORIGIN_FORBIDDEN');
  } finally { await f.close(); }
});

test('unsafe or incomplete development configuration fails closed', () => {
  const saved = { ...process.env };
  try {
    Object.assign(process.env, { NODE_ENV: 'development', GATEWAY_API_DOCS_ENABLED: 'true', GATEWAY_API_DOCS_TRY_IT_OUT: 'true', CORS_ALLOWED_ORIGINS: 'http://127.0.0.1:64345' });
    for (const origin of ['', 'https://external.invalid', 'ftp://127.0.0.1', 'http://user:password@localhost', 'http://localhost/path', 'http://localhost/?query=1', 'http://localhost/#fragment']) {
      process.env.GATEWAY_API_DOCS_ORIGIN = origin; assert.throws(() => createApp(), /loopback/);
    }
    process.env.GATEWAY_API_DOCS_ORIGIN = 'http://127.0.0.1:64346'; assert.throws(() => createApp(), /CORS/);
    process.env.GATEWAY_API_DOCS_ENABLED = 'false'; assert.throws(() => createApp(), /explicitly enabled/);
    process.env.GATEWAY_API_DOCS_ENABLED = 'yes'; assert.throws(() => createApp(), /Invalid Gateway/);
  } finally {
    for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k]; Object.assign(process.env, saved);
  }
});

test('no credentials are populated in the document, HTML or initialization script', async () => {
  const f = await fixture();
  try {
    for (const suffix of ['', '/openapi.json', '/init.js']) {
      const text = await (await fetch(f.url + '/api-docs' + suffix)).text();
      assert(!text.includes('fictional-secret-canary-never-in-document')); assert(!text.includes('fictional:canary-only'));
      assert.doesNotMatch(text, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/);
    }
    const rootPackage = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json')));
    assert.equal(rootPackage.scarfSettings.enabled, false);
  } finally { await f.close(); }
});
