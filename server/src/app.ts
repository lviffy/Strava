import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import activityRoutes from './routes/activities.routes';
import segmentRoutes from './routes/segments.routes';
import userRoutes from './routes/users.routes';
import notificationRoutes from './routes/notifications.routes';
import clubRoutes from './routes/clubs.routes';
import challengeRoutes from './routes/challenges.routes';
import subscriptionRoutes from './routes/subscriptions.routes';
import routeRoutes from './routes/routes.routes';
import { prisma } from './db';

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check with PostGIS status
const healthHandler = async (_req: Request, res: Response) => {
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
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// Helper function to mount routes on both prefixes
function mountRoutes(prefix: string) {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/activities`, activityRoutes);
  app.use(`${prefix}/segments`, segmentRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/clubs`, clubRoutes);
  app.use(`${prefix}/challenges`, challengeRoutes);
  app.use(`${prefix}/subscriptions`, subscriptionRoutes);
  app.use(`${prefix}/routes`, routeRoutes);
}

mountRoutes('/api/v1');
mountRoutes('/api');

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
