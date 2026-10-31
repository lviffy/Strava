import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get athlete subscription status and entitlements
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    let sub = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!sub) {
      // Create default summit trial or active subscription for development
      sub = await prisma.subscription.create({
        data: {
          userId,
          tier: 'summit',
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const isActive = sub.status === 'active' && new Date(sub.expiresAt) > new Date();

    res.json({
      subscription: {
        tier: sub.tier,
        status: sub.status,
        isActive,
        expiresAt: sub.expiresAt,
      },
      features: {
        athleteIntelligence: isActive,
        routeFlyover: isActive,
        racePredictions: isActive,
        beaconLiveTracking: isActive,
        heatmaps: isActive,
        bestEffortsPrs: isActive,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// Upgrade / extend subscription
router.post('/upgrade', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { plan } = req.body; // 'monthly', 'annual'

    const durationDays = plan === 'monthly' ? 30 : 365;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const sub = await prisma.subscription.upsert({
      where: { userId },
      update: {
        tier: 'summit',
        status: 'active',
        expiresAt,
      },
      create: {
        userId,
        tier: 'summit',
        status: 'active',
        expiresAt,
      },
    });

    res.json({
      success: true,
      subscription: sub,
      message: 'Successfully upgraded to Strava Summit Subscription!',
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
});

export default router;
