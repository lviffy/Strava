import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get all challenges
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    const challenges = await prisma.challenge.findMany({
      orderBy: { endDate: 'asc' },
      include: {
        _count: {
          select: { participants: true },
        },
        participants: userId
          ? {
              where: { userId },
              select: { progressDistanceMeters: true, completed: true },
            }
          : false,
      },
    });

    const now = Date.now();
    const formatted = challenges.map((c) => {
      const daysRemaining = Math.max(0, Math.ceil((new Date(c.endDate).getTime() - now) / (1000 * 60 * 60 * 24)));
      const participation = userId && c.participants && c.participants.length > 0 ? c.participants[0] : null;

      return {
        id: c.id,
        title: c.title,
        description: c.description || '',
        sportType: c.sportType,
        targetKm: c.targetDistanceMeters / 1000,
        targetDistanceMeters: c.targetDistanceMeters,
        currentKm: participation ? +(participation.progressDistanceMeters / 1000).toFixed(1) : 0,
        daysRemaining,
        badgeIcon: c.badgeIcon,
        joined: !!participation,
        completed: participation ? participation.completed : false,
        participantCount: c._count.participants,
      };
    });

    res.json({ challenges: formatted });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// Get challenge detail by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        _count: {
          select: { participants: true },
        },
        participants: {
          take: 20,
          orderBy: { progressDistanceMeters: 'desc' },
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
        },
      },
    });

    if (!challenge) {
      res.status(404).json({ error: 'Challenge not found' });
      return;
    }

    const now = Date.now();
    const daysRemaining = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - now) / (1000 * 60 * 60 * 24)));
    const userPart = userId ? challenge.participants.find((p) => p.userId === userId) : null;

    res.json({
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        sportType: challenge.sportType,
        targetKm: challenge.targetDistanceMeters / 1000,
        targetDistanceMeters: challenge.targetDistanceMeters,
        currentKm: userPart ? +(userPart.progressDistanceMeters / 1000).toFixed(1) : 0,
        progressPercent: userPart ? Math.min(100, Math.round((userPart.progressDistanceMeters / challenge.targetDistanceMeters) * 100)) : 0,
        daysRemaining,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        badgeIcon: challenge.badgeIcon,
        joined: !!userPart,
        completed: userPart ? userPart.completed : false,
        participantCount: challenge._count.participants,
        leaderboard: challenge.participants.map((p, idx) => ({
          rank: idx + 1,
          athleteId: p.user.id,
          name: `${p.user.firstName} ${p.user.lastName}`,
          avatarUrl: p.user.avatarUrl,
          city: p.user.city,
          distanceKm: +(p.progressDistanceMeters / 1000).toFixed(1),
          completed: p.completed,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching challenge details:', error);
    res.status(500).json({ error: 'Failed to fetch challenge details' });
  }
});

// Join / Leave challenge toggle
router.post('/:id/join', requireAuth, async (req: Request, res: Response) => {
  try {
    const challengeId = req.params.id;
    const userId = req.user!.userId;

    const existing = await prisma.challengeParticipant.findUnique({
      where: {
        challengeId_userId: { challengeId, userId },
      },
    });

    let joined = false;
    if (existing) {
      await prisma.challengeParticipant.delete({
        where: { id: existing.id },
      });
      joined = false;
    } else {
      await prisma.challengeParticipant.create({
        data: {
          challengeId,
          userId,
          progressDistanceMeters: 0,
          completed: false,
        },
      });
      joined = true;
    }

    const participantCount = await prisma.challengeParticipant.count({ where: { challengeId } });

    res.json({ joined, participantCount });
  } catch (error) {
    console.error('Error toggling challenge enrollment:', error);
    res.status(500).json({ error: 'Failed to toggle challenge enrollment' });
  }
});

export default router;
