"""Tests for S3 data layer and historical summary aggregation."""
from __future__ import annotations

import pytest

from src.models.progress import ProgressRecord, TopicScore
from src.tools.s3_data import build_historical_summary


def _make_record(**overrides) -> ProgressRecord:
    defaults = {
        "recordId": "rec_1",
        "childId": "child_1",
        "date": "2026-02-20",
        "totalQuestions": 10,
        "correctAnswers": 7,
        "incorrectAnswers": 3,
        "sessionsCompleted": 1,
        "sessionsLockedOut": 0,
        "topicBreakdown": {
            "addition": TopicScore(correct=5, incorrect=1),
            "multiplication": TopicScore(correct=2, incorrect=2),
        },
        "timeSpentSeconds": 600,
    }
    defaults.update(overrides)
    return ProgressRecord.model_validate(defaults)


class TestBuildHistoricalSummary:
    def test_empty_records(self):
        summary = build_historical_summary("child_1", [])
        assert summary.total_sessions == 0
        assert summary.accuracy_trend == []
        assert summary.struggling_topics == []
        assert summary.strengths_topics == []

    def test_single_record(self):
        record = _make_record()
        summary = build_historical_summary("child_1", [record])

        assert summary.child_id == "child_1"
        assert summary.total_sessions == 1
        assert summary.date_range.start == "2026-02-20"
        assert summary.date_range.end == "2026-02-20"
        assert len(summary.accuracy_trend) == 1
        assert summary.accuracy_trend[0] == pytest.approx(0.7)

    def test_multiple_records_aggregation(self):
        records = [
            _make_record(
                recordId="rec_1",
                date="2026-02-20",
                correctAnswers=7,
                incorrectAnswers=3,
                sessionsCompleted=1,
                timeSpentSeconds=600,
            ),
            _make_record(
                recordId="rec_2",
                date="2026-02-21",
                correctAnswers=5,
                incorrectAnswers=5,
                sessionsCompleted=1,
                timeSpentSeconds=900,
            ),
        ]
        summary = build_historical_summary("child_1", records)

        assert summary.total_sessions == 2
        assert summary.date_range.start == "2026-02-20"
        assert summary.date_range.end == "2026-02-21"
        assert len(summary.accuracy_trend) == 2

    def test_struggling_and_strength_classification(self):
        record = _make_record(
            topicBreakdown={
                "addition": TopicScore(correct=9, incorrect=1),
                "division": TopicScore(correct=2, incorrect=8),
            }
        )
        summary = build_historical_summary("child_1", [record])

        struggling_names = [s.topic for s in summary.struggling_topics]
        strength_names = [s.topic for s in summary.strengths_topics]

        assert "division" in struggling_names
        assert "addition" in strength_names

    def test_lockout_frequency_summed(self):
        records = [
            _make_record(recordId="r1", date="2026-02-20", sessionsLockedOut=2),
            _make_record(recordId="r2", date="2026-02-21", sessionsLockedOut=1),
        ]
        summary = build_historical_summary("child_1", records)
        assert summary.lockout_frequency == 3
