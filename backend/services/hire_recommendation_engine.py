"""Hire Recommendation Engine — Phase 15: AI Recruiter Copilot.

Determines hiring recommendation tiers and aggregates supporting evidence.
"""

from typing import List, Dict
from models.candidate import Candidate
from models.behavioral_intelligence import BehavioralIntelligence
from models.reliability_profile import ReliabilityProfile
from models.parsed_jd import ParsedJD
from models.hire_recommendation import HireRecommendation, RecommendationTier
from utils.logger import get_logger

logger = get_logger(__name__)


class HireRecommendationEngine:
    """Computes evidence-backed candidate screening tiers based on scores and signals."""

    @staticmethod
    def generate_recommendation(
        candidate: Candidate,
        final_score: float,
        confidence: float,
        behavioral_intel: BehavioralIntelligence,
        reliability_profile: ReliabilityProfile,
        parsed_jd: ParsedJD,
    ) -> HireRecommendation:
        """Determines the recommendation tier and gathers factual validation highlights.

        Args:
            candidate: Candidate aggregate.
            final_score: Calibrated final score from ranking service.
            confidence: Confidence score of ranking.
            behavioral_intel: Candidate behavioral intelligence.
            reliability_profile: Candidate reliability status.
            parsed_jd: Job description specification.

        Returns:
            HireRecommendation: The generated structured recommendation.
        """
        # Extract core signals
        rel_score = reliability_profile.reliability_score
        avail_score = behavioral_intel.availability_score
        resp_rate = candidate.redrob_signals.recruiter_response_rate
        notice_days = candidate.redrob_signals.notice_period_days

        # Calculate skill coverage
        jd_skills = {req.name.lower() for req in parsed_jd.must_have}
        cand_skills = {s.name.lower() for s in candidate.skills}
        matching_skills = jd_skills.intersection(cand_skills)
        skill_coverage_pct = (len(matching_skills) / len(jd_skills)) * 100.0 if jd_skills else 100.0

        # Collect evidence list
        evidence: List[str] = [
            f"{skill_coverage_pct:.0f}% must-have skill coverage ({len(matching_skills)} of {len(jd_skills)} skills matched)",
            f"Profile reliability score is {rel_score:.2f} ({reliability_profile.reliability_tier()})",
            f"Recruiter response rate is {resp_rate * 100:.0f}% with notice period of {notice_days} days",
            f"Calibrated final score is {final_score:.2f} with {confidence * 100:.0f}% score confidence",
        ]

        strengths: List[str] = []
        risks: List[str] = []
        missing_requirements: List[str] = []

        # Map strengths/weaknesses and requirements
        if skill_coverage_pct >= 80.0:
            strengths.append(f"Outstanding JD required skill matching ({skill_coverage_pct:.0f}%).")
        if rel_score >= 0.85:
            strengths.append("High profile reliability and verification score.")
        if notice_days <= 15:
            strengths.append("Immediate availability (notice period <= 15 days).")

        # Map risks and gaps
        if rel_score < 0.60:
            risks.append(f"Low profile reliability multiplier ({rel_score:.2f}).")
        if notice_days >= 90:
            risks.append(f"Long transition period (notice period of {notice_days} days).")
        if resp_rate < 0.60:
            risks.append(f"Low responsiveness indicator ({resp_rate * 100:.0f}% response rate).")

        # Map missing requirements
        missing = jd_skills - cand_skills
        for skill in missing:
            missing_requirements.append(skill.capitalize())

        # Determine Recommendation Tier
        # Conditions:
        # Strong Hire: final_score > 0.90 AND reliability_score > 0.85 AND availability_score > 0.70
        # Hire: final_score > 0.80
        # Interview: final_score > 0.70
        # Consider: final_score > 0.55
        # Reject: otherwise
        if final_score > 0.90 and rel_score > 0.85 and avail_score > 0.70:
            tier = RecommendationTier.STRONG_HIRE
            reasoning = "Excellent candidate matching all core skills, high availability, and profile credibility."
        elif final_score > 0.80:
            tier = RecommendationTier.HIRE
            reasoning = "Solid candidate exhibiting robust technical qualifications and good JD alignment."
        elif final_score > 0.70:
            tier = RecommendationTier.INTERVIEW
            reasoning = "Candidate meets most criteria and is recommended for a structured interview round."
        elif final_score > 0.55:
            tier = RecommendationTier.CONSIDER
            reasoning = "Candidate matches some criteria; consider as a backup option if finalists drop out."
        else:
            tier = RecommendationTier.REJECT
            reasoning = "Candidate does not meet must-have technical qualifications or exhibits high reliability risks."

        return HireRecommendation(
            recommendation=tier,
            confidence=round(confidence, 2),
            reasoning=reasoning,
            strengths=strengths,
            risks=risks,
            missing_requirements=missing_requirements,
            evidence=evidence
        )
