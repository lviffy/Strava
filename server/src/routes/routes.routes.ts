import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get all routes with sport filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const sport = req.query.sport as string;

    const where: any = {};
    if (sport && sport !== 'All') {
      where.sportType = sport;
    }

    const routes = await prisma.route.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    const formatted = routes.map((r) => ({
      id: r.id,
      name: r.name,
      sportType: r.sportType,
      distanceKm: +(r.distanceMeters / 1000).toFixed(1),
      distanceMeters: r.distanceMeters,
      elevationGainM: r.elevationGainMeters,
      estTime: `${r.estTimeMinutes} min`,
      surface: r.surfaceType,
      polylineEncoded: r.polylineEncoded,
      creatorName: `${r.user.firstName} ${r.user.lastName}`,
    }));

    res.json({ routes: formatted });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// Get single route by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    res.json({ route });
  } catch (error) {
    console.error('Error fetching route detail:', error);
    res.status(500).json({ error: 'Failed to fetch route detail' });
  }
});

// Create new custom route
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, sportType, distanceMeters, elevationGainMeters, estTimeMinutes, surfaceType, polylineEncoded } = req.body;

    if (!name || !distanceMeters) {
      res.status(400).json({ error: 'Route name and distance are required' });
      return;
    }

    const route = await prisma.route.create({
      data: {
        userId,
        name,
        sportType: sportType || 'Run',
        distanceMeters: parseFloat(distanceMeters),
        elevationGainMeters: parseFloat(elevationGainMeters || 0),
        estTimeMinutes: parseInt(estTimeMinutes || 45),
        surfaceType: surfaceType || 'Paved Road',
        polylineEncoded,
      },
    });

    res.status(201).json({ route });
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

export default router;
