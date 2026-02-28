import {
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES } from '../config/dynamodb';
import { getChild } from './child';
import type { Question, ChildProfile } from '../types';
import {
  DEFAULT_QUESTIONS,
  type AgeGroup,
} from '../data/default-questions';

/**
 * Fallback question bank when no pre-generated questions exist.
 */
const QUESTION_BANK: Record<string, Array<{ q: string; options: string[]; answer: string }>> = {
  math: [
    { q: 'What is 7 + 5?', options: ['10', '11', '12', '13'], answer: '12' },
    { q: 'What is 3 x 4?', options: ['7', '10', '12', '14'], answer: '12' },
    { q: 'What is 15 - 8?', options: ['5', '6', '7', '8'], answer: '7' },
    { q: 'What is 20 / 4?', options: ['4', '5', '6', '8'], answer: '5' },
    { q: 'What is 9 + 6?', options: ['13', '14', '15', '16'], answer: '15' },
  ],
  languages: [
    { q: 'What does "Bonjour" mean?', options: ['Goodbye', 'Hello', 'Thank you', 'Please'], answer: 'Hello' },
    { q: 'How do you say "cat" in Spanish?', options: ['Perro', 'Gato', 'Pájaro', 'Pez'], answer: 'Gato' },
    { q: 'What is "Thank you" in Japanese?', options: ['Konnichiwa', 'Sayonara', 'Arigatou', 'Sumimasen'], answer: 'Arigatou' },
  ],
  phonetics: [
    { q: 'What sound does the letter "B" make?', options: ['/b/', '/d/', '/p/', '/t/'], answer: '/b/' },
    { q: 'Which word starts with a "ch" sound?', options: ['Ship', 'Chair', 'Think', 'Jump'], answer: 'Chair' },
    { q: 'How many syllables in "elephant"?', options: ['2', '3', '4', '1'], answer: '3' },
  ],
  general: [
    { q: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], answer: 'Paris' },
    { q: 'How many days are in a week?', options: ['5', '6', '7', '8'], answer: '7' },
    { q: 'What planet do we live on?', options: ['Mars', 'Earth', 'Jupiter', 'Venus'], answer: 'Earth' },
    { q: 'How many legs does a spider have?', options: ['6', '8', '10', '4'], answer: '8' },
    { q: 'What is the opposite of hot?', options: ['Warm', 'Cold', 'Cool', 'Mild'], answer: 'Cold' },
  ],
};

function pickFromBank(profile: ChildProfile): {
  q: string;
  options: string[];
  answer: string;
  topic: string;
} {
  const topics =
    profile.learningFocus.length > 0 ? profile.learningFocus : ['general'];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const bank = QUESTION_BANK[topic] || QUESTION_BANK['general'];
  const item = bank[Math.floor(Math.random() * bank.length)];
  return { ...item, topic };
}

const TOPIC_ALIASES: Record<string, string> = {
  math: 'math',
  languages: 'languages',
  phonetics: 'phonetics',
  general: 'general',
  reading: 'general',
  science: 'general',
};

/** Seed default questions for a child on create. */
export async function seedDefaultQuestions(
  childId: string,
  ageGroup: string,
  learningFocus: string[]
): Promise<void> {
  const age = ageGroup as AgeGroup;
  const bank = DEFAULT_QUESTIONS[age] ?? DEFAULT_QUESTIONS['9-12'];
  const rawTopics =
    learningFocus.length > 0 ? learningFocus : ['general', 'math'];
  const topics = [...new Set(rawTopics.map((t) => TOPIC_ALIASES[t] ?? 'general'))];
  const now = new Date().toISOString();

  const items: Question[] = [];
  for (const topic of topics) {
    const questions = bank[topic as keyof typeof bank] ?? bank['general'] ?? [];
    for (const t of questions) {
      items.push({
        questionId: uuidv4(),
        sessionId: 'PRE-GEN',
        childId,
        topic,
        questionText: t.q,
        options: t.options,
        correctAnswer: t.answer,
        attemptNumber: 0,
        createdAt: now,
        source: 'default',
        status: 'ready',
      });
    }
  }

  if (items.length === 0) return;

  const batches: { PutRequest: { Item: Question } }[] = items.map((item) => ({
    PutRequest: { Item: item },
  }));

  for (let i = 0; i < batches.length; i += 25) {
    const chunk = batches.slice(i, i + 25);
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLES.QUESTIONS]: chunk,
        },
      })
    );
  }
}

