#!/bin/bash
# Create DynamoDB Users table with email-index GSI

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

echo "Creating DynamoDB table: $DYNAMODB_TABLE"

aws dynamodb create-table \
  --table-name "$DYNAMODB_TABLE" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes '[
    {
      "IndexName": "email-index",
      "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST \
  --region "$AWS_REGION" 2>/dev/null && echo "Table created successfully" || {
  if aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" &>/dev/null; then
    echo "Table $DYNAMODB_TABLE already exists"
  else
    echo "Failed to create table"
    exit 1
  fi
}
