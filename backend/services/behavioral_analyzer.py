"""Behavioral signals analyzer service.

Translates Redrob platform engagement features into normalized candidate behavioral metrics.
"""

from datetime import date
from models.candidate import Candidate
from models.behavioral_profile import BehavioralProfile
from utils.logger import get_logger

logger = get_logger(__name__)


class BehavioralAnalyzer:
    """Analyzes platform activity, response latency, and verifications."""

    @staticmethod
    def calculate_availability(candidate: Candidate) -> float:
        """Calculates candidate availability score.

        Weighs open-to-work flags, notice period limits, and active login dates.

        Args:
            candidate: Candidate aggregate.
        """
        signals = candidate.redrob_signals
        score = 0.0

        # 1. Open to work flag (base weight)
        if signals.open_to_work_flag:
            score += 0.60

        # 2. Notice period (smaller notice is better for fast hiring)
        notice = signals.notice_period_days
        if notice <= 15:
            score += 0.30
        elif notice <= 30:
            score += 0.25
        elif notice <= 60:
            score += 0.15
        elif notice <= 90:
            score += 0.05

        # 3. Active login date
        # Active in last 30 days
        if signals.is_recently_active(date(2026, 6, 15), days=30):
            score += 0.10
        elif signals.is_recently_active(date(2026, 6, 15), days=90):
            score += 0.05

        return round(min(1.0, max(0.0, score)), 2)

    @staticmethod
    def calculate_responsiveness(candidate: Candidate) -> float:
        """Calculates candidate response reliability.

        Combines recruiter response rates and typical response latency.

        Args:
            candidate: Candidate aggregate.
        """
        signals = candidate.redrob_signals

        # Response rate directly
        rate = signals.recruiter_response_rate

        # Response time factor
        hours = signals.avg_response_time_hours
        if hours <= 2.0:
            time_factor = 1.0
        elif hours <= 12.0:
            time_factor = 0.90
        elif hours <= 24.0:
            time_factor = 0.75
        elif hours <= 72.0:
            time_factor = 0.50
        else:
            time_factor = 0.20

        # Combine: 70% rate, 30% speed
        score = (0.70 * rate) + (0.30 * time_factor)
        return round(min(1.0, max(0.0, score)), 2)

    @staticmethod
    def calculate_engagement(candidate: Candidate) -> float:
        """Calculates platform application activity levels.

        Args:
            candidate: Candidate aggregate.
        """
        signals = candidate.redrob_signals

        # Base calculations on profile views and application counts
        views = min(1.0, signals.profile_views_received_30d / 50.0)
        apps = min(1.0, signals.applications_submitted_30d / 10.0)

        score = (0.40 * views) + (0.60 * apps)
        return round(min(1.0, max(0.0, score)), 2)

    @staticmethod
    def calculate_verification(candidate: Candidate) -> float:
        """Calculates profile verification level.

        Checks email, phone, and LinkedIn connections.

        Args:
            candidate: Candidate aggregate.
        """
        signals = candidate.redrob_signals
        score = 0.0

        if signals.verified_email:
            score += 0.40
        if signals.verified_phone:
            score += 0.40
        if signals.linkedin_connected:
            score += 0.20

        return round(min(1.0, max(0.0, score)), 2)

    def generate_behavioral_profile(self, candidate: Candidate) -> BehavioralProfile:
        """Evaluates and builds a complete BehavioralProfile.

        Args:
            candidate: Candidate aggregate.
        """
        availability = self.calculate_availability(candidate)
        responsiveness = self.calculate_responsiveness(candidate)
        engagement = self.calculate_engagement(candidate)
        verification = self.calculate_verification(candidate)

        # Directly match completion rate and activity indexes
        reliability = candidate.redrob_signals.interview_completion_rate
        # Map GitHub and search occurrences to general activity metrics
        activity = min(1.0, candidate.redrob_signals.search_appearance_30d / 300.0)

        return BehavioralProfile(
            availability_score=availability,
            responsiveness_score=responsiveness,
            engagement_score=engagement,
            interview_reliability=reliability,
            market_activity_score=activity,
            verification_score=verification,
        )
