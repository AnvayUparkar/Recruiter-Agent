"""Recruiter Insight Model — Phase 15: AI Recruiter Copilot.

Defines schemas for surfacing noteworthy, evidence-backed candidate details.
"""

from typing import List
from pydantic import BaseModel, Field


class RecruiterInsight(BaseModel):
    """Noteworthy candidate finding, alert, or highlight surfaced for recruiters."""

    insight_type: str = Field(
        ...,
        description="Type category (e.g., 'Strong Leadership', 'Exceptional Growth', 'High Fraud Risk', 'Low Availability').",
    )
    severity: str = Field(
        "INFO",
        pattern="^(CRITICAL|HIGH|MEDIUM|INFO)$",
        description="Urgency tier classification.",
    )
    title: str = Field(..., description="Short header title of the insight.")
    description: str = Field(..., description="Factual text explanation describing the signal.")
    evidence: List[str] = Field(
        default_factory=list,
        description="Factual signals or indicators justifying this insight.",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="System confidence score of this insight.",
    )

    model_config = {
        "populate_by_name": True,
    }
