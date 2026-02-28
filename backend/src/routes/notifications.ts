import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getNotifications } from '../services/notification';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const notifications = await getNotifications(req.user.userId);
  res.json(notifications);
});

export default router;
