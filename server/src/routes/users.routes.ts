import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get athlete profile by ID with aggregate workout stats
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        city: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            activities: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Athlete not found' });
      return;
    }

    // Calculate aggregated stats (total distance, total time, total elevation)
    const aggregates = await prisma.activity.aggregate({
      where: { userId: id },
      _sum: {
        distanceMeters: true,
        movingTimeSeconds: true,
        elevationGainMeters: true,
        calories: true,
      },
      _count: {
        id: true,
      },
    });

    res.json({
      athlete: user,
      stats: {
        totalActivities: aggregates._count.id,
        totalDistanceMeters: aggregates._sum.distanceMeters || 0,
        totalDistanceKm: ((aggregates._sum.distanceMeters || 0) / 1000).toFixed(1),
        totalMovingTimeSeconds: aggregates._sum.movingTimeSeconds || 0,
        totalElevationGainMeters: aggregates._sum.elevationGainMeters || 0,
        totalCalories: aggregates._sum.calories || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching athlete profile:', error);
    res.status(500).json({ error: 'Failed to fetch athlete profile' });
  }
});

// Follow / Unfollow an athlete
router.post('/:id/follow', requireAuth, async (req: Request, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user!.userId;

    if (targetUserId === currentUserId) {
      res.status(400).json({ error: 'You cannot follow yourself' });
      return;
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    let following = false;
    if (existingFollow) {
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });
      following = false;
    } else {
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      });
      following = true;
    }

    res.json({ following });
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ error: 'Failed to toggle follow status' });
  }
});

export default router;
