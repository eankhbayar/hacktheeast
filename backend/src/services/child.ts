import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../config/dynamodb';
import type { ChildProfile } from '../types';

export async function createChild(child: ChildProfile): Promise<ChildProfile> {
  await docClient.send(
    new PutCommand({
      TableName: TABLES.CHILDREN,
      Item: child,
      ConditionExpression: 'attribute_not_exists(childId)',
    })
  );
  return child;
}

export async function getChildren(parentId: string): Promise<ChildProfile[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLES.CHILDREN,
      IndexName: 'parentId-index',
      KeyConditionExpression: 'parentId = :parentId',
      ExpressionAttributeValues: { ':parentId': parentId },
    })
  );
  return (result.Items as ChildProfile[]) || [];
}

export async function getChild(childId: string): Promise<ChildProfile | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLES.CHILDREN,
      Key: { childId },
    })
  );
  return (result.Item as ChildProfile) || null;
}

export async function updateChild(
  childId: string,
  updates: Partial<Pick<ChildProfile, 'name' | 'ageGroup' | 'learningFocus' | 'interests' | 'avatarUrl' | 'isActive'>>
): Promise<ChildProfile | null> {
  const fields = Object.entries(updates).filter(([, v]) => v !== undefined);
  if (fields.length === 0) return getChild(childId);

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
      TableName: TABLES.CHILDREN,
      Key: { childId },
      UpdateExpression: `SET ${exprParts.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ConditionExpression: 'attribute_exists(childId)',
      ReturnValues: 'ALL_NEW',
    })
  );
  return (result.Attributes as ChildProfile) || null;
}

export async function deleteChild(childId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLES.CHILDREN,
      Key: { childId },
    })
  );
}
