#!/bin/bash
# Build Docker image, push to ECR, and deploy to EC2

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

# EC2_HOST must be set (from setup-ec2.sh output or .env)
EC2_HOST="${EC2_HOST:?EC2_HOST is required}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"
IMAGE_TAG="${1:-latest}"

echo "Building Docker image..."
docker build -t "$ECR_REPO_NAME:$IMAGE_TAG" "$PROJECT_ROOT/backend"

echo "Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "Tagging and pushing to ECR..."
docker tag "$ECR_REPO_NAME:$IMAGE_TAG" "$ECR_URI:$IMAGE_TAG"
docker push "$ECR_URI:$IMAGE_TAG"

# Also push as latest
if [ "$IMAGE_TAG" != "latest" ]; then
  docker tag "$ECR_REPO_NAME:$IMAGE_TAG" "$ECR_URI:latest"
  docker push "$ECR_URI:latest"
fi

echo "Deploying to EC2..."
# Deploy via SSH - requires EC2_SSH_KEY or key file
SSH_KEY="${EC2_SSH_KEY:-$KEY_FILE}"
if [ ! -f "$SSH_KEY" ] && [ -z "$EC2_SSH_KEY" ]; then
  echo "Error: SSH key not found at $KEY_FILE. Set EC2_SSH_KEY or ensure key file exists."
  exit 1
fi

# JWT secrets - must be set in environment when running deploy
JWT_SECRET_VAL="${JWT_SECRET:-}"
JWT_REFRESH_VAL="${JWT_REFRESH_SECRET:-}"
if [ -z "$JWT_SECRET_VAL" ] || [ -z "$JWT_REFRESH_VAL" ]; then
  echo "Warning: JWT_SECRET and JWT_REFRESH_SECRET should be set. Container may fail to start."
fi

deploy_remote() {
  ssh -i "$1" -o StrictHostKeyChecking=no ec2-user@"$EC2_HOST" "aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com && docker stop ${PROJECT_NAME}-backend 2>/dev/null || true && docker rm ${PROJECT_NAME}-backend 2>/dev/null || true && docker pull $ECR_URI:$IMAGE_TAG && docker run -d --name ${PROJECT_NAME}-backend --restart unless-stopped -p 3000:3000 -e PORT=3000 -e AWS_REGION=$AWS_REGION -e DYNAMODB_TABLE_NAME=$DYNAMODB_TABLE -e JWT_SECRET='$JWT_SECRET_VAL' -e JWT_REFRESH_SECRET='$JWT_REFRESH_VAL' $ECR_URI:$IMAGE_TAG"
}

if [ -f "$SSH_KEY" ]; then
  deploy_remote "$SSH_KEY"
else
  echo "Using EC2_SSH_KEY from environment..."
  echo "$EC2_SSH_KEY" > /tmp/deploy_key.pem
  chmod 600 /tmp/deploy_key.pem
  deploy_remote /tmp/deploy_key.pem
  rm -f /tmp/deploy_key.pem
fi

echo ""
echo "Deployment complete! API available at http://$EC2_HOST:3000"
