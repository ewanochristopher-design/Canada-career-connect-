import crypto from 'crypto';
import type { PublicUser, UserRecord, UserRole } from '../types.ts';

const SECRET = process.env.SESSION_SECRET || 'canada-career-connect-dev-session-secret-2026';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  const actualBuf = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

interface TokenPayload {
  uid: string;
  role: UserRole;
  exp: number;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf-8');
}

export function signToken(user: UserRecord): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadObj: TokenPayload = {
    uid: user.id,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const payload = base64UrlEncode(JSON.stringify(payloadObj));
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', SECRET).update(`${header}.${payload}`).digest()
  );
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = base64UrlEncode(
      crypto.createHmac('sha256', SECRET).update(`${header}.${payload}`).digest()
    );
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const parsed = JSON.parse(base64UrlDecode(payload)) as TokenPayload;
    if (!parsed.uid || !parsed.exp || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function toPublicUser(user: UserRecord): PublicUser {
  const { passwordHash: _omitted, ...publicUser } = user;
  return publicUser;
}

export function calculateProfileStrength(user: PublicUser, docCount: number): number {
  let score = 15; // Base account created
  if (user.phone && user.phone.trim().length >= 7) score += 10;
  if (user.country && user.country.trim().length >= 2) score += 5;
  if (user.bio && user.bio.trim().length >= 20) score += 15;
  if (user.preferredProvinces && user.preferredProvinces.length > 0) score += 10;
  if (user.preferredCategory) score += 10;
  if (user.workExperience && user.workExperience.length > 0) score += 15;
  if (user.education && user.education.length > 0) score += 10;
  if (user.skills && user.skills.length >= 2) score += 5;
  if (docCount > 0) score += 5;
  return Math.min(100, score);
}
