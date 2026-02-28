from __future__ import annotations

import logging

from langchain_exa import ExaSearchRetriever

from src.config import get_settings

logger = logging.getLogger(__name__)

_retriever: ExaSearchRetriever | None = None


def _get_retriever() -> ExaSearchRetriever:
    global _retriever
    if _retriever is None:
        settings = get_settings()
        _retriever = ExaSearchRetriever(
            k=3,
            exa_api_key=settings.exa_api_key,
        )
    return _retriever


def search_teaching_context(topic: str, age_group: str) -> str:
    """Search for best teaching practices for a topic and age group."""
    query = f"best practices teaching {topic} to children aged {age_group}"
    return _safe_search(query)


def search_parenting_context(topics: list[str]) -> str:
    """Search for parent guidance strategies for struggling topics."""
    topic_str = ", ".join(topics) if topics else "general learning"
    query = f"how parents can help child struggling with {topic_str}"
    return _safe_search(query)


def _safe_search(query: str) -> str:
    """Run an Exa search with graceful failure and S3 caching (PRD Section 9.3)."""
    from src.tools.exa_cache import get_cached, set_cached

    cached = get_cached(query)
    if cached is not None:
        return cached

    try:
        retriever = _get_retriever()
        docs = retriever.invoke(query)
        if not docs:
            return ""
        chunks = []
        for doc in docs:
            title = getattr(doc, "metadata", {}).get("title", "")
            content = doc.page_content[:500] if doc.page_content else ""
            if title:
                chunks.append(f"**{title}**: {content}")
            else:
                chunks.append(content)
        result = "\n\n".join(chunks)
        set_cached(query, result)
        return result
    except Exception:
        logger.warning("Exa search failed for query: %s", query, exc_info=True)
        return ""
