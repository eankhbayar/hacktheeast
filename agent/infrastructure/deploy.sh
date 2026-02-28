#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------
# Deployment script for Learning Agent to Bedrock AgentCore
#
# Prerequisites:
#   - AWS CLI v2 configured with appropriate credentials
#   - Docker installed and running
#   - The following env vars set (or edit defaults below):
#       AWS_ACCOUNT_ID, AWS_REGION
# ---------------------------------------------------------------

AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?Set AWS_ACCOUNT_ID}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPO_NAME="learning-agent"
IMAGE_TAG="latest"
S3_BUCKET_NAME="learning-system-data"

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

echo "==> Step 1: Create ECR repository (if not exists)"
aws ecr describe-repositories --repository-names "${ECR_REPO_NAME}" --region "${AWS_REGION}" 2>/dev/null \
  || aws ecr create-repository --repository-name "${ECR_REPO_NAME}" --region "${AWS_REGION}"

echo "==> Step 2: Authenticate Docker with ECR"
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "==> Step 3: Build Docker image"
docker build -t "${ECR_REPO_NAME}:${IMAGE_TAG}" .

echo "==> Step 4: Tag and push image to ECR"
docker tag "${ECR_REPO_NAME}:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"
docker push "${ECR_URI}:${IMAGE_TAG}"

echo "==> Step 5: Create S3 bucket (if not exists)"
aws s3api head-bucket --bucket "${S3_BUCKET_NAME}" --region "${AWS_REGION}" 2>/dev/null \
  || aws s3api create-bucket --bucket "${S3_BUCKET_NAME}" --region "${AWS_REGION}" \
       --create-bucket-configuration LocationConstraint="${AWS_REGION}"

echo "==> Step 6: Create AgentCore Runtime"
echo ""
echo "Use the AWS Console or the AgentCore starter toolkit CLI to:"
echo "  1. Create a new AgentCore Runtime pointing to: ${ECR_URI}:${IMAGE_TAG}"
echo "  2. Attach an IAM role with the following permissions:"
echo "     - s3:GetObject, s3:PutObject, s3:ListBucket on arn:aws:s3:::${S3_BUCKET_NAME}/*"
echo "     - secretsmanager:GetSecretValue"
echo "     - bedrock:InvokeModel (if using Bedrock models in future)"
echo "  3. Set environment variables:"
echo "     - SECRETS_MANAGER_NAME=learning-agent-secrets"
echo "     - S3_BUCKET_NAME=${S3_BUCKET_NAME}"
echo "     - AWS_REGION=${AWS_REGION}"
echo "  4. Note the DEFAULT endpoint ARN for mobile integration."
echo ""
echo "==> Deployment artifacts ready!"
echo "    ECR Image: ${ECR_URI}:${IMAGE_TAG}"
echo "    S3 Bucket: ${S3_BUCKET_NAME}"
