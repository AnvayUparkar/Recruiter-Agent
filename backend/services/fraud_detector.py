"""Fraud Detector — Phase 12: Profile Quality & Fraud Detection.

Recruiter Problem Solved:
    "Is this profile reliable enough to present to a hiring manager, or
    should I flag it for additional verification first?"  This is the
    master fraud-risk aggregator that combines all four risk signals into
    a single, defensible FraudProfile.

Signal Modeled:
    Combines skill stuffing risk, timeline risk, identity risk (from
    Phase 11 verification signals), experience risk, and anomaly risk
    into one overall_fraud_risk score using configurable weights.

Architecture:
    Rule-based first — all decisions are logged and explained.  The
    ``_apply_ml_override()`` stub is a no-op that a future model can
    replace via dependency injection (same pattern as Phase 11).

Phase 13 Ranking Usage:
    Returns FraudProfile with ``overall_fraud_risk`` which becomes the
    ``fraud_penalty`` in ReliabilityScoring (10% weight). Exported as
    ``fraud_overall_risk`` and ``fraud_penalty`` in Phase 13 feature vector.
"""

import logging
from typing import Optional

from models.candidate import Candidate
from models.fraud_profile import FraudProfile
from models.behavioral_intelligence import BehavioralIntelligence
from services.skill_stuffing_detector import SkillStuffingDetector
from services.timeline_validator import TimelineValidator
from services.anomaly_detector import AnomalyDetector
from models.anomaly_profile import AnomalyProfile

logger = logging.getLogger(__name__)

# ── Default risk weights ─────────────────────────────────────────────────────
_DEFAULT_WEIGHTS = {
    "skill_stuffing": 0.25,
    "timeline":       0.30,
    "identity":       0.20,
    "experience":     0.15,
    "anomaly":        0.10,
}


