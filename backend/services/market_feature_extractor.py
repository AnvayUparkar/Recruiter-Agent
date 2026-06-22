"""Market Feature Extractor service.

Extracts candidate availability, engagement, and market-fit signals
from RedrobSignals platform data.

Why it exists:
  Market signals live in RedrobSignals, which is a highly structured,
  platform-native data source. The extractor normalizes these raw platform
  signals (counts, rates, dates, salary ranges) into [0, 1] scores that
  are comparable across candidates.

Ranking dependency:
  Produces MarketFeatures. Market group has 5% weight in default ranking
  but availability_score functions as a hard gate signal in the candidate
  pool filtering phase.
"""

import math
from datetime import date
from typing import Optional
from models.candidate import Candidate
from models.market_features import MarketFeatures
from models.redrob_signals import RedrobSignals
from utils.logger import get_logger

logger = get_logger(__name__)

# Salary band assumed for the target role (in INR LPA)
# These are configurable; injected per JD by MatchingFeatureExtractor.
DEFAULT_ROLE_SALARY_MIN_LPA: float = 30.0
DEFAULT_ROLE_SALARY_MAX_LPA: float = 80.0

# Notice period: <= 30 days = max availability
MAX_NOTICE_PERIOD_DAYS: int = 90
REFERENCE_DATE: date = date(2026, 6, 15)


class MarketFeatureExtractor:
    """Extracts MarketFeatures from a Candidate's RedrobSignals."""

    def __init__(
        self,
        role_salary_min_lpa: float = DEFAULT_ROLE_SALARY_MIN_LPA,
        role_salary_max_lpa: float = DEFAULT_ROLE_SALARY_MAX_LPA,
        reference_date: date = REFERENCE_DATE,
    ) -> None:
        """Initializes the extractor with role-specific compensation context.

        Args:
            role_salary_min_lpa: Minimum salary budget for the role (INR LPA).
            role_salary_max_lpa: Maximum salary budget for the role (INR LPA).
            reference_date:      Reference date for staleness calculations.
        """
        self.role_salary_min = role_salary_min_lpa
        self.role_salary_max = role_salary_max_lpa
        self.reference_date = reference_date

    # ── Individual Signal Calculators ─────────────────────────────────────────

    def calculate_availability_score(self, signals: RedrobSignals) -> float:
        """Composite availability signal.

        Components:
          - open_to_work_flag (40%)
          - notice period shortness (40%)
          - recent activity (20%)

        Args:
            signals: RedrobSignals.

        Returns:
            float: Availability score in [0.0, 1.0].
        """
        open_flag = 1.0 if signals.open_to_work_flag else 0.2
        notice_score = max(
            0.0, 1.0 - signals.notice_period_days / MAX_NOTICE_PERIOD_DAYS
        )
        days_inactive = signals.days_since_last_active(self.reference_date)
        activity_score = max(0.0, 1.0 - days_inactive / 90.0)

        return round(
            0.40 * open_flag + 0.40 * notice_score + 0.20 * activity_score,
            4,
        )

    def calculate_engagement_score(self, signals: RedrobSignals) -> float:
        """Recruiter engagement proxy from platform interaction data.

        Combines:
          - profile views in last 30d (normalized at 50 views = 1.0)
          - saved by recruiters in last 30d (normalized at 10 saves = 1.0)
          - recruiter_response_rate

        Args:
            signals: RedrobSignals.

        Returns:
            float: Engagement score in [0.0, 1.0].
        """
        views_score = min(1.0, signals.profile_views_received_30d / 50.0)
        saves_score = min(1.0, signals.saved_by_recruiters_30d / 10.0)
        response_score = signals.recruiter_response_rate

        return round(
            0.35 * response_score + 0.35 * saves_score + 0.30 * views_score,
            4,
        )

    def calculate_profile_strength(self, signals: RedrobSignals) -> float:
        """Profile completeness and verification strength.

        Components:
          - profile_completeness_score (normalized from 0–100)
          - verified email + phone
          - linkedin_connected
          - assessment score presence

        Args:
            signals: RedrobSignals.

        Returns:
            float: Profile strength score in [0.0, 1.0].
        """
        completeness = signals.profile_completeness_score / 100.0
        verification = (
            (0.4 if signals.verified_email else 0.0)
            + (0.4 if signals.verified_phone else 0.0)
            + (0.2 if signals.linkedin_connected else 0.0)
        )
        has_assessments = 1.0 if signals.skill_assessment_scores else 0.0

        return round(
            0.50 * completeness + 0.30 * verification + 0.20 * has_assessments,
            4,
        )

    def calculate_salary_alignment(self, signals: RedrobSignals) -> float:
        """Salary range overlap between candidate expectations and role budget.

        Perfect overlap → 1.0. No overlap → 0.0.
        Partial overlap is scored proportionally.

        Args:
            signals: RedrobSignals.

        Returns:
            float: Salary alignment score in [0.0, 1.0].
        """
        cand_min = signals.expected_salary_range_inr_lpa.min
        cand_max = signals.expected_salary_range_inr_lpa.max
        role_min = self.role_salary_min
        role_max = self.role_salary_max

        overlap_lo = max(cand_min, role_min)
        overlap_hi = min(cand_max, role_max)
        overlap = max(0.0, overlap_hi - overlap_lo)
        cand_range = max(0.01, cand_max - cand_min)

        return round(min(1.0, overlap / cand_range), 4)

    def calculate_relocation_score(self, signals: RedrobSignals, is_remote: bool = False) -> float:
        """Relocation/remote work flexibility score.

        Args:
            signals:   RedrobSignals.
            is_remote: True if the role is remote-friendly.

        Returns:
            float: Relocation score in [0.0, 1.0].
        """
        if is_remote:
            return 1.0
        if signals.willing_to_relocate:
            return 1.0
        if signals.preferred_work_mode in ("remote", "flexible"):
            return 0.75
        return 0.25

    def calculate_market_interest(self, signals: RedrobSignals) -> float:
        """Market demand proxy from applications and search appearances.

        Args:
            signals: RedrobSignals.

        Returns:
            float: Market interest score in [0.0, 1.0].
        """
        apps_score = min(1.0, signals.applications_submitted_30d / 10.0)
        search_score = min(1.0, signals.search_appearance_30d / 100.0)
        completion_score = signals.interview_completion_rate
        offer_score = max(0.0, signals.offer_acceptance_rate)  # may be -1

        return round(
            0.35 * completion_score + 0.25 * offer_score
            + 0.20 * apps_score + 0.20 * search_score,
            4,
        )

    # ── Main Extraction ───────────────────────────────────────────────────────

    def extract_features(
        self,
        candidate: Candidate,
        is_remote_role: bool = False,
    ) -> MarketFeatures:
        """Extracts MarketFeatures from a Candidate's RedrobSignals.

        Args:
            candidate:      Raw Candidate record.
            is_remote_role: Whether the target role allows remote work.

        Returns:
            MarketFeatures: Populated feature object.
        """
        signals = candidate.redrob_signals

        features = MarketFeatures(
            availability_score=self.calculate_availability_score(signals),
            recruiter_engagement_score=self.calculate_engagement_score(signals),
            profile_strength_score=self.calculate_profile_strength(signals),
            salary_alignment_score=self.calculate_salary_alignment(signals),
            relocation_score=self.calculate_relocation_score(signals, is_remote_role),
            market_interest_score=self.calculate_market_interest(signals),
        )

        logger.debug(
            f"MarketFeatureExtractor: {candidate.candidate_id} → "
            f"overall={features.overall_market_score():.3f}"
        )
        return features
