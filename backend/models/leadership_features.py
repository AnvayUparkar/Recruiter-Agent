"""Leadership Features model definition.

Captures signals that distinguish a technical leader from an individual
contributor.

Why it exists:
  For senior/principal roles, a recruiter asks:
  "Have they led teams? Owned systems? Driven cross-functional initiatives?"
  These signals cannot be inferred from skill lists alone.

Ranking dependency:
  Leadership features carry 5% weight in default config, but are critical
  gating signals for senior and staff-level roles (future role-based weight
  overrides will amplify this group).
"""

from pydantic import BaseModel, Field


class LeadershipFeatures(BaseModel):
    """Recruiter-style leadership and ownership signals for a candidate.

    All fields in [0.0, 1.0]. Inferred from job titles, descriptions,
    and career progression patterns.
    """

    # ── People Leadership ─────────────────────────────────────────────────────
    people_management_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Evidence of directly managing engineers or data scientists.",
    )
    mentorship_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Evidence of mentoring, onboarding, or coaching junior engineers.",
    )

    # ── Technical Authority ───────────────────────────────────────────────────
    technical_leadership_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Evidence of tech lead, principal, or staff-level responsibilities.",
    )
    ownership_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Evidence of end-to-end system or product ownership.",
    )

    # ── Organizational Scope ──────────────────────────────────────────────────
    cross_functional_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Collaboration across product, data, infra, and business teams.",
    )
    decision_making_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Evidence of architectural or strategic technical decisions.",
    )

    def overall_leadership_score(self) -> float:
        """Weighted leadership signal aggregate.

        Returns:
            float: Score in [0.0, 1.0].
        """
        return round(min(1.0, (
            0.25 * self.technical_leadership_score
            + 0.20 * self.ownership_score
            + 0.20 * self.decision_making_score
            + 0.15 * self.people_management_score
            + 0.10 * self.cross_functional_score
            + 0.10 * self.mentorship_score
        )), 4)

    @property
    def leadership_score(self) -> float:
        """Compatibility property for overall leadership score."""
        return self.overall_leadership_score()

    model_config = {"populate_by_name": True}
