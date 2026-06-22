"""Behavioral profile model.

Represents a candidate's platform activity, communication speed, and reliability indicators.
"""

from pydantic import BaseModel, Field


class BehavioralProfile(BaseModel):
    """Pydantic model representing a candidate's behavioral features."""

    availability_score: float = Field(0.0, ge=0.0, le=1.0)
    responsiveness_score: float = Field(0.0, ge=0.0, le=1.0)
    engagement_score: float = Field(0.0, ge=0.0, le=1.0)
    interview_reliability: float = Field(0.0, ge=0.0, le=1.0)
    market_activity_score: float = Field(0.0, ge=0.0, le=1.0)
    verification_score: float = Field(0.0, ge=0.0, le=1.0)

    def behavioral_strength_score(self) -> float:
        """Calculates a suitability score based on candidate activity and reliability.

        Returns:
            float: Score from 0.0 to 1.0.
        """
        score = (
            0.30 * self.availability_score
            + 0.25 * self.responsiveness_score
            + 0.20 * self.interview_reliability
            + 0.15 * self.verification_score
            + 0.10 * self.engagement_score
        )
        return min(1.0, max(0.0, score))

    model_config = {
        "use_enum_values": True,
    }
