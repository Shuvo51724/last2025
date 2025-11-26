import { type Request, type Response, type NextFunction } from 'express';
import logger from '../config/logger';
import { config } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export class OperationalError extends Error implements AppError {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  logger.error('Error occurred', {
    error: {
      message: err.message,
      stack: err.stack,
      statusCode,
      isOperational: err.isOperational,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  const errorResponse: any = {
    status,
    message: err.message || 'Internal Server Error',
  };

  if (config.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.error = err;
  }

  res.status(statusCode).json(errorResponse);
}

export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  logger.warn(`404 - Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.method} ${req.url} not found`,
  });
}

export function handleUncaughtException(): void {
  process.on('uncaughtException', (err: Error) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
      error: {
        message: err.message,
        stack: err.stack,
      },
    });
    process.exit(1);
  });
}

export function handleUnhandledRejection(): void {
  process.on('unhandledRejection', (reason: any) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', {
      reason: reason instanceof Error ? {
        message: reason.message,
        stack: reason.stack,
      } : reason,
    });
    process.exit(1);
  });
}
