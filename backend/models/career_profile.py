"""Career history experience profile model.

Represents a candidate's trajectory, company type distributions, and tenure indicators.
"""

from pydantic import BaseModel, Field


class CareerProfile(BaseModel):
    """Pydantic model representing a candidate's professional trajectory."""

    years_experience: float = Field(0.0, ge=0.0)
    product_company_ratio: float = Field(0.0, ge=0.0, le=1.0)
    startup_ratio: float = Field(0.0, ge=0.0, le=1.0)
    average_tenure: float = Field(0.0, ge=0.0, description="Average tenure in years.")
    leadership_signal: float = Field(0.0, ge=0.0, le=1.0)
    individual_contributor_signal: float = Field(0.0, ge=0.0, le=1.0)
    career_stability: float = Field(0.0, ge=0.0, le=1.0)
    career_growth_rate: float = Field(0.0, ge=0.0, le=1.0)

    def career_strength_score(self) -> float:
        """Calculates a career suitability score.

        Weighs product company experience, stability, and growth rate.

        Returns:
            float: Score from 0.0 to 1.0.
        """
        # Weighted matching prioritizing product ratios, stability, and growth
        score = (
            0.30 * self.product_company_ratio
            + 0.20 * self.career_stability
            + 0.20 * self.career_growth_rate
            + 0.20 * self.startup_ratio
            + 0.10 * self.leadership_signal
        )
        return min(1.0, max(0.0, score))

    model_config = {
        "use_enum_values": True,
    }
