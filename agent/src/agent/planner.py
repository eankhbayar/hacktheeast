from __future__ import annotations

import json
import logging
from typing import Any

from src.agent.orchestrator import sanitize_interests
from src.agent.state import AgentState
from src.llm.minimax import generate
from src.models.output import PlannerOutput

logger = logging.getLogger(__name__)

PLANNER_SYSTEM_PROMPT = """\
You are a friendly tutor for a child aged {age_group}.
The child loves: {interests}.
Create a lesson on {topic} using analogies from the child's interests.
Teaching context for this age group:
{exa_context}

Generate a JSON object with this exact structure:
{{
  "lessonPlan": {{
    "title": "string",
    "learningObjectives": ["string"],
    "durationMinutes": number (5-10),
    "activities": [
      {{
        "type": "explanation" | "practice" | "review",
        "content": "string",
        "analogyUsed": "string from child's interests"
      }}
    ]
  }},
  "videoScript": {{
    "scenes": [
      {{
        "visualCue": "string",
        "dialogue": "string",
        "durationSeconds": number
      }}
    ]
  }}
}}

Include at least 2 analogies from the child's interests.
Respond ONLY with the JSON object.\
"""


def planner_generate(state: AgentState) -> dict[str, Any]:
    """Generate a lesson plan and video script (PRD Section 4.1)."""
    child_input = state["input"]
    topic = state.get("selected_topic", "general")
    exa_context = state.get("exa_context", "")

    safe_interests = sanitize_interests(child_input.interests)
    if not safe_interests:
        safe_interests = "learning and exploring"

    system_prompt = PLANNER_SYSTEM_PROMPT.format(
        age_group=child_input.age_group,
        interests=safe_interests,
        topic=topic,
        exa_context=exa_context or "Use age-appropriate teaching methods.",
    )

    user_prompt = (
        f"Create a {topic} lesson for a {child_input.age_group} year old "
        f"who loves {safe_interests}."
    )

    try:
        raw = generate(system_prompt, user_prompt)
        output = PlannerOutput.model_validate(raw)
        return {"output": output.model_dump(by_alias=True)}
    except Exception:
        logger.exception("Planner generation failed")
        return {
            "output": {
                "status": "partial_success",
                "message": "We're preparing your lesson. It will be ready in a moment.",
                "fallback": True,
            },
            "error": "planner_generation_failed",
        }
