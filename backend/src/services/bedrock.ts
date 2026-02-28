import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
});

export async function generatePersonalizedContent(
    userId: string,
    prompt: string
) {
    const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: `User ID: ${userId}\n\n${prompt}`,
            },
        ],
    };

    const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        contentType: 'application/json',
        body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.body));
    return result.content[0].text;
}