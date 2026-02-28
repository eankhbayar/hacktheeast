# Multi-Agent AI Learning System for Children

A LangGraph-orchestrated multi-agent system that delivers personalized learning
experiences for children (ages 6-15) and provides progress reports to parents.

## Architecture

- **Planner Agent** -- Creates on-demand lesson plans and video scripts tailored
  to a child's interests and weakest topics.
- **Reporter Agent** -- Generates scheduled or on-demand progress reports with
  data-driven insights and actionable recommendations for parents.
- **LangGraph Orchestrator** -- Routes requests, selects topics via the weakness
  algorithm, and enriches prompts with Exa Search context.
- **MiniMax M2.5 Highspeed** -- LLM powering both agents via the Anthropic SDK.
- **Exa Search API** -- Provides teaching best-practices and parenting guidance.
- **Amazon S3** -- Stores progress records, child profiles, and archived reports.
- **Bedrock AgentCore** -- Serverless deployment runtime with session isolation.

## Project Structure

```
src/
├── entrypoint.py           # AgentCore @app.entrypoint
├── config.py               # Settings and secrets
├── observability.py        # OpenTelemetry tracing helpers
├── agent/
│   ├── graph.py            # LangGraph StateGraph definition
│   ├── state.py            # AgentState TypedDict
│   ├── orchestrator.py     # Topic selection algorithm
│   ├── planner.py          # Planner node
│   └── reporter.py         # Reporter node
├── tools/
│   ├── exa_search.py       # Exa Search with S3 caching
│   ├── exa_cache.py        # S3-based cache for Exa results
│   └── s3_data.py          # S3 data layer for ProgressRecords
├── models/
│   ├── input.py            # ChildInput
│   ├── progress.py         # ProgressRecord, HistoricalSummary
│   └── output.py           # LessonPlan, VideoScript, ParentReport
└── llm/
    └── minimax.py          # MiniMax client wrapper
```

## Setup

### Prerequisites

- Python 3.12+
- AWS account with Bedrock AgentCore access
- MiniMax API key (from platform.minimax.io)
- Exa API key (from exa.ai)

### Local Development

```bash
# Clone and enter project
cd agents_hte

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run tests
pytest
```

### Deployment

See `infrastructure/deploy.sh` for the full deployment workflow:

1. Build Docker image
2. Push to Amazon ECR
3. Create AgentCore Runtime pointing to the ECR image
4. Create S3 bucket for data
5. Configure IAM role (see `infrastructure/iam-policy.json`)
6. Set up Cognito for mobile auth (see `infrastructure/cognito-setup.md`)
7. Configure EventBridge for scheduled reports (see `infrastructure/eventbridge-schedule.json`)

## API Usage

The mobile app invokes the agent via `InvokeAgentRuntime`. See `docs/api-contract.md`
for the full request/response contract with examples.

### Quick Example

```python
import boto3, json

client = boto3.client("bedrock-agentcore")

response = client.invoke_agent_runtime(
    agentRuntimeArn="arn:aws:bedrock-agentcore:...",
    runtimeSessionId="session-uuid",
    payload=json.dumps({
        "childId": "child_456",
        "ageGroup": "9-12",
        "interests": "loves dinosaurs, space, and pizza",
        "learningObjectives": ["multiplication", "fractions"],
        "requestType": "lesson"
    }).encode()
)
```

## Testing

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_topic_selection.py
```

## Evaluation

The evaluation framework in `tests/evaluation.py` scores agent outputs on:
- **Accuracy** (weight 4x)
- **Safety** (weight 4x)
- **Tone** (weight 2x)
- **Usefulness** (weight 1.33x)

Score >= 3.0 passes for release. See PRD Section 8 for details.
