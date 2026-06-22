"""Interview Plan Model — Phase 15: AI Recruiter Copilot.

Defines the structure for candidate-specific auto-generated interview guides.
"""

from typing import List
from pydantic import BaseModel, Field


class InterviewPlan(BaseModel):
    """Auto-generated interview strategy containing targeted questions and rounds estimates."""

    technical_questions: List[str] = Field(
        default_factory=list,
        description="Targeted technical questions evaluating the candidate's core skills.",
    )
    behavioral_questions: List[str] = Field(
        default_factory=list,
        description="Questions validating platform signals (availability, response speed, and cooperation).",
    )
    leadership_questions: List[str] = Field(
        default_factory=list,
        description="Questions evaluating leadership depth, team management, and design ownership.",
    )
    risk_validation_questions: List[str] = Field(
        default_factory=list,
        description="Targeted validation questions probing potential profile gaps, overlaps, or anomalies.",
    )
    focus_areas: List[str] = Field(
        default_factory=list,
        description="Core technical or behavioral domains the interviewer should focus on.",
    )
    estimated_interview_rounds: int = Field(
        2,
        ge=1,
        le=5,
        description="Suggested number of interview stages based on profile complexity and risk levels.",
    )

    model_config = {
        "populate_by_name": True,
    }