/** Fetch next ready question for child, preferring AI-generated. */
export async function getNextReadyQuestion(
  childId: string
): Promise<Question | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLES.QUESTIONS,
      IndexName: 'childId-index',
      KeyConditionExpression: 'childId = :cid',
      FilterExpression: '#s = :ready',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':cid': childId, ':ready': 'ready' },
      Limit: 50,
    })
  );

  const items = (result.Items as Question[]) ?? [];
  if (items.length === 0) return null;

  const aiFirst = items.sort((a, b) => {
    if (a.source === 'ai_generated' && b.source !== 'ai_generated') return -1;
    if (a.source !== 'ai_generated' && b.source === 'ai_generated') return 1;
    return 0;
  });
  return aiFirst[0] ?? null;
}

/** Claim a pre-generated question for a session. */
export async function claimQuestionForSession(
  questionId: string,
  sessionId: string,
  attemptNumber: number
): Promise<Question | null> {
  const q = await getQuestion(questionId);
  if (!q || q.status !== 'ready') return null;

  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.QUESTIONS,
      Key: { questionId },
      UpdateExpression: 'SET sessionId = :sid, #s = :used, attemptNumber = :a',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':sid': sessionId,
        ':used': 'used',
        ':a': attemptNumber,
      },
    })
  );

  return {
    ...q,
    sessionId,
    attemptNumber,
    status: 'used',
  };
}

export async function generateQuestion(
  childId: string,
  sessionId: string,
  attemptNumber: number
): Promise<Question> {
  const ready = await getNextReadyQuestion(childId);
  if (ready) {
    const claimed = await claimQuestionForSession(
      ready.questionId,
      sessionId,
      attemptNumber
    );
    if (claimed) return claimed;
  }

  const profile = await getChild(childId);
  const picked = pickFromBank(
    profile || ({ learningFocus: [], interests: [] } as unknown as ChildProfile)
  );

  const question: Question = {
    questionId: uuidv4(),
    sessionId,
    childId,
    topic: picked.topic,
    questionText: picked.q,
    options: picked.options,
    correctAnswer: picked.answer,
    attemptNumber,
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({ TableName: TABLES.QUESTIONS, Item: question })
  );
  return question;
}

export async function getQuestion(questionId: string): Promise<Question | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLES.QUESTIONS, Key: { questionId } })
  );
  return (result.Item as Question) || null;
}

export async function recordAnswer(
  questionId: string,
  childAnswer: string,
  isCorrect: boolean
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.QUESTIONS,
      Key: { questionId },
      UpdateExpression: 'SET childAnswer = :a, isCorrect = :c',
      ExpressionAttributeValues: { ':a': childAnswer, ':c': isCorrect },
    })
  );
}

export async function getSessionQuestions(sessionId: string): Promise<Question[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLES.QUESTIONS,
      IndexName: 'sessionId-index',
      KeyConditionExpression: 'sessionId = :sid',
      ExpressionAttributeValues: { ':sid': sessionId },
    })
  );
  return (result.Items as Question[]) || [];
}

export async function getFailedTopics(sessionId: string): Promise<string[]> {
  const questions = await getSessionQuestions(sessionId);
  const failedTopics = new Set<string>();
  for (const q of questions) {
    if (q.isCorrect === false) {
      failedTopics.add(q.topic);
    }
  }
  return [...failedTopics];
}
