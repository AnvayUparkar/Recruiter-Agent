"""Market attractiveness profile model.

Represents a candidate's visibility to recruiters, salary expectations alignment, and competitiveness.
"""

from pydantic import BaseModel, Field


class MarketProfile(BaseModel):
    """Pydantic model representing a candidate's hiring-market suitability."""

    recruiter_interest: float = Field(0.0, ge=0.0, le=1.0)
    search_visibility: float = Field(0.0, ge=0.0, le=1.0)
    profile_quality: float = Field(0.0, ge=0.0, le=1.0)
    salary_expectation_score: float = Field(0.0, ge=0.0, le=1.0)
    relocation_score: float = Field(0.0, ge=0.0, le=1.0)
    market_competitiveness: float = Field(0.0, ge=0.0, le=1.0)

    def market_strength_score(self) -> float:
        """Calculates a market suitability score.

        Weighs interest, visibility, salary alignment, and relocation.

        Returns:
            float: Suitability rating from 0.0 to 1.0.
        """
        score = (
            0.25 * self.recruiter_interest
            + 0.25 * self.market_competitiveness
            + 0.20 * self.salary_expectation_score
            + 0.15 * self.search_visibility
            + 0.10 * self.profile_quality
            + 0.05 * self.relocation_score
        )
        return min(1.0, max(0.0, score))

    model_config = {
        "use_enum_values": True,
    }
