import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get current athlete's notifications
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification(s) as read
router.post('/mark-read', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { notificationId, all } = req.body;

    if (all) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      res.json({ success: true, message: 'All notifications marked as read' });
      return;
    }

    if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
      });
      res.json({ success: true, message: 'Notification marked as read' });
      return;
    }

    res.status(400).json({ error: 'Must provide notificationId or all: true' });
  } catch (error) {
    console.error('Error updating notification read status:', error);
    res.status(500).json({ error: 'Failed to update notification read status' });
  }
});

export default router;
