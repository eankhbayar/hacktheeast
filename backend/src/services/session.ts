import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES } from '../config/dynamodb';
import { generateQuestion, getQuestion, recordAnswer as recordQuestionAnswer } from './question';
import { generateLesson, getLessonBySession, incrementWatchCount } from './lesson';
import { getFailedTopics } from './question';
import { recordAnswer as recordProgressAnswer, recordSessionComplete } from './progress';
import { notifyChildLocked } from './notification';
import type { Session, Question, Lesson } from '../types';

const STRIKE_THRESHOLD = 3;

export async function createSession(
  childId: string,
  parentId: string,
  triggerType: 'schedule' | 'manual'
): Promise<{ session: Session; question: Question }> {
  const session: Session = {
    sessionId: uuidv4(),
    childId,
    parentId,
    status: 'active',
    stage: 'questioning',
    incorrectStreak: 0,
    totalIncorrect: 0,
    triggerType,
    startedAt: new Date().toISOString(),
  };

  const question = await generateQuestion(childId, session.sessionId, 1);
  session.currentQuestionId = question.questionId;

  await docClient.send(
    new PutCommand({ TableName: TABLES.SESSIONS, Item: session })
  );

  return { session, question };
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLES.SESSIONS, Key: { sessionId } })
  );
  return (result.Item as Session) || null;
}

export async function getActiveSession(childId: string): Promise<Session | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLES.SESSIONS,
      IndexName: 'childId-index',
      KeyConditionExpression: 'childId = :cid',
      ExpressionAttributeValues: { ':cid': childId },
    })
  );

  const sessions = (result.Items as Session[]) || [];
  return sessions.find(
    (s) => s.status === 'active' || s.status === 'remediation' || s.status === 'full_stop'
  ) || null;
}

async function updateSession(
  sessionId: string,
  updates: Record<string, unknown>
): Promise<Session | null> {
  const exprParts: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(updates)) {
    const placeholder = `#${key}`;
    const valKey = `:${key}`;
    exprParts.push(`${placeholder} = ${valKey}`);
    names[placeholder] = key;
    values[valKey] = val;
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLES.SESSIONS,
      Key: { sessionId },
      UpdateExpression: `SET ${exprParts.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    })
  );
  return (result.Attributes as Session) || null;
}

export interface AnswerResult {
  result: 'correct' | 'incorrect' | 'locked';
  sessionComplete?: boolean;
  nextQuestion?: Question;
  strikesRemaining?: number;
  lesson?: Lesson;
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  answer: string
): Promise<AnswerResult> {
  const session = await getSession(sessionId);
  if (!session || (session.status !== 'active')) {
    throw new Error('Session not active for answering');
  }

  const question = await getQuestion(questionId);
  if (!question || question.sessionId !== sessionId) {
    throw new Error('Question not found for this session');
  }

  const isCorrect = question.correctAnswer === answer;
  await recordQuestionAnswer(questionId, answer, isCorrect);
  await recordProgressAnswer(session.childId, isCorrect, question.topic);

  if (isCorrect) {
    await updateSession(sessionId, {
      status: 'completed',
      stage: 'done',
      incorrectStreak: 0,
      completedAt: new Date().toISOString(),
    });
    await recordSessionComplete(session.childId, false);
    return { result: 'correct', sessionComplete: true };
  }

  const newStreak = session.incorrectStreak + 1;
  const newTotal = session.totalIncorrect + 1;

  if (newStreak >= STRIKE_THRESHOLD) {
    return escalateToRemediation(sessionId, session, newTotal);
  }

  const nextQuestion = await generateQuestion(
    session.childId,
    sessionId,
    newTotal + 1
  );

  await updateSession(sessionId, {
    incorrectStreak: newStreak,
    totalIncorrect: newTotal,
    currentQuestionId: nextQuestion.questionId,
  });

  return {
    result: 'incorrect',
    nextQuestion,
    strikesRemaining: STRIKE_THRESHOLD - newStreak,
  };
}

async function escalateToRemediation(
  sessionId: string,
  session: Session,
  totalIncorrect: number
): Promise<AnswerResult> {
  const failedTopics = await getFailedTopics(sessionId);
  const topic = failedTopics[0] || 'general';

  const lesson = await generateLesson(
    session.childId,
    sessionId,
    topic,
    session.currentQuestionId || ''
  );

  await updateSession(sessionId, {
    status: 'full_stop',
    stage: 'remediation_video',
    incorrectStreak: STRIKE_THRESHOLD,
    totalIncorrect: totalIncorrect,
    lockedAt: new Date().toISOString(),
  });

  await notifyChildLocked(session.parentId, session.childId, sessionId);

  return { result: 'locked', lesson };
}

export interface RemediationResult {
  result: 'correct' | 'incorrect';
  sessionComplete?: boolean;
  rewatchRequired?: boolean;
}

export async function markVideoComplete(sessionId: string): Promise<void> {
  const lesson = await getLessonBySession(sessionId);
  if (lesson) {
    await incrementWatchCount(lesson.lessonId);
  }
  await updateSession(sessionId, { stage: 'remediation_question' });
}

export async function submitRemediationAnswer(
  sessionId: string,
  answer: string
): Promise<RemediationResult> {
  const session = await getSession(sessionId);
  if (!session || session.status !== 'full_stop') {
    throw new Error('Session not in full_stop state');
  }

  const question = session.currentQuestionId
    ? await getQuestion(session.currentQuestionId)
    : null;

  if (!question) {
    throw new Error('No trigger question found for remediation');
  }

  const isCorrect = question.correctAnswer === answer;

  if (isCorrect) {
    await updateSession(sessionId, {
      status: 'completed',
      stage: 'done',
      unlockedAt: new Date().toISOString(),
      unlockedBy: 'child_correct',
      completedAt: new Date().toISOString(),
    });
    await recordSessionComplete(session.childId, true);
    return { result: 'correct', sessionComplete: true };
  }

  await updateSession(sessionId, { stage: 'remediation_video' });
  return { result: 'incorrect', rewatchRequired: true };
}

export async function parentUnlock(
  parentId: string,
  sessionId: string
): Promise<Session | null> {
  const session = await getSession(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.parentId !== parentId) throw new Error('Not authorized');
  if (session.status !== 'full_stop' && session.status !== 'remediation') {
    throw new Error('Session is not locked');
  }

  const updated = await updateSession(sessionId, {
    status: 'parent_unlocked',
    stage: 'done',
    unlockedAt: new Date().toISOString(),
    unlockedBy: 'parent_override',
    completedAt: new Date().toISOString(),
  });

  await recordSessionComplete(session.childId, true);
  return updated;
}
