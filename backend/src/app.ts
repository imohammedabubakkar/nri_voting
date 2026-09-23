import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: config.corsOrigin === '*' ? true : [config.corsOrigin, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Online Voting & Election Portal API',
      version: '1.0.0',
    });
  });

  // Mount API router
  app.use('/api', apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
