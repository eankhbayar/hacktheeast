#!/bin/bash
# Run all setup scripts in the correct order

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Running full AWS setup for hacktheeast..."
echo ""

"$SCRIPT_DIR/setup-iam.sh"
echo ""

"$SCRIPT_DIR/setup-dynamodb.sh"
echo ""

"$SCRIPT_DIR/setup-ecr.sh"
echo ""

"$SCRIPT_DIR/setup-ec2.sh"
echo ""

echo "All setup complete!"
