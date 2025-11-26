import { type Request, type Response } from 'express';
import db from '../db';
import logger from '../config/logger';

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  try {
    db.prepare('SELECT 1').get();
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'dob-performance-tracker',
      checks: {
        database: 'healthy',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'dob-performance-tracker',
      checks: {
        database: 'unhealthy',
      },
    });
  }
}

export async function readinessCheck(_req: Request, res: Response): Promise<void> {
  const uptime = process.uptime();
  const minUptimeSeconds = 15;

  if (uptime < minUptimeSeconds) {
    return res.status(503).json({
      status: 'not_ready',
      message: `Application is still initializing. Uptime: ${uptime.toFixed(2)}s`,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    db.prepare('SELECT 1').get();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      uptime,
    });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      status: 'not_ready',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
}
