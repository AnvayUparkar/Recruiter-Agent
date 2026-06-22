"""Fraud Profile model — Phase 12: Profile Quality & Fraud Detection.

Recruiter Problem Solved:
    "Is this profile inflated, fabricated, or inconsistent in ways that
    will embarrass me if I present it to a hiring manager?"  This is NOT
    criminal fraud detection — it is *profile reliability* detection.
    A high fraud_risk_score means the profile has signals that reduce
    recruiter confidence, not that the person is lying.

Signal Modeled:
    Six risk dimensions — skill stuffing (unrealistic skill volume),
    timeline risk (overlapping/impossible employment dates), identity
    risk (low verification + new account), experience risk (claimed years
    vs. provable history), anomaly risk (unusual patterns in the data),
    and a composite overall_fraud_risk that is subtracted as a penalty.

Phase 13 Ranking Usage:
    ``overall_fraud_risk`` becomes ``fraud_penalty`` in ReliabilityScoring
    (10% default weight).  High-risk profiles are down-ranked to protect
    recruiters from wasted outreach and reputational risk with hiring
    managers.  The score is exported as ``reliability_fraud_penalty``
    in the Phase 13 ranking feature vector.
"""

from typing import List
from pydantic import BaseModel, Field, model_validator


class FraudProfile(BaseModel):
    """Structured fraud-risk assessment for a single candidate profile.

    All risk scores are in [0.0, 1.0] where:
        0.0 = no detectable risk
        1.0 = maximum detectable risk

    Important:
        This model quantifies *signal reliability risk*, not criminal intent.
        A score of 1.0 means "very low confidence in profile accuracy",
        not "this person is lying".

    ``evidence`` provides a human-readable audit trail for recruiter UIs.
    ``confidence`` reflects signal completeness: 1.0 means all six risk
    dimensions had sufficient data to evaluate.
    """

    # ── Identity ───────────────────────────────────────────────────────────────
    candidate_id: str = Field(
        ...,
        description="Unique candidate identifier (CAND_XXXXXXX format).",
    )

    # ── Risk Sub-Scores ────────────────────────────────────────────────────────
    skill_stuffing_risk: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Risk that skills section is unrealistically inflated. "
            "High = many claimed skills with little supporting experience."
        ),
    )
    timeline_risk: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Risk from career timeline inconsistencies: overlapping roles, "
            "impossible date ranges, or claimed experience > employment history."
        ),
    )
    identity_risk: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Risk from low identity-verification signals: unverified contacts, "
            "no LinkedIn, new account with advanced claims."
        ),
    )
    experience_risk: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Risk from experience claim mismatches: claimed years of experience "
            "not supported by provable employment history."
        ),
    )
    anomaly_risk: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Risk from statistical anomalies: career jump extremes, "
            "salary expectation outliers, or pattern outliers vs. peer pool."
        ),
    )

    # ── Aggregate ──────────────────────────────────────────────────────────────
    overall_fraud_risk: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Weighted composite fraud risk score. "
            "Used as a reliability penalty in Phase 13 ranking."
        ),
    )

    # ── Metadata ───────────────────────────────────────────────────────────────
    confidence: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Signal-quality confidence: fraction of risk dimensions with "
            "sufficient data to evaluate."
        ),
    )
    evidence: List[str] = Field(
        default_factory=list,
        description="Human-readable audit trail explaining each risk signal.",
    )

    @model_validator(mode="after")
    def clamp_scores(self) -> "FraudProfile":
        """Ensures all float fields remain within [0.0, 1.0] after construction."""
        for field in (
            "skill_stuffing_risk",
            "timeline_risk",
            "identity_risk",
            "experience_risk",
            "anomaly_risk",
            "overall_fraud_risk",
            "confidence",
        ):
            value = getattr(self, field)
            setattr(self, field, round(min(1.0, max(0.0, value)), 4))
        return self

    def is_high_risk(self) -> bool:
        """Returns True when the profile presents significant reliability risk.

        Threshold: overall_fraud_risk ≥ 0.60 with confidence ≥ 0.50.

        Returns:
            bool: True if profile reliability risk is high.
        """
        return self.overall_fraud_risk >= 0.60 and self.confidence >= 0.50

    def fraud_penalty(self) -> float:
        """Returns the reliability penalty to subtract from composite scores.

        Penalty is half the fraud risk, capped at 0.30, to avoid catastrophic
        score collapse for borderline profiles.

        Returns:
            float: Penalty in [0.0, 0.30].
        """
        return round(min(0.30, self.overall_fraud_risk * 0.50), 4)

    def to_feature_dict(self) -> dict:
        """Exposes named scalar features for downstream ranking models.

        Returns:
            dict: Flat {feature_name: float} suitable for ML feature vectors.
        """
        return {
            "fraud_skill_stuffing": self.skill_stuffing_risk,
            "fraud_timeline":       self.timeline_risk,
            "fraud_identity":       self.identity_risk,
            "fraud_experience":     self.experience_risk,
            "fraud_anomaly":        self.anomaly_risk,
            "fraud_overall_risk":   self.overall_fraud_risk,
            "fraud_penalty":        self.fraud_penalty(),
            "fraud_confidence":     self.confidence,
        }

    model_config = {"populate_by_name": True}
