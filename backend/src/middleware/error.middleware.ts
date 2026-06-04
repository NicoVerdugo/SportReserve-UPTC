import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  errors?: unknown[];
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const response: Record<string, unknown> = {
    success: false,
    message,
  };

  if (err.errors && Array.isArray(err.errors)) {
    response['errors'] = err.errors;
  }

  if (config.nodeEnv === 'development') {
    response['stack'] = err.stack;
  }

  // Mongoose CastError
  if (err.name === 'CastError') {
    response['message'] = 'Invalid ID format';
    res.status(400).json(response);
    return;
  }

  // Mongoose duplicate key error
  if ((err as unknown as { code?: number }).code === 11000) {
    const keyValue = (err as unknown as { keyValue?: Record<string, unknown> }).keyValue;
    const field = keyValue ? Object.keys(keyValue)[0] : 'field';
    response['message'] = `Duplicate value for field: ${field}`;
    res.status(409).json(response);
    return;
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(
      (err as unknown as { errors: Record<string, { message: string }> }).errors
    ).map((e) => ({ message: e.message }));
    response['message'] = 'Validation Error';
    response['errors'] = validationErrors;
    res.status(400).json(response);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    response['message'] = 'Invalid token';
    res.status(401).json(response);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    response['message'] = 'Token has expired';
    res.status(401).json(response);
    return;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
