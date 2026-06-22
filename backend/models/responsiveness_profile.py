"""Responsiveness Profile model — Phase 11: Behavioral Intelligence.

Recruiter Problem Solved:
    "Will this candidate actually reply to my InMail, or will I spend my
    outreach budget on a black hole?"

Signal Modeled:
    Four communication-reliability dimensions — raw response rate (did
    they ever reply?), average response time (how quickly?), response
    consistency (are they reliable across all interactions?), and
    communication reliability (interview completion + offer-acceptance
    stability).

Phase 13 Ranking Usage:
    responsiveness_score feeds BehavioralIntelligence and is exported as
    ``behavioral_responsiveness`` in the Phase 13 ranking feature vector.
    High-responsiveness candidates are surfaced earlier in recruiter
    outreach queues to improve pipeline conversion rates.
"""

from typing import List
from pydantic import BaseModel, Field, model_validator


class ResponsivenessProfile(BaseModel):
    """Structured communication-reliability assessment for a single candidate.

    All sub-scores are normalised to [0.0, 1.0].
    ``evidence`` provides a human-readable audit trail for recruiter UIs.
    ``confidence`` reflects signal completeness: 1.0 means all four
    communication dimensions were observable.
    """

    # ── Sub-Scores ─────────────────────────────────────────────────────────────
    response_rate: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Historical recruiter-message response rate [0.0, 1.0]. "
            "Directly sourced from redrob_signals.recruiter_response_rate."
        ),
    )
    average_response_time: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Inverse-normalised response speed score. "
            "Faster responses yield higher scores."
        ),
    )
    response_consistency: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Consistency of communication across multiple interactions. "
            "Derived from interview-completion rate."
        ),
    )
    communication_reliability: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Combined signal of interview completion + offer acceptance. "
            "Rewards candidates who complete what they start."
        ),
    )

    # ── Aggregate ──────────────────────────────────────────────────────────────
    responsiveness_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Weighted composite responsiveness score across all four dimensions.",
    )

    # ── Metadata ───────────────────────────────────────────────────────────────
    confidence: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Signal-quality confidence: fraction of dimensions with "
            "non-default, observable values."
        ),
    )
    evidence: List[str] = Field(
        default_factory=list,
        description="Human-readable audit trail explaining each sub-score.",
    )

    @model_validator(mode="after")
    def clamp_scores(self) -> "ResponsivenessProfile":
        """Ensures all float fields remain within [0.0, 1.0] after construction."""
        for field in (
            "response_rate",
            "average_response_time",
            "response_consistency",
            "communication_reliability",
            "responsiveness_score",
            "confidence",
        ):
            value = getattr(self, field)
            setattr(self, field, round(min(1.0, max(0.0, value)), 4))
        return self

    def is_highly_responsive(self) -> bool:
        """Returns True when the candidate shows strong, reliable communication.

        Threshold: responsiveness_score ≥ 0.70 with confidence ≥ 0.50.

        Returns:
            bool: True if candidate is a reliable communicator.
        """
        return self.responsiveness_score >= 0.70 and self.confidence >= 0.50

    def to_feature_dict(self) -> dict:
        """Exposes named scalar features for downstream ranking models.

        Returns:
            dict: Flat {feature_name: float} suitable for ML feature vectors.
        """
        return {
            "resp_rate": self.response_rate,
            "resp_avg_time": self.average_response_time,
            "resp_consistency": self.response_consistency,
            "resp_reliability": self.communication_reliability,
            "resp_overall": self.responsiveness_score,
            "resp_confidence": self.confidence,
        }

    model_config = {"populate_by_name": True}
