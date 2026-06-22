"""Execution Features model definition.

Captures hands-on delivery and engineering impact signals.

Why it exists:
  Recruiters and hiring managers care deeply about what was *actually shipped*.
  A candidate who "designed retrieval infrastructure serving 10M users" is
  fundamentally different from one who "was involved in a search project."
  These signals cannot be inferred from skill proficiency alone.

Ranking dependency:
  Execution features carry 15% weight in the default ranking config.
  They are the primary discriminator between paper engineers and hands-on builders.
"""

from pydantic import BaseModel, Field


class ExecutionFeatures(BaseModel):
    """Hands-on engineering delivery and impact signals for a candidate.

    All fields in [0.0, 1.0]. Inferred from verbs, scale markers, and
    outcome statements in job descriptions and candidate summaries.
    """

    # ── Delivery ──────────────────────────────────────────────────────────────
    shipping_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Evidence of shipping products to users: built, launched, released, "
            "deployed, shipped."
        ),
    )
    production_delivery_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Evidence of production deployments: CI/CD, Kubernetes, monitoring, "
            "SLOs, on-call."
        ),
    )

    # ── Impact & Scale ────────────────────────────────────────────────────────
    impact_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Evidence of measurable business or technical impact: "
            "reduced latency, increased revenue, improved recall."
        ),
    )
    system_scale_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Evidence of large-scale systems: 'serving 10M users', "
            "'processing 1B events/day', '100TB dataset'."
        ),
    )

    # ── Complexity ────────────────────────────────────────────────────────────
    project_complexity_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Evidence of architecturally complex systems: "
            "distributed, real-time, multi-modal, multi-tenant."
        ),
    )
    initiative_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Evidence of proactive ownership: initiated, proposed, "
            "championed, spearheaded, drove adoption."
        ),
    )

    def overall_execution_score(self) -> float:
        """Weighted execution signal aggregate.

        Returns:
            float: Score in [0.0, 1.0].
        """
        return round(min(1.0, (
            0.25 * self.shipping_score
            + 0.20 * self.production_delivery_score
            + 0.20 * self.impact_score
            + 0.20 * self.system_scale_score
            + 0.10 * self.project_complexity_score
            + 0.05 * self.initiative_score
        )), 4)

    model_config = {"populate_by_name": True}
