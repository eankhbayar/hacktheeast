#!/bin/bash
# Create ECR repository for backend Docker image

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

echo "Creating ECR repository: $ECR_REPO_NAME"

aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" --region "$AWS_REGION" 2>/dev/null && {
  echo "ECR repository $ECR_REPO_NAME already exists"
} || {
  aws ecr create-repository \
    --repository-name "$ECR_REPO_NAME" \
    --region "$AWS_REGION" \
    --image-scanning-configuration scanOnPush=true
  echo "ECR repository created successfully"
}

echo ""
echo "ECR URI: $ECR_URI"
echo "Use this for docker push: $ECR_URI:latest"
