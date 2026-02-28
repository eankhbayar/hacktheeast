"""Observability helpers for the learning agent.

AgentCore emits OpenTelemetry traces natively. This module provides
convenience wrappers for custom spans around key operations.
"""
from __future__ import annotations

import logging
import time
from contextlib import contextmanager
from typing import Any, Generator

logger = logging.getLogger(__name__)

try:
    from opentelemetry import trace

    tracer = trace.get_tracer("learning-agent")
except ImportError:
    tracer = None


@contextmanager
def traced_operation(name: str, attributes: dict[str, Any] | None = None) -> Generator:
    """Context manager that creates an OTEL span if available, or logs timing."""
    start = time.monotonic()
    attrs = attributes or {}

    if tracer is not None:
        with tracer.start_as_current_span(name, attributes=attrs) as span:
            try:
                yield span
            except Exception as exc:
                span.set_attribute("error", True)
                span.set_attribute("error.message", str(exc))
                raise
            finally:
                elapsed = time.monotonic() - start
                span.set_attribute("duration_ms", round(elapsed * 1000, 1))
    else:
        try:
            yield None
        finally:
            elapsed = time.monotonic() - start
            logger.info(
                "%s completed in %.1fms | %s",
                name,
                elapsed * 1000,
                attrs,
            )
