from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class Activity(BaseModel):
    type: Literal["explanation", "practice", "review"]
    content: str
    analogy_used: str = Field("", alias="analogyUsed")

    model_config = {"populate_by_name": True}


class LessonPlan(BaseModel):
    title: str
    learning_objectives: list[str] = Field(..., alias="learningObjectives")
    duration_minutes: int = Field(..., alias="durationMinutes")
    activities: list[Activity]

    model_config = {"populate_by_name": True}


class Scene(BaseModel):
    visual_cue: str = Field(..., alias="visualCue")
    dialogue: str
    duration_seconds: int = Field(..., alias="durationSeconds")

    model_config = {"populate_by_name": True}


class VideoScript(BaseModel):
    scenes: list[Scene]


class PlannerOutput(BaseModel):
    lesson_plan: LessonPlan = Field(..., alias="lessonPlan")
    video_script: VideoScript = Field(..., alias="videoScript")

    model_config = {"populate_by_name": True}


class ReportSummary(BaseModel):
    period: str
    overall_accuracy: float = Field(..., alias="overallAccuracy")
    sessions_completed: int = Field(..., alias="sessionsCompleted")
    time_invested_minutes: float = Field(..., alias="timeInvestedMinutes")

    model_config = {"populate_by_name": True}


class ReportPatterns(BaseModel):
    strengths: list[str]
    challenges: list[str]
    engagement_indicators: str = Field(..., alias="engagementIndicators")

    model_config = {"populate_by_name": True}


class Recommendation(BaseModel):
    area: str
    suggestion: str
    rationale: str


class ParentReport(BaseModel):
    summary: ReportSummary
    patterns: ReportPatterns
    recommendations: list[Recommendation]
