import { Hono } from 'hono';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { createToken, requireAuth, getUserId } from '../middleware/auth';
import { ValidationError, AuthError } from '../lib/errors';

const authRouter = new Hono();

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register
authRouter.post('/register', async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Invalid input', parsed.error.issues);
  }

  const { email, password, name } = parsed.data;

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ValidationError('Email already registered');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);
  const encryption_key = `enc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password_hash,
      encryption_key,
    },
    select: {
      id: true,
      email: true,
      name: true,
      created_at: true,
    },
  });

  // Generate JWT
  const token = await createToken({ userId: user.id, email: user.email });

  return c.json({
    success: true,
    data: {
      user,
      token,
    },
  });
});

// POST /api/auth/login
authRouter.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Invalid input', parsed.error.issues);
  }

  const { email, password } = parsed.data;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password_hash: true,
      created_at: true,
    },
  });

  if (!user) {
    throw new AuthError('Invalid email or password');
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AuthError('Invalid email or password');
  }

  // Generate JWT
  const token = await createToken({ userId: user.id, email: user.email });

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
      token,
    },
  });
});

// GET /api/auth/me (requires auth)
authRouter.get('/me', requireAuth, async (c) => {
  const userId = getUserId(c);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!user) {
    throw new AuthError('User not found');
  }

  return c.json({
    success: true,
    data: user,
  });
});

export default authRouter;
