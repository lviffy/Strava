import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import activityRoutes from './routes/activities.routes';
import segmentRoutes from './routes/segments.routes';
import userRoutes from './routes/users.routes';
import { prisma } from './db';

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
// Large JSON limit to comfortably support uploading 10,000+ GPS coordinates
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check with PostGIS status
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const postgisVersion = await prisma.$queryRaw<Array<{ postgis_version: string }>>`
      SELECT PostGIS_Version();
    `;
    res.json({
      status: 'ok',
      service: 'strava-backend-api',
      timestamp: new Date().toISOString(),
      database: 'connected',
      postgis: postgisVersion[0]?.postgis_version || 'active',
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      service: 'strava-backend-api',
      error: 'Database connection failed',
    });
  }
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/segments', segmentRoutes);
app.use('/api/v1/users', userRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app;
