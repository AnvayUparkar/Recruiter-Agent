"""Ranking Explanation model — Phase 13: Final Recruiter Ranking Engine.

Models the natural language explanation and breakdown of the candidate's rank.
"""

from typing import List
from pydantic import BaseModel, Field


class RankingExplanation(BaseModel):
    """Recruiter-friendly explanation of why a candidate was ranked where they are."""

    summary: str = Field(
        ...,
        description="A concise summary paragraph justifying the candidate's ranking.",
    )
    strengths: List[str] = Field(
        default_factory=list,
        description="Bullet points representing the candidate's key strengths for the JD.",
    )
    gaps: List[str] = Field(
        default_factory=list,
        description="Bullet points representing gaps, weaknesses, or missing requirements.",
    )
    fit_verdict: str = Field(
        ...,
        description="Bottom-line fit classification (e.g., 'Strong Match', 'Backup', 'High Risk').",
    )

    model_config = {
        "populate_by_name": True,
    }
