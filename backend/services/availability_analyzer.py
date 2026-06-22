"""Availability Analyzer — Phase 11: Behavioral Intelligence.

Recruiter Problem Solved:
    Determines whether a candidate is currently available to be hired.
    Answers: "Is now a good time to reach out?"

Signal Modeled:
    - Open To Work flag (explicit platform intent)
    - Notice period (speed-to-join)
    - Recent application activity (active job-search intent)
    - Profile-update recency (temporal engagement decay)

Phase 13 Ranking Usage:
    Returns AvailabilityProfile with ``availability_score`` and
    ``confidence``. Consumed by BehavioralScoring (25% weight) and
    exported as ``behavioral_availability`` to the Phase 13 ranking
    feature vector.
"""

import logging
from datetime import date
from typing import List, Tuple

from models.availability_profile import AvailabilityProfile
from models.candidate import Candidate

logger = logging.getLogger(__name__)

# ── Reference date (platform anchor) ──────────────────────────────────────────
_REFERENCE_DATE: date = date(2026, 6, 15)


class AvailabilityAnalyzer:
    """Estimates how available a candidate is for new opportunities.

    Design philosophy:
        Rule-based scoring with explicit weight constants.  Every numeric
        decision is documented so that the evidence audit trail is
        meaningful to recruiters.  Architecture deliberately separates
        ``calculate_*`` helpers (pure computation) from ``generate_profile``
        (orchestration) to support future ML layer injection.
    """

    # ── Weight constants ───────────────────────────────────────────────────────
    WEIGHT_OPEN_TO_WORK: float = 0.40
    WEIGHT_NOTICE_PERIOD: float = 0.30
    WEIGHT_JOB_SEARCH: float = 0.20
    WEIGHT_RECENCY: float = 0.10

    # ── Thresholds ─────────────────────────────────────────────────────────────
    MAX_APPLICATIONS_30D: int = 10          # normalise application count
    MAX_DAYS_RECENT_ACTIVE: int = 90        # window for recency scoring
    DAYS_ACTIVE_HIGH: int = 7               # full recency score
    DAYS_ACTIVE_MEDIUM: int = 30            # medium recency score
    DAYS_ACTIVE_LOW: int = 60              # low recency score

    def calculate_open_to_work(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores the explicit Open-To-Work signal.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        signals = candidate.redrob_signals
        evidence: List[str] = []

        if signals.open_to_work_flag:
            score = 1.0
            evidence.append("✅ Open To Work flag is active on platform profile.")
        else:
            score = 0.0
            evidence.append("⚪ Open To Work flag is not enabled.")

        return round(score, 4), evidence

    def calculate_notice_period(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores speed-to-join based on notice period length.

        Shorter notice periods yield higher scores — recruiters prefer
        candidates who can start quickly.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        notice = candidate.redrob_signals.notice_period_days
        evidence: List[str] = []

        if notice == 0:
            score = 1.0
            evidence.append("✅ Candidate can join immediately (0-day notice).")
        elif notice <= 15:
            score = 0.90
            evidence.append(f"✅ Short notice period: {notice} days (≤15 days).")
        elif notice <= 30:
            score = 0.75
            evidence.append(f"🟡 Standard notice period: {notice} days (≤30 days).")
        elif notice <= 60:
            score = 0.50
            evidence.append(f"🟡 Extended notice period: {notice} days (31–60 days).")
        elif notice <= 90:
            score = 0.25
            evidence.append(f"🔴 Long notice period: {notice} days (61–90 days).")
        else:
            score = 0.05
            evidence.append(f"🔴 Very long notice period: {notice} days (>90 days).")

        return round(score, 4), evidence

    def calculate_job_search_activity(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores active job-search intent from application submissions.

        Uses 30-day application count as a proxy for active intent.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        apps = candidate.redrob_signals.applications_submitted_30d
        evidence: List[str] = []

        score = min(1.0, apps / self.MAX_APPLICATIONS_30D)

        if apps == 0:
            evidence.append("⚪ No applications submitted in the last 30 days.")
        elif apps <= 2:
            evidence.append(f"🟡 Low application activity: {apps} submissions in 30 days.")
        elif apps <= 5:
            evidence.append(f"✅ Moderate application activity: {apps} submissions in 30 days.")
        else:
            evidence.append(f"✅ High application activity: {apps} submissions in 30 days.")

        return round(score, 4), evidence

    def calculate_recency(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores profile-update recency using exponential-decay approximation.

        More recently active candidates receive higher recency scores.
        Decays sharply after 30 days of inactivity.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        signals = candidate.redrob_signals
        days_inactive = signals.days_since_last_active(_REFERENCE_DATE)
        evidence: List[str] = []

        if days_inactive <= self.DAYS_ACTIVE_HIGH:
            score = 1.0
            evidence.append(
                f"✅ Very recently active: {days_inactive} day(s) since last login."
            )
        elif days_inactive <= self.DAYS_ACTIVE_MEDIUM:
            score = 0.75
            evidence.append(
                f"✅ Recently active: {days_inactive} day(s) since last login."
            )
        elif days_inactive <= self.DAYS_ACTIVE_LOW:
            score = 0.45
            evidence.append(
                f"🟡 Moderately recent: {days_inactive} day(s) since last login."
            )
        elif days_inactive <= self.MAX_DAYS_RECENT_ACTIVE:
            score = 0.20
            evidence.append(
                f"🔴 Low recency: {days_inactive} day(s) since last login."
            )
        else:
            score = 0.05
            evidence.append(
                f"🔴 Stale profile: {days_inactive} day(s) since last login (>90 days)."
            )

        return round(score, 4), evidence

    def calculate_availability(self, candidate: Candidate) -> Tuple[float, float]:
        """Computes composite availability score and confidence.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, float]: (availability_score, confidence) in [0,1].
        """
        otw_score, _ = self.calculate_open_to_work(candidate)
        notice_score, _ = self.calculate_notice_period(candidate)
        activity_score, _ = self.calculate_job_search_activity(candidate)
        recency_score, _ = self.calculate_recency(candidate)

        composite = (
            self.WEIGHT_OPEN_TO_WORK * otw_score
            + self.WEIGHT_NOTICE_PERIOD * notice_score
            + self.WEIGHT_JOB_SEARCH * activity_score
            + self.WEIGHT_RECENCY * recency_score
        )

        # Confidence: count how many sub-signals produced non-zero values
        non_zero = sum(
            1 for s in (otw_score, notice_score, activity_score, recency_score)
            if s > 0.0
        )
        confidence = non_zero / 4.0

        return round(min(1.0, composite), 4), round(confidence, 4)

    def generate_profile(self, candidate: Candidate) -> AvailabilityProfile:
        """Orchestrates all sub-calculations and returns a complete AvailabilityProfile.

        This is the primary public interface consumed by RecruiterTrustService.

        Args:
            candidate: Candidate aggregate.

        Returns:
            AvailabilityProfile: Fully populated availability assessment.
        """
        logger.debug("Analyzing availability for candidate %s", candidate.candidate_id)

        otw_score, otw_evidence = self.calculate_open_to_work(candidate)
        notice_score, notice_evidence = self.calculate_notice_period(candidate)
        activity_score, activity_evidence = self.calculate_job_search_activity(candidate)
        recency_score, recency_evidence = self.calculate_recency(candidate)

        composite = (
            self.WEIGHT_OPEN_TO_WORK * otw_score
            + self.WEIGHT_NOTICE_PERIOD * notice_score
            + self.WEIGHT_JOB_SEARCH * activity_score
            + self.WEIGHT_RECENCY * recency_score
        )
        composite = round(min(1.0, max(0.0, composite)), 4)

        non_zero = sum(
            1 for s in (otw_score, notice_score, activity_score, recency_score)
            if s > 0.0
        )
        confidence = round(non_zero / 4.0, 4)

        all_evidence = (
            otw_evidence
            + notice_evidence
            + activity_evidence
            + recency_evidence
            + [f"📊 Composite availability_score = {composite:.3f} (confidence: {confidence:.2f})"]
        )

        logger.info(
            "Availability profile built for %s | score=%.3f | confidence=%.3f",
            candidate.candidate_id,
            composite,
            confidence,
        )

        return AvailabilityProfile(
            open_to_work_score=otw_score,
            notice_period_score=notice_score,
            job_search_activity=activity_score,
            profile_update_recency=recency_score,
            availability_score=composite,
            confidence=confidence,
            evidence=all_evidence,
        )
