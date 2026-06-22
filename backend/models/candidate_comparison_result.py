"""Candidate Comparison Result Model — Phase 15: AI Recruiter Copilot.

Defines schemas for side-by-side finalist comparisons.
"""

from typing import Dict, List
from pydantic import BaseModel, Field


class CandidateComparisonResult(BaseModel):
    """Factual, pairwise comparison results between two candidates."""

    candidate_a: str = Field(..., description="First candidate ID CAND_XXXXXXX.")
    candidate_b: str = Field(..., description="Second candidate ID CAND_XXXXXXX.")
    winner: str = Field(..., description="The ID of the candidate who ranks higher.")
    winner_reason: str = Field(..., description="Structured natural language reasoning explaining the decision.")
    strength_comparison: Dict[str, str] = Field(
        default_factory=dict,
        description="Comparative highlights showing how each candidate matches in key areas.",
    )
    weakness_comparison: Dict[str, str] = Field(
        default_factory=dict,
        description="Core gaps identified for each candidate.",
    )
    feature_differences: Dict[str, float] = Field(
        default_factory=dict,
        description="Raw feature vector delta table mapping category score differences (A - B).",
    )
    risk_differences: Dict[str, str] = Field(
        default_factory=dict,
        description="Contrast of behavioral or profile fraud indicators.",
    )
    decision_confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="System confidence score of this comparative outcome.",
    )

    model_config = {
        "populate_by_name": True,
    }
