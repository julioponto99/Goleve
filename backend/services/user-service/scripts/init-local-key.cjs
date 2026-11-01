const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');

const directory = path.resolve(__dirname, '../../../../.secrets');
const file = path.join(directory, 'user-data-key.key');
fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
try {
  fs.writeFileSync(file, randomBytes(32).toString('hex') + '\n', { flag: 'wx', mode: 0o600 });
  console.log('Created local User encryption key in .secrets/user-data-key.key; value is not displayed.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  if (!/^[a-f0-9]{64}$/i.test(fs.readFileSync(file, 'utf8').trim())) {
    throw new Error('Existing User encryption key is invalid; it was not overwritten');
  }
  console.log('Existing User encryption key preserved.');
}
