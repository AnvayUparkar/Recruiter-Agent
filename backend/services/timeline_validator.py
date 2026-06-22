"""Timeline Validator — Phase 12: Profile Quality & Fraud Detection.

Recruiter Problem Solved:
    "Does this candidate's career timeline actually add up?  Are there
    impossible overlaps, suspicious gaps, or a 'claimed 10 years of
    experience' backed by only 3 years of employment history?"

Signal Modeled:
    Detects four timeline risk categories:
      1. Overlapping employment (two simultaneous full-time roles)
      2. Experience claim vs. provable history mismatch
      3. Chronological gaps (unexplained periods of inactivity)
      4. Timeline density (does the chronology make sense end-to-end?)

Phase 13 Ranking Usage:
    Returns ``timeline_risk`` to FraudProfile. Exported as
    ``fraud_timeline`` in Phase 13 feature vector. Severe timeline
    inconsistencies are a strong predictor of profile unreliability.
"""

import logging
from datetime import date
from typing import List, Tuple

from models.candidate import Candidate
from models.career_history import CareerHistory

logger = logging.getLogger(__name__)

# ── Reference date ──────────────────────────────────────────────────────────
_REFERENCE_DATE: date = date(2026, 6, 15)

# ── Thresholds ──────────────────────────────────────────────────────────────
_OVERLAP_TOLERANCE_MONTHS: int = 1     # ≤1 month overlap is acceptable
_GAP_WARNING_MONTHS: int = 6           # >6 months gap triggers a warning
_GAP_HIGH_RISK_MONTHS: int = 24        # >24 months unexplained gap
_EXP_MISMATCH_TOLERANCE: float = 0.20 # 20% tolerance on claimed vs. provable years


