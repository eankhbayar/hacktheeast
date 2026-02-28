import api from './api';
import type { ProgressRecord } from '@/types/children';

export interface DashboardChildOverview {
  childId: string;
  name: string;
  ageGroup: string;
  isActive: boolean;
  activeSession: {
    sessionId: string;
    status: string;
    stage: string;
    incorrectStreak: number;
    startedAt: string;
    lockedAt?: string;
  } | null;
}

export interface DashboardResponse {
  children: DashboardChildOverview[];
}

export interface ProgressSummary {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  sessionsCompleted: number;
  sessionsLockedOut: number;
  timeSpentSeconds: number;
}

export interface ChildProgressResponse {
  childId: string;
  name: string;
  range: string;
  summary: ProgressSummary;
  dailyRecords: ProgressRecord[];
  weakTopics: string[];
}

export interface SessionHistoryItem {
  session: {
    sessionId: string;
    status: string;
    stage: string;
    totalIncorrect: number;
    triggerType: string;
    startedAt: string;
    completedAt?: string;
    unlockedBy?: string;
  };
  questions: Array<{
    questionId: string;
    topic: string;
    questionText: string;
    correctAnswer: string;
    childAnswer?: string;
    isCorrect?: boolean;
    attemptNumber: number;
  }>;
}

export interface ChildHistoryResponse {
  childId: string;
  history: SessionHistoryItem[];
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const response = await api.get<DashboardResponse>('/dashboard');
  return response.data;
}

export async function fetchChildProgress(
  childId: string,
  range: '7d' | '30d' | '90d' = '7d'
): Promise<ChildProgressResponse> {
  const response = await api.get<ChildProgressResponse>(
    `/dashboard/${childId}/progress`,
    { params: { range } }
  );
  return response.data;
}

export async function fetchChildHistory(
  childId: string,
  limit = 20
): Promise<ChildHistoryResponse> {
  const response = await api.get<ChildHistoryResponse>(
    `/dashboard/${childId}/history`,
    { params: { limit } }
  );
  return response.data;
}
