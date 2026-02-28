"""Tests for the topic selection algorithm (PRD Section 5.2)."""
from __future__ import annotations

import pytest

from src.agent.orchestrator import select_topic
from src.models.input import ChildInput
from src.models.progress import (
    DateRange,
    HistoricalSummary,
    TopicScore,
)


def _make_input(**overrides) -> ChildInput:
    defaults = {
        "childId": "child_1",
        "ageGroup": "9-12",
        "interests": "dinosaurs and space",
        "learningObjectives": ["multiplication", "fractions"],
        "requestType": "lesson",
    }
    defaults.update(overrides)
    return ChildInput.model_validate(defaults)


def _make_summary(topic_breakdown: dict[str, TopicScore]) -> HistoricalSummary:
    return HistoricalSummary(
        child_id="child_1",
        date_range=DateRange(start="2026-02-01", end="2026-02-28"),
        total_sessions=5,
        accuracy_trend=[0.5],
        struggling_topics=[],
        strengths_topics=[],
        average_time_per_session=10.0,
        lockout_frequency=0,
        topic_breakdown=topic_breakdown,
    )


class TestSelectTopic:
    def test_no_history_returns_first_objective(self):
        inp = _make_input()
        assert select_topic(None, inp) == "multiplication"

    def test_no_history_no_objectives_returns_general(self):
        inp = _make_input(learningObjectives=None)
        assert select_topic(None, inp) == "general"

    def test_selects_highest_incorrect_ratio(self):
        summary = _make_summary({
            "multiplication": TopicScore(correct=12, incorrect=28),
            "fractions": TopicScore(correct=3, incorrect=2),
        })
        inp = _make_input()
        assert select_topic(summary, inp) == "multiplication"

    def test_tie_break_by_interest(self):
        summary = _make_summary({
            "multiplication": TopicScore(correct=5, incorrect=5),
            "fractions": TopicScore(correct=5, incorrect=5),
        })
        inp = _make_input(interests="I love fractions puzzles")
        assert select_topic(summary, inp) == "fractions"

    def test_only_considers_topics_within_objectives(self):
        """PRD constraint N2: must not recommend topics outside objectives."""
        summary = _make_summary({
            "algebra": TopicScore(correct=0, incorrect=10),
            "multiplication": TopicScore(correct=8, incorrect=2),
        })
        inp = _make_input(learningObjectives=["multiplication", "fractions"])
        result = select_topic(summary, inp)
        assert result == "multiplication"

    def test_empty_breakdown_falls_back(self):
        summary = _make_summary({})
        inp = _make_input()
        assert select_topic(summary, inp) == "multiplication"

    def test_all_zero_scores_falls_back(self):
        summary = _make_summary({
            "multiplication": TopicScore(correct=0, incorrect=0),
        })
        inp = _make_input()
        assert select_topic(summary, inp) == "multiplication"
