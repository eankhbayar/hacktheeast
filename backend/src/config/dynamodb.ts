import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  type CreateTableCommandInput,
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

const prefix = process.env.DYNAMODB_TABLE_PREFIX || 'allnighters';

export const TABLES = {
  USERS: `${prefix}-users`,
  CHILDREN: `${prefix}-children`,
  SCHEDULES: `${prefix}-schedules`,
  SESSIONS: `${prefix}-sessions`,
  QUESTIONS: `${prefix}-questions`,
  LESSONS: `${prefix}-lessons`,
  PROGRESS: `${prefix}-progress`,
  NOTIFICATIONS: `${prefix}-notifications`,
} as const;

/** @deprecated Use TABLES.USERS instead */
export const TABLE_NAME = TABLES.USERS;

const TABLE_DEFINITIONS: CreateTableCommandInput[] = [
  {
    TableName: TABLES.USERS,
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
  },
  {
    TableName: TABLES.CHILDREN,
    AttributeDefinitions: [
      { AttributeName: 'childId', AttributeType: 'S' },
      { AttributeName: 'parentId', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'childId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'parentId-index',
        KeySchema: [{ AttributeName: 'parentId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: TABLES.SCHEDULES,
    AttributeDefinitions: [
      { AttributeName: 'scheduleId', AttributeType: 'S' },
      { AttributeName: 'childId', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'scheduleId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'childId-index',
        KeySchema: [{ AttributeName: 'childId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: TABLES.SESSIONS,
    AttributeDefinitions: [
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'childId', AttributeType: 'S' },
      { AttributeName: 'parentId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'sessionId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'childId-index',
        KeySchema: [{ AttributeName: 'childId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'parentId-status-index',
        KeySchema: [
          { AttributeName: 'parentId', KeyType: 'HASH' },
          { AttributeName: 'status', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: TABLES.QUESTIONS,
    AttributeDefinitions: [
      { AttributeName: 'questionId', AttributeType: 'S' },
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'childId', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'questionId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'sessionId-index',
        KeySchema: [{ AttributeName: 'sessionId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'childId-index',
        KeySchema: [{ AttributeName: 'childId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: TABLES.LESSONS,
    AttributeDefinitions: [
      { AttributeName: 'lessonId', AttributeType: 'S' },
      { AttributeName: 'sessionId', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'lessonId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'sessionId-index',
        KeySchema: [{ AttributeName: 'sessionId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: TABLES.PROGRESS,
    AttributeDefinitions: [
      { AttributeName: 'recordId', AttributeType: 'S' },
      { AttributeName: 'childId', AttributeType: 'S' },
      { AttributeName: 'date', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'recordId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'childId-date-index',
        KeySchema: [
          { AttributeName: 'childId', KeyType: 'HASH' },
          { AttributeName: 'date', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: TABLES.NOTIFICATIONS,
    AttributeDefinitions: [
      { AttributeName: 'notificationId', AttributeType: 'S' },
      { AttributeName: 'parentId', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'notificationId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'parentId-index',
        KeySchema: [{ AttributeName: 'parentId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
];

async function createTableIfNotExists(
  definition: CreateTableCommandInput
): Promise<void> {
  try {
    await client.send(
      new DescribeTableCommand({ TableName: definition.TableName! })
    );
    return;
  } catch {
    /* table does not exist */
  }

  try {
    await client.send(new CreateTableCommand(definition));
  } catch (err: unknown) {
    const name =
      err && typeof err === 'object' && 'name' in err
        ? (err as { name: string }).name
        : '';
    if (name === 'ResourceInUseException') return;
    throw err;
  }
}

export async function ensureTablesExist(): Promise<void> {
  if (!process.env.DYNAMODB_ENDPOINT) return;

  const maxAttempts = 10;
  const delayMs = 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await Promise.all(TABLE_DEFINITIONS.map(createTableIfNotExists));
      console.log('All DynamoDB tables ready');
      return;
    } catch {
      if (attempt === maxAttempts)
        throw new Error('Failed to create DynamoDB tables');
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

/** @deprecated Use ensureTablesExist instead */
export const ensureTableExists = ensureTablesExist;
