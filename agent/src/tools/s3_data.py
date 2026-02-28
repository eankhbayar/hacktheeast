from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Optional

import boto3

from src.config import get_settings
from src.models.progress import (
    DateRange,
    HistoricalSummary,
    ProgressRecord,
    StrengthTopic,
    StruggleTopic,
    TopicScore,
)

logger = logging.getLogger(__name__)

_s3_client = None


def _get_s3():
    global _s3_client
    if _s3_client is None:
        settings = get_settings()
        _s3_client = boto3.client("s3", region_name=settings.aws_region)
    return _s3_client


def get_progress_records(
    child_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> list[ProgressRecord]:
    """Fetch ProgressRecords from S3 for a given child, optionally filtered by date range."""
    settings = get_settings()
    s3 = _get_s3()
    prefix = f"progress/{child_id}/"

    try:
        response = s3.list_objects_v2(Bucket=settings.s3_bucket_name, Prefix=prefix)
    except Exception:
        logger.exception("Failed to list S3 objects for child %s", child_id)
        return []

    if "Contents" not in response:
        return []

    records: list[ProgressRecord] = []
    for obj in response["Contents"]:
        key = obj["Key"]
        date_part = key.rsplit("/", 1)[-1].replace(".json", "")

        if start_date and date_part < start_date:
            continue
        if end_date and date_part > end_date:
            continue

        try:
            body = s3.get_object(Bucket=settings.s3_bucket_name, Key=key)
            data = json.loads(body["Body"].read().decode("utf-8"))
            records.append(ProgressRecord.model_validate(data))
        except Exception:
            logger.warning("Skipping malformed record at %s", key)

    records.sort(key=lambda r: r.date)
    return records


def put_progress_record(record: ProgressRecord) -> None:
    """Write a ProgressRecord to S3."""
    settings = get_settings()
    s3 = _get_s3()
    key = f"progress/{record.child_id}/{record.date}.json"
    body = record.model_dump(by_alias=True)

    s3.put_object(
        Bucket=settings.s3_bucket_name,
        Key=key,
        Body=json.dumps(body),
        ContentType="application/json",
    )


def save_report(child_id: str, report_id: str, report_data: dict) -> None:
    """Archive a generated report to S3."""
    settings = get_settings()
    s3 = _get_s3()
    key = f"reports/{child_id}/{report_id}.json"

    s3.put_object(
        Bucket=settings.s3_bucket_name,
        Key=key,
        Body=json.dumps(report_data),
        ContentType="application/json",
    )


def build_historical_summary(
    child_id: str, records: list[ProgressRecord]
) -> HistoricalSummary:
    """Aggregate a list of ProgressRecords into a HistoricalSummary."""
    if not records:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        return HistoricalSummary(
            child_id=child_id,
            date_range=DateRange(start=today, end=today),
            total_sessions=0,
            accuracy_trend=[],
            struggling_topics=[],
            strengths_topics=[],
            average_time_per_session=0.0,
            lockout_frequency=0,
            topic_breakdown={},
        )

    date_range = DateRange(start=records[0].date, end=records[-1].date)

    total_sessions = sum(r.sessions_completed for r in records)
    total_time = sum(r.time_spent_seconds for r in records)
    lockout_frequency = sum(r.sessions_locked_out for r in records)
    avg_time = (total_time / total_sessions / 60.0) if total_sessions > 0 else 0.0

    accuracy_trend: list[float] = []
    for r in records:
        total = r.correct_answers + r.incorrect_answers
        accuracy_trend.append(r.correct_answers / total if total > 0 else 0.0)

    merged_topics: dict[str, TopicScore] = {}
    for r in records:
        for topic, score in r.topic_breakdown.items():
            if topic not in merged_topics:
                merged_topics[topic] = TopicScore(correct=0, incorrect=0)
            merged_topics[topic].correct += score.correct
            merged_topics[topic].incorrect += score.incorrect

    struggling: list[StruggleTopic] = []
    strengths: list[StrengthTopic] = []

    for topic, score in merged_topics.items():
        total = score.correct + score.incorrect
        if total == 0:
            continue
        incorrect_rate = score.incorrect / total
        correct_rate = score.correct / total

        if incorrect_rate > 0.5:
            struggling.append(StruggleTopic(topic=topic, incorrect_rate=incorrect_rate))
        if correct_rate >= 0.7:
            strengths.append(StrengthTopic(topic=topic, correct_rate=correct_rate))

    struggling.sort(key=lambda s: s.incorrect_rate, reverse=True)
    strengths.sort(key=lambda s: s.correct_rate, reverse=True)

    return HistoricalSummary(
        child_id=child_id,
        date_range=date_range,
        total_sessions=total_sessions,
        accuracy_trend=accuracy_trend,
        struggling_topics=struggling,
        strengths_topics=strengths,
        average_time_per_session=round(avg_time, 1),
        lockout_frequency=lockout_frequency,
        topic_breakdown=merged_topics,
    )
