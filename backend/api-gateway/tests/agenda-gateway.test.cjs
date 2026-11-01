const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

test('proxies fictitious agenda activity requests through the gateway', async () => {
  const received = {};
  const upstream = http.createServer((req, res) => {
    received.url = req.url;
    received.authorization = req.headers.authorization;
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      received.body = JSON.parse(body);
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: { id: '000000000000000000000001', title: received.body.title, status: 'planned' } }));
    });
  });
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  const upstreamPort = upstream.address().port;
  process.env.AGENDA_SERVICE_URL = `http://127.0.0.1:${upstreamPort}`;
  const { createApp } = require('../dist/app');
  const gateway = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => gateway.once('listening', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${gateway.address().port}/agenda/activities`, {
      method: 'POST',
      headers: { authorization: 'Bearer fictitious-jwt', 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Treino fictício', kind: 'workout', environment: 'home' }),
    });
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { data: { id: '000000000000000000000001', title: 'Treino fictício', status: 'planned' } });
    assert.equal(received.url, '/agenda/activities');
    assert.equal(received.authorization, 'Bearer fictitious-jwt');
    assert.equal(received.body.environment, 'home');
  } finally {
    await new Promise((resolve) => gateway.close(resolve));
    await new Promise((resolve) => upstream.close(resolve));
  }
});
