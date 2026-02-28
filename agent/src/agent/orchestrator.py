from __future__ import annotations

import logging

from src.models.input import ChildInput
from src.models.progress import HistoricalSummary

logger = logging.getLogger(__name__)

INTEREST_BLOCKLIST = frozenset({
    "kill", "death", "gun", "weapon", "drug", "blood", "violence",
    "hate", "fight", "war", "knife", "bomb", "suicide",
})


def sanitize_interests(interests: str) -> str:
    """Remove blocked keywords from interests string (PRD constraint N6)."""
    words = interests.split()
    filtered = [w for w in words if w.lower().strip(",.!?") not in INTEREST_BLOCKLIST]
    return " ".join(filtered)


def select_topic(history: HistoricalSummary | None, child_input: ChildInput) -> str:
    """Pick the topic the child should study next (PRD Section 5.2).

    Priority:
      1. Topic with highest incorrect / (correct + incorrect) ratio
      2. Tie-break: prefer topic that appears in the child's interests
      3. Fallback: first learning objective or "general"
    """
    objectives = child_input.learning_objectives or []

    if not history or not history.topic_breakdown:
        return objectives[0] if objectives else "general"

    breakdown = history.topic_breakdown

    # Only consider topics within learning objectives if objectives are set (N2)
    if objectives:
        breakdown = {
            t: s for t, s in breakdown.items()
            if t.lower() in [o.lower() for o in objectives]
        }

    if not breakdown:
        return objectives[0] if objectives else "general"

    ratios: dict[str, float] = {}
    for topic, score in breakdown.items():
        total = score.correct + score.incorrect
        if total > 0:
            ratios[topic] = score.incorrect / total

    if not ratios:
        return objectives[0] if objectives else "general"

    max_ratio = max(ratios.values())
    candidates = [t for t, r in ratios.items() if r == max_ratio]

    if len(candidates) == 1:
        return candidates[0]

    interests_lower = child_input.interests.lower()
    for candidate in candidates:
        if candidate.lower() in interests_lower:
            return candidate

    return candidates[0]
