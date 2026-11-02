const { test } = require('node:test'), assert = require('node:assert/strict'), express = require('express'), { once } = require('node:events');
const { createApp } = require('../dist/app');
const { serviceOrigins } = require('../dist/middlewares/integration.middleware');
async function fixture(options = {}) {
  const saved = { ...process.env }, seen = [], upstreamApp = express();
  upstreamApp.use((req, res) => { seen.push(req.headers); res.status(options.unavailable ? 503 : 200).json({ ok: true }); });
  const upstream = upstreamApp.listen(0, '127.0.0.1'); await once(upstream, 'listening');
  for (const [variable] of Object.values(serviceOrigins)) process.env[variable] = 'http://127.0.0.1:' + upstream.address().port;
  process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:5173'; process.env.GATEWAY_API_RATE_LIMIT = String(options.limit || 300);
  const server = createApp().listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = 'http://127.0.0.1:' + server.address().port;
  return { url, seen, async close() { for (const s of [server, upstream]) { const done = new Promise(r => s.close(r)); s.closeAllConnections(); await done; } for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k]; Object.assign(process.env, saved); } };
}
test('CORS allows only configured origins and exposes concurrency headers without cookies', async () => {
  const f = await fixture(); try { const r = await fetch(f.url + '/auth/me', { headers: { Origin: 'http://localhost:5173' } }); assert.equal(r.status, 200); assert.equal(r.headers.get('access-control-allow-origin'), 'http://localhost:5173'); assert.match(r.headers.get('access-control-expose-headers'), /ETag/); assert.equal(r.headers.get('access-control-allow-credentials'), null); await r.text(); } finally { await f.close(); }
});
test('CORS rejects unapproved and null origins before proxying', async () => {
  const f = await fixture(); try { for (const Origin of ['https://untrusted.invalid', 'null']) { const r = await fetch(f.url + '/auth/me', { headers: { Origin } }); assert.equal(r.status, 403); await r.text(); } assert.equal(f.seen.length, 0); } finally { await f.close(); }
});
test('preflight permits explicit administrative proof headers and rejects technical headers', async () => {
  const f = await fixture(); try { for (const [headers, status] of [['authorization, if-match, if-none-match, x-admin-step-up', 204], ['x-management-caller', 403]]) { const r = await fetch(f.url + '/management/assignments', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': headers } }); assert.equal(r.status, status); } assert.equal(f.seen.length, 0); } finally { await f.close(); }
});
test('internal paths and traversal do not reach public upstreams', async () => {
  const f = await fixture(); try { for (const p of ['/internal/v1/management/admin-check', '/auth/internal/demo', '/auth/%2e%2e/internal/v1', '/auth/%69nternal/demo']) { const r = await fetch(f.url + p); assert.equal(r.status, 404); await r.text(); } assert.equal(f.seen.length, 0); } finally { await f.close(); }
});
test('public proxy preserves bearer while removing spoofed service identity headers', async () => {
  const f = await fixture(); try { const r = await fetch(f.url + '/auth/me', { headers: { Authorization: 'Bearer fictional', 'X-Management-Caller': 'management', 'X-Management-User-Authorization': 'spoofed', 'X-Demo-Caller': 'payment' } }); assert.equal(r.status, 200); await r.text(); assert.equal(f.seen[0].authorization, 'Bearer fictional'); for (const h of ['x-management-caller', 'x-management-user-authorization', 'x-demo-caller']) assert.equal(f.seen[0][h], undefined); } finally { await f.close(); }
});
test('service credentials cannot be used as public bearer authentication', async () => {
  const f = await fixture(); try { for (const Authorization of ['Service fictional', 'DemoService fictional', 'AgendaService fictional']) { const r = await fetch(f.url + '/auth/me', { headers: { Authorization } }); assert.equal(r.status, 404); await r.text(); } assert.equal(f.seen.length, 0); } finally { await f.close(); }
});
test('global API rate limit excludes liveness and readiness', async () => {
  const f = await fixture({ limit: 2 }); try { for (let i = 0; i < 2; i++) { const r = await fetch(f.url + '/users/me'); assert.equal(r.status, 200); await r.text(); } const blocked = await fetch(f.url + '/users/me'); assert.equal(blocked.status, 429); await blocked.text(); const health = await fetch(f.url + '/health'); assert.equal(health.status, 200); await health.text(); const ready = await fetch(f.url + '/ready'); assert.equal(ready.status, 200); assert.equal((await ready.json()).dependencies.length, 11); } finally { await f.close(); }
});
test('dependency failure makes readiness unavailable while HTTP liveness remains active', async () => {
  const f = await fixture({ unavailable: true }); try { const ready = await fetch(f.url + '/ready'); assert.equal(ready.status, 503); assert((await ready.json()).dependencies.every(d => d.status === 'unavailable')); const health = await fetch(f.url + '/health'); assert.equal(health.status, 200); await health.text(); } finally { await f.close(); }
});
