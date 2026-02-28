from __future__ import annotations

import logging
from typing import Any

from src.agent.state import AgentState
from src.llm.minimax import generate
from src.models.output import ParentReport

logger = logging.getLogger(__name__)

REPORTER_SYSTEM_PROMPT = """\
You are an educational analyst creating a progress report for a parent.
Child age group: {age_group}
Reporting period: {date_range}

Historical performance data:
- Total sessions: {total_sessions}
- Accuracy trend (per session): {accuracy_trend}
- Average time per session: {avg_time} minutes

Topics with struggle indicators (>50% incorrect):
{struggling_topics}

Topics showing strength (>=70% correct):
{strength_topics}

Session completion rate: {sessions_completed}
Lockout events (indicates frustration): {lockout_count}

Parent guidance context:
{exa_context}

Generate a JSON object with this exact structure:
{{
  "summary": {{
    "period": "string",
    "overallAccuracy": number (0-1),
    "sessionsCompleted": number,
    "timeInvestedMinutes": number
  }},
  "patterns": {{
    "strengths": ["string"],
    "challenges": ["string"],
    "engagementIndicators": "string"
  }},
  "recommendations": [
    {{
      "area": "string",
      "suggestion": "string",
      "rationale": "string linked to research context"
    }}
  ]
}}

IMPORTANT: All numbers in the report MUST reflect the actual data provided above.
Do NOT fabricate or estimate any statistics. Respond ONLY with the JSON object.\
"""


def reporter_generate(state: AgentState) -> dict[str, Any]:
    """Generate a parent progress report (PRD Section 4.2)."""
    child_input = state["input"]
    history = state.get("history")
    exa_context = state.get("exa_context", "")

    if not history:
        return {
            "output": {
                "summary": {
                    "period": "N/A",
                    "overallAccuracy": 0,
                    "sessionsCompleted": 0,
                    "timeInvestedMinutes": 0,
                },
                "patterns": {
                    "strengths": [],
                    "challenges": [],
                    "engagementIndicators": "No data available yet.",
                },
                "recommendations": [
                    {
                        "area": "Getting Started",
                        "suggestion": "Complete a few learning sessions to begin tracking progress.",
                        "rationale": "Insufficient data to generate a meaningful report.",
                    }
                ],
            },
            "error": "insufficient_data",
        }

    struggling_str = "\n".join(
        f"- {s.topic}: {s.incorrect_rate:.0%} incorrect"
        for s in history.struggling_topics
    ) or "None identified"

    strength_str = "\n".join(
        f"- {s.topic}: {s.correct_rate:.0%} correct"
        for s in history.strengths_topics
    ) or "None identified"

    total_time = sum(
        a * history.average_time_per_session for a in [1]
    ) * history.total_sessions if history.total_sessions else 0

    system_prompt = REPORTER_SYSTEM_PROMPT.format(
        age_group=child_input.age_group,
        date_range=f"{history.date_range.start} to {history.date_range.end}",
        total_sessions=history.total_sessions,
        accuracy_trend=[round(a, 2) for a in history.accuracy_trend],
        avg_time=history.average_time_per_session,
        struggling_topics=struggling_str,
        strength_topics=strength_str,
        sessions_completed=history.total_sessions,
        lockout_count=history.lockout_frequency,
        exa_context=exa_context or "Use evidence-based guidance.",
    )

    user_prompt = (
        f"Generate a progress report for a child aged {child_input.age_group} "
        f"covering {history.date_range.start} to {history.date_range.end}."
    )

    try:
        raw = generate(system_prompt, user_prompt)
        output = ParentReport.model_validate(raw)
        return {"output": output.model_dump(by_alias=True)}
    except Exception:
        logger.exception("Reporter generation failed")
        return {
            "output": {
                "status": "partial_success",
                "message": "Report generation encountered an issue. Please try again shortly.",
                "fallback": True,
            },
            "error": "reporter_generation_failed",
        }
