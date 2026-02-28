#!/bin/bash
# Teardown all AWS resources in reverse order

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

ROLE_NAME="${PROJECT_NAME}-ec2-role"
INSTANCE_PROFILE_NAME="${PROJECT_NAME}-ec2-profile"
POLICY_NAME="${PROJECT_NAME}-ec2-policy"
POLICY_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/${POLICY_NAME}"

echo "=========================================="
echo "WARNING: This will DELETE all resources for $PROJECT_NAME"
echo "  - EC2 instance"
echo "  - Elastic IP"
echo "  - Security group"
echo "  - Key pair"
echo "  - ECR repository (and all images)"
echo "  - IAM role and policy"
echo "  - DynamoDB table: $DYNAMODB_TABLE"
echo "=========================================="
read -p "Are you sure? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

# 1. Terminate EC2 instance
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "tag:Project=${PROJECT_NAME}" "instance-state-name=running,pending" \
  --query 'Reservations[*].Instances[*].InstanceId' \
  --output text \
  --region "$AWS_REGION" 2>/dev/null)
if [ -n "$INSTANCE_ID" ]; then
  echo "Terminating EC2 instance: $INSTANCE_ID"
  aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region "$AWS_REGION"
  aws ec2 wait instance-terminated --instance-ids $INSTANCE_ID --region "$AWS_REGION"
fi

# 2. Release Elastic IP
ALLOC_IDS=$(aws ec2 describe-addresses \
  --filters "tag:Project=${PROJECT_NAME}" \
  --query 'Addresses[*].AllocationId' \
  --output text \
  --region "$AWS_REGION" 2>/dev/null)
for AID in $ALLOC_IDS; do
  echo "Releasing Elastic IP: $AID"
  aws ec2 release-address --allocation-id "$AID" --region "$AWS_REGION" 2>/dev/null || true
done

# 3. Delete security group (after instance is gone)
sleep 5
SG_ID=$(aws ec2 describe-security-groups --group-names "$SECURITY_GROUP_NAME" --region "$AWS_REGION" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null) || true
if [ -n "$SG_ID" ] && [ "$SG_ID" != "None" ]; then
  echo "Deleting security group: $SECURITY_GROUP_NAME"
  aws ec2 delete-security-group --group-id "$SG_ID" --region "$AWS_REGION" 2>/dev/null || echo "  (may need to wait for instance to fully terminate)"
fi

# 4. Delete key pair
echo "Deleting key pair: $KEY_PAIR_NAME"
aws ec2 delete-key-pair --key-name "$KEY_PAIR_NAME" --region "$AWS_REGION" 2>/dev/null || true
rm -f "$KEY_FILE"

# 5. Delete ECR repository and images
echo "Deleting ECR repository: $ECR_REPO_NAME"
aws ecr delete-repository --repository-name "$ECR_REPO_NAME" --force --region "$AWS_REGION" 2>/dev/null || true

# 6. Remove IAM role from instance profile and delete
echo "Removing IAM instance profile: $INSTANCE_PROFILE_NAME"
aws iam remove-role-from-instance-profile --instance-profile-name "$INSTANCE_PROFILE_NAME" --role-name "$ROLE_NAME" 2>/dev/null || true
sleep 2
aws iam delete-instance-profile --instance-profile-name "$INSTANCE_PROFILE_NAME" 2>/dev/null || true

# 7. Detach policy and delete role
echo "Deleting IAM role: $ROLE_NAME"
aws iam detach-role-policy --role-name "$ROLE_NAME" --policy-arn "$POLICY_ARN" 2>/dev/null || true
aws iam delete-role --role-name "$ROLE_NAME" 2>/dev/null || true

# 8. Delete policy (need to delete all versions first for custom policies)
echo "Deleting IAM policy: $POLICY_NAME"
aws iam delete-policy --policy-arn "$POLICY_ARN" 2>/dev/null || true

# 9. Delete DynamoDB table
echo "Deleting DynamoDB table: $DYNAMODB_TABLE"
aws dynamodb delete-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" 2>/dev/null || true

echo ""
echo "Teardown complete."