class TimelineValidator:
    """Validates the career timeline for inconsistencies and impossible sequences.

    Design philosophy:
        Career timelines have natural ambiguity — people do sabbaticals,
        freelance, study, or take care of family.  This validator assigns
        risk scores proportionally, not binary flags, so genuine but
        unconventional careers are not penalised catastrophically.
    """

    def _compute_employment_months(
        self,
        candidate: Candidate,
    ) -> float:
        """Sums provable employment months from career history.

        Uses ``duration_months`` field on each role directly (avoids
        date calculation inconsistencies with partial months).

        Args:
            candidate: Candidate aggregate.

        Returns:
            float: Total months of provable employment history.
        """
        return sum(role.duration_months for role in candidate.career_history)

    def _check_overlapping_roles(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Detects overlapping employment periods in career history.

        Two roles are considered overlapping if they share a date range
        that exceeds the overlap tolerance.  Consulting or part-time roles
        may legitimately overlap, so this is a risk signal, not a hard flag.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (risk in [0,1], evidence list).
        """
        history = candidate.career_history
        evidence: List[str] = []
        overlapping_pairs = 0

        if len(history) < 2:
            evidence.append("✅ Only one role — no timeline overlap to check.")
            return 0.0, evidence

        # Sort by start_date for sequential comparison
        try:
            sorted_history = sorted(history, key=lambda r: r.start_date)
        except Exception:
            evidence.append("⚪ Cannot sort career history by date — timeline check skipped.")
            return 0.0, evidence

        for i in range(len(sorted_history) - 1):
            current = sorted_history[i]
            next_role = sorted_history[i + 1]

            # Skip if current role has no end date (it's the current role)
            if current.is_current or current.end_date is None:
                continue

            if next_role.start_date < current.end_date:
                # Calculate overlap in months
                overlap_days = (current.end_date - next_role.start_date).days
                overlap_months = overlap_days / 30
                if overlap_months > _OVERLAP_TOLERANCE_MONTHS:
                    overlapping_pairs += 1
                    evidence.append(
                        f"⚠️ Overlap detected: '{current.title}' at {current.company} "
                        f"overlaps with '{next_role.title}' at {next_role.company} "
                        f"by ~{overlap_months:.0f} month(s)."
                    )

        if overlapping_pairs == 0:
            evidence.append("✅ No overlapping employment periods detected.")
            return 0.0, evidence

        # Risk scales with number of overlapping pairs
        risk = min(1.0, overlapping_pairs * 0.30)
        return round(risk, 4), evidence

    def _check_experience_mismatch(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Compares claimed years of experience to provable employment history.

        If profile claims 10 years but employment history sums to 3 years,
        that is a strong reliability signal.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (risk in [0,1], evidence list).
        """
        claimed_years = candidate.total_years_experience
        provable_months = self._compute_employment_months(candidate)
        provable_years = provable_months / 12.0
        evidence: List[str] = []

        if claimed_years == 0:
            evidence.append("⚪ No years of experience claimed — skipping mismatch check.")
            return 0.0, evidence

        gap_years = claimed_years - provable_years
        gap_ratio = gap_years / claimed_years if claimed_years > 0 else 0.0

        if gap_ratio <= _EXP_MISMATCH_TOLERANCE:
            evidence.append(
                f"✅ Experience claim ({claimed_years:.1f}yrs) consistent with "
                f"employment history ({provable_years:.1f}yrs provable)."
            )
            return 0.0, evidence
        elif gap_ratio <= 0.40:
            risk = 0.25
            evidence.append(
                f"🟡 Moderate experience gap: claimed {claimed_years:.1f}yrs but "
                f"only {provable_years:.1f}yrs provable in employment history "
                f"({gap_years:.1f}yr gap = {gap_ratio:.0%})."
            )
        elif gap_ratio <= 0.60:
            risk = 0.55
            evidence.append(
                f"🔴 Large experience gap: claimed {claimed_years:.1f}yrs but "
                f"only {provable_years:.1f}yrs provable ({gap_ratio:.0%} unaccounted)."
            )
        else:
            risk = 0.85
            evidence.append(
                f"🔴 Severe experience mismatch: claimed {claimed_years:.1f}yrs but "
                f"only {provable_years:.1f}yrs provable ({gap_ratio:.0%} unaccounted). "
                "Profile may significantly overstate seniority."
            )

        return round(risk, 4), evidence

    def _check_chronological_gaps(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Detects significant unexplained gaps between employment periods.

        Long gaps are not inherently disqualifying but reduce timeline
        confidence.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (risk in [0,1], evidence list).
        """
        history = candidate.career_history
        evidence: List[str] = []

        if len(history) < 2:
            evidence.append("✅ Too few roles to detect chronological gaps.")
            return 0.0, evidence

        try:
            sorted_history = sorted(history, key=lambda r: r.start_date)
        except Exception:
            evidence.append("⚪ Cannot assess gaps — career history dates unavailable.")
            return 0.0, evidence

        long_gaps: List[float] = []
        for i in range(len(sorted_history) - 1):
            current = sorted_history[i]
            next_role = sorted_history[i + 1]

            if current.end_date is None or current.is_current:
                continue

            gap_days = (next_role.start_date - current.end_date).days
            gap_months = max(0, gap_days / 30)

            if gap_months > _GAP_WARNING_MONTHS:
                long_gaps.append(gap_months)
                severity = "⚠️" if gap_months < _GAP_HIGH_RISK_MONTHS else "🔴"
                evidence.append(
                    f"{severity} Employment gap of ~{gap_months:.0f} months between "
                    f"'{current.company}' and '{next_role.company}'."
                )

        if not long_gaps:
            evidence.append("✅ No significant unexplained employment gaps detected.")
            return 0.0, evidence

        # Risk scales with longest gap
        max_gap_months = max(long_gaps)
        risk = min(1.0, max_gap_months / 48.0)  # 48 months = 4 years = max risk

        return round(risk, 4), evidence

    def _check_timeline_density(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Checks whether the timeline is internally dense and plausible.

        A healthy timeline has roles that span from early career to now
        without extreme sparsity.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (risk in [0,1], evidence list).
        """
        history = candidate.career_history
        evidence: List[str] = []

        if not history:
            evidence.append("🔴 No career history to assess timeline density.")
            return 0.80, evidence

        provable_months = self._compute_employment_months(candidate)
        claimed_years = candidate.total_years_experience
        claimed_months = claimed_years * 12

        if claimed_months == 0:
            evidence.append("⚪ No experience claimed — timeline density skipped.")
            return 0.0, evidence

        # Density = provable months / claimed months
        density = min(1.0, provable_months / claimed_months)
        risk = max(0.0, 1.0 - density - 0.20)  # 20% tolerance built-in

        evidence.append(
            f"{'✅' if risk < 0.20 else '🟡'} Timeline density: "
            f"{provable_months:.0f} provable months vs. {claimed_months:.0f} claimed months "
            f"({density:.0%} coverage)."
        )

        return round(max(0.0, risk), 4), evidence

    def calculate_risk(
        self,
        candidate: Candidate,
    ) -> Tuple[float, float]:
        """Computes composite timeline risk and confidence.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, float]: (timeline_risk, confidence) in [0,1].
        """
        overlap, _ = self._check_overlapping_roles(candidate)
        mismatch, _ = self._check_experience_mismatch(candidate)
        gaps, _ = self._check_chronological_gaps(candidate)
        density, _ = self._check_timeline_density(candidate)

        composite = (
            0.30 * overlap
            + 0.40 * mismatch
            + 0.20 * gaps
            + 0.10 * density
        )

        has_dates = any(r.start_date is not None for r in candidate.career_history)
        confidence = 0.85 if has_dates else 0.30

        return round(min(1.0, composite), 4), round(confidence, 4)

    def validate(
        self,
        candidate: Candidate,
    ) -> Tuple[float, float, List[str]]:
        """Full timeline validation returning risk, confidence, and evidence.

        This is the primary interface consumed by FraudDetector.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, float, List[str]]: (risk, confidence, evidence).
        """
        logger.debug("Validating timeline for %s", candidate.candidate_id)

        overlap, overlap_ev = self._check_overlapping_roles(candidate)
        mismatch, mismatch_ev = self._check_experience_mismatch(candidate)
        gaps, gaps_ev = self._check_chronological_gaps(candidate)
        density, density_ev = self._check_timeline_density(candidate)

        composite = round(min(1.0, max(0.0, (
            0.30 * overlap
            + 0.40 * mismatch
            + 0.20 * gaps
            + 0.10 * density
        ))), 4)

        has_dates = any(r.start_date is not None for r in candidate.career_history)
        confidence = round(0.85 if has_dates else 0.30, 4)

        all_evidence = (
            overlap_ev + mismatch_ev + gaps_ev + density_ev
            + [f"📊 timeline_risk = {composite:.3f} (confidence: {confidence:.2f})"]
        )

        logger.info(
            "Timeline validation for %s | risk=%.3f | confidence=%.3f",
            candidate.candidate_id,
            composite,
            confidence,
        )

        return composite, confidence, all_evidence
