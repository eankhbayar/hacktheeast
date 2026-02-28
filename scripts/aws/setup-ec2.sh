#!/bin/bash
# Create EC2 instance with Docker, security group, key pair, and Elastic IP

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

INSTANCE_PROFILE_NAME="${PROJECT_NAME}-ec2-profile"

# Get latest Amazon Linux 2023 AMI
get_ami() {
  aws ec2 describe-images \
    --owners amazon \
    --filters "name=name,values=al2023-ami-*-x86_64" "name=state,values=available" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text \
    --region "$AWS_REGION"
}

echo "Setting up EC2 infrastructure..."

# Create key pair
if ! aws ec2 describe-key-pairs --key-names "$KEY_PAIR_NAME" --region "$AWS_REGION" 2>/dev/null; then
  aws ec2 create-key-pair \
    --key-name "$KEY_PAIR_NAME" \
    --query 'KeyMaterial' \
    --output text \
    --region "$AWS_REGION" > "$KEY_FILE"
  chmod 400 "$KEY_FILE"
  echo "Key pair created: $KEY_FILE"
else
  echo "Key pair $KEY_PAIR_NAME already exists"
fi

# Create security group
if ! aws ec2 describe-security-groups --group-names "$SECURITY_GROUP_NAME" --region "$AWS_REGION" 2>/dev/null; then
  SG_ID=$(aws ec2 create-security-group \
    --group-name "$SECURITY_GROUP_NAME" \
    --description "Security group for ${PROJECT_NAME} backend" \
    --region "$AWS_REGION" \
    --query 'GroupId' \
    --output text)

  # Allow SSH, API port, HTTPS
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0 --region "$AWS_REGION"
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region "$AWS_REGION"
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0 --region "$AWS_REGION"
  echo "Security group created: $SG_ID"
else
  SG_ID=$(aws ec2 describe-security-groups --group-names "$SECURITY_GROUP_NAME" --region "$AWS_REGION" --query 'SecurityGroups[0].GroupId' --output text)
  echo "Security group $SECURITY_GROUP_NAME already exists: $SG_ID"
fi

# User data to install Docker
USER_DATA='#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user
'

# Launch EC2 instance
AMI_ID="${EC2_AMI:-$(get_ami)}"
echo "Using AMI: $AMI_ID"

INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "tag:Name=${PROJECT_NAME}-backend" "tag:Project=${PROJECT_NAME}" "instance-state-name=running" \
  --query 'Reservations[*].Instances[*].InstanceId' \
  --output text \
  --region "$AWS_REGION" 2>/dev/null | head -1)

if [ -z "$INSTANCE_ID" ]; then
  INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --instance-type "$EC2_INSTANCE_TYPE" \
    --key-name "$KEY_PAIR_NAME" \
    --security-group-ids "$SG_ID" \
    --iam-instance-profile "Name=$INSTANCE_PROFILE_NAME" \
    --user-data "$USER_DATA" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${PROJECT_NAME}-backend},{Key=Project,Value=${PROJECT_NAME}}]" \
    --region "$AWS_REGION" \
    --query 'Instances[0].InstanceId' \
    --output text)
  echo "EC2 instance launched: $INSTANCE_ID"
  echo "Waiting for instance to be running..."
  aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$AWS_REGION"
else
  echo "EC2 instance already running: $INSTANCE_ID"
fi

# Allocate and associate Elastic IP if not already associated
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text \
  --region "$AWS_REGION")

# Check if instance has an Elastic IP
ALLOC_ID=$(aws ec2 describe-addresses \
  --filters "tag:Project=${PROJECT_NAME}" \
  --query 'Addresses[?AssociationId!=`null`].AllocationId' \
  --output text \
  --region "$AWS_REGION" 2>/dev/null)

if [ -z "$ALLOC_ID" ]; then
  ALLOC_ID=$(aws ec2 allocate-address \
    --domain vpc \
    --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Project,Value=${PROJECT_NAME}}]" \
    --region "$AWS_REGION" \
    --query 'AllocationId' \
    --output text)
  aws ec2 associate-address --instance-id "$INSTANCE_ID" --allocation-id "$ALLOC_ID" --region "$AWS_REGION"
  PUBLIC_IP=$(aws ec2 describe-addresses --allocation-ids "$ALLOC_ID" --query 'Addresses[0].PublicIp' --output text --region "$AWS_REGION")
  echo "Elastic IP associated: $PUBLIC_IP"
fi

echo ""
echo "=========================================="
echo "EC2 setup complete!"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP:   $PUBLIC_IP"
echo ""
echo "Add to .env or GitHub Secrets:"
echo "  EC2_HOST=$PUBLIC_IP"
echo ""
echo "SSH (after instance is ready, ~2 min for Docker install):"
echo "  ssh -i $KEY_FILE ec2-user@$PUBLIC_IP"
echo "=========================================="
