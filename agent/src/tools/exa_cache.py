"""Simple S3-based cache for Exa search results with TTL.

Avoids repeated Exa API calls for the same topic + age_group combination.
Default TTL: 24 hours.
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import Optional

import boto3

from src.config import get_settings

logger = logging.getLogger(__name__)

DEFAULT_TTL_HOURS = 24


def _cache_key(query: str) -> str:
    digest = hashlib.sha256(query.encode()).hexdigest()[:16]
    return f"cache/exa/{digest}.json"


def get_cached(query: str) -> Optional[str]:
    """Return cached Exa result if fresh, else None."""
    settings = get_settings()
    key = _cache_key(query)

    try:
        s3 = boto3.client("s3", region_name=settings.aws_region)
        obj = s3.get_object(Bucket=settings.s3_bucket_name, Key=key)
        data = json.loads(obj["Body"].read().decode("utf-8"))

        cached_at = datetime.fromisoformat(data["cached_at"])
        if datetime.utcnow() - cached_at < timedelta(hours=DEFAULT_TTL_HOURS):
            logger.debug("Exa cache hit for query: %s", query[:60])
            return data["result"]
        else:
            logger.debug("Exa cache expired for query: %s", query[:60])
            return None
    except Exception:
        return None


def set_cached(query: str, result: str) -> None:
    """Store an Exa result in the S3 cache."""
    settings = get_settings()
    key = _cache_key(query)

    try:
        s3 = boto3.client("s3", region_name=settings.aws_region)
        data = {
            "query": query,
            "result": result,
            "cached_at": datetime.utcnow().isoformat(),
        }
        s3.put_object(
            Bucket=settings.s3_bucket_name,
            Key=key,
            Body=json.dumps(data),
            ContentType="application/json",
        )
    except Exception:
        logger.warning("Failed to cache Exa result", exc_info=True)
