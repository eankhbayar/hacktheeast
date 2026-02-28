from __future__ import annotations

from typing import Any, Optional, TypedDict

from src.models.input import ChildInput
from src.models.progress import HistoricalSummary


class AgentState(TypedDict, total=False):
    input: ChildInput
    history: Optional[HistoricalSummary]
    selected_topic: Optional[str]
    exa_context: Optional[str]
    output: Optional[dict[str, Any]]
    error: Optional[str]
