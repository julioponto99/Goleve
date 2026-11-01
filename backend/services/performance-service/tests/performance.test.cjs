const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const test = require('node:test');

const owner = '507f1f77bcf86cd799439011';
const { measurementSchema } = require('../dist/models/measurement.model');
const { stepsSchema } = require('../dist/models/steps.model');
const { heartRateSchema } = require('../dist/models/heart-rate.model');
const { goalSchema } = require('../dist/models/goal.model');

test('schemas validate measurement units, steps, heart rate and goals', async () => {
  await Promise.all([
    new mongoose.Document({ ownerId: owner, kind: 'weight', value: 80, unit: 'kg', measuredAt: new Date(), timezone: 'Europe/Lisbon', source: 'manual' }, measurementSchema).validate(),
    new mongoose.Document({ ownerId: owner, count: 5000, recordedAt: new Date(), timezone: 'Europe/Lisbon', localDate: '2026-11-01', source: 'manual' }, stepsSchema).validate(),
    new mongoose.Document({ ownerId: owner, bpm: 72, measuredAt: new Date(), timezone: 'Europe/Lisbon', source: 'manual' }, heartRateSchema).validate(),
    new mongoose.Document({ ownerId: owner, kind: 'steps', target: 10000, unit: 'steps', timezone: 'Europe/Lisbon', version: 1 }, goalSchema).validate(),
  ]);
  await assert.rejects(() => new mongoose.Document({ ownerId: owner, kind: 'weight', value: 80, unit: 'invalid', measuredAt: new Date(), timezone: 'Europe/Lisbon' }, measurementSchema).validate());
});

test('gateway forwards performance requests and authorization', async () => {
  const received = await new Promise((resolve) => {
    const upstream = http.createServer((req, res) => {
      resolve({ url: req.url, authorization: req.headers.authorization });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: { total: 1000 } }));
    });
    upstream.listen(0, () => {
      process.env.PERFORMANCE_SERVICE_URL = `http://127.0.0.1:${upstream.address().port}`;
      const { createApp } = require('../../../api-gateway/dist/app');
      const gateway = http.createServer(createApp());
      gateway.listen(0, async () => {
        const response = await fetch(`http://127.0.0.1:${gateway.address().port}/performance/steps/summary?from=2026-11-01`, { headers: { authorization: 'Bearer synthetic-token' } });
        assert.equal(response.status, 200);
        gateway.close(() => upstream.close());
      });
    });
  });
  assert.deepEqual(received, { url: '/performance/steps/summary?from=2026-11-01', authorization: 'Bearer synthetic-token' });
});
