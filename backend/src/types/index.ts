// ─── User (Parent Account) ───────────────────────────────────────────────────

export interface User {
  userId: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber: string;
  role: 'parent';
  pushToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: 'parent';
  createdAt: string;
}

// ─── Child Profile (Netflix-style, no separate auth) ────────────────────────

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

// ─── Session (Intervention Cycle) ───────────────────────────────────────────

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

// ─── Question ────────────────────────────────────────────────────────────────

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

// ─── Lesson (Remedial Video) ────────────────────────────────────────────────

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

// ─── Progress Record ────────────────────────────────────────────────────────

export interface TopicScore {
  correct: number;
  incorrect: number;
}

export interface ProgressRecord {
  recordId: string;
  childId: string;
  date: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  sessionsCompleted: number;
  sessionsLockedOut: number;
  topicBreakdown: Record<string, TopicScore>;
  timeSpentSeconds: number;
}

// ─── Notification Log ───────────────────────────────────────────────────────

export type NotificationType = 'child_locked' | 'session_complete' | 'daily_summary';

export interface NotificationLog {
  notificationId: string;
  parentId: string;
  childId: string;
  type: NotificationType;
  title: string;
  body: string;
  sentAt: string;
  readAt?: string;
}

// ─── Auth DTOs ──────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserResponse;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
