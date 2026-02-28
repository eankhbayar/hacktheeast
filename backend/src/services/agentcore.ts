import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from '@aws-sdk/client-bedrock-agentcore';
import type { AgentRequest, AgentResponse } from '../types';

const AGENT_LOCAL_URL = process.env.AGENT_LOCAL_URL;
const AGENT_RUNTIME_ARN = process.env.AGENT_RUNTIME_ARN;

let client: BedrockAgentCoreClient | null = null;

function getClient(): BedrockAgentCoreClient {
  if (!client) {
    client = new BedrockAgentCoreClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }
  return client;
}

export async function invokeAgent(
  payload: AgentRequest,
  sessionId?: string
): Promise<AgentResponse> {
  if (AGENT_LOCAL_URL) {
    return invokeLocal(payload);
  }
  if (AGENT_RUNTIME_ARN) {
    return invokeRemote(payload, sessionId);
  }
  throw new Error(
    'Agent not configured: set AGENT_LOCAL_URL (dev) or AGENT_RUNTIME_ARN (prod)'
  );
}

async function invokeLocal(payload: AgentRequest): Promise<AgentResponse> {
  const url = `${AGENT_LOCAL_URL}/invocations`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    return {
      status: 'error',
      message: `Agent returned HTTP ${res.status}: ${await res.text()}`,
    };
  }

  return (await res.json()) as AgentResponse;
}

async function invokeRemote(
  payload: AgentRequest,
  sessionId?: string
): Promise<AgentResponse> {
  const command = new InvokeAgentRuntimeCommand({
    agentRuntimeArn: AGENT_RUNTIME_ARN!,
    payload: Buffer.from(JSON.stringify(payload)),
    contentType: 'application/json',
    accept: 'application/json',
    ...(sessionId && { runtimeSessionId: sessionId }),
  });

  const response = await getClient().send(command);

  const body = response.response
    ? await response.response.transformToString()
    : '{}';

  try {
    return JSON.parse(body) as AgentResponse;
  } catch {
    return {
      status: 'error',
      message: 'Failed to parse agent response',
    };
  }
}
