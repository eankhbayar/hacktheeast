from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class ChildInput(BaseModel):
    child_id: str = Field(..., alias="childId")
    age_group: Literal["6-8", "9-12", "13-15"] = Field(..., alias="ageGroup")
    interests: str = ""
    learning_objectives: Optional[list[str]] = Field(
        default=None, alias="learningObjectives"
    )
    request_type: Literal["lesson", "report"] = Field(..., alias="requestType")

    model_config = {"populate_by_name": True}
