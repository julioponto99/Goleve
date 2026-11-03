'use strict';
// Optional real-browser smoke test. Uses an existing Chrome/Chromium executable;
// no browser installation, real profile, Docker or domain services are used.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const { once } = require('node:events');
const { setTimeout: delay } = require('node:timers/promises');
const { createApp } = require('../dist/app');
const { serviceOrigins } = require('../dist/middlewares/integration.middleware');

async function waitFor(check, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { const value = await check(); if (value) return value; await delay(100); }
  throw new Error('Browser condition timed out');
}
async function fixture(tryItOut) {
  const saved = { ...process.env };
  const server = http.createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = 'http://127.0.0.1:' + server.address().port;
  Object.assign(process.env, { NODE_ENV: 'development', GATEWAY_API_DOCS_ENABLED: 'true',
    GATEWAY_API_DOCS_TRY_IT_OUT: String(tryItOut), GATEWAY_API_DOCS_ORIGIN: url,
    CORS_ALLOWED_ORIGINS: url, GATEWAY_API_RATE_LIMIT: '1000' });
  // Any accidental domain call fails locally instead of touching an existing service.
  for (const [variable] of Object.values(serviceOrigins)) process.env[variable] = 'http://127.0.0.1:1';
  server.on('request', createApp());
  return { url, async close() {
    const closed = new Promise(resolve => server.close(resolve)); server.closeAllConnections(); await closed;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env, saved);
  } };
}

test('real Swagger UI renders service groups; readonly blocks execution and authorized UI executes a safe GET',
  { skip: !process.env.GOLEVE_SWAGGER_TEST_BROWSER, timeout: 90000 }, async () => {
    assert(os.freemem() > 1.2 * 1024 ** 3, 'Insufficient free host memory for optional browser test');
    const executable = process.env.GOLEVE_SWAGGER_TEST_BROWSER;
    assert(fs.existsSync(executable), 'Configured browser does not exist');
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'goleve-swagger-ui-'));
    const child = cp.spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--disable-background-networking', '--disable-sync', '--disable-extensions', '--disable-component-update',
      '--disable-default-apps', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0',
      '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
    let socket, active, sequence = 0;
    const pending = new Map(), requests = [], errors = [];
    const call = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence, timeout = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, 15000);
      pending.set(id, value => { clearTimeout(timeout); value.error ? reject(new Error(value.error.message)) : resolve(value.result); });
      socket.send(JSON.stringify({ id, method, params }));
    });
    try {
      const portFile = path.join(profile, 'DevToolsActivePort');
      await waitFor(() => fs.existsSync(portFile));
      const port = Number(fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0]);
      const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
      await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
      socket.addEventListener('message', event => {
        const message = JSON.parse(event.data);
        if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id); }
        if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url);
        if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
      });
      await call('Network.enable'); await call('Runtime.enable'); await call('Page.enable');
      const evaluate = async expression => {
        const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
        return result.result.value;
      };
      for (const basePath of ['/api-docs', '/api-docs/essentials']) for (const tryItOut of [false, true]) {
        active = await fixture(tryItOut);
        const start = requests.length;
        await call('Page.navigate', { url: active.url + basePath + '?url=https://untrusted.invalid/openapi.json' });
        await waitFor(() => evaluate("document.querySelectorAll('.opblock-tag').length === 12"));
        assert.equal(await evaluate("document.title.includes('GoLeve')"), true);
        assert.equal(await evaluate("Object.keys(window.ui.getSystem().specSelectors.specJson().toJS().paths).length"), basePath === '/api-docs' ? 170 : 24);
        assert.equal(await evaluate("window.ui.getConfigs().persistAuthorization"), false);
        assert.equal(await evaluate("window.ui.getConfigs().supportedSubmitMethods.length"), tryItOut ? 5 : 0);
        const safePath = basePath === '/api-docs' ? '/health' : '/auth/me';
        const safeTag = basePath === '/api-docs' ? 'gateway' : 'auth';
        await evaluate("document.getElementById('operations-tag-" + safeTag + "').click()");
        await waitFor(() => evaluate("!!document.querySelector('.opblock-summary-path[data-path=\"" + safePath + "\"]')"));
        await evaluate("document.querySelector('.opblock-summary-path[data-path=\"" + safePath + "\"]').closest('.opblock').querySelector('.opblock-summary-control').click()");
        await waitFor(() => evaluate("!!document.querySelector('.opblock-summary-path[data-path=\"" + safePath + "\"]').closest('.opblock').querySelector('.opblock-body')"));
        const safe = "document.querySelector('.opblock-summary-path[data-path=\"" + safePath + "\"]').closest('.opblock')";
        if (tryItOut) await waitFor(() => evaluate('!!' + safe + ".querySelector('.try-out__btn')"), 10000);
        assert.equal(await evaluate('!!' + safe + ".querySelector('.try-out__btn')"), tryItOut);
        if (tryItOut) {
          const tryOut = await evaluate('(() => { const r = ' + safe + ".querySelector('.try-out__btn').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()");
          await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: tryOut.x, y: tryOut.y, button: 'left', clickCount: 1 });
          await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: tryOut.x, y: tryOut.y, button: 'left', clickCount: 1 });
          await waitFor(() => evaluate('!!' + safe + ".querySelector('.execute')"), 10000);
          assert.equal(await evaluate("fetch('" + safePath + "').then(response => response.status)"), basePath === '/api-docs' ? 200 : 401);
        }
        const pageRequests = requests.slice(start).filter(url => /^https?:/.test(url));
        assert(pageRequests.every(url => new URL(url).origin === active.url), 'Unexpected external browser request');
        assert.equal(pageRequests.filter(url => new URL(url).pathname === safePath).length, tryItOut ? 1 : 0);
        assert.equal(errors.length, 0, errors.join('; '));
        await active.close(); active = undefined;
      }
    } finally {
      if (active) await active.close();
      if (socket?.readyState === WebSocket.OPEN) { await call('Browser.close').catch(() => {}); socket.close(); }
      if (child.exitCode === null) {
        await Promise.race([once(child, 'exit'), delay(5000, undefined, { ref: false })]);
        if (child.exitCode === null) child.kill();
      }
      // Only the newly created, identified test profile can be removed.
      assert.equal(path.dirname(path.resolve(profile)), path.resolve(os.tmpdir()));
      assert(path.basename(profile).startsWith('goleve-swagger-ui-'));
      assert(!fs.lstatSync(profile).isSymbolicLink());
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
    }
  });
