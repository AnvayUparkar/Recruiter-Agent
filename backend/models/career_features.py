"""Career Features model definition.

Captures recruiter-style career trajectory and professional maturity signals.

Why it exists:
  A recruiter reads a resume not just for skills but for the arc:
  Did this person grow? Are they stable? Do they have the right company mix?
  These signals are independent of technical skill and form a separate
  feature group in the ranking model.

Ranking dependency:
  Career features receive 20% weight in the default ranking config.
  Key fields: years_experience_score, career_growth_score, career_stability_score.
"""

from pydantic import BaseModel, Field


class CareerFeatures(BaseModel):
    """Recruiter-style career trajectory signals for a candidate.

    Positive signals increase rank. Penalty fields reduce it.
    All values are in [0.0, 1.0]; higher always means "better for this role".
    """

    # ── Experience Depth ──────────────────────────────────────────────────────
    years_experience_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Normalized years of total experience (0 yrs=0.0, 15+ yrs=1.0).",
    )

    # ── Trajectory ────────────────────────────────────────────────────────────
    career_growth_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Evidence of promotion / title progression over career.",
    )
    career_stability_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Ratio of long tenures vs. short tenures.",
    )

    # ── Company Type Mix ──────────────────────────────────────────────────────
    startup_experience_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Fraction of career at startup-scale companies.",
    )
    product_company_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Fraction of career at product-first companies.",
    )

    # ── Penalty Signals (higher = worse; stored as 0..1 penalty magnitude) ────
    consulting_penalty: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Extent of consulting / outsourcing exposure (penalises rank).",
    )
    research_penalty: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Pure academia / research exposure without industry delivery.",
    )
    job_hopping_penalty: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Proportion of roles shorter than 12 months.",
    )

    # ── Tenure Quality ────────────────────────────────────────────────────────
    average_tenure_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Normalized average tenure per role (18 mo=0.5, 36+ mo=1.0).",
    )

    # ── Industry Relevance ────────────────────────────────────────────────────
    industry_relevance_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Fraction of career in tech / ML / search-adjacent industries.",
    )

    def overall_career_score(self) -> float:
        """Weighted aggregate career strength, accounting for penalty deductions.

        Returns:
            float: Score in [0.0, 1.0].
        """
        positive = (
            0.25 * self.years_experience_score
            + 0.20 * self.career_growth_score
            + 0.15 * self.career_stability_score
            + 0.15 * self.product_company_score
            + 0.10 * self.average_tenure_score
            + 0.10 * self.industry_relevance_score
            + 0.05 * self.startup_experience_score
        )
        penalty = (
            0.40 * self.job_hopping_penalty
            + 0.35 * self.consulting_penalty
            + 0.25 * self.research_penalty
        )
        return round(min(1.0, max(0.0, positive - 0.15 * penalty)), 4)

    model_config = {"populate_by_name": True}
