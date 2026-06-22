"""Recruiter Summary Generator — Phase 15: AI Recruiter Copilot.

Produces concise, evidence-grounded candidate summaries deterministically.
"""

from typing import List, Dict
from models.candidate import Candidate
from models.reliability_profile import ReliabilityProfile
from models.parsed_jd import ParsedJD
from utils.logger import get_logger

logger = get_logger(__name__)


class RecruiterSummaryGenerator:
    """Generates structured, factual candidate summary paragraphs without hallucinations."""

    @staticmethod
    def generate_summary(
        candidate: Candidate,
        reliability_profile: ReliabilityProfile,
        parsed_jd: ParsedJD,
    ) -> str:
        """Assembles a structured recruiter summary paragraph for a single candidate.

        Args:
            candidate: Candidate aggregate.
            reliability_profile: Profile reliability status.
            parsed_jd: Job description specification.

        Returns:
            str: Factual candidate review summary.
        """
        title = candidate.profile.current_title or "Professional"
        company = candidate.profile.current_company or "Unknown Company"
        exp_years = candidate.total_years_experience
        rel_tier = reliability_profile.reliability_tier()

        # Skill match overview
        jd_skills = {req.name.lower() for req in parsed_jd.must_have}
        cand_skills = {s.name.lower() for s in candidate.skills}
        matching_skills = jd_skills.intersection(cand_skills)

        # Build summary text
        summary = (
            f"{candidate.profile.anonymized_name or 'Candidate'} is a {title} "
            f"with {exp_years:.1f} total years of professional experience (currently at '{company}'). "
            f"The candidate's profile exhibits '{rel_tier}' reliability. "
        )

        # Add JD alignment indicators
        if matching_skills:
            matched_subset = list(matching_skills)[:3]
            summary += f"Shows strong alignment on must-have skills including: {', '.join(matched_subset)}. "
        else:
            summary += f"Presents general experience matching the '{parsed_jd.job_title}' requirements. "

        # Add behavioral highlight
        notice = candidate.redrob_signals.notice_period_days
        if notice <= 15:
            summary += "Notably, is an immediate joiner (notice period of 15 days or less)."
        elif notice >= 90:
            summary += "Please note the candidate has a longer notice period (90 days)."
        else:
            summary += f"Maintains a notice period of {notice} days."

        return summary.strip()

    @staticmethod
    def generate_batch_summaries(
        candidates: List[Candidate],
        reliability_profiles: Dict[str, ReliabilityProfile],
        parsed_jd: ParsedJD,
    ) -> Dict[str, str]:
        """Generates candidate summaries in batch.

        Args:
            candidates: List of Candidate aggregates.
            reliability_profiles: Mapping of candidate_id to ReliabilityProfile.
            parsed_jd: Job description specification.

        Returns:
            Dict[str, str]: Mapping of candidate_id to summary paragraph.
        """
        logger.info(f"Generating summaries for batch of {len(candidates)} candidates.")
        results = {}
        for c in candidates:
            cid = c.candidate_id
            rp = reliability_profiles.get(cid)
            if not rp:
                # Fallback empty or default reliability profile if missing
                rp = ReliabilityProfile(candidate_id=cid)
            results[cid] = RecruiterSummaryGenerator.generate_summary(c, rp, parsed_jd)
        return results
