import { Router, Response } from 'express';
import { validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getChild } from '../services/child';
import {
  createSession,
  getSession,
  getActiveSession,
  submitAnswer,
  markVideoComplete,
  submitRemediationAnswer,
  parentUnlock,
} from '../services/session';
import {
  triggerSessionValidator,
  sessionIdParamValidator,
  submitAnswerValidator,
  submitRemediationAnswerValidator,
} from '../validators/sessions';

const router = Router();

router.post('/trigger', authMiddleware, triggerSessionValidator, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { childId, triggerType } = req.body;
  const child = await getChild(childId);
  if (!child || child.parentId !== req.user!.userId) {
    res.status(404).json({ error: 'Child profile not found' });
    return;
  }

  const existing = await getActiveSession(childId);
  if (existing) {
    res.status(409).json({ error: 'An active session already exists', session: existing });
    return;
  }

  const result = await createSession(childId, req.user!.userId, triggerType || 'manual');
  res.status(201).json(result);
});

router.get('/:sessionId', authMiddleware, sessionIdParamValidator, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const sessionId = req.params.sessionId as string;
  const session = await getSession(sessionId);
  if (!session || session.parentId !== req.user!.userId) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json(session);
});

router.get('/active/:childId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const childId = req.params.childId as string;
  const child = await getChild(childId);
  if (!child || child.parentId !== req.user!.userId) {
    res.status(404).json({ error: 'Child profile not found' });
    return;
  }

  const session = await getActiveSession(childId);
  if (!session) {
    res.status(404).json({ error: 'No active session' });
    return;
  }
  res.json(session);
});

router.post('/:sessionId/answer', authMiddleware, submitAnswerValidator, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const sessionId = req.params.sessionId as string;
  try {
    const result = await submitAnswer(sessionId, req.body.questionId, req.body.answer);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

router.post('/:sessionId/video-complete', authMiddleware, sessionIdParamValidator, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const sessionId = req.params.sessionId as string;
  try {
    await markVideoComplete(sessionId);
    res.json({ status: 'video_complete' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

router.post('/:sessionId/remediation-answer', authMiddleware, submitRemediationAnswerValidator, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const sessionId = req.params.sessionId as string;
  try {
    const result = await submitRemediationAnswer(sessionId, req.body.answer);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

router.post('/:sessionId/parent-unlock', authMiddleware, sessionIdParamValidator, async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const sessionId = req.params.sessionId as string;
  try {
    const session = await parentUnlock(req.user!.userId, sessionId);
    res.json({ status: 'unlocked', session });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

export default router;
