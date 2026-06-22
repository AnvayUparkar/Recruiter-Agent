"""Explanation Report Model — Phase 14: Production API & Recruiter Suite.

Defines the structure for candidate fit and evidence summaries.
"""

from typing import List, Dict, Any
from pydantic import BaseModel, Field


class ExplanationReport(BaseModel):
    """Detailed fit explanation report for a single candidate."""

    candidate_id: str = Field(..., description="Unique candidate identifier.")
    fit_verdict: str = Field(..., description="E.g., Strong Match, Good Match, Backup.")
    summary: str = Field(..., description="recruiter-friendly fit justification paragraph.")
    strengths: List[str] = Field(
        default_factory=list,
        description="Key strengths matching the candidate to the role.",
    )
    weaknesses: List[str] = Field(
        default_factory=list,
        description="Core weaknesses or gaps relative to job description requirements.",
    )
    matched_requirements: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of JD requirements met, including name and importance tier.",
    )
    missing_requirements: List[str] = Field(
        default_factory=list,
        description="List of must-have JD requirements missing from the candidate's profile.",
    )
    evidence: Dict[str, List[str]] = Field(
        default_factory=dict,
        description="Granular category-level highlights (career, behavioral, trust).",
    )
    generated_at: str = Field(..., description="Timestamp of report generation.")

    model_config = {
        "populate_by_name": True,
    }
