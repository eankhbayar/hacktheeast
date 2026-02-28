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
  createChildValidator,
  updateChildValidator,
  childIdParamValidator,
} from '../validators/children';
import type { ChildProfile } from '../types';

const router = Router();

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