class FraudDetector:
    """Combines all risk signals into a single FraudProfile.

    Design philosophy:
        Fraud detection here means *profile reliability detection*, not
        criminal fraud detection.  A high overall_fraud_risk means the
        recruiter should verify the profile more carefully before
        presenting it — it never means "reject this candidate".

        Weights are configurable so talent teams can adjust signal
        importance based on their specific role type and hiring culture.
    """

    def __init__(
        self,
        skill_stuffing_detector: Optional[SkillStuffingDetector] = None,
        timeline_validator: Optional[TimelineValidator] = None,
        anomaly_detector: Optional[AnomalyDetector] = None,
        weights: Optional[dict] = None,
    ) -> None:
        """Initialises with injectable sub-detectors and configurable weights.

        Args:
            skill_stuffing_detector: Injected SkillStuffingDetector.
            timeline_validator: Injected TimelineValidator.
            anomaly_detector: Injected AnomalyDetector.
            weights: Weight override dict (must have same keys as _DEFAULT_WEIGHTS).
        """
        self._stuffing = skill_stuffing_detector or SkillStuffingDetector()
        self._timeline = timeline_validator or TimelineValidator()
        self._anomaly_detector = anomaly_detector or AnomalyDetector()
        self._weights = weights or dict(_DEFAULT_WEIGHTS)

        # Validate weights sum
        weight_sum = sum(self._weights.values())
        if abs(weight_sum - 1.0) > 0.01:
            logger.warning(
                "FraudDetector weights sum to %.3f (expected 1.0). "
                "Normalising automatically.",
                weight_sum,
            )
            self._weights = {
                k: v / weight_sum for k, v in self._weights.items()
            }

    def _calculate_identity_risk(
        self,
        candidate: Candidate,
        behavioral_intel: Optional[BehavioralIntelligence] = None,
    ) -> tuple:
        """Derives identity risk from Phase 11 trust signals if available,
        otherwise from raw RedrobSignals.

        Args:
            candidate: Candidate aggregate.
            behavioral_intel: Optional Phase 11 behavioral intelligence.

        Returns:
            Tuple[float, float, list]: (risk, confidence, evidence).
        """
        evidence = []

        if behavioral_intel and behavioral_intel.trust_profile:
            tp = behavioral_intel.trust_profile
            # Identity risk is inverse of verification score
            risk = round(1.0 - tp.verification_score, 4)
            confidence = tp.confidence
            evidence.append(
                f"{'✅' if risk < 0.30 else '🟡' if risk < 0.60 else '🔴'} "
                f"Identity risk from Phase 11 trust: verification_score={tp.verification_score:.2f}, "
                f"identity_risk={risk:.3f}."
            )
        else:
            # Fallback: compute from raw signals
            sig = candidate.redrob_signals
            verification_score = (
                (0.40 if sig.verified_email else 0.0)
                + (0.40 if sig.verified_phone else 0.0)
                + (0.20 if sig.linkedin_connected else 0.0)
            )
            risk = round(1.0 - verification_score, 4)
            confidence = 0.70
            evidence.append(
                f"{'✅' if risk < 0.30 else '🔴'} Identity risk from raw signals: "
                f"email={'✓' if sig.verified_email else '✗'}, "
                f"phone={'✓' if sig.verified_phone else '✗'}, "
                f"linkedin={'✓' if sig.linkedin_connected else '✗'} → risk={risk:.3f}."
            )

        return risk, round(confidence, 4), evidence

    def _calculate_experience_risk(
        self,
        candidate: Candidate,
    ) -> tuple:
        """Derives experience risk from the ratio of claimed vs. provable years.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, float, list]: (risk, confidence, evidence).
        """
        evidence = []
        claimed = candidate.total_years_experience
        provable = sum(r.duration_months for r in candidate.career_history) / 12.0

        if claimed == 0:
            evidence.append("⚪ No experience claimed — experience risk is 0.")
            return 0.0, 0.50, evidence

        gap_ratio = max(0.0, (claimed - provable) / claimed)

        if gap_ratio <= 0.15:
            risk = 0.0
            evidence.append(
                f"✅ Claimed ({claimed:.1f}yrs) ≈ provable ({provable:.1f}yrs) experience."
            )
        elif gap_ratio <= 0.35:
            risk = 0.20
            evidence.append(
                f"🟡 Moderate experience gap: {gap_ratio:.0%} of claimed "
                f"{claimed:.1f}yrs unaccounted in employment history."
            )
        elif gap_ratio <= 0.55:
            risk = 0.50
            evidence.append(
                f"🔴 Large experience gap: {gap_ratio:.0%} of claimed "
                f"{claimed:.1f}yrs unaccounted ({provable:.1f}yrs provable)."
            )
        else:
            risk = 0.85
            evidence.append(
                f"🔴 Severe experience gap: {gap_ratio:.0%} of claimed "
                f"{claimed:.1f}yrs not supported by employment history."
            )

        return round(risk, 4), 0.80, evidence

    def _apply_ml_override(
        self,
        rule_based_risk: float,
        candidate: Candidate,
    ) -> float:
        """ML extension hook for future model injection (no-op stub).

        In Phase 13+, inject a trained binary classifier here that accepts
        a candidate feature vector and returns a calibrated fraud probability.

        Args:
            rule_based_risk: Risk computed by the rule-based engine.
            candidate: Candidate aggregate (for future ML feature extraction).

        Returns:
            float: Adjusted risk — currently returns rule_based_risk unchanged.
        """
        return rule_based_risk

    def calculate_risk(
        self,
        candidate: Candidate,
        behavioral_intel: Optional[BehavioralIntelligence] = None,
        anomaly_profile: Optional[AnomalyProfile] = None,
    ) -> float:
        """Computes composite fraud risk without full profile construction.

        Args:
            candidate: Candidate aggregate.
            behavioral_intel: Optional Phase 11 intelligence.
            anomaly_profile: Optional pre-computed anomaly profile.

        Returns:
            float: overall_fraud_risk in [0, 1].
        """
        stuffing_risk, _, _ = self._stuffing.detect_stuffing(candidate)
        timeline_risk, _, _ = self._timeline.validate(candidate)
        identity_risk, _, _ = self._calculate_identity_risk(candidate, behavioral_intel)
        exp_risk, _, _ = self._calculate_experience_risk(candidate)
        anom_risk = (
            anomaly_profile.risk_score
            if anomaly_profile
            else self._anomaly_detector.detect(candidate).risk_score
        )

        composite = (
            self._weights.get("skill_stuffing", 0.25) * stuffing_risk
            + self._weights.get("timeline", 0.30) * timeline_risk
            + self._weights.get("identity", 0.20) * identity_risk
            + self._weights.get("experience", 0.15) * exp_risk
            + self._weights.get("anomaly", 0.10) * anom_risk
        )

        return round(min(1.0, max(0.0, composite)), 4)

    def detect_fraud(
        self,
        candidate: Candidate,
        behavioral_intel: Optional[BehavioralIntelligence] = None,
        anomaly_profile: Optional[AnomalyProfile] = None,
    ) -> FraudProfile:
        """Runs the complete fraud detection pipeline and returns a FraudProfile.

        This is the primary interface consumed by TrustworthinessService.

        Args:
            candidate: Candidate aggregate.
            behavioral_intel: Optional Phase 11 behavioral intelligence for
                              richer identity risk signals.
            anomaly_profile: Optional pre-computed AnomalyProfile (avoids
                             re-running anomaly detection if already done).

        Returns:
            FraudProfile: Fully populated fraud risk assessment.
        """
        cid = candidate.candidate_id
        logger.debug("Running fraud detection for %s", cid)

        # Run all risk sub-detectors
        stuffing_risk, stuffing_conf, stuffing_ev = self._stuffing.detect_stuffing(candidate)
        timeline_risk, timeline_conf, timeline_ev = self._timeline.validate(candidate)
        identity_risk, identity_conf, identity_ev = self._calculate_identity_risk(
            candidate, behavioral_intel
        )
        exp_risk, exp_conf, exp_ev = self._calculate_experience_risk(candidate)

        # Use pre-computed anomaly profile if provided
        if anomaly_profile is not None:
            anom_risk = anomaly_profile.risk_score
            anom_ev = anomaly_profile.evidence
        else:
            ap = self._anomaly_detector.detect(candidate)
            anom_risk = ap.risk_score
            anom_ev = ap.evidence

        # Weighted composite
        w = self._weights
        composite = (
            w.get("skill_stuffing", 0.25) * stuffing_risk
            + w.get("timeline", 0.30) * timeline_risk
            + w.get("identity", 0.20) * identity_risk
            + w.get("experience", 0.15) * exp_risk
            + w.get("anomaly", 0.10) * anom_risk
        )
        composite = round(min(1.0, max(0.0, composite)), 4)

        # Apply ML override stub
        final_risk = self._apply_ml_override(composite, candidate)
        final_risk = round(min(1.0, max(0.0, final_risk)), 4)

        # Aggregate confidence
        confidences = [stuffing_conf, timeline_conf, identity_conf, exp_conf]
        confidence = round(sum(confidences) / len(confidences), 4)

        all_evidence = (
            stuffing_ev + timeline_ev + identity_ev + exp_ev + anom_ev
            + [f"📊 overall_fraud_risk = {final_risk:.3f} (confidence: {confidence:.2f})"]
        )

        logger.info(
            "Fraud detection for %s | risk=%.3f | confidence=%.3f",
            cid,
            final_risk,
            confidence,
        )

        return FraudProfile(
            candidate_id=cid,
            skill_stuffing_risk=stuffing_risk,
            timeline_risk=timeline_risk,
            identity_risk=identity_risk,
            experience_risk=exp_risk,
            anomaly_risk=anom_risk,
            overall_fraud_risk=final_risk,
            confidence=confidence,
            evidence=all_evidence,
        )
