from __future__ import annotations

import json
import logging
from typing import Any

import anthropic

from src.config import get_settings

logger = logging.getLogger(__name__)

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        settings = get_settings()
        _client = anthropic.Anthropic(
            base_url=settings.anthropic_base_url,
            api_key=settings.minimax_api_key,
            timeout=settings.minimax_timeout_seconds,
        )
    return _client


def generate(system_prompt: str, user_prompt: str) -> dict[str, Any]:
    """Call MiniMax M2.5 and parse the JSON response.

    Retries once with a stricter prompt on JSON parse failure.
    Returns a dict on success or raises on double failure.
    """
    settings = get_settings()
    client = _get_client()

    for attempt in range(2):
        try:
            suffix = ""
            if attempt == 1:
                suffix = (
                    "\n\nIMPORTANT: You MUST respond with valid JSON only. "
                    "No markdown, no explanation, just the JSON object."
                )

            message = client.messages.create(
                model=settings.minimax_model,
                max_tokens=settings.minimax_max_tokens,
                system=system_prompt + suffix,
                messages=[{"role": "user", "content": user_prompt}],
            )

            text = message.content[0].text
            text = text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
                if text.endswith("```"):
                    text = text[: text.rfind("```")]
                text = text.strip()

            return json.loads(text)

        except json.JSONDecodeError:
            if attempt == 0:
                logger.warning("MiniMax returned non-JSON; retrying with stricter prompt")
                continue
            raise
        except anthropic.APITimeoutError:
            if attempt == 0:
                logger.warning("MiniMax timeout; retrying once")
                continue
            raise
