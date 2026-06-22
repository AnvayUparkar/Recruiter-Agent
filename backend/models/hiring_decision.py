"""Hiring Decision Model — Phase 15: AI Recruiter Copilot.

Defines schemas for packaging final recruitment evaluations.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from models.hire_recommendation import HireRecommendation


class HiringDecision(BaseModel):
    """The master hiring proposal detailing decisions, risks, and next steps."""

    decision: str = Field(
        ...,
        description="Actionable next step category (e.g. 'Submit to Hiring Manager', 'Hold / Backup', 'Reject').",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="System confidence in this hiring proposal.",
    )
    rationale: str = Field(
        ...,
        description="Detailed text paragraph justifying this hiring proposal.",
    )
    supporting_evidence: List[str] = Field(
        default_factory=list,
        description="Core evidence metrics backing this hiring decision.",
    )
    risk_summary: str = Field(
        ...,
        description="Short text describing identified risks and potential mitigation strategies.",
    )
    recommendation: HireRecommendation = Field(
        ...,
        description="The underlying detailed hire recommendation profile.",
    )

    model_config = {
        "populate_by_name": True,
    }
