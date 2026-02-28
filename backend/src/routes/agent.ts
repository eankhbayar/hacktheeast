import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { invokeAgent } from '../services/agentcore';
import type { AgentRequest } from '../types';

const router = Router();

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

    const payload: AgentRequest = {
      childId: req.body.childId,
      ageGroup: req.body.ageGroup,
      requestType: req.body.requestType,
      interests: req.body.interests,
      learningObjectives: req.body.learningObjectives,
    };

    try {
      const sessionId = req.headers['x-agent-session-id'] as string | undefined;
      const result = await invokeAgent(payload, sessionId);
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

    const payload: AgentRequest = {
      childId: req.body.childId,
      ageGroup: req.body.ageGroup,
      requestType: 'lesson',
      interests: req.body.interests,
      learningObjectives: req.body.learningObjectives,
    };

    try {
      const sessionId = req.headers['x-agent-session-id'] as string | undefined;
      const result = await invokeAgent(payload, sessionId);
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

    const payload: AgentRequest = {
      childId: req.body.childId,
      ageGroup: req.body.ageGroup,
      requestType: 'report',
      interests: req.body.interests,
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

export default router;
