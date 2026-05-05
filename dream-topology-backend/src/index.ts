import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { PrismaClient } from '@prisma/client';
import { config } from './lib/config';
import { AppError } from './lib/errors';
import aiRouter from './routes/ai';
import authRouter from './routes/auth';
import healthRouter from './routes/health';
import tarotRouter from './routes/tarot';

export const prisma = new PrismaClient();

const app = new Hono<{ Variables: { userId: string; userEmail: string } }>();

// Global error handler middleware - must be registered early
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: err.message,
        code: err.code,
      },
      err.status as 400 | 401 | 403 | 404 | 502 | 500
    );
  }

  console.error('Unhandled error:', err);
  return c.json(
    {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    500
  );
});

// CORS middleware
app.use('*', cors({
  origin: config.corsOrigins.length === 1 ? config.corsOrigins[0] : config.corsOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-anon-id'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
}));

app.use('*', logger());

// Routes
app.get('/', (c) => c.text('Dream Topology API is running!'));
app.route('/api/ai', aiRouter);
app.route('/api/auth', authRouter);
app.route('/api/health', healthRouter);
app.route('/api/tarot', tarotRouter);

// Database connection & Server start
async function main() {
  console.log(`Starting Dream Topology Backend...`);
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Port: ${config.PORT}`);
  console.log(`CORS origins: ${JSON.stringify(config.corsOrigins)}`);

  try {
    await prisma.$connect();
    console.log('Successfully connected to the database');
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }

  serve({
    fetch: app.fetch,
    port: config.PORT,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
