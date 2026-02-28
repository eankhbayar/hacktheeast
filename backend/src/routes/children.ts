import { Router, Response } from 'express';
import { validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import {
  createChild,
  getChildren,
  getChild,
  updateChild,
  deleteChild,
} from '../services/child';
import {
  createSchedule,
  getScheduleByChild,
  updateSchedule,
  deleteSchedule,
} from '../services/schedule';
import {
  createChildValidator,
  updateChildValidator,
  childIdParamValidator,
} from '../validators/children';
import {
  createScheduleValidator,
  updateScheduleValidator,
} from '../validators/schedules';
import type { ChildProfile, Schedule } from '../types';

const router = Router();

async function verifyChildOwnership(req: AuthRequest, res: Response): Promise<boolean> {
  const childId = req.params.childId as string;
  const child = await getChild(childId);
  if (!child || child.parentId !== req.user!.userId) {
    res.status(404).json({ error: 'Child profile not found' });
    return false;
  }
  return true;
}

router.post('/', authMiddleware, createChildValidator, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const now = new Date().toISOString();
  const child: ChildProfile = {
    childId: uuidv4(),
    parentId: req.user!.userId,
    name: req.body.name,
    ageGroup: req.body.ageGroup,
    learningFocus: req.body.learningFocus,
    interests: req.body.interests,
    avatarUrl: req.body.avatarUrl,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await createChild(child);
  res.status(201).json(child);
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const children = await getChildren(req.user!.userId);
  res.json(children);
});

// Schedule routes (must come before /:childId so /:childId/schedule matches)
router.post('/:childId/schedule', authMiddleware, createScheduleValidator, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  if (!(await verifyChildOwnership(req, res))) return;

  const childId = req.params.childId as string;
  const existing = await getScheduleByChild(childId);
  if (existing) {
    res.status(409).json({ error: 'Schedule already exists for this child. Use PUT to update.' });
    return;
  }

  const now = new Date().toISOString();
  const schedule: Schedule = {
    scheduleId: uuidv4(),
    childId,
    intervalMinutes: req.body.intervalMinutes,
    activeDays: req.body.activeDays,
    activeStartTime: req.body.activeStartTime,
    activeEndTime: req.body.activeEndTime,
    isEnabled: true,
    createdAt: now,
    updatedAt: now,
  };

  await createSchedule(schedule);
  res.status(201).json(schedule);
});

router.get('/:childId/schedule', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!(await verifyChildOwnership(req, res))) return;

  const schedule = await getScheduleByChild(req.params.childId as string);
  if (!schedule) {
    res.status(404).json({ error: 'No schedule found for this child' });
    return;
  }
  res.json(schedule);
});

router.put('/:childId/schedule', authMiddleware, updateScheduleValidator, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  if (!(await verifyChildOwnership(req, res))) return;

  const schedule = await getScheduleByChild(req.params.childId as string);
  if (!schedule) {
    res.status(404).json({ error: 'No schedule found for this child' });
    return;
  }

  const { intervalMinutes, activeDays, activeStartTime, activeEndTime, isEnabled } = req.body;
  const updated = await updateSchedule(schedule.scheduleId, {
    intervalMinutes,
    activeDays,
    activeStartTime,
    activeEndTime,
    isEnabled,
  });
  res.json(updated);
});

router.delete('/:childId/schedule', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!(await verifyChildOwnership(req, res))) return;

  const schedule = await getScheduleByChild(req.params.childId as string);
  if (!schedule) {
    res.status(404).json({ error: 'No schedule found for this child' });
    return;
  }

  await deleteSchedule(schedule.scheduleId);
  res.status(204).send();
});

router.get('/:childId', authMiddleware, childIdParamValidator, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const childId = req.params.childId as string;
  const child = await getChild(childId);
  if (!child || child.parentId !== req.user!.userId) {
    res.status(404).json({ error: 'Child profile not found' });
    return;
  }
  res.json(child);
});

router.put('/:childId', authMiddleware, updateChildValidator, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const childId = req.params.childId as string;
  const existing = await getChild(childId);
  if (!existing || existing.parentId !== req.user!.userId) {
    res.status(404).json({ error: 'Child profile not found' });
    return;
  }

  const { name, ageGroup, learningFocus, interests, avatarUrl, isActive } = req.body;
  const updated = await updateChild(childId, {
    name,
    ageGroup,
    learningFocus,
    interests,
    avatarUrl,
    isActive,
  });
  res.json(updated);
});

router.delete('/:childId', authMiddleware, childIdParamValidator, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const childId = req.params.childId as string;
  const existing = await getChild(childId);
  if (!existing || existing.parentId !== req.user!.userId) {
    res.status(404).json({ error: 'Child profile not found' });
    return;
  }

  await deleteChild(childId);
  res.status(204).send();
});

export default router;
