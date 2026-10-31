import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// PostGIS Geospatial Query: Find nearby segments/routes within given radius (in meters)
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusMeters = parseFloat(req.query.radiusMeters as string) || 10000; // default 10km
    const sportType = (req.query.sportType as string) || null;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'Valid lat and lng query parameters are required' });
      return;
    }

    const sportFilter = sportType ? Prisma.sql`AND s."sportType" = ${sportType}` : Prisma.empty;

    // Execute PostGIS query via Prisma raw SQL
    // ST_MakePoint takes (longitude, latitude)
    // Cast to geography for accurate spherical distance in meters
    const nearbySegments = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      sportType: string;
      distanceMeters: number;
      elevationGainMeters: number;
      startLatitude: number;
      startLongitude: number;
      endLatitude: number;
      endLongitude: number;
      polylineEncoded: string | null;
      distanceFromOriginMeters: number;
    }>>`
      SELECT 
        s.id,
        s.name,
        s."sportType",
        s."distanceMeters",
        s."elevationGainMeters",
        s."startLatitude",
        s."startLongitude",
        s."endLatitude",
        s."endLongitude",
        s."polylineEncoded",
        ROUND(
          ST_Distance(
            ST_SetSRID(ST_MakePoint(s."startLongitude", s."startLatitude"), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
          )::numeric, 1
        )::float as "distanceFromOriginMeters"
      FROM segments s
      WHERE 
        ST_DWithin(
          ST_SetSRID(ST_MakePoint(s."startLongitude", s."startLatitude"), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
        ${sportFilter}
      ORDER BY "distanceFromOriginMeters" ASC
      LIMIT 50;
    `;

    res.json({
      origin: { latitude: lat, longitude: lng },
      radiusMeters,
      count: nearbySegments.length,
      segments: nearbySegments,
    });
  } catch (error) {
    console.error('PostGIS nearby query error:', error);
    res.status(500).json({ error: 'Failed to query nearby segments' });
  }
});

// Get segment detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const segment = await prisma.segment.findUnique({
      where: { id },
      include: {
        _count: { select: { efforts: true } },
      },
    });

    if (!segment) {
      res.status(404).json({ error: 'Segment not found' });
      return;
    }

    res.json({ segment });
  } catch (error) {
    console.error('Error fetching segment:', error);
    res.status(500).json({ error: 'Failed to fetch segment' });
  }
});

// Get segment leaderboard
router.get('/:id/leaderboard', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);

    const efforts = await prisma.segmentEffort.findMany({
      where: { segmentId: id },
      orderBy: { movingTimeSeconds: 'asc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            city: true,
          },
        },
      },
    });

    const rankedEfforts = efforts.map((effort, index) => ({
      ...effort,
      rank: index + 1,
    }));

    res.json({
      segmentId: id,
      leaderboard: rankedEfforts,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Create new segment
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      name,
      sportType = 'Run',
      distanceMeters,
      elevationGainMeters = 0,
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
      polylineEncoded,
    } = req.body;

    if (!name || startLatitude == null || startLongitude == null || endLatitude == null || endLongitude == null || distanceMeters == null) {
      res.status(400).json({ error: 'Name, start/end coordinates, and distance are required' });
      return;
    }

    const segment = await prisma.segment.create({
      data: {
        name,
        sportType,
        distanceMeters: parseFloat(distanceMeters),
        elevationGainMeters: parseFloat(elevationGainMeters),
        startLatitude: parseFloat(startLatitude),
        startLongitude: parseFloat(startLongitude),
        endLatitude: parseFloat(endLatitude),
        endLongitude: parseFloat(endLongitude),
        polylineEncoded: polylineEncoded || null,
      },
    });

    res.status(201).json({ segment });
  } catch (error) {
    console.error('Error creating segment:', error);
    res.status(500).json({ error: 'Failed to create segment' });
  }
});

export default router;
