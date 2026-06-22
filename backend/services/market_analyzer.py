"""Market attractiveness analyzer service.

Computes candidate market popularity, search appearance ratios, and compensation suitabilities.
"""

from models.candidate import Candidate
from models.market_profile import MarketProfile
from utils.logger import get_logger

logger = get_logger(__name__)


class MarketAnalyzer:
    """Analyzes salary expectations, recruiter demand, and search visibility."""

    @staticmethod
    def calculate_market_interest(candidate: Candidate) -> float:
        """Measures recruiter interest based on how often the candidate was saved.

        Args:
            candidate: Candidate aggregate.
        """
        saves = candidate.redrob_signals.saved_by_recruiters_30d
        # Normalize: 20 or more saves is 1.0
        return round(min(1.0, max(0.0, saves / 20.0)), 2)

    @staticmethod
    def calculate_visibility(candidate: Candidate) -> float:
        """Evaluates search appearance occurrences.

        Args:
            candidate: Candidate aggregate.
        """
        appearances = candidate.redrob_signals.search_appearance_30d
        # Normalize: 300 or more appearances is 1.0
        return round(min(1.0, max(0.0, appearances / 300.0)), 2)

    @staticmethod
    def calculate_competitiveness(candidate: Candidate) -> float:
        """Measures the candidate's demand index in the hiring market.

        Args:
            candidate: Candidate aggregate.
        """
        signals = candidate.redrob_signals

        # Combine profile views and connection density
        views_factor = min(1.0, signals.profile_views_received_30d / 100.0)
        connections_factor = min(1.0, signals.connection_count / 1000.0)

        score = (0.50 * views_factor) + (0.50 * connections_factor)
        return round(min(1.0, max(0.0, score)), 2)

    @staticmethod
    def calculate_salary_expectation_score(candidate: Candidate) -> float:
        """Rates expected salary LPA ranges.

        Budget-friendly expectations yield higher scores.

        Args:
            candidate: Candidate aggregate.
        """
        salary_min = candidate.redrob_signals.expected_salary_range_inr_lpa.min

        # Heuristic scoring: 10 LPA or lower is 1.0, 80 LPA or higher is 0.2
        if salary_min <= 10.0:
            return 1.0
        elif salary_min >= 80.0:
            return 0.20
        else:
            # Linear scaling
            score = 1.0 - ((salary_min - 10.0) / 70.0) * 0.8
            return round(min(1.0, max(0.20, score)), 2)

    @staticmethod
    def calculate_relocation_score(candidate: Candidate) -> float:
        """Rates relocation willingness.

        Args:
            candidate: Candidate aggregate.
        """
        return 1.0 if candidate.redrob_signals.willing_to_relocate else 0.50

    def generate_market_profile(self, candidate: Candidate) -> MarketProfile:
        """Aggregates all visibility and compensation checks into a MarketProfile.

        Args:
            candidate: Candidate aggregate.
        """
        interest = self.calculate_market_interest(candidate)
        visibility = self.calculate_visibility(candidate)
        competitiveness = self.calculate_competitiveness(candidate)
        salary_score = self.calculate_salary_expectation_score(candidate)
        relocation = self.calculate_relocation_score(candidate)

        # Profile completeness score mapped 0-100 to 0.0-1.0
        quality = candidate.redrob_signals.profile_completeness_score / 100.0

        return MarketProfile(
            recruiter_interest=interest,
            search_visibility=visibility,
            profile_quality=quality,
            salary_expectation_score=salary_score,
            relocation_score=relocation,
            market_competitiveness=competitiveness,
        )
