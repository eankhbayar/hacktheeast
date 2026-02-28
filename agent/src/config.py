from __future__ import annotations

import os
import json
import logging
from functools import lru_cache

import boto3
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


def _fetch_secret(secret_name: str, region: str) -> dict:
    """Fetch a secret from AWS Secrets Manager. Returns empty dict on failure."""
    try:
        client = boto3.client("secretsmanager", region_name=region)
        response = client.get_secret_value(SecretId=secret_name)
        return json.loads(response["SecretString"])
    except Exception:
        logger.debug("Secrets Manager unavailable; falling back to env vars")
        return {}


class Settings(BaseSettings):
    minimax_api_key: str = ""
    exa_api_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = "learning-system-data"
    anthropic_base_url: str = "https://api.minimax.io/anthropic"
    minimax_model: str = "MiniMax-M2.5-highspeed"
    minimax_max_tokens: int = 4096
    minimax_timeout_seconds: float = 60.0
    secrets_manager_name: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    settings = Settings()

    if settings.secrets_manager_name:
        secrets = _fetch_secret(settings.secrets_manager_name, settings.aws_region)
        if secrets.get("MINIMAX_API_KEY"):
            settings.minimax_api_key = secrets["MINIMAX_API_KEY"]
        if secrets.get("EXA_API_KEY"):
            settings.exa_api_key = secrets["EXA_API_KEY"]

    return settings
