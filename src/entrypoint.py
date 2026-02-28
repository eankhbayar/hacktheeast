from __future__ import annotations

import logging
import os
import sys

from bedrock_agentcore.runtime import BedrockAgentCoreApp

from src.agent.graph import compiled_graph
from src.models.input import ChildInput

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

app = BedrockAgentCoreApp()


@app.entrypoint
def invoke(payload: dict, context=None) -> dict:
    """Main entrypoint invoked by AgentCore Runtime.

    Payload must conform to ChildInput schema.
    Returns the agent output or a structured error.
    """
    logger.info("Received request: requestType=%s", payload.get("requestType"))

    try:
        child_input = ChildInput.model_validate(payload)
    except Exception as exc:
        logger.error("Invalid payload: %s", exc)
        return {
            "status": "error",
            "message": f"Invalid request payload: {exc}",
        }

    try:
        result = compiled_graph.invoke({"input": child_input})
    except Exception as exc:
        logger.exception("Graph execution failed")
        return {
            "status": "error",
            "message": "An unexpected error occurred. Please try again.",
        }

    if result.get("error"):
        return {
            "status": "partial_success",
            "data": result.get("output", {}),
            "warning": result["error"],
        }

    return {
        "status": "success",
        "data": result.get("output", {}),
    }


if __name__ == "__main__":
    app.run()
