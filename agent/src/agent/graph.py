from __future__ import annotations

import logging
from typing import Any

from langgraph.graph import END, StateGraph

from src.agent.orchestrator import select_topic
from src.agent.planner import planner_generate
from src.agent.reporter import reporter_generate
from src.agent.state import AgentState
from src.observability import traced_operation
from src.models.progress import ProgressRecord
from src.tools.exa_search import search_parenting_context, search_teaching_context
from src.tools.s3_data import build_historical_summary, get_progress_records

logger = logging.getLogger(__name__)


def load_history(state: AgentState) -> dict[str, Any]:
    """Build historical summary from inline progress records or S3 fallback."""
    child_input = state["input"]
    with traced_operation("load_history", {"child_id": child_input.child_id}):
        if child_input.progress_records:
            records = [
                ProgressRecord.model_validate(r)
                for r in child_input.progress_records
            ]
        else:
            records = get_progress_records(child_input.child_id)
        history = build_historical_summary(child_input.child_id, records)
    return {"history": history}


def select_topic_node(state: AgentState) -> dict[str, Any]:
    """Choose the weakest topic for the lesson."""
    with traced_operation("select_topic"):
        topic = select_topic(state.get("history"), state["input"])
    return {"selected_topic": topic}


def exa_search_teaching(state: AgentState) -> dict[str, Any]:
    """Enrich with pedagogical best practices via Exa."""
    topic = state.get("selected_topic", "general")
    age_group = state["input"].age_group
    with traced_operation("exa_search_teaching", {"topic": topic, "age_group": age_group}):
        context = search_teaching_context(topic, age_group)
    return {"exa_context": context}


def aggregate_data(state: AgentState) -> dict[str, Any]:
    """Prepare aggregated data for the reporter (history is already loaded)."""
    return {}


def exa_search_parenting(state: AgentState) -> dict[str, Any]:
    """Enrich with parent guidance strategies via Exa."""
    history = state.get("history")
    topics = []
    if history and history.struggling_topics:
        topics = [s.topic for s in history.struggling_topics[:3]]
    with traced_operation("exa_search_parenting", {"topics": topics}):
        context = search_parenting_context(topics)
    return {"exa_context": context}


def route_request(state: AgentState) -> str:
    """Route to planner or reporter branch based on request type."""
    return state["input"].request_type


def build_graph() -> StateGraph:
    """Construct the LangGraph StateGraph for the learning system."""
    graph = StateGraph(AgentState)

    graph.add_node("load_history", load_history)
    graph.add_node("select_topic", select_topic_node)
    graph.add_node("exa_search_teaching", exa_search_teaching)
    graph.add_node("planner_generate", planner_generate)
    graph.add_node("aggregate_data", aggregate_data)
    graph.add_node("exa_search_parenting", exa_search_parenting)
    graph.add_node("reporter_generate", reporter_generate)

    graph.set_entry_point("load_history")

    graph.add_conditional_edges(
        "load_history",
        route_request,
        {
            "lesson": "select_topic",
            "report": "aggregate_data",
        },
    )

    graph.add_edge("select_topic", "exa_search_teaching")
    graph.add_edge("exa_search_teaching", "planner_generate")
    graph.add_edge("planner_generate", END)

    graph.add_edge("aggregate_data", "exa_search_parenting")
    graph.add_edge("exa_search_parenting", "reporter_generate")
    graph.add_edge("reporter_generate", END)

    return graph


compiled_graph = build_graph().compile()
