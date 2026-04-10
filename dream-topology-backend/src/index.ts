import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import aiRouter from './routes/ai';
import healthRouter from './routes/health';
import tarotRouter from './routes/tarot';

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

export const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 3000;

const app = new Hono();
const corsOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_ORIGIN || '*')
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean);

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Routes
app.get('/', (c) => c.text('Dream Topology API is running!'));
app.route('/api/ai', aiRouter);
app.route('/api/health', healthRouter);
app.route('/api/tarot', tarotRouter);

// Database connection & Server start
async function main() {
  console.log(`Starting Dream Topology Backend...`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${PORT}`);
  
  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to the database');
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
  }

  serve({
    fetch: app.fetch,
    port: PORT
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
