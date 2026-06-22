"""Recruiter Report Model — Phase 15: AI Recruiter Copilot.

Defines the master unified recruiter view model schema.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from models.hire_recommendation import HireRecommendation


class RecruiterReport(BaseModel):
    """The master consolidated candidate evaluation report for recruiter copilots."""

    candidate_id: str = Field(..., description="Unique candidate ID CAND_XXXXXXX.")
    recruiter_summary: str = Field(..., description="Recruiter-friendly factual summary paragraph.")
    hire_recommendation: HireRecommendation = Field(..., description="Hiring recommendation verdict and metrics.")
    strengths: List[str] = Field(default_factory=list, description="Top candidate strengths.")
    weaknesses: List[str] = Field(default_factory=list, description="Candidate gaps and weaknesses.")
    risks: List[str] = Field(default_factory=list, description="Key warning flags or risk items.")
    interview_focus: List[str] = Field(default_factory=list, description="Core areas suggested for interview focus.")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Overall model score confidence.")
    evidence: List[str] = Field(default_factory=list, description="Direct fact-grounded verification highlights.")
    overall_assessment: str = Field(..., description="Summarized recruiter assessment paragraph.")
    generated_at: str = Field(..., description="ISO timestamp of report generation.")

    model_config = {
        "populate_by_name": True,
    }
