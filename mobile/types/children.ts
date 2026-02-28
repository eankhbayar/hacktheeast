/**
 * Frontend types matching the backend API.
 * Used for children, schedules, sessions, and questions.
 */

// ─── Child Profile ────────────────────────────────────────────────────────────

export interface ChildProfile {
  childId: string;
  parentId: string;
  name: string;
  ageGroup: string;
  learningFocus: string[];
  interests: string[];
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Schedule ────────────────────────────────────────────────────────────────

export interface Schedule {
  scheduleId: string;
  childId: string;
  intervalMinutes: number;
  activeDays: string[];
  activeStartTime: string;
  activeEndTime: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export type SessionStatus =
  | 'active'
  | 'remediation'
  | 'full_stop'
  | 'completed'
  | 'parent_unlocked';

export type SessionStage =
  | 'questioning'
  | 'remediation_video'
  | 'remediation_question'
  | 'done';

export interface Session {
  sessionId: string;
  childId: string;
  parentId: string;
  status: SessionStatus;
  stage: SessionStage;
  incorrectStreak: number;
  totalIncorrect: number;
  currentQuestionId?: string;
  triggerType: 'schedule' | 'manual';
  lockedAt?: string;
  unlockedAt?: string;
  unlockedBy?: 'child_correct' | 'parent_override';
  startedAt: string;
  completedAt?: string;
}

// ─── Question ─────────────────────────────────────────────────────────────────

export interface Question {
  questionId: string;
  sessionId: string;
  childId: string;
  topic: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  childAnswer?: string;
  isCorrect?: boolean;
  attemptNumber: number;
  createdAt: string;
}

// ─── Lesson (Remedial Video) ──────────────────────────────────────────────────

export interface Lesson {
  lessonId: string;
  sessionId: string;
  childId: string;
  topic: string;
  videoUrl: string;
  description: string;
  durationSeconds: number;
  watchCount: number;
  triggerQuestionId: string;
  createdAt: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface AnswerResult {
  result: 'correct' | 'incorrect' | 'locked';
  sessionComplete?: boolean;
  nextQuestion?: Question;
  strikesRemaining?: number;
  lesson?: Lesson;
}

export interface RemediationResult {
  result: 'correct' | 'incorrect';
  sessionComplete?: boolean;
  rewatchRequired?: boolean;
}

// ─── Composite UI Type ────────────────────────────────────────────────────────

/** Combines ChildProfile + Schedule + derived display fields for UI. */
export interface KidView {
  childId: string;
  parentId: string;
  name: string;
  ageGroup: string;
  learningFocus: string[];
  interests: string[];
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** From schedule; defaults to 30 if no schedule. */
  intervalMinutes: number;
  /** Derived client-side for display (not stored in backend). */
  avatarEmoji: string;
  /** Derived client-side for display (not stored in backend). */
  avatarColor: string;
}
