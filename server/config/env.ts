import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;
  DB_PATH: string;
  UPLOAD_DIR: string;
  MAX_FILE_SIZE: number;
  CORS_ORIGINS: string[];
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  SESSION_SECRET: string;
  YOUTUBE_API_KEY?: string;
  LOG_LEVEL: string;
  LOG_DIR: string;
  TRUST_PROXY: number;
}

function parseEnvironment(): EnvironmentConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvironmentConfig['NODE_ENV'];
  
  return {
    NODE_ENV: nodeEnv,
    PORT: parseInt(process.env.PORT || '5000', 10),
    HOST: process.env.HOST || '0.0.0.0',
    DB_PATH: process.env.DB_PATH || path.join(process.cwd(), 'data', 'dob.db'),
    UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'chat-files'),
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '524288000', 10),
    CORS_ORIGINS: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:5000'],
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    SESSION_SECRET: process.env.SESSION_SECRET || (nodeEnv === 'production' 
      ? (() => { throw new Error('SESSION_SECRET must be set in production'); })()
      : 'dev-secret-change-me'),
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    LOG_LEVEL: process.env.LOG_LEVEL || (nodeEnv === 'production' ? 'info' : 'debug'),
    LOG_DIR: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
    TRUST_PROXY: parseInt(process.env.TRUST_PROXY || '0', 10),
  };
}

export const config = parseEnvironment();

export function validateConfig(): void {
  const required: (keyof EnvironmentConfig)[] = [
    'PORT', 
    'HOST', 
    'DB_PATH', 
    'UPLOAD_DIR'
  ];

  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (config.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET must be set in production environment');
  }
}

export default config;
