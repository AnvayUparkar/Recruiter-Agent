"""Candidate Intelligence Profile model definition.

Aggregate root model representing the complete extracted intelligence for a candidate.
"""

from pydantic import BaseModel, Field
from models.technical_profile import TechnicalProfile
from models.career_profile import CareerProfile
from models.behavioral_profile import BehavioralProfile
from models.market_profile import MarketProfile


class CandidateProfile(BaseModel):
    """Aggregate model representing the complete extracted intelligence of a candidate."""

    candidate_id: str
    technical_profile: TechnicalProfile
    career_profile: CareerProfile
    behavioral_profile: BehavioralProfile
    market_profile: MarketProfile
    candidate_summary: str = Field(
        ...,
        description="A recruiter-style natural language overview (max 100 words).",
    )
    overall_strength: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Aggregate capability rating across all profiles.",
    )

    model_config = {
        "use_enum_values": True,
        "populate_by_name": True,
    }
