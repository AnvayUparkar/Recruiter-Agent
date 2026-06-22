"""Strengths Extractor — Phase 15: AI Recruiter Copilot.

Extracts candidate highlights and gaps dynamically and factually.
"""

from typing import List
from models.candidate import Candidate
from models.feature_vector import FeatureVector
from models.parsed_jd import ParsedJD
from utils.logger import get_logger

logger = get_logger(__name__)


class StrengthsExtractor:
    """Extracts top candidate strengths and weaknesses based on profile features and signals."""

    @staticmethod
    def extract_strengths(
        candidate: Candidate,
        feature_vector: FeatureVector,
        parsed_jd: ParsedJD,
    ) -> List[str]:
        """Identifies up to 5 verified technical and behavioral strengths.

        Args:
            candidate: Candidate aggregate.
            feature_vector: Candidate feature representation.
            parsed_jd: Job description specification.

        Returns:
            List[str]: List of candidate strengths.
        """
        strengths = []

        # 1. Experience level strength
        if candidate.total_years_experience >= 7.0:
            strengths.append(f"Experienced professional with {candidate.total_years_experience:.1f} years of tenure.")
        elif candidate.total_years_experience >= 4.0:
            strengths.append("Established career history (4+ years of experience).")

        # 2. Tenure stability strength
        if candidate.average_tenure >= 2.5:
            strengths.append(f"Excellent career stability (average of {candidate.average_tenure:.1f} years per role).")

        # 3. Technical competency strength
        tech_score = feature_vector.technical_features.technical_score if hasattr(feature_vector, "technical_features") else 0.5
        if tech_score >= 0.75:
            strengths.append("Strong technical competence matching target JD qualifications.")

        # 4. Immediate joiner strength
        notice = candidate.redrob_signals.notice_period_days
        if notice <= 15:
            strengths.append(f"High availability (notice period of {notice} days).")

        # 5. Open-source contribution
        github_val = candidate.redrob_signals.github_activity_score
        if github_val >= 70.0:
            strengths.append("Active open-source contributor (positive GitHub activity score).")

        # 6. Skill assessment score
        if candidate.redrob_signals.interview_completion_rate >= 0.95:
            strengths.append("Highly cooperative candidate with a 95%+ interview completion rate.")

        return strengths[:5]

    @staticmethod
    def extract_weaknesses(
        candidate: Candidate,
        feature_vector: FeatureVector,
        parsed_jd: ParsedJD,
    ) -> List[str]:
        """Identifies key gaps and experience limitations.

        Args:
            candidate: Candidate aggregate.
            feature_vector: Candidate feature representation.
            parsed_jd: Job description specification.

        Returns:
            List[str]: List of candidate weaknesses.
        """
        weaknesses = []

        # 1. Job hopper warning
        if candidate.average_tenure < 1.2:
            weaknesses.append(f"Job hopping alert (average tenure of {candidate.average_tenure:.1f} years per role).")

        # 2. Skill gaps
        jd_skills = {req.name.lower() for req in parsed_jd.must_have}
        cand_skills = {s.name.lower() for s in candidate.skills}
        missing = jd_skills - cand_skills
        for skill in missing:
            weaknesses.append(f"Missing required must-have skill: {skill.capitalize()}.")

        # 3. Notice period warning
        notice = candidate.redrob_signals.notice_period_days
        if notice >= 90:
            weaknesses.append(f"Long transition delay (notice period of {notice} days).")

        # 4. Limited experience warning
        if candidate.total_years_experience < 3.0:
            weaknesses.append(f"Junior-level experience profile (less than 3 years of work history).")

        # 5. Low response rate
        resp_rate = candidate.redrob_signals.recruiter_response_rate
        if resp_rate < 0.60:
            weaknesses.append(f"Low responsiveness indicator (response rate of {resp_rate * 100:.0f}%).")

        return weaknesses[:5]
