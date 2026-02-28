import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES } from '../config/dynamodb';
import type { ProgressRecord } from '../types';

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getOrCreateToday(childId: string): Promise<ProgressRecord> {
  const date = todayString();
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLES.PROGRESS,
      IndexName: 'childId-date-index',
      KeyConditionExpression: 'childId = :cid AND #d = :date',
      ExpressionAttributeNames: { '#d': 'date' },
      ExpressionAttributeValues: { ':cid': childId, ':date': date },
    })
  );

  if (result.Items && result.Items.length > 0) {
    return result.Items[0] as ProgressRecord;
  }

  const record: ProgressRecord = {
    recordId: uuidv4(),
    childId,
    date,
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    sessionsCompleted: 0,
    sessionsLockedOut: 0,
    topicBreakdown: {},
    timeSpentSeconds: 0,
  };

  await docClient.send(
    new PutCommand({ TableName: TABLES.PROGRESS, Item: record })
  );
  return record;
}

export async function recordAnswer(
  childId: string,
  isCorrect: boolean,
  topic: string
): Promise<void> {
  const record = await getOrCreateToday(childId);

  const topicBreakdown = record.topicBreakdown || {};
  if (!topicBreakdown[topic]) {
    topicBreakdown[topic] = { correct: 0, incorrect: 0 };
  }
  if (isCorrect) {
    topicBreakdown[topic].correct++;
  } else {
    topicBreakdown[topic].incorrect++;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.PROGRESS,
      Key: { recordId: record.recordId },
      UpdateExpression:
        'SET totalQuestions = totalQuestions + :one, ' +
        (isCorrect ? 'correctAnswers = correctAnswers + :one' : 'incorrectAnswers = incorrectAnswers + :one') +
        ', topicBreakdown = :tb',
      ExpressionAttributeValues: {
        ':one': 1,
        ':tb': topicBreakdown,
      },
    })
  );
}

export async function recordSessionComplete(
  childId: string,
  wasLocked: boolean
): Promise<void> {
  const record = await getOrCreateToday(childId);

  const updates = ['sessionsCompleted = sessionsCompleted + :one'];
  if (wasLocked) {
    updates.push('sessionsLockedOut = sessionsLockedOut + :one');
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.PROGRESS,
      Key: { recordId: record.recordId },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeValues: { ':one': 1 },
    })
  );
}

export async function getProgress(
  childId: string,
  startDate: string,
  endDate: string
): Promise<ProgressRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLES.PROGRESS,
      IndexName: 'childId-date-index',
      KeyConditionExpression: 'childId = :cid AND #d BETWEEN :start AND :end',
      ExpressionAttributeNames: { '#d': 'date' },
      ExpressionAttributeValues: {
        ':cid': childId,
        ':start': startDate,
        ':end': endDate,
      },
    })
  );
  return (result.Items as ProgressRecord[]) || [];
}

export async function getWeakTopics(
  childId: string
): Promise<Array<{ topic: string; accuracy: number }>> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const records = await getProgress(
    childId,
    thirtyDaysAgo.toISOString().slice(0, 10),
    todayString()
  );

  const aggregate: Record<string, { correct: number; total: number }> = {};
  for (const rec of records) {
    for (const [topic, score] of Object.entries(rec.topicBreakdown || {})) {
      if (!aggregate[topic]) aggregate[topic] = { correct: 0, total: 0 };
      aggregate[topic].correct += score.correct;
      aggregate[topic].total += score.correct + score.incorrect;
    }
  }

  return Object.entries(aggregate)
    .map(([topic, stats]) => ({
      topic,
      accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}
