"""Anomaly Detector — Phase 12: Profile Quality & Fraud Detection.

Recruiter Problem Solved:
    "Are there unusual statistical patterns in this profile that don't
    fit normal career behavior?  Things that are individually explainable
    but collectively suspicious?"

Signal Modeled:
    Detects eight categories of profile anomalies using configurable
    thresholds.  Each detected anomaly is classified by type
    (AnomalyType enum), assigned a severity, and stored in the evidence
    trail.  Aggregate risk scales with anomaly count and severity.

Phase 13 Ranking Usage:
    Returns AnomalyProfile with ``risk_score`` feeding FraudProfile's
    ``anomaly_risk`` dimension. Exported as ``fraud_anomaly`` in the
    Phase 13 ranking feature vector.
"""

import logging
from typing import Dict, List, Optional, Tuple

from models.candidate import Candidate
from models.anomaly_profile import AnomalyProfile, AnomalyType

logger = logging.getLogger(__name__)

# ── Configurable Thresholds ──────────────────────────────────────────────────
_THRESHOLDS: Dict[str, float] = {
    "career_jump_years":        5.0,    # >5yr seniority jump in one role change
    "skill_inflation_ratio":    8.0,    # >8 skills per year of experience
    "sparse_summary_words":     10,     # summary < 10 words
    "response_contradiction_rate": 0.80,  # high rate + slow time
    "response_contradiction_hours": 72.0,
    "salary_outlier_multiplier":   3.0,  # salary max > 3× min
    "min_description_ratio":    0.25,   # <25% roles with descriptions = sparse
    "max_short_tenure_ratio":   0.60,   # >60% of roles lasting <6 months
}

# ── Severity weights per anomaly type ───────────────────────────────────────
_SEVERITY_WEIGHTS: Dict[AnomalyType, float] = {
    AnomalyType.CAREER_JUMP:              0.15,
    AnomalyType.SKILL_INFLATION:          0.25,
    AnomalyType.SPARSE_PROFILE:           0.10,
    AnomalyType.CONTRADICTORY_SIGNALS:    0.20,
    AnomalyType.EXPERIENCE_MISMATCH:      0.25,
    AnomalyType.TITLE_SENIORITY_MISMATCH: 0.20,
    AnomalyType.RESPONSE_PATTERN:         0.15,
    AnomalyType.SALARY_OUTLIER:           0.10,
}


