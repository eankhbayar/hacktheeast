"""Tests for pydantic model validation."""
from __future__ import annotations

import pytest
from pydantic import ValidationError

from src.models.input import ChildInput
from src.models.output import LessonPlan, ParentReport, PlannerOutput
from src.models.progress import ProgressRecord, TopicScore


class TestChildInput:
    def test_valid_input(self):
        data = {
            "childId": "child_1",
            "ageGroup": "9-12",
            "interests": "space",
            "requestType": "lesson",
        }
        inp = ChildInput.model_validate(data)
        assert inp.child_id == "child_1"
        assert inp.age_group == "9-12"

    def test_invalid_age_group(self):
        with pytest.raises(ValidationError):
            ChildInput.model_validate({
                "childId": "c1",
                "ageGroup": "1-5",
                "requestType": "lesson",
            })

    def test_invalid_request_type(self):
        with pytest.raises(ValidationError):
            ChildInput.model_validate({
                "childId": "c1",
                "ageGroup": "6-8",
                "requestType": "quiz",
            })

    def test_alias_population(self):
        inp = ChildInput(
            child_id="c1",
            age_group="6-8",
            request_type="report",
        )
        assert inp.child_id == "c1"


class TestProgressRecord:
    def test_valid_record(self):
        data = {
            "recordId": "r1",
            "childId": "c1",
            "date": "2026-02-20",
            "totalQuestions": 10,
            "correctAnswers": 7,
            "incorrectAnswers": 3,
            "sessionsCompleted": 1,
            "sessionsLockedOut": 0,
            "topicBreakdown": {
                "math": {"correct": 7, "incorrect": 3},
            },
            "timeSpentSeconds": 600,
        }
        record = ProgressRecord.model_validate(data)
        assert record.child_id == "c1"
        assert record.topic_breakdown["math"].correct == 7


class TestPlannerOutput:
    def test_valid_output(self):
        data = {
            "lessonPlan": {
                "title": "Test",
                "learningObjectives": ["obj1"],
                "durationMinutes": 5,
                "activities": [
                    {"type": "explanation", "content": "test", "analogyUsed": "dino"}
                ],
            },
            "videoScript": {
                "scenes": [
                    {"visualCue": "cue", "dialogue": "hi", "durationSeconds": 10}
                ],
            },
        }
        output = PlannerOutput.model_validate(data)
        assert output.lesson_plan.title == "Test"


class TestParentReport:
    def test_valid_report(self):
        data = {
            "summary": {
                "period": "week 1",
                "overallAccuracy": 0.8,
                "sessionsCompleted": 3,
                "timeInvestedMinutes": 30,
            },
            "patterns": {
                "strengths": ["math"],
                "challenges": ["reading"],
                "engagementIndicators": "good",
            },
            "recommendations": [
                {"area": "reading", "suggestion": "read more", "rationale": "helps"}
            ],
        }
        report = ParentReport.model_validate(data)
        assert report.summary.overall_accuracy == 0.8
