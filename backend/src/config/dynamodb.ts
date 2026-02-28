import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    },
  }),
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLE_NAME =
  process.env.DYNAMODB_TABLE_NAME || 'hacktheeast-users';

export async function ensureTableExists(): Promise<void> {
  if (!process.env.DYNAMODB_ENDPOINT) return;

  const maxAttempts = 10;
  const delayMs = 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await client.send(
        new DescribeTableCommand({ TableName: TABLE_NAME })
      );
      return;
    } catch {
      /* Table does not exist or DynamoDB not ready */
    }

    try {
      await client.send(
        new CreateTableCommand({
          TableName: TABLE_NAME,
          AttributeDefinitions: [
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'email', AttributeType: 'S' },
          ],
          KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
          GlobalSecondaryIndexes: [
            {
              IndexName: 'email-index',
              KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
              Projection: { ProjectionType: 'ALL' },
            },
          ],
          BillingMode: 'PAY_PER_REQUEST',
        })
      );
      return;
    } catch (err: unknown) {
      const name = err && typeof err === 'object' && 'name' in err ? (err as { name: string }).name : '';
      if (name === 'ResourceInUseException') return;
      if (attempt === maxAttempts) throw new Error('Failed to create DynamoDB table');
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
