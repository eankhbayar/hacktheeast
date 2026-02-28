"""
Lambda function invoked by EventBridge Scheduler to generate weekly reports.

Iterates over all child profiles in S3 and invokes the AgentCore Runtime
for each child with requestType="report".
"""
from __future__ import annotations

import json
import logging
import os

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

S3_BUCKET = os.environ["S3_BUCKET_NAME"]
AGENT_RUNTIME_ARN = os.environ["AGENT_RUNTIME_ARN"]
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")


def handler(event, context):
    s3 = boto3.client("s3", region_name=AWS_REGION)
    agentcore = boto3.client("bedrock-agentcore", region_name=AWS_REGION)

    response = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix="profiles/")
    if "Contents" not in response:
        logger.info("No child profiles found")
        return {"statusCode": 200, "body": "No profiles"}

    results = []

    for obj in response["Contents"]:
        key = obj["Key"]
        if not key.endswith(".json"):
            continue

        try:
            profile_data = s3.get_object(Bucket=S3_BUCKET, Key=key)
            profile = json.loads(profile_data["Body"].read().decode("utf-8"))

            payload = json.dumps({
                "childId": profile["childId"],
                "ageGroup": profile["ageGroup"],
                "interests": profile.get("interests", ""),
                "requestType": "report",
            }).encode()

            report_response = agentcore.invoke_agent_runtime(
                agentRuntimeArn=AGENT_RUNTIME_ARN,
                payload=payload,
            )

            results.append({
                "childId": profile["childId"],
                "status": "success",
            })
            logger.info("Report generated for child %s", profile["childId"])

        except Exception:
            logger.exception("Failed to generate report for %s", key)
            results.append({
                "childId": key,
                "status": "error",
            })

    return {
        "statusCode": 200,
        "body": json.dumps({"reports_triggered": len(results), "results": results}),
    }
