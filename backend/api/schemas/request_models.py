"""Request Schemas — Phase 14: Production API & Recruiter Suite.

Defines Pydantic request payloads for input validation.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class JDRequest(BaseModel):
    """Payload for job description analysis and processing."""

    job_description: str = Field(
        ...,
        min_length=20,
        description="Raw text of the job description to analyze.",
    )


class RetrievalRequest(BaseModel):
    """Payload for fetching candidate pools matching a job description."""

    job_description: str = Field(
        ...,
        min_length=20,
        description="Job description query text for retrieval.",
    )
    limit: Optional[int] = Field(
        100,
        ge=1,
        le=500,
        description="Maximum number of candidates to retrieve.",
    )


class RankingRequest(BaseModel):
    """Payload for scoring and ranking candidate pools."""

    job_description: str = Field(
        ...,
        min_length=20,
        description="Job description specifications to rank candidates against.",
    )
    strategy: Optional[str] = Field(
        "balanced",
        pattern="^(balanced|technical_first|engagement_first)$",
        description="Weight distribution prioritisation strategy.",
    )
    limit: Optional[int] = Field(
        100,
        ge=1,
        le=1000,
        description="Number of ranked candidates to return.",
    )


class ExplanationRequest(BaseModel):
    """Payload for retrieving detailed explainability reports for a candidate."""

    candidate_id: str = Field(
        ...,
        pattern=r"^CAND_[0-9]{7}$",
        description="Unique candidate identifier CAND_XXXXXXX.",
    )
    job_description: Optional[str] = Field(
        None,
        description="Optional active job description context.",
    )


class EvaluationRequest(BaseModel):
    """Payload for initiating a system-wide evaluation run."""

    job_description: str = Field(
        ...,
        min_length=20,
        description="Reference JD to evaluate the retrieved pool against.",
    )
    ground_truth: Optional[dict[str, int]] = Field(
        None,
        description="Optional mapping of candidate_id to annotated relevance (0 to 3).",
    )
