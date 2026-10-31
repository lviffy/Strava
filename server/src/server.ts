import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { prisma } from './db';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('[Database] Connected to PostgreSQL database');

    const result = await prisma.$queryRaw<Array<{ postgis_version: string }>>`SELECT PostGIS_Version();`;
    console.log(`[PostGIS] Extension: ${result[0]?.postgis_version}`);

    app.listen(PORT, () => {
      console.log(`[Server] Strava Backend listening on port ${PORT}`);
      console.log(`[Health] Endpoint: http://localhost:${PORT}/health`);
      console.log(`[API] Base URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
