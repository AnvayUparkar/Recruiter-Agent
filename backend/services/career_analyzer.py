"""Career trajectory analyzer service.

Evaluates work history lists to calculate stability, startup exposure,
product company ratios, and leadership signals.
"""

from models.candidate import Candidate
from models.career_profile import CareerProfile
from utils.logger import get_logger

logger = get_logger(__name__)


class CareerAnalyzer:
    """Analyzes work experience sequences to compute trajectory suitability metrics."""

    @staticmethod
    def calculate_average_tenure(candidate: Candidate) -> float:
        """Computes the average duration of employment positions in decimal years.

        Args:
            candidate: Candidate aggregate.
        """
        if not candidate.career_history:
            return 0.0
        total_years = sum(job.tenure_years for job in candidate.career_history)
        return total_years / len(candidate.career_history)

    def detect_job_hopping(self, candidate: Candidate) -> float:
        """Calculates career stability index.

        A score of 1.0 indicates stable tenure, while scores below 0.5 indicate job-hopping.

        Args:
            candidate: Candidate aggregate.

        Returns:
            float: Stability index (0.0 to 1.0).
        """
        avg_tenure = self.calculate_average_tenure(candidate)

        # Heuristic stability calculation
        if avg_tenure >= 3.0:
            return 1.0
        elif avg_tenure <= 1.0:
            return 0.2
        else:
            # Linear scaling between 1.0 and 3.0 years
            return round(0.2 + (avg_tenure - 1.0) * 0.4, 2)

    @staticmethod
    def detect_product_company_background(candidate: Candidate) -> float:
        """Determines the ratio of experience spent in product-based companies.

        Args:
            candidate: Candidate aggregate.
        """
        if not candidate.career_history:
            return 0.0

        product_years = sum(
            job.tenure_years for job in candidate.career_history if job.is_product_company
        )
        total_years = sum(job.tenure_years for job in candidate.career_history)

        if total_years == 0:
            return 0.0
        return round(product_years / total_years, 2)

    @staticmethod
    def detect_startup_background(candidate: Candidate) -> float:
        """Evaluates the proportion of experience spent in early-to-mid stage startups.

        Stage bounds: company size categories under 500 employees.

        Args:
            candidate: Candidate aggregate.
        """
        if not candidate.career_history:
            return 0.0

        startup_sizes = {"1-10", "11-50", "51-200", "201-500"}
        startup_years = sum(
            job.tenure_years
            for job in candidate.career_history
            if job.company_size in startup_sizes
        )
        total_years = sum(job.tenure_years for job in candidate.career_history)

        if total_years == 0:
            return 0.0
        return round(startup_years / total_years, 2)

    @staticmethod
    def detect_leadership_signals(candidate: Candidate) -> float:
        """Detects management and technical leadership roles.

        Args:
            candidate: Candidate aggregate.
        """
        if not candidate.career_history:
            return 0.0

        leadership_words = {
            "lead",
            "manager",
            "principal",
            "head",
            "director",
            "architect",
            "vp",
            "founder",
            "co-founder",
            "founding",
            "chief",
            "cto",
        }
        lead_jobs = 0
        for job in candidate.career_history:
            title_lower = job.title.lower()
            if any(word in title_lower for word in leadership_words):
                lead_jobs += 1

        return round(lead_jobs / len(candidate.career_history), 2)

    @staticmethod
    def detect_individual_contributor_signals(candidate: Candidate) -> float:
        """Detects individual contributor engineering signals.

        Args:
            candidate: Candidate aggregate.
        """
        if not candidate.career_history:
            return 0.0

        ic_words = {
            "engineer",
            "developer",
            "programmer",
            "coder",
            "consultant",
            "analyst",
            "specialist",
        }
        ic_jobs = 0
        for job in candidate.career_history:
            title_lower = job.title.lower()
            if any(word in title_lower for word in ic_words):
                ic_jobs += 1

        return round(ic_jobs / len(candidate.career_history), 2)

    @staticmethod
    def detect_career_growth(candidate: Candidate) -> float:
        """Evaluates promotions and upward title progression.

        Args:
            candidate: Candidate aggregate.
        """
        if len(candidate.career_history) <= 1:
            return 0.5  # Neutral baseline

        growth_weight = 0.5
        # Order history from oldest to newest to check progression
        sorted_jobs = sorted(candidate.career_history, key=lambda j: j.start_date)

        # Check for title changes containing hierarchical keywords
        hierarchies = ["junior", "associate", "senior", "lead", "principal", "director"]
        max_idx = -1
        first_idx = -1

        for idx, lvl in enumerate(hierarchies):
            if lvl in sorted_jobs[0].title.lower():
                first_idx = idx
            if lvl in sorted_jobs[-1].title.lower():
                max_idx = idx

        if max_idx > first_idx and first_idx != -1:
            growth_weight = 0.85
        elif len(sorted_jobs) >= 3:
            # Multi-job tenure without regression
            growth_weight = 0.70

        return growth_weight

    def generate_career_profile(self, candidate: Candidate) -> CareerProfile:
        """Aggregates work history metrics into a CareerProfile structure.

        Args:
            candidate: Candidate aggregate.
        """
        years_exp = candidate.total_years_experience
        avg_tenure = self.calculate_average_tenure(candidate)
        product_ratio = self.detect_product_company_background(candidate)
        startup_ratio = self.detect_startup_background(candidate)
        stability = self.detect_job_hopping(candidate)
        leadership = self.detect_leadership_signals(candidate)
        ic_signal = self.detect_individual_contributor_signals(candidate)
        growth = self.detect_career_growth(candidate)

        return CareerProfile(
            years_experience=years_exp,
            product_company_ratio=product_ratio,
            startup_ratio=startup_ratio,
            average_tenure=avg_tenure,
            leadership_signal=leadership,
            individual_contributor_signal=ic_signal,
            career_stability=stability,
            career_growth_rate=growth,
        )
