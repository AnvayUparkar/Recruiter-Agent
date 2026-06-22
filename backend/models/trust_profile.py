"""Trust Profile model — Phase 11: Behavioral Intelligence.

Recruiter Problem Solved:
    "Can I trust the information on this profile? Is this a real person
    with a verified, consistent career history, or a padded/fabricated
    profile that will embarrass me in front of the hiring manager?"

Signal Modeled:
    Six trust dimensions — profile completeness (is the data there?),
    verification (is identity confirmed?), consistency (does the career
    story hold together?), career consistency (no unexplained gaps or
    suspicious jumps), identity confidence (verified touchpoints), and
    profile quality (detail depth and coherence).

Phase 13 Ranking Usage:
    trust_score feeds BehavioralIntelligence as the highest-weighted
    behavioral dimension (30% default weight). It is exported as
    ``behavioral_trust`` in the Phase 13 ranking feature vector and also
    gates candidates in hard-filter rules before scoring begins.
"""

from typing import List
from pydantic import BaseModel, Field, model_validator


class TrustProfile(BaseModel):
    """Structured recruiter-trust assessment for a single candidate.

    All sub-scores are normalised to [0.0, 1.0].
    ``evidence`` provides a human-readable audit trail for recruiter UIs.
    ``confidence`` reflects signal quality: 1.0 means all six trust
    dimensions were observable and internally consistent.

    Note:
        This model intentionally avoids fraud-detection framing.
        Low trust_score means *insufficient signal*, not detected fraud.
        Downstream systems should surface this as a confidence qualifier,
        not a disqualifier.
    """

    # ── Sub-Scores ─────────────────────────────────────────────────────────────
    profile_completeness: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Normalised profile-completeness percentage from platform signals. "
            "Higher completeness → richer signal surface."
        ),
    )
    verification_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Identity-verification score: email + phone + LinkedIn connections "
            "each contribute independently."
        ),
    )
    consistency_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Overall career-narrative consistency: cross-checks tenure math, "
            "title progressions, and skill-to-role alignment."
        ),
    )
    career_consistency: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Specific career-history consistency: average tenure health, "
            "absence of unexplained gaps, and normal job-switch frequency."
        ),
    )
    identity_confidence: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Composite identity-confidence from verified contact points, "
            "LinkedIn connection, and platform tenure (signup age)."
        ),
    )
    profile_quality: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Profile detail depth: skills count, assessment scores, "
            "endorsements, and connections richness."
        ),
    )

    # ── Aggregate ──────────────────────────────────────────────────────────────
    trust_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Weighted composite trust score across all six dimensions.",
    )

    # ── Metadata ───────────────────────────────────────────────────────────────
    confidence: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Signal-quality confidence: fraction of dimensions that "
            "provided observable, non-default values."
        ),
    )
    evidence: List[str] = Field(
        default_factory=list,
        description="Human-readable audit trail explaining each sub-score.",
    )

    @model_validator(mode="after")
    def clamp_scores(self) -> "TrustProfile":
        """Ensures all float fields remain within [0.0, 1.0] after construction."""
        for field in (
            "profile_completeness",
            "verification_score",
            "consistency_score",
            "career_consistency",
            "identity_confidence",
            "profile_quality",
            "trust_score",
            "confidence",
        ):
            value = getattr(self, field)
            setattr(self, field, round(min(1.0, max(0.0, value)), 4))
        return self

    def is_highly_trusted(self) -> bool:
        """Returns True when the candidate profile meets high-trust thresholds.

        Threshold: trust_score ≥ 0.75 with confidence ≥ 0.60.

        Returns:
            bool: True if candidate is a highly trusted profile.
        """
        return self.trust_score >= 0.75 and self.confidence >= 0.60

    def to_feature_dict(self) -> dict:
        """Exposes named scalar features for downstream ranking models.

        Returns:
            dict: Flat {feature_name: float} suitable for ML feature vectors.
        """
        return {
            "trust_completeness": self.profile_completeness,
            "trust_verification": self.verification_score,
            "trust_consistency": self.consistency_score,
            "trust_career": self.career_consistency,
            "trust_identity": self.identity_confidence,
            "trust_quality": self.profile_quality,
            "trust_overall": self.trust_score,
            "trust_confidence": self.confidence,
        }

    model_config = {"populate_by_name": True}
