import bcrypt from 'bcrypt';
import { ApiError } from '../config/errors';
import { signAccessToken, TOKEN_LIFETIME_SECONDS } from '../config/token';
import { LoginInput, RegisterInput } from '../config/validation';
import { AuthUser, publicUser } from '../models/auth-user.model';

export const PASSWORD_HASH_ROUNDS = 12;
// Use a real comparison for unknown emails as well, without exposing account existence.
const dummyHash = bcrypt.hash('goleve-unused-account-password', PASSWORD_HASH_ROUNDS);

function session(user: Parameters<typeof publicUser>[0]) {
  return {
    user: publicUser(user),
    accessToken: signAccessToken(user._id.toHexString()),
    tokenType: 'Bearer',
    expiresIn: TOKEN_LIFETIME_SECONDS,
  };
}

export async function register(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);
  const user = await AuthUser.create({
    name: input.name,
    email: input.email,
    passwordHash,
    userType: 'utilizador',
  });
  return session(user);
}

export async function login(input: LoginInput) {
  const user = await AuthUser.findOne({ email: input.email }).select('+passwordHash');
  const matches = await bcrypt.compare(input.password, user?.passwordHash ?? await dummyHash);
  if (!user || !user.passwordHash || !matches) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  return session(user);
}

export async function currentUser(userId: string) {
  const user = await AuthUser.findById(userId);
  if (!user) {
    throw new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired access token');
  }
  return publicUser(user);
}
