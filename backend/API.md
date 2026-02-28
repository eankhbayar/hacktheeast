# AllNighters Backend API Reference

Base URL: `http://<host>:3000`

All protected endpoints require `Authorization: Bearer <accessToken>` header.

---

## Authentication

All requests (except register and login) require the parent's JWT access token.
Kids do not have their own auth -- they are profiles within the parent account (Netflix-style).
The mobile app sends `childId` alongside requests when in Kid Mode.

---

## 1. Auth (`/auth`)

### POST `/auth/register`

Register a new parent account.

**Body:**

```json
{
  "email": "parent@example.com",
  "password": "securepass123",
  "fullName": "Jane Doe",
  "phoneNumber": "+1234567890"
}
```

**Response `201`:**

```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "expiresIn": 900,
  "user": {
    "userId": "uuid",
    "email": "parent@example.com",
    "fullName": "Jane Doe",
    "phoneNumber": "+1234567890",
    "role": "parent",
    "createdAt": "2026-02-28T12:00:00.000Z"
  }
}
```

**Errors:** `400` validation, `409` email already registered.

---

### POST `/auth/login`

**Body:**

```json
{
  "email": "parent@example.com",
  "password": "securepass123"
}
```

**Response `200`:** Same shape as register response.

**Errors:** `400` validation, `401` invalid credentials.

---

### POST `/auth/refresh`

**Body:**

