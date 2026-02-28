import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES } from '../config/dynamodb';
import type { Lesson, AgentResponse } from '../types';

export async function saveLesson(
  childId: string,
  topic: string,
  agentResult: AgentResponse
): Promise<Lesson> {
  const data = agentResult.data || {};

  const lesson: Lesson = {
    lessonId: uuidv4(),
    childId,
    topic,
    lessonPlan: data.lessonPlan as Lesson['lessonPlan'],
    videoScript: data.videoScript as Lesson['videoScript'],
    status: agentResult.status === 'success' ? 'success' : 'partial_success',
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({ TableName: TABLES.LESSONS, Item: lesson })
  );
  return lesson;
}

export async function getLesson(lessonId: string): Promise<Lesson | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLES.LESSONS, Key: { lessonId } })
  );
  return (result.Item as Lesson) || null;
}

export async function getLessonsByChild(
  childId: string,
  limit = 20
): Promise<Lesson[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLES.LESSONS,
      IndexName: 'childId-index',
      KeyConditionExpression: 'childId = :cid',
      ExpressionAttributeValues: { ':cid': childId },
      ScanIndexForward: false,
      Limit: limit,
    })
  );
  return (result.Items as Lesson[]) || [];
}

// Legacy compat for session.ts -- stores a placeholder lesson for remediation flow
export async function generateLesson(
  childId: string,
  sessionId: string,
  topic: string,
  triggerQuestionId: string
): Promise<Lesson> {
  const lesson: Lesson = {
    lessonId: uuidv4(),
    childId,
    topic,
    lessonPlan: {
      title: `Remedial: ${topic}`,
      learningObjectives: [`Review ${topic}`],
      durationMinutes: 5,
      activities: [{ type: 'review', content: `Review ${topic} concepts`, analogyUsed: '' }],
    },
    status: 'partial_success',
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLES.LESSONS,
      Item: { ...lesson, sessionId, triggerQuestionId, watchCount: 0 },
    })
  );
  return lesson;
}

export async function getLessonBySession(sessionId: string): Promise<Lesson | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLES.LESSONS,
      IndexName: 'childId-index',
      FilterExpression: 'sessionId = :sid',
      KeyConditionExpression: 'childId = :cid',
      ExpressionAttributeValues: { ':sid': sessionId, ':cid': sessionId },
    })
  );
  return (result.Items?.[0] as Lesson) || null;
}

export async function incrementWatchCount(lessonId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.LESSONS,
      Key: { lessonId },
      UpdateExpression: 'SET watchCount = if_not_exists(watchCount, :zero) + :inc',
      ExpressionAttributeValues: { ':inc': 1, ':zero': 0 },
    })
  );
}
