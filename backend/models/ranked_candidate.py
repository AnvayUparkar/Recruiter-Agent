"""Ranked Candidate model — Phase 13: Final Recruiter Ranking Engine.

Models the final candidate representation after scoring and ranking are applied.
"""

from typing import Optional
from pydantic import BaseModel, Field
from models.ranking_score import RankingScore
from models.ranking_explanation import RankingExplanation
from models.recruiter_reasoning_trace import RecruiterReasoningTrace


class RankedCandidate(BaseModel):
    """Represents a single candidate in the final ranked output list."""

    candidate_id: str = Field(..., description="Unique identifier for the candidate.")
    rank: int = Field(..., ge=1, description="1-indexed rank position in the final list.")
    final_score: float = Field(..., ge=0.0, le=1.0, description="Final composite score.")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Overall ranking confidence.")
    score_details: RankingScore = Field(
        ..., description="Full breakdown of how the final score was computed."
    )
    explanation: Optional[RankingExplanation] = Field(
        None, description="Explainable recruiter-friendly textual breakdown."
    )
    reasoning_trace: Optional[RecruiterReasoningTrace] = Field(
        None, description="Detailed trace of the recruiter heuristic path."
    )

    model_config = {
        "populate_by_name": True,
    }
