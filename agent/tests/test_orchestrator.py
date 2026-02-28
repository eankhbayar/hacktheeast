"""Tests for orchestrator utility functions."""
from __future__ import annotations

from src.agent.orchestrator import sanitize_interests


class TestSanitizeInterests:
    def test_removes_blocked_words(self):
        result = sanitize_interests("dinosaurs and gun games")
        assert "gun" not in result
        assert "dinosaurs" in result

    def test_preserves_clean_input(self):
        result = sanitize_interests("loves dinosaurs, space, and pizza")
        assert result == "loves dinosaurs, space, and pizza"

    def test_handles_empty_string(self):
        assert sanitize_interests("") == ""

    def test_removes_multiple_blocked_words(self):
        result = sanitize_interests("war games with bomb and knife toys")
        assert "war" not in result
        assert "bomb" not in result
        assert "knife" not in result
        assert "games" in result
        assert "toys" in result

    def test_case_insensitive_blocking(self):
        result = sanitize_interests("KILL something")
        assert "KILL" not in result
        assert "something" in result
