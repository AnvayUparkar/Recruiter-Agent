"""Candidate intelligence profiler service.

Coordinates individual analyzers (technical, career, behavioral, market)
to build the aggregate CandidateProfile.
"""

from models.candidate import Candidate
from models.candidate_profile import CandidateProfile
from models.technical_profile import TechnicalProfile
from models.career_profile import CareerProfile
from models.behavioral_profile import BehavioralProfile
from models.market_profile import MarketProfile

from services.skill_analyzer import SkillAnalyzer
from services.career_analyzer import CareerAnalyzer
from services.behavioral_analyzer import BehavioralAnalyzer
from services.market_analyzer import MarketAnalyzer
from services.candidate_text_builder import CandidateTextBuilder
from utils.logger import get_logger

logger = get_logger(__name__)


class CandidateProfiler:
    """Orchestrates individual sub-profile analyzers to generate complete candidate profiles."""

    def __init__(
        self,
        skill_analyzer: SkillAnalyzer = None,
        career_analyzer: CareerAnalyzer = None,
        behavioral_analyzer: BehavioralAnalyzer = None,
        market_analyzer: MarketAnalyzer = None,
    ):
        """Initializes the profiler with analyzers.

        Args:
            skill_analyzer: SkillAnalyzer instance.
            career_analyzer: CareerAnalyzer instance.
            behavioral_analyzer: BehavioralAnalyzer instance.
            market_analyzer: MarketAnalyzer instance.
        """
        self.skill_analyzer = skill_analyzer or SkillAnalyzer()
        self.career_analyzer = career_analyzer or CareerAnalyzer()
        self.behavioral_analyzer = behavioral_analyzer or BehavioralAnalyzer()
        self.market_analyzer = market_analyzer or MarketAnalyzer()

    def profile_candidate(self, candidate: Candidate) -> CandidateProfile:
        """Runs all sub-analyzers, computes overall strength, generates summary, and returns the profile.

        Args:
            candidate: Candidate aggregate.

        Returns:
            CandidateProfile: Complete intelligence profile.
        """
        # 1. Analyze Skills & build TechnicalProfile
        skills_dict = self.skill_analyzer.analyze_skills(candidate)
        technical_profile = TechnicalProfile(
            retrieval_experience=skills_dict["retrieval"]["score"],
            ranking_experience=skills_dict["ranking"]["score"],
            recommendation_experience=skills_dict["recommendation"]["score"],
            vector_database_experience=skills_dict["vector_db"]["score"],
            llm_experience=skills_dict["llm"]["score"],
            python_experience=skills_dict["python"]["score"],
            evaluation_experience=skills_dict["evaluation"]["score"],
            fine_tuning_experience=skills_dict["fine_tuning"]["score"],
            distributed_systems_experience=skills_dict["distributed_systems"]["score"],
            production_ml_experience=skills_dict["production_ml"]["score"],
            open_source_signal=skills_dict["open_source"]["score"],
            github_signal=skills_dict["github"]["score"],
        )

        # 2. Analyze Career
        career_profile = self.career_analyzer.generate_career_profile(candidate)

        # 3. Analyze Behavioral
        behavioral_profile = self.behavioral_analyzer.generate_behavioral_profile(candidate)

        # 4. Analyze Market
        market_profile = self.market_analyzer.generate_market_profile(candidate)

        # 5. Calculate overall strength
        overall_strength = self.calculate_overall_strength(
            technical_profile, career_profile, behavioral_profile, market_profile
        )

        # 6. Generate summary
        summary = self.generate_summary(
            candidate, technical_profile, career_profile, behavioral_profile, market_profile
        )

        # 7. Create and return CandidateProfile
        return CandidateProfile(
            candidate_id=candidate.candidate_id,
            technical_profile=technical_profile,
            career_profile=career_profile,
            behavioral_profile=behavioral_profile,
            market_profile=market_profile,
            candidate_summary=summary,
            overall_strength=overall_strength,
        )

    @staticmethod
    def calculate_overall_strength(
        technical: TechnicalProfile,
        career: CareerProfile,
        behavioral: BehavioralProfile,
        market: MarketProfile,
    ) -> float:
        """Computes the aggregate profile strength score.

        Weights: Technical 40%, Career 20%, Behavioral 20%, Market 20%.

        Args:
            technical: Technical experience profile.
            career: Career trajectory profile.
            behavioral: Behavioral engagement profile.
            market: Market attractiveness profile.

        Returns:
            float: Score from 0.0 to 1.0.
        """
        tech_strength = technical.technical_strength_score()
        career_strength = career.career_strength_score()
        behavioral_strength = behavioral.behavioral_strength_score()
        market_strength = market.market_strength_score()

        score = (
            0.40 * tech_strength
            + 0.20 * career_strength
            + 0.20 * behavioral_strength
            + 0.20 * market_strength
        )
        return round(min(1.0, max(0.0, score)), 2)

    @staticmethod
    def generate_summary(
        candidate: Candidate,
        technical: TechnicalProfile,
        career: CareerProfile,
        behavioral: BehavioralProfile,
        market: MarketProfile,
    ) -> str:
        """Delegates summary generation to CandidateTextBuilder.

        Args:
            candidate: Candidate aggregate.
            technical: Technical profile.
            career: Career profile.
            behavioral: Behavioral profile.
            market: Market profile.

        Returns:
            str: Recruiter summary string.
        """
        return CandidateTextBuilder.build_short_summary(
            candidate, technical, career, behavioral, market
        )
