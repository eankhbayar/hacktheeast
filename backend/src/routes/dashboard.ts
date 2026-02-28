import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getChildren, getChild } from '../services/child';
import { getActiveSession } from '../services/session';
import { getProgress, getWeakTopics } from '../services/progress';
import { getSessionQuestions } from '../services/question';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../config/dynamodb';
import type { Session } from '../types';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const children = await getChildren(req.user!.userId);

  const overview = await Promise.all(
    children.map(async (child) => {
      const activeSession = await getActiveSession(child.childId);
      return {
        childId: child.childId,
        name: child.name,
        ageGroup: child.ageGroup,
        isActive: child.isActive,
        activeSession: activeSession
          ? {
              sessionId: activeSession.sessionId,
              status: activeSession.status,
              stage: activeSession.stage,
              incorrectStreak: activeSession.incorrectStreak,
              startedAt: activeSession.startedAt,
              lockedAt: activeSession.lockedAt,
            }
          : null,
      };
    })
  );

  res.json({ children: overview });
});

router.get('/:childId/progress', authMiddleware, async (req: AuthRequest, res: Response) => {
  const child = await getChild(req.params.childId as string);
  if (!child || child.parentId !== req.user!.userId) {
    res.status(404).json({ error: 'Child profile not found' });
    return;
  }

  const range = (req.query.range as string) || '7d';
  const endDate = new Date();
  const startDate = new Date();

  if (range === '30d') {
    startDate.setDate(startDate.getDate() - 30);
  } else if (range === '90d') {
    startDate.setDate(startDate.getDate() - 90);
  } else {
    startDate.setDate(startDate.getDate() - 7);
  }

  const [records, weakTopics] = await Promise.all([
    getProgress(child.childId, startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)),
    getWeakTopics(child.childId),
  ]);

  const totals = records.reduce(
    (acc, r) => ({
      totalQuestions: acc.totalQuestions + r.totalQuestions,
      correctAnswers: acc.correctAnswers + r.correctAnswers,
      incorrectAnswers: acc.incorrectAnswers + r.incorrectAnswers,
      sessionsCompleted: acc.sessionsCompleted + r.sessionsCompleted,
      sessionsLockedOut: acc.sessionsLockedOut + r.sessionsLockedOut,
      timeSpentSeconds: acc.timeSpentSeconds + r.timeSpentSeconds,
    }),
    {
      totalQuestions: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      sessionsCompleted: 0,
      sessionsLockedOut: 0,
      timeSpentSeconds: 0,
    }
  );

  res.json({
    childId: child.childId,
    name: child.name,
    range,
    summary: totals,
    dailyRecords: records,
    weakTopics,
  });
});

router.get('/:childId/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  const child = await getChild(req.params.childId as string);
  if (!child || child.parentId !== req.user!.userId) {
    res.status(404).json({ error: 'Child profile not found' });
    return;
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLES.SESSIONS,
      IndexName: 'childId-index',
      KeyConditionExpression: 'childId = :cid',
      ExpressionAttributeValues: { ':cid': child.childId },
      ScanIndexForward: false,
    })
  );
  const sessions = (result.Items as Session[]) || [];

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const recentSessions = sessions.slice(0, limit);

  const history = await Promise.all(
    recentSessions.map(async (session) => {
      const questions = await getSessionQuestions(session.sessionId);
      return {
        session: {
          sessionId: session.sessionId,
          status: session.status,
          stage: session.stage,
          totalIncorrect: session.totalIncorrect,
          triggerType: session.triggerType,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
          unlockedBy: session.unlockedBy,
        },
        questions: questions.map((q) => ({
          questionId: q.questionId,
          topic: q.topic,
          questionText: q.questionText,
          correctAnswer: q.correctAnswer,
          childAnswer: q.childAnswer,
          isCorrect: q.isCorrect,
          attemptNumber: q.attemptNumber,
        })),
      };
    })
  );

  res.json({ childId: child.childId, history });
});

export default router;
