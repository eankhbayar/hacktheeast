"""Tests for the planner node."""
from __future__ import annotations

from unittest.mock import patch

from src.agent.planner import planner_generate
from src.agent.state import AgentState
from src.models.input import ChildInput

MOCK_MINIMAX_RESPONSE = {
    "lessonPlan": {
        "title": "Multiplication with Dinosaur Herds",
        "learningObjectives": ["Understand multiplication as repeated addition"],
        "durationMinutes": 7,
        "activities": [
            {
                "type": "explanation",
                "content": "Imagine 3 herds of dinosaurs...",
                "analogyUsed": "dinosaurs",
            },
            {
                "type": "practice",
                "content": "If a pizza has 8 slices...",
                "analogyUsed": "pizza",
            },
        ],
    },
    "videoScript": {
        "scenes": [
            {
                "visualCue": "Show dinosaur groups",
                "dialogue": "Let's count!",
                "durationSeconds": 15,
            }
        ]
    },
}


def _make_state(**overrides) -> AgentState:
    child_input = ChildInput.model_validate({
        "childId": "child_1",
        "ageGroup": "9-12",
        "interests": "dinosaurs and pizza",
        "learningObjectives": ["multiplication"],
        "requestType": "lesson",
    })
    defaults: AgentState = {
        "input": child_input,
        "history": None,
        "selected_topic": "multiplication",
        "exa_context": "Use concrete examples.",
        "output": None,
        "error": None,
    }
    defaults.update(overrides)
    return defaults


class TestPlannerGenerate:
    @patch("src.agent.planner.generate", return_value=MOCK_MINIMAX_RESPONSE)
    def test_successful_generation(self, mock_gen):
        state = _make_state()
        result = planner_generate(state)

        assert "output" in result
        assert result["output"]["lessonPlan"]["title"] == "Multiplication with Dinosaur Herds"
        assert len(result["output"]["lessonPlan"]["activities"]) == 2
        assert "error" not in result or result.get("error") is None

    @patch("src.agent.planner.generate", side_effect=Exception("API down"))
    def test_fallback_on_failure(self, mock_gen):
        state = _make_state()
        result = planner_generate(state)

        assert result["output"]["fallback"] is True
        assert result["error"] == "planner_generation_failed"

    @patch("src.agent.planner.generate", return_value=MOCK_MINIMAX_RESPONSE)
    def test_empty_interests_uses_default(self, mock_gen):
        state = _make_state()
        state["input"] = ChildInput.model_validate({
            "childId": "child_1",
            "ageGroup": "6-8",
            "interests": "",
            "requestType": "lesson",
        })
        result = planner_generate(state)
        assert "output" in result
        mock_gen.assert_called_once()
        call_args = mock_gen.call_args
        assert "learning and exploring" in call_args[0][0]
