import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { GetServerSidePropsContext } from 'next';

const SECRET = process.env.ADMIN_SESSION_SECRET || 'dev-secret-change-me';
const PASSWORD = process.env.ADMIN_PASSWORD || 'echevin2026';
const COOKIE = 'ec_admin';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

export function verifyPassword(pwd: string): boolean {
  return typeof pwd === 'string' && pwd.length > 0 && pwd === PASSWORD;
}

export function makeSessionToken(): string {
  const exp = Date.now() + MAX_AGE * 1000;
  const payload = `admin.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [role, expStr, sig] = parts;
  if (role !== 'admin') return false;
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return sign(`${role}.${expStr}`) === sig;
}

export function setSessionCookie(res: NextApiResponse, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${isProd ? '; Secure' : ''}`,
  );
}

export function clearSessionCookie(res: NextApiResponse) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function readCookieFromHeader(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(/;\s*/);
  for (const p of parts) {
    const [k, ...rest] = p.split('=');
    if (k === COOKIE) return rest.join('=');
  }
  return undefined;
}

export function isAuthedApi(req: NextApiRequest): boolean {
  return verifyToken(readCookieFromHeader(req.headers.cookie));
}

export function isAuthedSSR(ctx: GetServerSidePropsContext): boolean {
  return verifyToken(readCookieFromHeader(ctx.req.headers.cookie));
}

export function requireAuth(req: NextApiRequest, res: NextApiResponse): boolean {
  if (!isAuthedApi(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
