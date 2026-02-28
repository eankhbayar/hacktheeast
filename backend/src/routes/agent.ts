import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { invokeAgent } from '../services/agentcore';
import { getProgress } from '../services/progress';
import { saveLesson, getLesson, getLessonsByChild } from '../services/lesson';
import type { AgentRequest } from '../types';

const router = Router();

async function fetchProgressRecords(childId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);

  try {
    return await getProgress(childId, startDate, endDate);
  } catch {
    return [];
  }
}

const validateInvoke = [
  body('childId').isString().notEmpty(),
  body('ageGroup').isIn(['6-8', '9-12', '13-15']),
  body('requestType').isIn(['lesson', 'report']),
  body('interests').optional().isString(),
  body('learningObjectives').optional().isArray(),
  body('learningObjectives.*').optional().isString(),
];

router.post(
  '/invoke',
  authMiddleware,
  validateInvoke,
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', errors: errors.array() });
      return;
    }

    const progressRecords = await fetchProgressRecords(req.body.childId);

    const payload: AgentRequest = {
      childId: req.body.childId,
      ageGroup: req.body.ageGroup,
      requestType: req.body.requestType,
      interests: req.body.interests,
      learningObjectives: req.body.learningObjectives,
      progressRecords,
    };

    try {
      const sessionId = req.headers['x-agent-session-id'] as string | undefined;
      const result = await invokeAgent(payload, sessionId);

      if (result.status !== 'error' && result.data?.lessonPlan && payload.requestType === 'lesson') {
        const topic = result.data.lessonPlan &&
          typeof result.data.lessonPlan === 'object' &&
          'title' in result.data.lessonPlan
          ? String((result.data.lessonPlan as Record<string, unknown>).title)
          : 'general';
        const lesson = await saveLesson(payload.childId, topic, result);
        result.data.lessonId = lesson.lessonId;
      }

      const statusCode = result.status === 'error' ? 502 : 200;
      res.status(statusCode).json(result);
    } catch (err) {
      console.error('Agent invocation failed:', err);
      res.status(503).json({
        status: 'error',
        message: 'Agent service unavailable. Please try again.',
      });
    }
  }
);

router.post(
  '/lesson',
  authMiddleware,
  [
    body('childId').isString().notEmpty(),
    body('ageGroup').isIn(['6-8', '9-12', '13-15']),
    body('interests').optional().isString(),
    body('learningObjectives').optional().isArray(),
    body('learningObjectives.*').optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', errors: errors.array() });
      return;
    }

    const progressRecords = await fetchProgressRecords(req.body.childId);

    const payload: AgentRequest = {
      childId: req.body.childId,
      ageGroup: req.body.ageGroup,
      requestType: 'lesson',
      interests: req.body.interests,
      learningObjectives: req.body.learningObjectives,
      progressRecords,
    };

    try {
      const sessionId = req.headers['x-agent-session-id'] as string | undefined;
      const result = await invokeAgent(payload, sessionId);

      if (result.status !== 'error' && result.data?.lessonPlan) {
        const topic = result.data.lessonPlan &&
          typeof result.data.lessonPlan === 'object' &&
          'title' in result.data.lessonPlan
          ? String((result.data.lessonPlan as Record<string, unknown>).title)
          : 'general';
        const lesson = await saveLesson(payload.childId, topic, result);
        result.data.lessonId = lesson.lessonId;
      }

      const statusCode = result.status === 'error' ? 502 : 200;
      res.status(statusCode).json(result);
    } catch (err) {
      console.error('Agent lesson invocation failed:', err);
      res.status(503).json({
        status: 'error',
        message: 'Agent service unavailable. Please try again.',
      });
    }
  }
);

router.post(
  '/report',
  authMiddleware,
  [
    body('childId').isString().notEmpty(),
    body('ageGroup').isIn(['6-8', '9-12', '13-15']),
    body('interests').optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', errors: errors.array() });
      return;
    }

    const progressRecords = await fetchProgressRecords(req.body.childId);

    const payload: AgentRequest = {
      childId: req.body.childId,
      ageGroup: req.body.ageGroup,
      requestType: 'report',
      interests: req.body.interests,
      progressRecords,
    };

    try {
      const sessionId = req.headers['x-agent-session-id'] as string | undefined;
      const result = await invokeAgent(payload, sessionId);
      const statusCode = result.status === 'error' ? 502 : 200;
      res.status(statusCode).json(result);
    } catch (err) {
      console.error('Agent report invocation failed:', err);
      res.status(503).json({
        status: 'error',
        message: 'Agent service unavailable. Please try again.',
      });
    }
  }
);

router.get(
  '/lessons/:childId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const childId = String(req.params.childId);
      const limit = Math.min(parseInt(String(req.query.limit)) || 20, 100);
      const lessons = await getLessonsByChild(childId, limit);
      res.json({ lessons });
    } catch (err) {
      console.error('Failed to fetch lessons:', err);
      res.status(500).json({ status: 'error', message: 'Failed to fetch lessons' });
    }
  }
);

router.get(
  '/lessons/:childId/:lessonId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const childId = String(req.params.childId);
      const lessonId = String(req.params.lessonId);
      const lesson = await getLesson(lessonId);
      if (!lesson || lesson.childId !== childId) {
        res.status(404).json({ status: 'error', message: 'Lesson not found' });
        return;
      }
      res.json({ lesson });
    } catch (err) {
      console.error('Failed to fetch lesson:', err);
      res.status(500).json({ status: 'error', message: 'Failed to fetch lesson' });
    }
  }
);

export default router;
