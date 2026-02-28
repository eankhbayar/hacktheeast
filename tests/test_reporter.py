"""Tests for the reporter node."""
from __future__ import annotations

from unittest.mock import patch

from src.agent.reporter import reporter_generate
from src.agent.state import AgentState
from src.models.input import ChildInput
from src.models.progress import (
    DateRange,
    HistoricalSummary,
    StrengthTopic,
    StruggleTopic,
    TopicScore,
)

MOCK_REPORT_RESPONSE = {
    "summary": {
        "period": "2026-02-01 to 2026-02-28",
        "overallAccuracy": 0.72,
        "sessionsCompleted": 5,
        "timeInvestedMinutes": 45,
    },
    "patterns": {
        "strengths": ["Addition (90% correct)"],
        "challenges": ["Multiplication (70% incorrect)"],
        "engagementIndicators": "Consistent daily sessions",
    },
    "recommendations": [
        {
            "area": "Multiplication",
            "suggestion": "Use visual grouping exercises",
            "rationale": "Research supports concrete manipulatives",
        }
    ],
}


def _make_history() -> HistoricalSummary:
    return HistoricalSummary(
        child_id="child_1",
        date_range=DateRange(start="2026-02-01", end="2026-02-28"),
        total_sessions=5,
        accuracy_trend=[0.6, 0.7, 0.75, 0.72, 0.8],
        struggling_topics=[
            StruggleTopic(topic="multiplication", incorrect_rate=0.7),
        ],
        strengths_topics=[
            StrengthTopic(topic="addition", correct_rate=0.9),
        ],
        average_time_per_session=9.0,
        lockout_frequency=1,
        topic_breakdown={
            "addition": TopicScore(correct=45, incorrect=5),
            "multiplication": TopicScore(correct=12, incorrect=28),
        },
    )


def _make_state(**overrides) -> AgentState:
    child_input = ChildInput.model_validate({
        "childId": "child_1",
        "ageGroup": "9-12",
        "interests": "dinosaurs",
        "requestType": "report",
    })
    defaults: AgentState = {
        "input": child_input,
        "history": _make_history(),
        "selected_topic": None,
        "exa_context": "Parent guidance context.",
        "output": None,
        "error": None,
    }
    defaults.update(overrides)
    return defaults


class TestReporterGenerate:
    @patch("src.agent.reporter.generate", return_value=MOCK_REPORT_RESPONSE)
    def test_successful_report(self, mock_gen):
        state = _make_state()
        result = reporter_generate(state)

        assert "output" in result
        assert result["output"]["summary"]["overallAccuracy"] == 0.72
        assert len(result["output"]["recommendations"]) == 1

    @patch("src.agent.reporter.generate", side_effect=Exception("timeout"))
    def test_fallback_on_failure(self, mock_gen):
        state = _make_state()
        result = reporter_generate(state)

        assert result["output"]["fallback"] is True
        assert result["error"] == "reporter_generation_failed"

    def test_no_history_returns_insufficient_data(self):
        state = _make_state(history=None)
        result = reporter_generate(state)

        assert result["error"] == "insufficient_data"
        assert result["output"]["patterns"]["engagementIndicators"] == "No data available yet."
        assert len(result["output"]["recommendations"]) == 1