class AnomalyDetector:
    """Detects statistically unusual patterns in candidate profiles.

    Design philosophy:
        Each anomaly check is independent and returns a flag + evidence
        string.  The composite risk scales additively with detected
        anomaly severity, capped at 1.0.  Configurable thresholds make
        the detector tuneable per talent pool without code changes.

    Usage:
        detector = AnomalyDetector()
        profile = detector.detect(candidate)
    """

    def __init__(self, thresholds: Optional[Dict[str, float]] = None) -> None:
        """Initialises detector with optional threshold overrides.

        Args:
            thresholds: Override dict for specific threshold keys.
        """
        self._thresholds = dict(_THRESHOLDS)
        if thresholds:
            self._thresholds.update(thresholds)

    def _detect_career_jumps(
        self,
        candidate: Candidate,
    ) -> Tuple[bool, Optional[AnomalyType], str]:
        """Detects extreme career title jumps in a single transition.

        Example: IC → CTO in one move with <2 years of experience.
        """
        history = candidate.career_history
        if len(history) < 2:
            return False, None, ""

        try:
            sorted_h = sorted(history, key=lambda r: r.start_date)
        except Exception:
            return False, None, ""

        for i in range(len(sorted_h) - 1):
            curr = sorted_h[i]
            nxt = sorted_h[i + 1]
            curr_title = curr.title.lower()
            nxt_title = nxt.title.lower()

            # Flag transition to executive with very short prior tenure
            is_exec_jump = (
                "vp" in nxt_title or "director" in nxt_title
                or "chief" in nxt_title or "head of" in nxt_title
            )
            is_not_exec_before = not any(
                t in curr_title for t in ("vp", "director", "chief", "head")
            )
            if is_exec_jump and is_not_exec_before and curr.duration_months < 18:
                return (
                    True,
                    AnomalyType.CAREER_JUMP,
                    f"⚠️ Rapid career jump: '{curr.title}' ({curr.duration_months}mo) "
                    f"→ '{nxt.title}' without expected progression time.",
                )

        return False, None, ""

    def _detect_skill_inflation(
        self,
        candidate: Candidate,
    ) -> Tuple[bool, Optional[AnomalyType], str]:
        """Detects extreme skill count relative to experience years."""
        skill_count = len(candidate.skills)
        years = max(0.5, candidate.total_years_experience)
        ratio = skill_count / years
        threshold = self._thresholds["skill_inflation_ratio"]

        if ratio > threshold:
            return (
                True,
                AnomalyType.SKILL_INFLATION,
                f"⚠️ Skill inflation: {skill_count} skills / {years:.1f}yrs = "
                f"{ratio:.1f} skills/year (threshold: ≤{threshold:.0f}).",
            )
        return False, None, ""

    def _detect_sparse_profile(
        self,
        candidate: Candidate,
    ) -> Tuple[bool, Optional[AnomalyType], str]:
        """Detects profiles with severely limited textual content."""
        summary_words = len(candidate.profile.summary.split())
        min_words = int(self._thresholds["sparse_summary_words"])
        described_ratio = (
            sum(1 for r in candidate.career_history if r.description and len(r.description) > 20)
            / max(1, len(candidate.career_history))
        )
        min_desc_ratio = self._thresholds["min_description_ratio"]

        if summary_words < min_words and described_ratio < min_desc_ratio:
            return (
                True,
                AnomalyType.SPARSE_PROFILE,
                f"⚠️ Sparse profile: summary only {summary_words} words AND "
                f"only {described_ratio:.0%} of roles have descriptions.",
            )
        return False, None, ""

    def _detect_contradictory_signals(
        self,
        candidate: Candidate,
    ) -> Tuple[bool, Optional[AnomalyType], str]:
        """Detects contradictory platform signals (high rate + very slow response)."""
        sig = candidate.redrob_signals
        rate_threshold = self._thresholds["response_contradiction_rate"]
        hours_threshold = self._thresholds["response_contradiction_hours"]

        if (sig.recruiter_response_rate > rate_threshold
                and sig.avg_response_time_hours > hours_threshold):
            return (
                True,
                AnomalyType.CONTRADICTORY_SIGNALS,
                f"⚠️ Contradictory signals: {sig.recruiter_response_rate:.0%} response rate "
                f"but {sig.avg_response_time_hours:.0f}h average response time — "
                "may indicate automated or bulk responses.",
            )
        return False, None, ""

    def _detect_experience_mismatch(
        self,
        candidate: Candidate,
    ) -> Tuple[bool, Optional[AnomalyType], str]:
        """Detects large claimed-vs-provable experience gap."""
        claimed = candidate.total_years_experience
        provable = sum(r.duration_months for r in candidate.career_history) / 12.0

        if claimed == 0 or provable == 0:
            return False, None, ""

        gap_ratio = max(0.0, (claimed - provable) / claimed)
        if gap_ratio > 0.50:
            return (
                True,
                AnomalyType.EXPERIENCE_MISMATCH,
                f"⚠️ Experience mismatch: claimed {claimed:.1f}yrs but only "
                f"{provable:.1f}yrs provable ({gap_ratio:.0%} gap).",
            )
        return False, None, ""

    def _detect_title_seniority_mismatch(
        self,
        candidate: Candidate,
    ) -> Tuple[bool, Optional[AnomalyType], str]:
        """Detects premature senior/executive title claims."""
        title = (candidate.current_role or "").lower()
        years = candidate.total_years_experience

        is_exec = any(t in title for t in ("vp", "director", "chief", "head of", "cto"))
        is_senior = any(t in title for t in ("principal", "staff", "distinguished"))

        if is_exec and years < 8:
            return (
                True,
                AnomalyType.TITLE_SENIORITY_MISMATCH,
                f"⚠️ Executive title '{candidate.current_role}' with only "
                f"{years:.1f}yrs experience (typically requires ≥8yrs).",
            )
        if is_senior and years < 6:
            return (
                True,
                AnomalyType.TITLE_SENIORITY_MISMATCH,
                f"⚠️ Principal/Staff title '{candidate.current_role}' with only "
                f"{years:.1f}yrs experience (typically requires ≥6yrs).",
            )
        return False, None, ""

    def _detect_response_pattern(
        self,
        candidate: Candidate,
    ) -> Tuple[bool, Optional[AnomalyType], str]:
        """Detects extreme response behavior patterns."""
        sig = candidate.redrob_signals

        # Perfect completion + zero acceptance is unusual
        if sig.interview_completion_rate > 0.95 and sig.offer_acceptance_rate == 0.0:
            return (
                True,
                AnomalyType.RESPONSE_PATTERN,
                "⚠️ Perfect interview completion with zero offer acceptance — "
                "candidate may be using processes as market research.",
            )
        return False, None, ""

    def _detect_salary_outlier(
        self,
        candidate: Candidate,
    ) -> Tuple[bool, Optional[AnomalyType], str]:
        """Detects unusually wide salary expectation ranges."""
        exp = candidate.redrob_signals.expected_salary_range_inr_lpa
        if exp.min <= 0:
            return False, None, ""

        ratio = exp.max / exp.min
        threshold = self._thresholds["salary_outlier_multiplier"]

        if ratio > threshold:
            return (
                True,
                AnomalyType.SALARY_OUTLIER,
                f"⚠️ Wide salary range: ₹{exp.min}L–₹{exp.max}L "
                f"(max/min ratio = {ratio:.1f}× — threshold: ≤{threshold:.0f}×). "
                "Candidate may not have a clear market-rate expectation.",
            )
        return False, None, ""

    def detect(
        self,
        candidate: Candidate,
    ) -> AnomalyProfile:
        """Runs all eight anomaly detectors and returns an AnomalyProfile.

        This is the primary interface consumed by FraudDetector.

        Args:
            candidate: Candidate aggregate.

        Returns:
            AnomalyProfile: Complete anomaly assessment with risk score.
        """
        logger.debug("Running anomaly detection for %s", candidate.candidate_id)

        checks = [
            self._detect_career_jumps(candidate),
            self._detect_skill_inflation(candidate),
            self._detect_sparse_profile(candidate),
            self._detect_contradictory_signals(candidate),
            self._detect_experience_mismatch(candidate),
            self._detect_title_seniority_mismatch(candidate),
            self._detect_response_pattern(candidate),
            self._detect_salary_outlier(candidate),
        ]

        detected_types: List[AnomalyType] = []
        evidence: List[str] = []
        severity_sum: float = 0.0

        for is_anomaly, anomaly_type, description in checks:
            if is_anomaly and anomaly_type is not None:
                detected_types.append(anomaly_type)
                evidence.append(description)
                severity_sum += _SEVERITY_WEIGHTS.get(anomaly_type, 0.10)

        anomaly_count = len(detected_types)

        # Severity is the mean of individual weights (keeps range honest)
        avg_severity = severity_sum / max(1, anomaly_count) if anomaly_count > 0 else 0.0

        # Risk scales with count × avg_severity, capped at 1.0
        risk_score = round(min(1.0, anomaly_count * avg_severity), 4)

        if anomaly_count == 0:
            evidence.append("✅ No significant anomalies detected.")
        else:
            evidence.append(
                f"📊 {anomaly_count} anomaly(ies) detected | "
                f"severity={avg_severity:.2f} | risk={risk_score:.3f}"
            )

        logger.info(
            "Anomaly detection for %s | count=%d | risk=%.3f",
            candidate.candidate_id,
            anomaly_count,
            risk_score,
        )

        return AnomalyProfile(
            candidate_id=candidate.candidate_id,
            anomaly_count=anomaly_count,
            severity_score=round(avg_severity, 4),
            anomaly_types=detected_types,
            risk_score=risk_score,
            evidence=evidence,
        )
