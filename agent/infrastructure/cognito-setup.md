# Cognito Authentication Setup

## Overview

Amazon Cognito provides authentication for the mobile app. Parents/children sign in
via Cognito, receive a JWT, and pass it as a bearer token when invoking the agent.

## Setup Steps

### 1. Create a Cognito User Pool

```bash
aws cognito-idp create-user-pool \
  --pool-name learning-system-users \
  --auto-verified-attributes email \
  --schema '[
    {"Name":"email","Required":true,"Mutable":true},
    {"Name":"custom:role","AttributeDataType":"String","Mutable":true}
  ]'
```

Note the `UserPoolId` from the response.

### 2. Create an App Client

```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id <USER_POOL_ID> \
  --client-name learning-mobile-app \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --supported-identity-providers COGNITO
```

Note the `ClientId` from the response.

### 3. Configure AgentCore Inbound Auth

When creating the AgentCore Runtime, configure OAuth inbound auth:

- **Discovery URL**: `https://cognito-idp.<REGION>.amazonaws.com/<USER_POOL_ID>/.well-known/openid-configuration`
- **Allowed Audiences**: `[<CLIENT_ID>]`
- **Allowed Clients**: `[<CLIENT_ID>]`

### 4. Mobile Integration

The mobile app should:

1. Authenticate the user via Cognito SDK (Amplify for iOS/Android)
2. Obtain a JWT id_token
3. Pass it as `Authorization: Bearer <token>` when calling `InvokeAgentRuntime`

### 5. User-to-Child Mapping

Store parent-child relationships in the Cognito user attributes or a DynamoDB table.
The entrypoint can verify that the authenticated user is authorized to access
a specific `childId` by checking this mapping.
