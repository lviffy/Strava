import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get all clubs with membership indicator
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    const clubs = await prisma.club.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { members: true },
        },
        members: userId
          ? {
              where: { userId },
              select: { role: true },
            }
          : false,
      },
    });

    const formatted = clubs.map((c) => ({
      id: c.id,
      name: c.name,
      sportType: c.sportType,
      location: c.location || 'Global',
      description: c.description || '',
      avatarUrl: c.avatarUrl,
      memberCount: c._count.members,
      isMember: userId ? c.members && c.members.length > 0 : false,
      role: userId && c.members && c.members.length > 0 ? c.members[0].role : null,
    }));

    res.json({ clubs: formatted });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
});

// Get club detail by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true },
        },
        members: {
          take: 20,
          orderBy: { joinedAt: 'desc' },
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

    if (!club) {
      res.status(404).json({ error: 'Club not found' });
      return;
    }

    const isMember = userId
      ? club.members.some((m) => m.userId === userId)
      : false;

    // Fetch recent activities from club members
    const memberUserIds = club.members.map((m) => m.userId);
    const recentActivities = await prisma.activity.findMany({
      where: {
        userId: { in: memberUserIds },
      },
      take: 10,
      orderBy: { startTime: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { kudos: true, comments: true },
        },
      },
    });

    res.json({
      club: {
        id: club.id,
        name: club.name,
        sportType: club.sportType,
        location: club.location,
        description: club.description,
        avatarUrl: club.avatarUrl,
        memberCount: club._count.members,
        isMember,
        members: club.members.map((m) => ({
          id: m.user.id,
          name: `${m.user.firstName} ${m.user.lastName}`,
          avatarUrl: m.user.avatarUrl,
          city: m.user.city,
          role: m.role,
        })),
        recentActivities: recentActivities.map((act) => ({
          id: act.id,
          name: act.name,
          sportType: act.sportType,
          startTime: act.startTime,
          distanceMeters: act.distanceMeters,
          movingTimeSeconds: act.movingTimeSeconds,
          elevationGainMeters: act.elevationGainMeters,
          athleteName: `${act.user.firstName} ${act.user.lastName}`,
          athleteId: act.user.id,
          kudosCount: act._count.kudos,
          commentsCount: act._count.comments,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching club details:', error);
    res.status(500).json({ error: 'Failed to fetch club details' });
  }
});

// Join / Leave club toggle
router.post('/:id/join', requireAuth, async (req: Request, res: Response) => {
  try {
    const clubId = req.params.id;
    const userId = req.user!.userId;

    const existing = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: { clubId, userId },
      },
    });

    let isMember = false;
    if (existing) {
      await prisma.clubMember.delete({
        where: { id: existing.id },
      });
      isMember = false;
    } else {
      await prisma.clubMember.create({
        data: { clubId, userId, role: 'member' },
      });
      isMember = true;
    }

    const memberCount = await prisma.clubMember.count({ where: { clubId } });

    res.json({ isMember, memberCount });
  } catch (error) {
    console.error('Error toggling club membership:', error);
    res.status(500).json({ error: 'Failed to toggle club membership' });
  }
});

// Create new club
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, sportType, location, description, avatarUrl, isPrivate } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Club name is required' });
      return;
    }

    const club = await prisma.club.create({
      data: {
        name,
        sportType: sportType || 'Running Club',
        location: location || 'San Francisco, CA',
        description: description || '',
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=300&h=300&fit=crop',
        isPrivate: !!isPrivate,
        creatorId: userId,
        members: {
          create: {
            userId,
            role: 'admin',
          },
        },
      },
    });

    res.status(201).json({ club });
  } catch (error) {
    console.error('Error creating club:', error);
    res.status(500).json({ error: 'Failed to create club' });
  }
});

export default router;
