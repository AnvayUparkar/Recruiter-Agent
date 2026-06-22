"""Availability Profile model — Phase 11: Behavioral Intelligence.

Recruiter Problem Solved:
    "Is this candidate actually available right now, or will they ghost me
    after accepting an interview?"

Signal Modeled:
    Captures four orthogonal availability axes — explicit opt-in (Open To
    Work flag), urgency (notice period), recent intent (job-search
    application volume), and temporal freshness (profile-update recency).

Phase 13 Ranking Usage:
    availability_score feeds the BehavioralIntelligence aggregate and is
    later injected into the final ranking feature vector as
    ``behavioral_availability``, acting as a tiebreaker when technical
    scores are near-equal.
"""

from typing import List
from pydantic import BaseModel, Field, model_validator


class AvailabilityProfile(BaseModel):
    """Structured availability assessment for a single candidate.

    All sub-scores are normalised to [0.0, 1.0].
    ``evidence`` is a human-readable audit trail for recruiter UIs.
    ``confidence`` reflects signal completeness: 1.0 means all four
    sub-signals were present and internally consistent.
    """

    # ── Sub-Scores ─────────────────────────────────────────────────────────────
    open_to_work_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Explicit Open-To-Work flag contribution (0 or 1).",
    )
    notice_period_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Speed-to-join score; shorter notice → higher score.",
    )
    job_search_activity: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Normalized application-submission rate over last 30 days.",
    )
    profile_update_recency: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Recency of last platform activity; decay applied over days.",
    )

    # ── Aggregate ──────────────────────────────────────────────────────────────
    availability_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Weighted composite availability score.",
    )

    # ── Metadata ───────────────────────────────────────────────────────────────
    confidence: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Signal-quality confidence: proportion of sub-signals that "
            "contributed non-zero, non-default values."
        ),
    )
    evidence: List[str] = Field(
        default_factory=list,
        description="Human-readable audit trail explaining each sub-score.",
    )

    @model_validator(mode="after")
    def clamp_scores(self) -> "AvailabilityProfile":
        """Ensures all float fields remain within [0.0, 1.0] after construction."""
        for field in (
            "open_to_work_score",
            "notice_period_score",
            "job_search_activity",
            "profile_update_recency",
            "availability_score",
            "confidence",
        ):
            value = getattr(self, field)
            setattr(self, field, round(min(1.0, max(0.0, value)), 4))
        return self

    def is_immediately_available(self) -> bool:
        """Returns True when the candidate shows strong, immediate availability.

        Threshold: availability_score ≥ 0.75 with confidence ≥ 0.50.

        Returns:
            bool: True if candidate is likely immediately available.
        """
        return self.availability_score >= 0.75 and self.confidence >= 0.50

    def to_feature_dict(self) -> dict:
        """Exposes named scalar features for downstream ranking models.

        Returns:
            dict: Flat {feature_name: float} suitable for ML feature vectors.
        """
        return {
            "avail_open_to_work": self.open_to_work_score,
            "avail_notice_period": self.notice_period_score,
            "avail_job_search": self.job_search_activity,
            "avail_recency": self.profile_update_recency,
            "avail_overall": self.availability_score,
            "avail_confidence": self.confidence,
        }

    model_config = {"populate_by_name": True}
