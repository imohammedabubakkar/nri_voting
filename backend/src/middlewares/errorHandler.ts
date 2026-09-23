import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Error Handler]', err);

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    res.status(409).json({
      success: false,
      message: `Duplicate entry detected for field: ${fields}. Value already registered.`,
      duplicateFields: err.keyValue,
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e: any) => e.message);
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid authorization token',
    });
    return;
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: `Invalid identifier: ${err.value}`,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
}
