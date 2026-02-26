import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE = 'multilinea_session';

function getAdminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error('ADMIN_PASSWORD env var not set');
  return pw;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function validatePassword(input: string): boolean {
  return input === getAdminPassword();
}

export async function setSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const token = hashPassword(getAdminPassword());
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session) return false;
  const expected = hashPassword(getAdminPassword());
  return session.value === expected;
}
