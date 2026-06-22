"""Career Feature Extractor service.

Extracts recruiter-style career trajectory signals from a Candidate record.

Why it exists:
  Career patterns are best detected from the raw career_history list, not
  the aggregate CareerProfile. The extractor re-reads the raw job records
  to compute tenure distributions, company type mix, and growth patterns
  with full evidence — something the aggregate profile cannot provide alone.

Ranking dependency:
  Produces CareerFeatures. Career group has 20% weight in ranking.
  years_experience_score and career_stability_score are key discriminators
  between mid-level and senior engineers.
"""

import math
from typing import List, Optional, Set, Tuple
from models.candidate import Candidate
from models.candidate_profile import CandidateProfile
from models.career_features import CareerFeatures
from models.career_history import CareerHistory
from utils.logger import get_logger

logger = get_logger(__name__)

# Industries considered highly relevant for ML/search engineering roles
RELEVANT_INDUSTRIES: Set[str] = {
    "technology", "software", "internet", "e-commerce", "fintech",
    "saas", "ai", "machine learning", "data", "cloud", "search",
    "media", "gaming", "healthcare tech", "edtech", "mobility",
}

# Titles suggesting upward career progression
SENIOR_TITLE_SIGNALS: Set[str] = {
    "senior", "staff", "principal", "lead", "manager", "director",
    "head", "vp", "vice president", "architect", "fellow",
}


