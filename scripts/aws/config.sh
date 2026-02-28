#!/bin/bash
# Shared configuration for AWS setup scripts
# Source this file in other scripts: source "$(dirname "$0")/config.sh"

set -e

# AWS
export AWS_REGION="${AWS_REGION:-us-east-1}"

# Project
export PROJECT_NAME="${PROJECT_NAME:-hacktheeast}"
export DYNAMODB_TABLE="${DYNAMODB_TABLE:-${PROJECT_NAME}-users}"
export ECR_REPO_NAME="${ECR_REPO_NAME:-${PROJECT_NAME}-backend}"

# EC2
export EC2_INSTANCE_TYPE="${EC2_INSTANCE_TYPE:-t3.micro}"
export KEY_PAIR_NAME="${KEY_PAIR_NAME:-${PROJECT_NAME}-key}"
export SECURITY_GROUP_NAME="${SECURITY_GROUP_NAME:-${PROJECT_NAME}-sg}"

# Amazon Linux 2023 AMI (us-east-1)
# Get latest: aws ec2 describe-images --owners amazon --filters "name=name,values=al2023-ami-*-x86_64" --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' --output text
export EC2_AMI="${EC2_AMI:-ami-0c02fb55b1c4e4c6b}"

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
KEY_FILE="${PROJECT_ROOT}/${KEY_PAIR_NAME}.pem"
