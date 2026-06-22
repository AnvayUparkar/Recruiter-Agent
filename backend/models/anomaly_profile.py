"""Anomaly Profile model — Phase 12: Profile Quality & Fraud Detection.

Recruiter Problem Solved:
    "Does this profile contain statistically unusual patterns that a
    recruiter should investigate before presenting to a hiring manager?"
    Anomalies are not disqualifiers — they are signals requiring human
    attention.

Signal Modeled:
    Quantifies the count, severity, and type classification of detected
    anomalies.  Anomaly types include career-jump extremes, skill
    inflation outliers, sparse profile patterns, contradictory market
    signals, and content repetition.

Phase 13 Ranking Usage:
    ``risk_score`` contributes to ``anomaly_risk`` inside FraudProfile
    and is exported as ``fraud_anomaly`` in the Phase 13 ranking feature
    vector.  Profiles with many high-severity anomalies receive a
    composite reliability penalty.
"""

from enum import Enum
from typing import List
from pydantic import BaseModel, Field, model_validator


class AnomalyType(str, Enum):
    """Enumeration of detectable profile anomaly categories."""

    CAREER_JUMP = "career_jump"
    SKILL_INFLATION = "skill_inflation"
    SPARSE_PROFILE = "sparse_profile"
    CONTRADICTORY_SIGNALS = "contradictory_signals"
    EXPERIENCE_MISMATCH = "experience_mismatch"
    TITLE_SENIORITY_MISMATCH = "title_seniority_mismatch"
    RESPONSE_PATTERN = "response_pattern"
    SALARY_OUTLIER = "salary_outlier"


class AnomalyProfile(BaseModel):
    """Structured anomaly assessment for a single candidate profile.

    ``severity_score`` in [0.0, 1.0] represents the aggregate impact.
    ``risk_score`` in [0.0, 1.0] is the final anomaly contribution to FraudProfile.
    ``evidence`` provides a human-readable audit trail for recruiter UIs.
    """

    # ── Identity ───────────────────────────────────────────────────────────────
    candidate_id: str = Field(
        ...,
        description="Unique candidate identifier (CAND_XXXXXXX format).",
    )

    # ── Anomaly Counts & Classification ───────────────────────────────────────
    anomaly_count: int = Field(
        0,
        ge=0,
        description="Total number of anomalies detected across all dimensions.",
    )
    severity_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Aggregate severity of all detected anomalies. "
            "Weighted by anomaly type severity — career jumps are "
            "less severe than experience fabrication indicators."
        ),
    )
    anomaly_types: List[AnomalyType] = Field(
        default_factory=list,
        description="List of detected anomaly type classifications.",
    )

    # ── Risk Score ─────────────────────────────────────────────────────────────
    risk_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Final anomaly risk contribution: derived from anomaly_count "
            "× severity_score, capped at 1.0."
        ),
    )

    # ── Metadata ───────────────────────────────────────────────────────────────
    evidence: List[str] = Field(
        default_factory=list,
        description="Human-readable descriptions of each detected anomaly.",
    )

    @model_validator(mode="after")
    def clamp_scores(self) -> "AnomalyProfile":
        """Ensures all float fields remain within [0.0, 1.0] after construction."""
        for field in ("severity_score", "risk_score"):
            value = getattr(self, field)
            setattr(self, field, round(min(1.0, max(0.0, value)), 4))
        return self

    def has_anomalies(self) -> bool:
        """Returns True if at least one anomaly was detected.

        Returns:
            bool: True if anomaly_count > 0.
        """
        return self.anomaly_count > 0

    def is_high_risk(self) -> bool:
        """Returns True when anomaly risk is high enough to warrant review.

        Threshold: risk_score ≥ 0.50 OR ≥ 3 anomalies detected.

        Returns:
            bool: True if the profile has significant anomaly risk.
        """
        return self.risk_score >= 0.50 or self.anomaly_count >= 3

    def to_feature_dict(self) -> dict:
        """Exposes named scalar features for downstream ranking models.

        Returns:
            dict: Flat {feature_name: float} suitable for ML feature vectors.
        """
        return {
            "anomaly_count":    float(self.anomaly_count),
            "anomaly_severity": self.severity_score,
            "anomaly_risk":     self.risk_score,
        }

    model_config = {"populate_by_name": True, "use_enum_values": True}
