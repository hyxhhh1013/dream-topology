import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3000,

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',

  // OpenAI / DeepSeek
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.deepseek.com/v1',

  // Zhipu AI
  ZHIPU_API_KEY: process.env.ZHIPU_API_KEY || '',
  ZHIPU_BASE_URL: process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',

  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'dev_32_byte_encryption_key_here!',

  // CORS
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  CORS_ORIGINS: process.env.CORS_ORIGINS || '',

  // Health device client IDs
  XIAOMI_CLIENT_ID: process.env.XIAOMI_CLIENT_ID || '',
  HUAWEI_CLIENT_ID: process.env.HUAWEI_CLIENT_ID || '',

  get corsOrigins(): string[] {
    if (this.CORS_ORIGINS) {
      return this.CORS_ORIGINS.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    const origin = this.FRONTEND_ORIGIN;
    if (origin) {
      return origin.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return ['*'];
  },

  // AI model names
  AI_CHAT_MODEL: process.env.AI_CHAT_MODEL || 'deepseek-chat',
  AI_EMBEDDING_MODEL: process.env.AI_EMBEDDING_MODEL || 'embedding-3',
  AI_IMAGE_MODEL: process.env.AI_IMAGE_MODEL || 'cogview-3',
};

export default config;
