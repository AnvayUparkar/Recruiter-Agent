"""Ranking Response model — Phase 13: Final Recruiter Ranking Engine.

Models the API response containing the final candidate rankings and metadata.
"""

from typing import List, Dict, Any
from pydantic import BaseModel, Field
from models.ranked_candidate import RankedCandidate


class RankingResponse(BaseModel):
    """The master ranking response wrapper containing the ordered shortlist."""

    job_title: str = Field(..., description="Job Title from the parsed JD.")
    total_candidates_evaluated: int = Field(
        ..., ge=0, description="Total count of input candidates evaluated."
    )
    ranked_candidates: List[RankedCandidate] = Field(
        ..., description="Ordered list of ranked candidates (best candidates first)."
    )
    applied_weights: Dict[str, float] = Field(
        ..., description="The weight configuration applied to this run."
    )
    processing_time_ms: float = Field(
        ..., description="Server-side ranking execution duration in milliseconds."
    )
    ranking_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Extra execution and model details (e.g., calibrator threshold, metrics).",
    )

    model_config = {
        "populate_by_name": True,
    }
