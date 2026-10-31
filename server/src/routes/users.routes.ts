import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Athlete Search by name, city, or email (must be before /:id)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    if (!q) {
      const athletes = await prisma.user.findMany({
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          city: true,
          bio: true,
          _count: {
            select: {
              followers: true,
              activities: true,
            },
          },
        },
      });
      res.json({ athletes });
      return;
    }

    const athletes = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 20,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        city: true,
        bio: true,
        _count: {
          select: {
            followers: true,
            activities: true,
          },
        },
      },
    });

    res.json({ athletes });
  } catch (error) {
    console.error('Error searching athletes:', error);
    res.status(500).json({ error: 'Failed to search athletes' });
  }
});

// Get athlete profile by ID with aggregate workout stats and recent activities
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

    // Recent activities
    const recentActivities = await prisma.activity.findMany({
      where: { userId: id },
      take: 5,
      orderBy: { startTime: 'desc' },
      select: {
        id: true,
        name: true,
        sportType: true,
        startTime: true,
        distanceMeters: true,
        movingTimeSeconds: true,
        elevationGainMeters: true,
        _count: {
          select: { kudos: true, comments: true },
        },
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
      recentActivities,
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

      // Create notification
      const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          actorId: currentUserId,
          type: 'follow',
          title: 'New Follower',
          message: `${currentUser?.firstName || 'An athlete'} started following you.`,
        },
      });
    }

    res.json({ following });
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ error: 'Failed to toggle follow status' });
  }
});

export default router;
