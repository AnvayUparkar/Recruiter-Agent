"""Behavioral Intelligence model — Phase 11: Behavioral Intelligence.

Recruiter Problem Solved:
    Aggregates all behavioral signals into a single, explainable
    ``BehavioralIntelligence`` object that answers three recruiter
    questions:

        1. "Can I trust this profile?"       → trust_score
        2. "Will they actually respond?"     → responsiveness_score
        3. "Will they accept if I offer?"    → join_probability

Signal Modeled:
    The composite of all five behavioral sub-systems — availability,
    engagement, responsiveness, trust, and join probability — plus a
    derived ``behavioral_score`` and ``recruiter_friendliness`` index.

Phase 13 Ranking Usage:
    This is the primary behavioral payload consumed by the Phase 13
    Final Ranking Engine. The ``to_feature_dict()`` method produces the
    exact ``behavioral_*`` keys that the ranker expects.  The
    ``behavioral_score`` participates in the final composite score with a
    configurable weight (default 0.20 of total ranking score).
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator

from models.availability_profile import AvailabilityProfile
from models.engagement_profile import EngagementProfile
from models.responsiveness_profile import ResponsivenessProfile
from models.trust_profile import TrustProfile


class BehavioralIntelligence(BaseModel):
    """Aggregate behavioral intelligence for a single candidate.

    Combines sub-profiles from all five behavioral analyzers into one
    validated, self-documenting object.  All scalar scores are [0.0, 1.0].
    """

    # ── Identity ───────────────────────────────────────────────────────────────
    candidate_id: str = Field(
        ...,
        description="Unique candidate identifier (CAND_XXXXXXX format).",
    )

    # ── Sub-Profile Payloads ───────────────────────────────────────────────────
    availability_profile: Optional[AvailabilityProfile] = Field(
        None,
        description="Detailed availability sub-profile with evidence trail.",
    )
    engagement_profile: Optional[EngagementProfile] = Field(
        None,
        description="Detailed engagement sub-profile with evidence trail.",
    )
    responsiveness_profile: Optional[ResponsivenessProfile] = Field(
        None,
        description="Detailed responsiveness sub-profile with evidence trail.",
    )
    trust_profile: Optional[TrustProfile] = Field(
        None,
        description="Detailed trust sub-profile with evidence trail.",
    )

    # ── Scalar Aggregates ──────────────────────────────────────────────────────
    behavioral_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Master behavioral score. Weighted composite of trust (30%), "
            "availability (25%), responsiveness (20%), engagement (15%), "
            "join_probability (10%)."
        ),
    )
    trust_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Shortcut to trust_profile.trust_score.",
    )
    availability_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Shortcut to availability_profile.availability_score.",
    )
    engagement_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Shortcut to engagement_profile.engagement_score.",
    )
    responsiveness_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Shortcut to responsiveness_profile.responsiveness_score.",
    )
    join_probability: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Estimated probability that candidate accepts an offer (0→1).",
    )

    # ── Derived Indexes ────────────────────────────────────────────────────────
    recruiter_friendliness: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Composite recruiter-experience score: "
            "0.5 × responsiveness + 0.3 × availability + 0.2 × trust. "
            "Predicts friction-free engagement."
        ),
    )

    # ── Meta-Confidence ────────────────────────────────────────────────────────
    confidence: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Average confidence across all sub-profiles that provided data. "
            "Low confidence flags insufficient signal."
        ),
    )

    # ── Global Evidence Audit Trail ────────────────────────────────────────────
    evidence: List[str] = Field(
        default_factory=list,
        description=(
            "Aggregated human-readable evidence from all sub-profiles, "
            "plus top-level composite observations."
        ),
    )

    # ── Weights Used for Composite Calculation ─────────────────────────────────
    scoring_weights: Dict[str, float] = Field(
        default_factory=lambda: {
            "trust":            0.30,
            "availability":     0.25,
            "responsiveness":   0.20,
            "engagement":       0.15,
            "join_probability": 0.10,
        },
        description="Configurable weights used to compute behavioral_score.",
    )

    @model_validator(mode="after")
    def clamp_scores(self) -> "BehavioralIntelligence":
        """Clamps all top-level float scores to [0.0, 1.0]."""
        for field in (
            "behavioral_score",
            "trust_score",
            "availability_score",
            "engagement_score",
            "responsiveness_score",
            "join_probability",
            "recruiter_friendliness",
            "confidence",
        ):
            value = getattr(self, field)
            setattr(self, field, round(min(1.0, max(0.0, value)), 4))
        return self

    def is_recruiter_ready(self) -> bool:
        """Returns True when the candidate meets baseline recruiter-confidence thresholds.

        A candidate is recruiter-ready when:
          - behavioral_score ≥ 0.60
          - trust_score      ≥ 0.50
          - responsiveness_score ≥ 0.40

        Returns:
            bool: True if candidate passes all three thresholds.
        """
        return (
            self.behavioral_score >= 0.60
            and self.trust_score >= 0.50
            and self.responsiveness_score >= 0.40
        )

    def to_feature_dict(self) -> Dict[str, float]:
        """Produces a flat feature dictionary for the Phase 13 ranking engine.

        All keys are prefixed with ``behavioral_`` for namespace clarity.

        Returns:
            Dict[str, float]: Flat behavioral feature vector.
        """
        features: Dict[str, float] = {
            "behavioral_score":             self.behavioral_score,
            "behavioral_trust":             self.trust_score,
            "behavioral_availability":      self.availability_score,
            "behavioral_engagement":        self.engagement_score,
            "behavioral_responsiveness":    self.responsiveness_score,
            "behavioral_join_probability":  self.join_probability,
            "behavioral_friendliness":      self.recruiter_friendliness,
            "behavioral_confidence":        self.confidence,
        }

        # Merge sub-profile feature dicts when available
        if self.availability_profile:
            features.update(self.availability_profile.to_feature_dict())
        if self.engagement_profile:
            features.update(self.engagement_profile.to_feature_dict())
        if self.responsiveness_profile:
            features.update(self.responsiveness_profile.to_feature_dict())
        if self.trust_profile:
            features.update(self.trust_profile.to_feature_dict())

        return features

    def summary(self) -> Dict[str, Any]:
        """Returns a high-level summary for logging and monitoring dashboards.

        Returns:
            Dict[str, Any]: Key behavioral metrics for quick inspection.
        """
        return {
            "candidate_id":         self.candidate_id,
            "behavioral_score":     self.behavioral_score,
            "trust_score":          self.trust_score,
            "availability_score":   self.availability_score,
            "responsiveness_score": self.responsiveness_score,
            "join_probability":     self.join_probability,
            "recruiter_friendliness": self.recruiter_friendliness,
            "confidence":           self.confidence,
            "recruiter_ready":      self.is_recruiter_ready(),
            "evidence_count":       len(self.evidence),
        }

    model_config = {"populate_by_name": True}
