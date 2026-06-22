"""Hire Recommendation Model — Phase 15: AI Recruiter Copilot.

Defines recommendation tiers and structured hiring recommendation schemas.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class RecommendationTier(str, Enum):
    """Actionable recruiter-facing hiring recommendation categories."""

    STRONG_HIRE = "Strong Hire"
    HIRE = "Hire"
    INTERVIEW = "Interview"
    CONSIDER = "Consider"
    REJECT = "Reject"


class HireRecommendation(BaseModel):
    """Factual, evidence-based hiring recommendation report for a candidate."""

    recommendation: RecommendationTier = Field(
        ...,
        description="Categorical recruitment verdict.",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="System confidence in this recommendation.",
    )
    reasoning: str = Field(
        ...,
        description="Factual summary rationale explaining the recommendation tier assignment.",
    )
    strengths: List[str] = Field(
        default_factory=list,
        description="List of primary strengths supporting this recommendation.",
    )
    risks: List[str] = Field(
        default_factory=list,
        description="Key risks identified that warrant validation.",
    )
    missing_requirements: List[str] = Field(
        default_factory=list,
        description="Required skills or qualifications missing from candidate profile.",
    )
    evidence: List[str] = Field(
        default_factory=list,
        description="Audited numeric and factual evidence metrics supporting this classification.",
    )

    model_config = {
        "populate_by_name": True,
        "use_enum_values": True,
    }
