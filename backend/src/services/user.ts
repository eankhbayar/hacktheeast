import { PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../config/dynamodb';
import type { User } from '../types';

export async function createUser(user: User): Promise<User> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: user,
      ConditionExpression: 'attribute_not_exists(userId)',
    })
  );
  return user;
}

export async function findByEmail(email: string): Promise<User | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
    })
  );

  const item = result.Items?.[0];
  return item ? (item as User) : null;
}

export async function findById(userId: string): Promise<User | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId },
    })
  );

  return (result.Item as User) || null;
}
