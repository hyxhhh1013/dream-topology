import { Context, Next } from 'hono';
import { sign, verify } from 'hono/jwt';
import { config } from '../lib/config';
import { AuthError } from '../lib/errors';

export interface JwtPayload {
  userId: string;
  email: string;
  [key: string]: unknown;
}

/**
 * Create a JWT token for the given user
 */
export async function createToken(payload: JwtPayload): Promise<string> {
  return sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      iat: Math.floor(Date.now() / 1000),
    },
    config.JWT_SECRET,
    'HS256'
  );
}

/**
 * Verify a JWT token and return its payload
 */
export async function verifyToken(token: string): Promise<JwtPayload> {
  try {
    const payload = await verify(token, config.JWT_SECRET, 'HS256');
    return payload as unknown as JwtPayload;
  } catch {
    throw new AuthError('Invalid or expired token');
  }
}

/**
 * Middleware that requires a valid JWT token via Authorization header.
 * On success, sets c.get('userId') and c.get('userEmail') for downstream handlers.
 */
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7);
  const payload = await verifyToken(token);

  c.set('userId', payload.userId);
  c.set('userEmail', payload.email);

  await next();
}

/**
 * Optional auth middleware: extracts user info if a valid token is present,
 * but does not block the request if no token is provided.
 * Sets c.get('userId') if authenticated, otherwise leaves it unset.
 */
export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = await verifyToken(token);
      c.set('userId', payload.userId);
      c.set('userEmail', payload.email);
    } catch {
      // Token invalid, continue without auth
    }
  }

  await next();
}

/**
 * Get userId from context (set by auth middleware) or fall back to header-based
 * anonymous identification for backward compatibility.
 */
export function getUserId(c: Context): string {
  const jwtUserId = c.get('userId') as string | undefined;
  if (jwtUserId) return jwtUserId;

  const headerUserId = c.req.header('x-user-id')?.trim();
  if (headerUserId) return headerUserId;

  const anonId = c.req.header('x-anon-id')?.trim();
  if (anonId) return anonId;

  return `anon_${Date.now()}`;
}
