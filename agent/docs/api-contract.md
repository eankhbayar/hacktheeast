# API Contract for Mobile Integration

## Overview

The mobile app communicates with the Learning Agent via the Bedrock AgentCore
`InvokeAgentRuntime` API. There is no custom REST API -- the agent is invoked
directly through AWS SDK or HTTPS.

## Base Endpoint

```
POST /runtimes/{agentRuntimeArn}/invocations
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <cognito_jwt_token>`

**Query Parameters:**
- `runtimeSessionId` (optional): Session ID for multi-turn context

---

## Endpoints

### 1. Request a Lesson

**Payload:**
```json
{
  "childId": "child_456",
  "ageGroup": "9-12",
  "interests": "loves dinosaurs, space rockets, and pizza",
  "learningObjectives": ["multiplication", "fractions"],
  "requestType": "lesson"
}
```

**Success Response (status = "success"):**
```json
{
  "status": "success",
  "data": {
    "lessonPlan": {
      "title": "Multiplication with Dinosaur Herds",
      "learningObjectives": ["Understand multiplication as repeated addition"],
      "durationMinutes": 7,
      "activities": [
        {
          "type": "explanation",
          "content": "Imagine 3 herds of dinosaurs, each with 4 dinosaurs...",
          "analogyUsed": "dinosaurs"
        },
        {
          "type": "practice",
          "content": "If a pizza has 8 slices and 4 friends want equal shares...",
          "analogyUsed": "pizza"
        }
      ]
    },
    "videoScript": {
      "scenes": [
        {
          "visualCue": "Show 3 groups of 4 cartoon dinosaurs",
          "dialogue": "Hey there! Let's count dinosaurs today!",
          "durationSeconds": 15
        }
      ]
    }
  }
}
```

### 2. Request a Report

**Payload:**
```json
{
  "childId": "child_456",
  "ageGroup": "9-12",
  "interests": "loves dinosaurs",
  "requestType": "report"
}
```

**Success Response (status = "success"):**
```json
{
  "status": "success",
  "data": {
    "summary": {
      "period": "2026-02-21 to 2026-02-28",
      "overallAccuracy": 0.72,
      "sessionsCompleted": 5,
      "timeInvestedMinutes": 45
    },
    "patterns": {
      "strengths": ["Addition (90% correct)"],
      "challenges": ["Multiplication (70% incorrect)"],
      "engagementIndicators": "Consistent daily sessions with 1 lockout event"
    },
    "recommendations": [
      {
        "area": "Multiplication",
        "suggestion": "Use visual grouping exercises with real objects",
        "rationale": "Research shows concrete manipulatives improve multiplication understanding"
      }
    ]
  }
}
```

---

## Error Responses

### Validation Error
```json
{
  "status": "error",
  "message": "Invalid request payload: field 'requestType' is required"
}
```

### Partial Success (fallback)
```json
{
  "status": "partial_success",
  "data": {
    "status": "partial_success",
    "message": "We're preparing your lesson. It will be ready in a moment.",
    "fallback": true
  },
  "warning": "planner_generation_failed"
}
```

### Server Error
```json
{
  "status": "error",
  "message": "An unexpected error occurred. Please try again."
}
```

---

## Field Reference

### ChildInput (Request)

| Field               | Type                          | Required | Description                        |
|---------------------|-------------------------------|----------|------------------------------------|
| childId             | string                        | Yes      | Unique child identifier            |
| ageGroup            | "6-8" \| "9-12" \| "13-15"   | Yes      | Child's age group                  |
| interests           | string                        | No       | Free-text interests                |
| learningObjectives  | string[]                      | No       | Topics in curriculum               |
| requestType         | "lesson" \| "report"          | Yes      | Which agent to invoke              |

### Session Management

Pass `runtimeSessionId` as a query parameter to maintain multi-turn context.
Generate a UUID for each new conversation. Reuse the same ID for follow-ups.

---

## Mobile SDK Examples

### iOS (Swift)
```swift
import AWSBedrockAgentCoreRuntime

let client = BedrockAgentCoreClient(region: .usEast1)
let payload = try JSONEncoder().encode(lessonRequest)

let response = try await client.invokeAgentRuntime(
    agentRuntimeArn: "arn:aws:bedrock-agentcore:...",
    payload: payload,
    runtimeSessionId: sessionId
)
```

### Android (Kotlin)
```kotlin
val client = BedrockAgentCoreClient { region = "us-east-1" }
val payload = Gson().toJson(lessonRequest).toByteArray()

val response = client.invokeAgentRuntime {
    agentRuntimeArn = "arn:aws:bedrock-agentcore:..."
    this.payload = payload
    runtimeSessionId = sessionId
}
```
