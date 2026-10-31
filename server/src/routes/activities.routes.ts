import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();

interface CoordinateInput {
  seq: number;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  timestamp: string;
}

interface SplitInput {
  splitNumber: number;
  distanceUnit?: string;
  movingTimeSeconds: number;
  elevationDeltaMeters?: number;
}

// Ingest or sync an activity from mobile SQLite
// Idempotent: client-provided UUID prevents duplicate entries upon retries
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      id, // Client UUID
      name,
      sportType = 'Run',
      visibility = 'everyone',
      startTime,
      elapsedTimeSeconds,
      movingTimeSeconds,
      distanceMeters,
      elevationGainMeters = 0,
      calories = 0,
      polylineEncoded,
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
      deviceInfo,
      coordinates = [],
      splits = [],
    } = req.body;

    if (!id || !name || !startTime || elapsedTimeSeconds == null || movingTimeSeconds == null || distanceMeters == null) {
      res.status(400).json({ error: 'Missing required activity fields (id, name, startTime, elapsedTimeSeconds, movingTimeSeconds, distanceMeters)' });
      return;
    }

    // Check if activity already exists (Idempotency guarantee)
    const existing = await prisma.activity.findUnique({
      where: { id },
      include: {
        splits: true,
        _count: { select: { coordinates: true, kudos: true, comments: true } },
      },
    });

    if (existing) {
      res.status(200).json({
        message: 'Activity already synchronized',
        activity: existing,
        alreadyExisted: true,
      });
      return;
    }

    // Transaction: Create activity, bulk insert coordinates and splits
    const created = await prisma.$transaction(async (tx) => {
      const activity = await tx.activity.create({
        data: {
          id,
          userId,
          name,
          sportType,
          visibility,
          startTime: new Date(startTime),
          elapsedTimeSeconds: Math.round(elapsedTimeSeconds),
          movingTimeSeconds: Math.round(movingTimeSeconds),
          distanceMeters: parseFloat(distanceMeters),
          elevationGainMeters: parseFloat(elevationGainMeters),
          calories: Math.round(calories),
          polylineEncoded: polylineEncoded || null,
          startLatitude: startLatitude != null ? parseFloat(startLatitude) : null,
          startLongitude: startLongitude != null ? parseFloat(startLongitude) : null,
          endLatitude: endLatitude != null ? parseFloat(endLatitude) : null,
          endLongitude: endLongitude != null ? parseFloat(endLongitude) : null,
          deviceInfo: deviceInfo || 'React Native Expo Go',
        },
      });

      // Bulk insert coordinates if present
      if (coordinates.length > 0) {
        const coordData = coordinates.map((c: CoordinateInput) => ({
          activityId: id,
          seq: c.seq,
          latitude: c.latitude,
          longitude: c.longitude,
          altitude: c.altitude != null ? c.altitude : null,
          accuracy: c.accuracy != null ? c.accuracy : null,
          speed: c.speed != null ? c.speed : null,
          timestamp: new Date(c.timestamp),
        }));

        await tx.coordinate.createMany({
          data: coordData,
        });
      }

      // Bulk insert splits if present
      if (splits.length > 0) {
        const splitData = splits.map((s: SplitInput) => ({
          activityId: id,
          splitNumber: s.splitNumber,
          distanceUnit: s.distanceUnit || 'km',
          movingTimeSeconds: Math.round(s.movingTimeSeconds),
          elevationDeltaMeters: s.elevationDeltaMeters || 0,
        }));

        await tx.split.createMany({
          data: splitData,
        });
      }

      return activity;
    });

    res.status(201).json({
      message: 'Activity uploaded and saved successfully',
      activity: created,
      coordinatesCount: coordinates.length,
      splitsCount: splits.length,
      alreadyExisted: false,
    });
  } catch (error) {
    console.error('Error saving activity:', error);
    res.status(500).json({ error: 'Failed to record activity' });
  }
});

// Get social activity feed
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;
    const currentUserId = req.user?.userId;

    const activities = await prisma.activity.findMany({
      skip,
      take: limit,
      orderBy: { startTime: 'desc' },
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
        _count: {
          select: {
            kudos: true,
            comments: true,
            coordinates: true,
          },
        },
        kudos: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
      },
    });

    const formatted = activities.map((act) => ({
      ...act,
      hasKudoed: currentUserId ? (act.kudos && act.kudos.length > 0) : false,
      kudos: undefined, // remove raw kudos array
    }));

    res.json({
      page,
      limit,
      activities: formatted,
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

// Get specific activity details with splits and comments
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            city: true,
            bio: true,
          },
        },
        splits: {
          orderBy: { splitNumber: 'asc' },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            kudos: true,
            coordinates: true,
          },
        },
        kudos: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
      },
    });

    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }

    const hasKudoed = currentUserId ? (activity.kudos && activity.kudos.length > 0) : false;

    res.json({
      activity: {
        ...activity,
        hasKudoed,
        kudos: undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching activity details:', error);
    res.status(500).json({ error: 'Failed to fetch activity details' });
  }
});

// Get raw GPS coordinates for an activity
router.get('/:id/coordinates', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const coordinates = await prisma.coordinate.findMany({
      where: { activityId: id },
      orderBy: { seq: 'asc' },
      select: {
        seq: true,
        latitude: true,
        longitude: true,
        altitude: true,
        speed: true,
        timestamp: true,
      },
    });

    res.json({
      activityId: id,
      count: coordinates.length,
      coordinates,
    });
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    res.status(500).json({ error: 'Failed to fetch coordinates' });
  }
});

// Toggle Kudos on an activity
router.post('/:id/kudos', requireAuth, async (req: Request, res: Response) => {
  try {
    const activityId = req.params.id;
    const userId = req.user!.userId;

    const existingKudos = await prisma.kudos.findUnique({
      where: {
        activityId_userId: {
          activityId,
          userId,
        },
      },
    });

    let kudoed = false;
    if (existingKudos) {
      await prisma.kudos.delete({
        where: { id: existingKudos.id },
      });
      kudoed = false;
    } else {
      await prisma.kudos.create({
        data: {
          activityId,
          userId,
        },
      });
      kudoed = true;
    }

    const totalKudos = await prisma.kudos.count({
      where: { activityId },
    });

    res.json({
      kudoed,
      kudosCount: totalKudos,
    });
  } catch (error) {
    console.error('Error toggling kudos:', error);
    res.status(500).json({ error: 'Failed to toggle kudos' });
  }
});

// Add comment to an activity
router.post('/:id/comments', requireAuth, async (req: Request, res: Response) => {
  try {
    const activityId = req.params.id;
    const userId = req.user!.userId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Comment content cannot be empty' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        activityId,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// Delete an activity
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const activityId = req.params.id;
    const userId = req.user!.userId;

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { userId: true },
    });

    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }

    if (activity.userId !== userId) {
      res.status(403).json({ error: 'Forbidden: You can only delete your own activities' });
      return;
    }

    await prisma.activity.delete({
      where: { id: activityId },
    });

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

export default router;