```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response `200`:**

```json
{
  "accessToken": "eyJhbG...",
  "expiresIn": 900,
  "user": { ... }
}
```

**Errors:** `401` invalid/expired refresh token.

---

### GET `/auth/me`

Protected. Returns the current parent's profile.

**Response `200`:**

```json
{
  "userId": "uuid",
  "email": "parent@example.com",
  "fullName": "Jane Doe",
  "phoneNumber": "+1234567890",
  "role": "parent",
  "createdAt": "2026-02-28T12:00:00.000Z"
}
```

---

### POST `/auth/verify-password`

Protected. Re-verify the parent's password to exit Kid Mode.
The mobile app calls this when the user wants to switch back from Kid Mode to the parent dashboard.

**Body:**

```json
{
  "password": "securepass123"
}
```

**Response `200`:**

```json
{
  "verified": true
}
```

**Errors:** `401` invalid password.

---

## 2. Children (`/children`)

All endpoints are protected. Parents can only access their own children.

### POST `/children`

Create a child profile.

**Body:**

```json
{
  "name": "Alex",
  "ageGroup": "8-10",
  "learningFocus": ["math", "phonetics"],
  "interests": ["roblox", "dinosaurs"],
  "avatarUrl": "https://example.com/avatar.png"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | |
| `ageGroup` | string | yes | e.g. "5-7", "8-10", "11-13" |
| `learningFocus` | string[] | yes | at least 1 item |
| `interests` | string[] | yes | at least 1 item |
| `avatarUrl` | string | no | valid URL |

**Response `201`:**

```json
{
  "childId": "uuid",
  "parentId": "uuid",
  "name": "Alex",
  "ageGroup": "8-10",
  "learningFocus": ["math", "phonetics"],
  "interests": ["roblox", "dinosaurs"],
  "avatarUrl": "https://example.com/avatar.png",
  "isActive": true,
  "createdAt": "2026-02-28T12:00:00.000Z",
  "updatedAt": "2026-02-28T12:00:00.000Z"
}
```

---

### GET `/children`

List all children for the authenticated parent.

**Response `200`:**

```json
[
  {
    "childId": "uuid",
    "parentId": "uuid",
    "name": "Alex",
    "ageGroup": "8-10",
    "learningFocus": ["math", "phonetics"],
    "interests": ["roblox", "dinosaurs"],
    "isActive": true,
    ...
  }
]
```

---

### GET `/children/:childId`

Get a single child profile.

**Response `200`:** Full `ChildProfile` object.

**Errors:** `404` not found or not owned by parent.

---

### PUT `/children/:childId`

Update a child profile. All fields optional.

**Body (all optional):**

```json
{
  "name": "Alexander",
  "ageGroup": "11-13",
  "learningFocus": ["math", "spanish"],
  "interests": ["roblox", "trains"],
  "avatarUrl": "https://example.com/new-avatar.png",
  "isActive": false
}
```

**Response `200`:** Updated `ChildProfile` object.

---

### DELETE `/children/:childId`

Remove a child profile.

**Response `204`:** No content.

---

## 3. Schedules (`/children/:childId/schedule`)

All endpoints are protected. One schedule per child.

### POST `/children/:childId/schedule`

Create the interruption schedule for a child.

**Body:**

```json
{
  "intervalMinutes": 20,
  "activeDays": ["mon", "tue", "wed", "thu", "fri"],
  "activeStartTime": "09:00",
  "activeEndTime": "21:00"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `intervalMinutes` | number | yes | 5-120 |
| `activeDays` | string[] | yes | values: mon, tue, wed, thu, fri, sat, sun |
| `activeStartTime` | string | yes | HH:MM 24h format |
| `activeEndTime` | string | yes | HH:MM 24h format |

**Response `201`:**

```json
{
  "scheduleId": "uuid",
  "childId": "uuid",
  "intervalMinutes": 20,
  "activeDays": ["mon", "tue", "wed", "thu", "fri"],
  "activeStartTime": "09:00",
  "activeEndTime": "21:00",
  "isEnabled": true,
  "createdAt": "2026-02-28T12:00:00.000Z",
  "updatedAt": "2026-02-28T12:00:00.000Z"
}
```

**Errors:** `409` schedule already exists (use PUT to update).

---

### GET `/children/:childId/schedule`

Get the schedule for a child.

**Response `200`:** Full `Schedule` object.

**Errors:** `404` no schedule found.

---

### PUT `/children/:childId/schedule`

Update the schedule. All fields optional.

**Body (all optional):**

```json
{
  "intervalMinutes": 30,
  "activeDays": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  "activeStartTime": "08:00",
  "activeEndTime": "20:00",
  "isEnabled": false
}
```

**Response `200`:** Updated `Schedule` object.

---

### DELETE `/children/:childId/schedule`

Delete the schedule for a child.

**Response `204`:** No content.

---

## 4. Sessions (`/sessions`) -- The Intervention Engine

This is the core of the app. Sessions track a single interruption cycle from trigger through resolution.

### POST `/sessions/trigger`

Start a new interruption session. Returns the session and the first question.

**Body:**

```json
{
  "childId": "uuid",
  "triggerType": "schedule"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `childId` | string (UUID) | yes | |
| `triggerType` | string | no | "schedule" or "manual" (defaults to "manual") |

**Response `201`:**

```json
{
  "session": {
    "sessionId": "uuid",
    "childId": "uuid",
    "parentId": "uuid",
    "status": "active",
    "stage": "questioning",
    "incorrectStreak": 0,
    "totalIncorrect": 0,
    "currentQuestionId": "uuid",
    "triggerType": "schedule",
    "startedAt": "2026-02-28T12:00:00.000Z"
  },
  "question": {
    "questionId": "uuid",
    "sessionId": "uuid",
    "childId": "uuid",
    "topic": "math",
    "questionText": "What is 7 + 5?",
    "options": ["10", "11", "12", "13"],
    "correctAnswer": "12",
    "attemptNumber": 1,
    "createdAt": "2026-02-28T12:00:00.000Z"
  }
}
```

**Errors:** `409` active session already exists.

---

### GET `/sessions/:sessionId`

Get full session state.

**Response `200`:** Full `Session` object.

---

### GET `/sessions/active/:childId`

Get the currently active session for a child (if any).

**Response `200`:** Full `Session` object.

**Errors:** `404` no active session.

---

### POST `/sessions/:sessionId/answer`

Submit an answer during the questioning stage. This is the core intervention ladder logic.

**Body:**

```json
{
  "questionId": "uuid",
  "answer": "12"
}
```

**Response `200` -- Correct answer (session complete):**

```json
{
  "result": "correct",
  "sessionComplete": true
}
```

**Response `200` -- Incorrect answer (strikes remaining):**

```json
{
  "result": "incorrect",
  "nextQuestion": {
    "questionId": "uuid",
    "sessionId": "uuid",
    "childId": "uuid",
    "topic": "math",
    "questionText": "What is 3 x 4?",
    "options": ["7", "10", "12", "14"],
    "correctAnswer": "12",
    "attemptNumber": 2,
    "createdAt": "..."
  },
  "strikesRemaining": 1
}
```

**Response `200` -- 3 strikes reached (device locked):**

```json
{
  "result": "locked",
  "lesson": {
    "lessonId": "uuid",
    "sessionId": "uuid",
    "childId": "uuid",
    "topic": "math",
    "videoUrl": "https://...",
    "description": "Remedial lesson on math...",
    "durationSeconds": 120,
    "watchCount": 0,
    "triggerQuestionId": "uuid",
    "createdAt": "..."
  }
}
```

---

### POST `/sessions/:sessionId/video-complete`

Mark the remediation video as watched. Call this after the child finishes watching the video.

**Body:** None required.

**Response `200`:**

```json
{
  "status": "video_complete"
}
```

---

### POST `/sessions/:sessionId/remediation-answer`

Submit an answer after watching the remediation video. This is the locked-question loop.

**Body:**

```json
{
  "answer": "12"
}
```

**Response `200` -- Correct (unlocked):**

```json
{
  "result": "correct",
  "sessionComplete": true
}
```

**Response `200` -- Incorrect (must rewatch):**

```json
{
  "result": "incorrect",
  "rewatchRequired": true
}
```

---

### POST `/sessions/:sessionId/parent-unlock`

Parent remotely unlocks a locked device. Only works when session is in `full_stop` status.

**Body:** None required.

**Response `200`:**

```json
{
  "status": "unlocked",
  "session": { ... }
}
```

**Errors:** `400` session not locked, not authorized.

---

## 5. Dashboard (`/dashboard`)

All endpoints are protected. Parent-facing overview and progress data.

### GET `/dashboard`

Parent overview showing all children and their active session status.

**Response `200`:**

```json
{
  "children": [
    {
      "childId": "uuid",
      "name": "Alex",
      "ageGroup": "8-10",
      "isActive": true,
      "activeSession": {
        "sessionId": "uuid",
        "status": "full_stop",
        "stage": "remediation_video",
        "incorrectStreak": 3,
        "startedAt": "2026-02-28T12:00:00.000Z",
        "lockedAt": "2026-02-28T12:05:00.000Z"
      }
    },
    {
      "childId": "uuid",
      "name": "Sam",
      "ageGroup": "5-7",
      "isActive": true,
      "activeSession": null
    }
  ]
}
```

---

### GET `/dashboard/:childId/progress?range=7d`

Child progress with aggregated stats and weak topic analysis.

**Query params:**

| Param | Default | Options |
|-------|---------|---------|
| `range` | `7d` | `7d`, `30d`, `90d` |

**Response `200`:**

```json
{
  "childId": "uuid",
  "name": "Alex",
  "range": "7d",
  "summary": {
    "totalQuestions": 42,
    "correctAnswers": 30,
    "incorrectAnswers": 12,
    "sessionsCompleted": 15,
    "sessionsLockedOut": 3,
    "timeSpentSeconds": 3600
  },
  "dailyRecords": [
    {
      "recordId": "uuid",
      "childId": "uuid",
      "date": "2026-02-27",
      "totalQuestions": 8,
      "correctAnswers": 6,
      "incorrectAnswers": 2,
      "sessionsCompleted": 3,
      "sessionsLockedOut": 1,
      "topicBreakdown": {
        "math": { "correct": 4, "incorrect": 1 },
        "phonetics": { "correct": 2, "incorrect": 1 }
      },
      "timeSpentSeconds": 600
    }
  ],
  "weakTopics": [
    { "topic": "phonetics", "accuracy": 0.55 },
    { "topic": "math", "accuracy": 0.78 }
  ]
}
```

---

### GET `/dashboard/:childId/history?limit=20`

Session history with all questions and answers.

**Query params:**

| Param | Default | Max |
|-------|---------|-----|
| `limit` | `20` | `50` |

**Response `200`:**

```json
{
  "childId": "uuid",
  "history": [
    {
      "session": {
        "sessionId": "uuid",
        "status": "completed",
        "stage": "done",
        "totalIncorrect": 1,
        "triggerType": "schedule",
        "startedAt": "2026-02-28T12:00:00.000Z",
        "completedAt": "2026-02-28T12:02:00.000Z",
        "unlockedBy": null
      },
      "questions": [
        {
          "questionId": "uuid",
          "topic": "math",
          "questionText": "What is 7 + 5?",
          "correctAnswer": "12",
          "childAnswer": "11",
          "isCorrect": false,
          "attemptNumber": 1
        },
        {
          "questionId": "uuid",
          "topic": "math",
          "questionText": "What is 3 x 4?",
          "correctAnswer": "12",
          "childAnswer": "12",
          "isCorrect": true,
          "attemptNumber": 2
        }
      ]
    }
  ]
}
```

---

## 6. Health Check

### GET `/health`

**Response `200`:**

```json
{
  "status": "ok",
  "timestamp": "2026-02-28T12:00:00.000Z"
}
```

---

## Session Status & Stage Reference

### Session Status

| Status | Meaning |
|--------|---------|
| `active` | Child is answering questions (questioning phase) |
| `remediation` | Transitioning to remediation |
| `full_stop` | Device locked -- child must watch video and answer correctly |
| `completed` | Session finished normally (child answered correctly) |
| `parent_unlocked` | Parent remotely unlocked the device |

### Session Stage

| Stage | Meaning |
|-------|---------|
| `questioning` | Presenting multiple-choice questions |
| `remediation_video` | Child must watch the remedial video |
| `remediation_question` | Child must answer the trigger question after video |
| `done` | Session is finished |

---

## Intervention Ladder Flow (Frontend Integration)

```
1. Mobile app timer fires based on schedule
       |
       v
2. POST /sessions/trigger  { childId }
       |
       v
3. Show question overlay to child
       |
       v
4. POST /sessions/:id/answer  { questionId, answer }
       |
       +-- result: "correct"  -->  dismiss overlay, return to previous app
       |
       +-- result: "incorrect"  -->  show nextQuestion, display strikesRemaining
       |                               loop back to step 4
       |
       +-- result: "locked"  -->  enter full-screen kiosk mode
                                    |
                                    v
                              5. Play lesson.videoUrl
                                    |
                                    v
                              6. POST /sessions/:id/video-complete
                                    |
                                    v
                              7. Show the trigger question again
                                    |
                                    v
                              8. POST /sessions/:id/remediation-answer  { answer }
                                    |
                                    +-- result: "correct"  -->  exit kiosk, return to app
                                    |
                                    +-- result: "incorrect", rewatchRequired: true
                                            --> loop back to step 5

Parent override (from parent dashboard or shared device):
    POST /sessions/:id/parent-unlock  -->  exits kiosk immediately

Exit Kid Mode (shared device):
    POST /auth/verify-password  { password }  -->  verified: true  -->  show parent dashboard
```
