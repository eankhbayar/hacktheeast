#!/bin/bash
# Create IAM role and instance profile for EC2 with DynamoDB, ECR, Bedrock permissions

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

ROLE_NAME="${PROJECT_NAME}-ec2-role"
INSTANCE_PROFILE_NAME="${PROJECT_NAME}-ec2-profile"
POLICY_NAME="${PROJECT_NAME}-ec2-policy"

echo "Creating IAM role: $ROLE_NAME"

# Trust policy for EC2
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }
  ]
}'

# Create role
aws iam get-role --role-name "$ROLE_NAME" 2>/dev/null && {
  echo "IAM role $ROLE_NAME already exists"
} || {
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY"
  echo "IAM role created"
}

# Create policy for DynamoDB, ECR, Bedrock
POLICY_DOCUMENT=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:ConditionCheckItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:${AWS_REGION}:*:table/${DYNAMODB_TABLE}",
        "arn:aws:dynamodb:${AWS_REGION}:*:table/${DYNAMODB_TABLE}/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "arn:aws:ecr:${AWS_REGION}:*:repository/${ECR_REPO_NAME}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*"
    }
  ]
}
EOF
)

# Create or update policy
POLICY_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/${POLICY_NAME}"
aws iam get-policy --policy-arn "$POLICY_ARN" 2>/dev/null && {
  echo "Policy $POLICY_NAME exists, creating new version"
  aws iam create-policy-version \
    --policy-arn "$POLICY_ARN" \
    --policy-document "$POLICY_DOCUMENT" \
    --set-as-default
} || {
  aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document "$POLICY_DOCUMENT"
  echo "IAM policy created"
}

# Attach policy to role
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "$POLICY_ARN" 2>/dev/null || echo "Policy already attached"

# Create instance profile
aws iam get-instance-profile --instance-profile-name "$INSTANCE_PROFILE_NAME" 2>/dev/null && {
  echo "Instance profile $INSTANCE_PROFILE_NAME already exists"
} || {
  aws iam create-instance-profile --instance-profile-name "$INSTANCE_PROFILE_NAME"
  aws iam add-role-to-instance-profile \
    --instance-profile-name "$INSTANCE_PROFILE_NAME" \
    --role-name "$ROLE_NAME"
  echo "Instance profile created"
}

echo ""
echo "IAM setup complete. Instance profile: $INSTANCE_PROFILE_NAME"
