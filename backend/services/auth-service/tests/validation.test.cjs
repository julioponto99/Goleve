const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateRegister, validateLogin } = require('../dist/config/validation');
const { AuthUser, USER_TYPES } = require('../dist/models/auth-user.model');

const valid = { name: '  Ana Silva  ', email: '  ANA@EXAMPLE.COM  ', password: 'safe-password-123' };

test('registration normalizes name and email, preserving the exact password', () => {
  assert.deepEqual(validateRegister({ ...valid, password: ' password with spaces ' }), {
    name: 'Ana Silva', email: 'ana@example.com', password: ' password with spaces ',
  });
});

for (const [label, body] of [
  ['missing body', undefined], ['null', null], ['array', []],
  ['missing name', { email: valid.email, password: valid.password }],
  ['short name', { ...valid, name: 'A' }],
  ['long name', { ...valid, name: 'A'.repeat(101) }],
  ['control characters in name', { ...valid, name: 'Ana\nSilva' }],
  ['missing email', { name: valid.name, password: valid.password }],
  ['malformed email', { ...valid, email: 'not-an-email' }],
  ['long email', { ...valid, email: 'a'.repeat(250) + '@example.com' }],
  ['control characters in email', { ...valid, email: 'a\0@example.com' }],
  ['email query injection', { ...valid, email: { $ne: null } }],
  ['missing password', { name: valid.name, email: valid.email }],
  ['short password', { ...valid, password: 'short' }],
  ['blank password', { ...valid, password: '        ' }],
  ['non-string password', { ...valid, password: 12345678 }],
  ['NUL password', { ...valid, password: 'password\0suffix' }],
  ['password over 72 bytes', { ...valid, password: 'a'.repeat(73) }],
  ['multibyte password over 72 bytes', { ...valid, password: '\u00e9'.repeat(37) }],
  ['privileged userType', { ...valid, userType: 'administrador' }],
  ['role injection', { ...valid, role: 'gestor' }],
  ['passwordHash injection', { ...valid, passwordHash: 'fake-hash' }],
]) {
  test('registration rejects ' + label, () => {
    assert.throws(() => validateRegister(body), (e) => e.statusCode === 400 && e.code === 'VALIDATION_ERROR');
  });
}

test('72-byte passwords are accepted without silent bcrypt truncation', () => {
  assert.equal(validateRegister({ ...valid, password: 'a'.repeat(72) }).password.length, 72);
});

test('login normalizes email and rejects extra fields and query injection', () => {
  assert.equal(validateLogin({ email: valid.email, password: valid.password }).email, 'ana@example.com');
  assert.throws(() => validateLogin({ ...valid }), { statusCode: 400 });
  assert.throws(() => validateLogin({ email: { $gt: '' }, password: valid.password }), { statusCode: 400 });
});

test('model defaults to utilizador, supports the four roles, and hides password hashes', async () => {
  assert.deepEqual(USER_TYPES, ['utilizador', 'profissional', 'gestor', 'administrador']);
  const user = new AuthUser({ name: 'Ana Silva', email: 'ana@example.com', passwordHash: 'secret-hash' });
  assert.equal(user.userType, 'utilizador');
  assert.equal(AuthUser.schema.path('passwordHash').options.select, false);
  assert.equal('passwordHash' in user.toJSON(), false);
  user.userType = 'root';
  await assert.rejects(user.validate(), (error) => Boolean(error.errors.userType));
});
