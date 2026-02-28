from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class TopicScore(BaseModel):
    correct: int = 0
    incorrect: int = 0


class ProgressRecord(BaseModel):
    record_id: str = Field(..., alias="recordId")
    child_id: str = Field(..., alias="childId")
    date: str
    total_questions: int = Field(0, alias="totalQuestions")
    correct_answers: int = Field(0, alias="correctAnswers")
    incorrect_answers: int = Field(0, alias="incorrectAnswers")
    sessions_completed: int = Field(0, alias="sessionsCompleted")
    sessions_locked_out: int = Field(0, alias="sessionsLockedOut")
    topic_breakdown: dict[str, TopicScore] = Field(
        default_factory=dict, alias="topicBreakdown"
    )
    time_spent_seconds: int = Field(0, alias="timeSpentSeconds")

    model_config = {"populate_by_name": True}


class StruggleTopic(BaseModel):
    topic: str
    incorrect_rate: float = Field(..., alias="incorrectRate")

    model_config = {"populate_by_name": True}


class StrengthTopic(BaseModel):
    topic: str
    correct_rate: float = Field(..., alias="correctRate")

    model_config = {"populate_by_name": True}


class DateRange(BaseModel):
    start: str
    end: str


class HistoricalSummary(BaseModel):
    child_id: str = Field(..., alias="childId")
    date_range: DateRange = Field(..., alias="dateRange")
    total_sessions: int = Field(0, alias="totalSessions")
    accuracy_trend: list[float] = Field(default_factory=list, alias="accuracyTrend")
    struggling_topics: list[StruggleTopic] = Field(
        default_factory=list, alias="strugglingTopics"
    )
    strengths_topics: list[StrengthTopic] = Field(
        default_factory=list, alias="strengthsTopics"
    )
    average_time_per_session: float = Field(0.0, alias="averageTimePerSession")
    lockout_frequency: int = Field(0, alias="lockoutFrequency")
    topic_breakdown: Optional[dict[str, TopicScore]] = Field(
        default=None, alias="topicBreakdown"
    )

    model_config = {"populate_by_name": True}
