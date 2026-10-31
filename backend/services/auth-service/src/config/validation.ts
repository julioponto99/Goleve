import { ApiError } from './errors';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}

function invalid(message: string): never {
  throw new ApiError(400, 'VALIDATION_ERROR', message);
}

function readBody(body: unknown, fields: string[]): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return invalid('A JSON object is required');
  }
  if (Object.keys(body).some((key) => !fields.includes(key))) {
    return invalid('Unexpected fields in request body');
  }
  return body as Record<string, unknown>;
}

function readCredentials(body: Record<string, unknown>): LoginInput {
  if (typeof body.email !== 'string') {
    return invalid('A valid email is required');
  }
  const email = body.email.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || /[\u0000-\u001f\u007f]/.test(email)) {
    return invalid('A valid email is required');
  }

  const password = body.password;
  if (typeof password !== 'string' || password.length < 8
    || !password.trim() || password.includes('\0')
    || Buffer.byteLength(password, 'utf8') > 72) {
    return invalid('Password must have at least 8 characters and at most 72 UTF-8 bytes');
  }
  return { email, password };
}

export function validateRegister(body: unknown): RegisterInput {
  const data = readBody(body, ['name', 'email', 'password']);
  if (typeof data.name !== 'string') {
    return invalid('Name must have between 2 and 100 characters');
  }
  const name = data.name.trim();
  if (name.length < 2 || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)) {
    return invalid('Name must have between 2 and 100 characters');
  }
  return { name, ...readCredentials(data) };
}

export function validateLogin(body: unknown): LoginInput {
  return readCredentials(readBody(body, ['email', 'password']));
}