class CareerFeatureExtractor:
    """Extracts CareerFeatures from a Candidate record."""

    def __init__(
        self,
        max_experience_years: float = 15.0,
        target_tenure_months: float = 24.0,
        job_hopping_threshold_months: int = 12,
    ) -> None:
        """Initializes the extractor.

        Args:
            max_experience_years:           Years of experience that maps to score 1.0.
            target_tenure_months:           Average tenure that maps to score 1.0.
            job_hopping_threshold_months:   Roles shorter than this count as job hops.
        """
        self.max_experience_years = max_experience_years
        self.target_tenure_months = target_tenure_months
        self.job_hopping_threshold = job_hopping_threshold_months

    # ── Individual Signal Calculators ─────────────────────────────────────────

    def calculate_experience_score(self, years: float) -> float:
        """Maps years of experience to [0, 1] using a saturating curve.

        0 yrs → 0.0, 5 yrs → ~0.58, 10 yrs → ~0.87, 15+ yrs → 1.0

        Args:
            years: Total years of experience.

        Returns:
            float: Normalized score.
        """
        if years <= 0:
            return 0.0
        return round(min(1.0, 1 - math.exp(-years / self.max_experience_years * 3)), 4)

    def calculate_growth_score(self, career_history: List[CareerHistory]) -> float:
        """Detects upward title progression over the candidate's career.

        Heuristic: counts transitions where a later role has a senior title signal
        that the preceding role lacked.

        Args:
            career_history: Ordered list of career positions (oldest first).

        Returns:
            float: Growth score in [0.0, 1.0].
        """
        if len(career_history) < 2:
            return 0.0

        # Sort by start_date to ensure chronological order
        sorted_history = sorted(career_history, key=lambda h: h.start_date)
        progression_events = 0

        for i in range(1, len(sorted_history)):
            prev_title = sorted_history[i - 1].title.lower()
            curr_title = sorted_history[i].title.lower()
            prev_senior = any(s in prev_title for s in SENIOR_TITLE_SIGNALS)
            curr_senior = any(s in curr_title for s in SENIOR_TITLE_SIGNALS)
            if curr_senior and not prev_senior:
                progression_events += 1

        # 2 promotion events → score 1.0
        return round(min(1.0, progression_events / 2.0), 4)

    def calculate_stability_score(self, career_history: List[CareerHistory]) -> float:
        """Computes career stability as the ratio of long-tenure roles.

        Args:
            career_history: List of career positions.

        Returns:
            float: Stability score in [0.0, 1.0].
        """
        if not career_history:
            return 0.0
        long_tenure = sum(
            1 for job in career_history
            if job.duration_months >= self.job_hopping_threshold
        )
        return round(long_tenure / len(career_history), 4)

    def calculate_job_hopping_penalty(self, career_history: List[CareerHistory]) -> float:
        """Computes penalty for frequent short-tenure roles.

        Args:
            career_history: List of career positions.

        Returns:
            float: Penalty in [0.0, 1.0] (higher = more hopping).
        """
        if not career_history:
            return 0.0
        short_roles = sum(
            1 for job in career_history
            if job.duration_months < self.job_hopping_threshold
        )
        return round(short_roles / len(career_history), 4)

    def calculate_tenure_score(self, career_history: List[CareerHistory]) -> float:
        """Normalizes average tenure against the target.

        Args:
            career_history: List of career positions.

        Returns:
            float: Tenure score in [0.0, 1.0].
        """
        if not career_history:
            return 0.0
        avg = sum(j.duration_months for j in career_history) / len(career_history)
        return round(min(1.0, avg / self.target_tenure_months), 4)

    def calculate_product_company_score(self, career_history: List[CareerHistory]) -> float:
        """Fraction of roles at product-first companies.

        Args:
            career_history: List of career positions.

        Returns:
            float: Score in [0.0, 1.0].
        """
        if not career_history:
            return 0.0
        product_roles = sum(1 for j in career_history if j.is_product_company)
        return round(product_roles / len(career_history), 4)

    def calculate_startup_score(self, career_history: List[CareerHistory]) -> float:
        """Fraction of roles at small/startup companies (≤ 200 employees).

        Args:
            career_history: List of career positions.

        Returns:
            float: Score in [0.0, 1.0].
        """
        if not career_history:
            return 0.0
        startup_sizes = {"1-10", "11-50", "51-200"}
        startup_roles = sum(
            1 for j in career_history if j.company_size in startup_sizes
        )
        return round(startup_roles / len(career_history), 4)

    def calculate_consulting_penalty(self, career_history: List[CareerHistory]) -> float:
        """Penalty for heavy consulting/outsourcing background.

        A candidate who spent most of their career at TCS/Wipro-style firms
        may lack product thinking and ownership mindset.

        Args:
            career_history: List of career positions.

        Returns:
            float: Penalty in [0.0, 1.0].
        """
        if not career_history:
            return 0.0
        consulting_roles = sum(
            1 for j in career_history if not j.is_product_company
        )
        return round(consulting_roles / len(career_history), 4)

    def calculate_industry_relevance(self, career_history: List[CareerHistory]) -> float:
        """Fraction of career spent in tech/ML-relevant industries.

        Args:
            career_history: List of career positions.

        Returns:
            float: Score in [0.0, 1.0].
        """
        if not career_history:
            return 0.0
        relevant = sum(
            1 for j in career_history
            if any(ind in j.industry.lower() for ind in RELEVANT_INDUSTRIES)
        )
        return round(relevant / len(career_history), 4)

    # ── Main Extraction ───────────────────────────────────────────────────────

    def extract_features(
        self,
        candidate: Candidate,
        profile: Optional[CandidateProfile] = None,
    ) -> CareerFeatures:
        """Extracts CareerFeatures from a Candidate record.

        Args:
            candidate: Raw Candidate record (Phase 2 model).
            profile:   Optional CandidateProfile for intelligence signal blending.

        Returns:
            CareerFeatures: Populated feature object.
        """
        history = candidate.career_history
        years = candidate.total_years_experience
        cp = profile.career_profile if profile else None

        # Blend with Phase 5 signal if available
        growth_score = self.calculate_growth_score(history)
        stability_score = self.calculate_stability_score(history)
        if cp:
            growth_score = 0.6 * growth_score + 0.4 * cp.career_growth_rate
            stability_score = 0.6 * stability_score + 0.4 * cp.career_stability

        features = CareerFeatures(
            years_experience_score=self.calculate_experience_score(years),
            career_growth_score=round(min(1.0, growth_score), 4),
            career_stability_score=round(min(1.0, stability_score), 4),
            startup_experience_score=self.calculate_startup_score(history),
            product_company_score=self.calculate_product_company_score(history),
            consulting_penalty=self.calculate_consulting_penalty(history),
            research_penalty=0.0,   # Research penalty requires academic keyword scan
            job_hopping_penalty=self.calculate_job_hopping_penalty(history),
            average_tenure_score=self.calculate_tenure_score(history),
            industry_relevance_score=self.calculate_industry_relevance(history),
        )

        logger.debug(
            f"CareerFeatureExtractor: {candidate.candidate_id} → "
            f"overall={features.overall_career_score():.3f}"
        )
        return features
