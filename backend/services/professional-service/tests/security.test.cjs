const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { errorHandler } = require('../dist/middlewares/error.middleware');
test('responses and logs never expose arbitrary internal errors or stored duplicate data', () => {
  const original = console.error, logs = [];
  console.error = (...values) => logs.push(values.join(' '));
  try {
    for (const [error, status] of [
      [new Error('SYNTHETIC_PRIVATE_PAYLOAD'), 500],
      [Object.assign(new Error('SYNTHETIC_DB_URI_AND_PASSWORD'), { name: 'MongoServerError' }), 503],
      [Object.assign(new Error('SYNTHETIC_DUPLICATE_CONTACT'), { code: 11000 }), 409],
      [new mongoose.Error.ValidationError(), 400],
    ]) {
      const result = {}; const response = { headersSent: false, status(code) { result.status = code; return this; }, json(body) { result.body = body; } };
      errorHandler(error, {}, response, () => assert.fail('Unexpected next'));
      assert.equal(result.status, status); assert.equal(JSON.stringify(result).includes('SYNTHETIC_'), false);
    }
    assert.equal(logs.some((entry) => entry.includes('SYNTHETIC_')), false);
  } finally { console.error = original; }
});
