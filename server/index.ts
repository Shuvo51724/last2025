import express, { type Request, Response, NextFunction } from "express";
import morgan from 'morgan';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { config, validateConfig } from "./config/env";
import logger, { stream } from "./config/logger";
import { setupSecurity } from "./middleware/security";
import { errorHandler, notFoundHandler, handleUncaughtException, handleUnhandledRejection } from "./middleware/errorHandler";
import { healthCheck, readinessCheck } from "./middleware/healthCheck";
import { setupGracefulShutdown } from "./utils/gracefulShutdown";

handleUncaughtException();
handleUnhandledRejection();

try {
  validateConfig();
  logger.info('Environment configuration validated successfully');
} catch (error) {
  logger.error('Environment configuration validation failed', { error });
  process.exit(1);
}

const app = express();

setupSecurity(app);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use(morgan('combined', { stream }));

app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

app.get('/healthz', healthCheck);
app.get('/readyz', readinessCheck);

(async () => {
  try {
    const { httpServer, wss } = await registerRoutes(app);

    if (config.NODE_ENV === "development") {
      await setupVite(app, httpServer);
    } else {
      serveStatic(app);
    }

    app.use(notFoundHandler);
    app.use(errorHandler);

    await new Promise<void>((resolve, reject) => {
      httpServer.listen({
        port: config.PORT,
        host: config.HOST,
        reusePort: true,
      }, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    logger.info(`Server running on ${config.HOST}:${config.PORT} in ${config.NODE_ENV} mode`);

    setupGracefulShutdown(httpServer, wss);

    if (process.send) {
      process.send('ready');
    }
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
})();
