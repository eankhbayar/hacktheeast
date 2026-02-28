import api from './api';
import type {
  Session,
  Question,
  AnswerResult,
  RemediationResult,
} from '@/types/children';

export interface TriggerSessionRequest {
  childId: string;
  triggerType?: 'schedule' | 'manual';
}

export interface TriggerSessionResponse {
  session: Session;
  question: Question;
}

export interface SubmitAnswerRequest {
  questionId: string;
  answer: string;
}

export async function triggerSession(
  childId: string,
  triggerType: 'schedule' | 'manual' = 'schedule'
): Promise<TriggerSessionResponse> {
  const response = await api.post<TriggerSessionResponse>(
    '/sessions/trigger',
    { childId, triggerType }
  );
  return response.data;
}

export async function getSession(sessionId: string): Promise<Session> {
  const response = await api.get<Session>(`/sessions/${sessionId}`);
  return response.data;
}

export async function getActiveSession(
  childId: string
): Promise<Session | null> {
  try {
    const response = await api.get<Session>(
      `/sessions/active/${childId}`
    );
    return response.data;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 404) {
        return null;
      }
    }
    throw err;
  }
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  answer: string
): Promise<AnswerResult> {
  const response = await api.post<AnswerResult>(
    `/sessions/${sessionId}/answer`,
    { questionId, answer }
  );
  return response.data;
}

export async function markVideoComplete(
  sessionId: string
): Promise<{ status: string }> {
  const response = await api.post<{ status: string }>(
    `/sessions/${sessionId}/video-complete`
  );
  return response.data;
}

export async function submitRemediationAnswer(
  sessionId: string,
  answer: string
): Promise<RemediationResult> {
  const response = await api.post<RemediationResult>(
    `/sessions/${sessionId}/remediation-answer`,
    { answer }
  );
  return response.data;
}

export async function parentUnlock(
  sessionId: string
): Promise<{ status: string; session: Session }> {
  const response = await api.post<{ status: string; session: Session }>(
    `/sessions/${sessionId}/parent-unlock`
  );
  return response.data;
}
