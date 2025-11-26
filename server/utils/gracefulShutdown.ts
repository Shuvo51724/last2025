import { type Server } from 'http';
import { WebSocketServer } from 'ws';
import db from '../db';
import logger from '../config/logger';

let isShuttingDown = false;

export function setupGracefulShutdown(server: Server, wss?: WebSocketServer): void {
  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress, forcing exit...');
      process.exit(1);
    }

    isShuttingDown = true;
    logger.info(`${signal} received, starting graceful shutdown...`);

    const shutdownTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, 30000);

    try {
      logger.info('Closing HTTP server...');
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info('HTTP server closed');

      if (wss) {
        logger.info('Closing WebSocket connections...');
        wss.clients.forEach((ws) => {
          ws.close(1000, 'Server shutting down');
        });
        await new Promise<void>((resolve) => {
          wss.close(() => resolve());
        });
        logger.info('WebSocket server closed');
      }

      logger.info('Closing database connection...');
      db.close();
      logger.info('Database connection closed');

      clearTimeout(shutdownTimeout);
      logger.info('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (error) {
      clearTimeout(shutdownTimeout);
      logger.error('Error during graceful shutdown', { error });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  logger.info('Graceful shutdown handlers registered');
}
