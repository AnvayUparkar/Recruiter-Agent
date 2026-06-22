"""Market Features model definition.

Captures candidate availability, recruiter engagement, and market-fit signals
from the Redrob platform ecosystem.

Why it exists:
  The best technical candidate is worthless if they are not reachable,
  not interested, or have misaligned salary expectations.
  Market signals answer the recruiter's practical question:
  "Can we actually hire this person?"

Ranking dependency:
  Market features carry 5% weight in the default ranking config.
  However, availability_score is used as a hard gate:
  candidates with availability < 0.1 may be deprioritized regardless
  of technical strength.
"""

from pydantic import BaseModel, Field


class MarketFeatures(BaseModel):
    """Market availability and recruiter engagement signals for a candidate.

    All fields in [0.0, 1.0]. Sourced from RedrobSignals platform data.
    """

    # ── Availability ──────────────────────────────────────────────────────────
    availability_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Composite availability: open_to_work, notice period shortness, "
            "and recent platform activity."
        ),
    )

    # ── Recruiter Engagement ──────────────────────────────────────────────────
    recruiter_engagement_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Platform engagement: saved by recruiters, profile views, "
            "response rate to messages."
        ),
    )

    # ── Profile Quality ───────────────────────────────────────────────────────
    profile_strength_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Profile completeness, verification status (email, phone, LinkedIn), "
            "and assessment scores."
        ),
    )

    # ── Compensation Fit ──────────────────────────────────────────────────────
    salary_alignment_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "How well the candidate's salary expectation aligns with the role's "
            "budget band."
        ),
    )

    # ── Flexibility ───────────────────────────────────────────────────────────
    relocation_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Willingness to relocate or work remotely matching the role's "
            "location requirements."
        ),
    )

    # ── Market Demand Proxy ───────────────────────────────────────────────────
    market_interest_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Demand signal from the market: number of applications, "
            "search appearances, and interview activity."
        ),
    )

    def overall_market_score(self) -> float:
        """Weighted market readiness signal aggregate.

        Returns:
            float: Score in [0.0, 1.0].
        """
        return round(min(1.0, (
            0.30 * self.availability_score
            + 0.25 * self.profile_strength_score
            + 0.20 * self.recruiter_engagement_score
            + 0.15 * self.salary_alignment_score
            + 0.05 * self.relocation_score
            + 0.05 * self.market_interest_score
        )), 4)

    model_config = {"populate_by_name": True}
