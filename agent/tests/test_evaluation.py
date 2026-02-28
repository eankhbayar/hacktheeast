"""Tests for the evaluation framework."""
from __future__ import annotations

from tests.evaluation import (
    EvaluationScores,
    evaluate_planner_output,
    evaluate_reporter_output,
)


class TestEvaluationScores:
    def test_weighted_score_calculation(self):
        scores = EvaluationScores(accuracy=4, safety=4, tone=4, usefulness=3, test_case="test")
        assert scores.weighted_score == 3.88

    def test_passes_threshold(self):
        passing = EvaluationScores(accuracy=3, safety=3, tone=3, usefulness=3)
        assert passing.passes

        failing = EvaluationScores(accuracy=1, safety=1, tone=1, usefulness=1)
        assert not failing.passes


class TestPlannerEvaluation:
    def test_good_output(self):
        output = {
            "lessonPlan": {
                "title": "Math with Dinos",
                "learningObjectives": ["multiplication"],
                "durationMinutes": 7,
                "activities": [
                    {"type": "explanation", "content": "...", "analogyUsed": "dinosaurs"},
                    {"type": "practice", "content": "...", "analogyUsed": "pizza"},
                ],
            },
            "videoScript": {
                "scenes": [{"visualCue": "x", "dialogue": "y", "durationSeconds": 10}],
            },
        }
        scores = evaluate_planner_output(output, "happy path")
        assert scores.passes

    def test_missing_analogies_penalized(self):
        output = {
            "lessonPlan": {
                "title": "Math Lesson",
                "learningObjectives": ["multiplication"],
                "durationMinutes": 7,
                "activities": [
                    {"type": "explanation", "content": "...", "analogyUsed": ""},
                ],
            },
            "videoScript": {"scenes": [{"visualCue": "x", "dialogue": "y", "durationSeconds": 10}]},
        }
        scores = evaluate_planner_output(output, "missing analogies")
        assert scores.usefulness < 3


class TestReporterEvaluation:
    def test_accurate_report(self):
        output = {
            "summary": {
                "period": "week 1",
                "overallAccuracy": 0.72,
                "sessionsCompleted": 5,
                "timeInvestedMinutes": 45,
            },
            "patterns": {
                "strengths": ["addition"],
                "challenges": ["multiplication"],
                "engagementIndicators": "good",
            },
            "recommendations": [
                {"area": "math", "suggestion": "practice", "rationale": "research"}
            ],
        }
        scores = evaluate_reporter_output(output, actual_sessions=5, actual_accuracy=0.72, test_case="accurate")
        assert scores.passes
        assert scores.accuracy == 4

    def test_fabricated_session_count_penalized(self):
        output = {
            "summary": {
                "period": "week 1",
                "overallAccuracy": 0.72,
                "sessionsCompleted": 10,
                "timeInvestedMinutes": 45,
            },
            "patterns": {"strengths": [], "challenges": [], "engagementIndicators": ""},
            "recommendations": [{"area": "x", "suggestion": "y", "rationale": "z"}],
        }
        scores = evaluate_reporter_output(output, actual_sessions=5, actual_accuracy=0.72, test_case="fabricated")
        assert scores.accuracy <= 2
