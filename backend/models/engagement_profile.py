"""Engagement Profile model — Phase 11: Behavioral Intelligence.

Recruiter Problem Solved:
    "Is this candidate actively visible and engaging with the platform,
    or a passive ghost profile that no one sees?"

Signal Modeled:
    Five engagement dimensions — recruiter saves (passive market signal),
    profile views (platform visibility), application activity (active
    intent), search appearances (discoverability), and general market
    activity (composite buzz index).

Phase 13 Ranking Usage:
    engagement_score feeds BehavioralIntelligence and is exported as
    ``behavioral_engagement`` in the ranking feature vector. High
    engagement candidates receive a recruiter-confidence bonus that helps
    break ties when technical scores are near-equal.
"""

from typing import List
from pydantic import BaseModel, Field, model_validator


class EngagementProfile(BaseModel):
    """Structured engagement assessment for a single candidate.

    All sub-scores are normalised to [0.0, 1.0].
    ``evidence`` provides a human-readable audit trail for recruiter UIs.
    ``confidence`` reflects signal completeness across the five axes.
    """

    # ── Sub-Scores ─────────────────────────────────────────────────────────────
    profile_views: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Normalised 30-day profile-view rate. Proxy for discoverability.",
    )
    recruiter_saves: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Normalised 30-day saved-by-recruiters count. Passive demand signal.",
    )
    application_activity: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Normalised 30-day application-submission rate. Active intent signal.",
    )
    search_appearances: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Normalised 30-day search-appearance count. Platform discoverability.",
    )
    market_activity: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Composite GitHub + general activity index. External market buzz.",
    )

    # ── Aggregate ──────────────────────────────────────────────────────────────
    engagement_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Weighted composite engagement score across all five dimensions.",
    )

    # ── Metadata ───────────────────────────────────────────────────────────────
    confidence: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Signal-quality confidence: proportion of sub-signals that "
            "contributed non-default, non-zero values."
        ),
    )
    evidence: List[str] = Field(
        default_factory=list,
        description="Human-readable audit trail explaining each sub-score.",
    )

    @model_validator(mode="after")
    def clamp_scores(self) -> "EngagementProfile":
        """Ensures all float fields remain within [0.0, 1.0] after construction."""
        for field in (
            "profile_views",
            "recruiter_saves",
            "application_activity",
            "search_appearances",
            "market_activity",
            "engagement_score",
            "confidence",
        ):
            value = getattr(self, field)
            setattr(self, field, round(min(1.0, max(0.0, value)), 4))
        return self

    def is_highly_engaged(self) -> bool:
        """Returns True when the candidate is an active, high-demand market participant.

        Threshold: engagement_score ≥ 0.70 with confidence ≥ 0.60.

        Returns:
            bool: True if candidate shows strong market engagement.
        """
        return self.engagement_score >= 0.70 and self.confidence >= 0.60

    def to_feature_dict(self) -> dict:
        """Exposes named scalar features for downstream ranking models.

        Returns:
            dict: Flat {feature_name: float} suitable for ML feature vectors.
        """
        return {
            "engage_profile_views": self.profile_views,
            "engage_recruiter_saves": self.recruiter_saves,
            "engage_applications": self.application_activity,
            "engage_search_appear": self.search_appearances,
            "engage_market": self.market_activity,
            "engage_overall": self.engagement_score,
            "engage_confidence": self.confidence,
        }

    model_config = {"populate_by_name": True}
