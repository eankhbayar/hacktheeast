import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../config/dynamodb';
import type { Schedule } from '../types';

export async function createSchedule(schedule: Schedule): Promise<Schedule> {
  await docClient.send(
    new PutCommand({ TableName: TABLES.SCHEDULES, Item: schedule })
  );
  return schedule;
}

export async function getScheduleByChild(childId: string): Promise<Schedule | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLES.SCHEDULES,
      IndexName: 'childId-index',
      KeyConditionExpression: 'childId = :childId',
      ExpressionAttributeValues: { ':childId': childId },
    })
  );
  return (result.Items?.[0] as Schedule) || null;
}

export async function getSchedule(scheduleId: string): Promise<Schedule | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLES.SCHEDULES, Key: { scheduleId } })
  );
  return (result.Item as Schedule) || null;
}

export async function updateSchedule(
  scheduleId: string,
  updates: Partial<Pick<Schedule, 'intervalMinutes' | 'activeDays' | 'activeStartTime' | 'activeEndTime' | 'isEnabled'>>
): Promise<Schedule | null> {
  const fields = Object.entries(updates).filter(([, v]) => v !== undefined);
  if (fields.length === 0) return getSchedule(scheduleId);

  const exprParts: string[] = ['#updatedAt = :updatedAt'];
  const names: Record<string, string> = { '#updatedAt': 'updatedAt' };
  const values: Record<string, unknown> = { ':updatedAt': new Date().toISOString() };

  for (const [key, val] of fields) {
    const placeholder = `#${key}`;
    const valKey = `:${key}`;
    exprParts.push(`${placeholder} = ${valKey}`);
    names[placeholder] = key;
    values[valKey] = val;
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLES.SCHEDULES,
      Key: { scheduleId },
      UpdateExpression: `SET ${exprParts.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ConditionExpression: 'attribute_exists(scheduleId)',
      ReturnValues: 'ALL_NEW',
    })
  );
  return (result.Attributes as Schedule) || null;
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({ TableName: TABLES.SCHEDULES, Key: { scheduleId } })
  );
}

export function shouldTriggerNow(schedule: Schedule): boolean {
  if (!schedule.isEnabled) return false;

  const now = new Date();
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = dayNames[now.getDay()];

  if (!schedule.activeDays.includes(today)) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = schedule.activeStartTime.split(':').map(Number);
  const [endH, endM] = schedule.activeEndTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}
