"""Reliability Profile model — Phase 12: Profile Quality & Fraud Detection.

Recruiter Problem Solved:
    "What is the single, final reliability verdict on this candidate that
    I can use to decide how much confidence to invest in their profile
    before reaching out?"  This is the top-level Phase 12 output that
    the Phase 13 Ranking Engine consumes.

Signal Modeled:
    Combines all four Phase 12 signals — profile quality (30%), behavioral
    score from Phase 11 (25%), trust score from Phase 11 (20%),
    consistency score (15%) — and applies a fraud penalty (10% cap).
    The result is ``reliability_score``: the recruiter's bottom-line
    confidence in this candidate's profile.

Phase 13 Ranking Usage:
    ``reliability_score`` is exported as a group of ``reliability_*``
    features in the Phase 13 ranking feature vector.  The reliability
    score acts as a multiplier on technical scores — a brilliant technical
    match with a 0.20 reliability score would be deprioritised behind
    a good technical match with a 0.95 reliability score.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, model_validator

from models.profile_quality import ProfileQuality
from models.fraud_profile import FraudProfile
from models.consistency_profile import ConsistencyProfile
from models.anomaly_profile import AnomalyProfile


class ReliabilityProfile(BaseModel):
    """Final recruiter-reliability assessment combining all Phase 12 signals.

    All scalar scores are in [0.0, 1.0].
    ``evidence`` aggregates the audit trails from all sub-profiles.
    ``confidence`` is the mean confidence across all contributing sub-systems.
    """

    # ── Identity ───────────────────────────────────────────────────────────────
    candidate_id: str = Field(
        ...,
        description="Unique candidate identifier (CAND_XXXXXXX format).",
    )

    # ── Sub-Profile Payloads ───────────────────────────────────────────────────
    quality_profile: Optional[ProfileQuality] = Field(
        None,
        description="Detailed profile quality sub-assessment.",
    )
    fraud_profile: Optional[FraudProfile] = Field(
        None,
        description="Detailed fraud risk sub-assessment.",
    )
    consistency_profile: Optional[ConsistencyProfile] = Field(
        None,
        description="Detailed consistency sub-assessment.",
    )
    anomaly_profile: Optional[AnomalyProfile] = Field(
        None,
        description="Detailed anomaly sub-assessment.",
    )

    # ── Scalar Inputs (Phase 11 pass-through) ──────────────────────────────────
    behavioral_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Behavioral score from Phase 11 BehavioralIntelligence. "
            "Represents platform engagement + communication reliability."
        ),
    )
    trust_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Trust score from Phase 11 BehavioralIntelligence. "
            "Represents identity verification + career narrative trust."
        ),
    )

    # ── Scalar Aggregates ──────────────────────────────────────────────────────
    quality_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Shortcut to quality_profile.quality_score.",
    )
    fraud_penalty: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Shortcut to fraud_profile.overall_fraud_risk (applied as a penalty).",
    )
    consistency_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Shortcut to consistency_profile.consistency_score.",
    )

    # ── Final Score ────────────────────────────────────────────────────────────
    reliability_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Weighted composite reliability score: "
            "30% quality + 25% behavioral + 20% trust + 15% consistency "
            "- 10% fraud_penalty."
        ),
    )

    # ── Meta-Confidence ────────────────────────────────────────────────────────
    confidence: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Mean confidence across all contributing sub-systems.",
    )

    # ── Evidence Audit Trail ───────────────────────────────────────────────────
    evidence: List[str] = Field(
        default_factory=list,
        description=(
            "Aggregated human-readable evidence from all sub-profiles, "
            "plus top-level composite observations."
        ),
    )

    # ── Weights Reference ──────────────────────────────────────────────────────
    scoring_weights: dict = Field(
        default_factory=lambda: {
            "quality":      0.30,
            "behavioral":   0.25,
            "trust":        0.20,
            "consistency":  0.15,
            "fraud_penalty": 0.10,
        },
        description="Weights used to compute reliability_score.",
    )

    @model_validator(mode="after")
    def clamp_scores(self) -> "ReliabilityProfile":
        """Clamps all top-level float scores to [0.0, 1.0]."""
        for field in (
            "behavioral_score",
            "trust_score",
            "quality_score",
            "fraud_penalty",
            "consistency_score",
            "reliability_score",
            "confidence",
        ):
            value = getattr(self, field)
            setattr(self, field, round(min(1.0, max(0.0, value)), 4))
        return self

    def is_reliable(self) -> bool:
        """Returns True when the profile meets baseline reliability thresholds.

        A profile is reliable when:
          - reliability_score ≥ 0.55
          - fraud_penalty     ≤ 0.40

        Returns:
            bool: True if profile passes reliability thresholds.
        """
        return self.reliability_score >= 0.55 and self.fraud_penalty <= 0.40

    def reliability_tier(self) -> str:
        """Classifies the profile into a named reliability tier.

        Returns:
            str: "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW"
        """
        s = self.reliability_score
        if s >= 0.80:
            return "HIGH"
        elif s >= 0.60:
            return "MEDIUM"
        elif s >= 0.40:
            return "LOW"
        return "VERY_LOW"

    def to_feature_dict(self) -> dict:
        """Produces a flat feature dictionary for the Phase 13 ranking engine.

        All keys are prefixed with ``reliability_`` for namespace clarity.

        Returns:
            dict: Flat {feature_name: float} suitable for ML feature vectors.
        """
        features = {
            "reliability_score":       self.reliability_score,
            "reliability_quality":     self.quality_score,
            "reliability_behavioral":  self.behavioral_score,
            "reliability_trust":       self.trust_score,
            "reliability_consistency": self.consistency_score,
            "reliability_fraud_penalty": self.fraud_penalty,
            "reliability_confidence":  self.confidence,
        }

        # Merge detailed sub-profile feature dicts
        if self.quality_profile:
            features.update(self.quality_profile.to_feature_dict())
        if self.fraud_profile:
            features.update(self.fraud_profile.to_feature_dict())
        if self.consistency_profile:
            features.update(self.consistency_profile.to_feature_dict())
        if self.anomaly_profile:
            features.update(self.anomaly_profile.to_feature_dict())

        return features

    def summary(self) -> dict:
        """Returns a high-level summary for logging and dashboards.

        Returns:
            dict: Key reliability metrics for quick inspection.
        """
        return {
            "candidate_id":        self.candidate_id,
            "reliability_score":   self.reliability_score,
            "reliability_tier":    self.reliability_tier(),
            "quality_score":       self.quality_score,
            "fraud_penalty":       self.fraud_penalty,
            "consistency_score":   self.consistency_score,
            "behavioral_score":    self.behavioral_score,
            "trust_score":         self.trust_score,
            "confidence":          self.confidence,
            "is_reliable":         self.is_reliable(),
            "evidence_count":      len(self.evidence),
        }

    model_config = {"populate_by_name": True}
