"""Ranking Evaluator service — Phase 13: Final Recruiter Ranking Engine.

Evaluates the overall quality, alignment, and distribution of the generated shortlist.
"""

from typing import List, Dict, Any
from models.ranked_candidate import RankedCandidate
from models.parsed_jd import ParsedJD
from utils.logger import get_logger

logger = get_logger(__name__)


class RankingEvaluator:
    """Evaluates ranked candidate lists against JD targets for quality assurance."""

    @staticmethod
    def evaluate_shortlist(
        ranked_candidates: List[RankedCandidate],
        parsed_jd: ParsedJD,
        top_n: int = 5,
    ) -> Dict[str, Any]:
        """Runs quality and alignment analysis on the top candidates.

        Args:
            ranked_candidates: Ordered list of RankedCandidate objects.
            parsed_jd: Parsed Job Description targets.
            top_n: Number of top candidates to evaluate.

        Returns:
            Dict[str, Any]: Quality evaluation metrics.
        """
        if not ranked_candidates:
            return {
                "evaluation_verdict": "Empty Pool",
                "must_have_coverage_top_n": 0.0,
                "average_experience_top_n": 0.0,
                "recommendation_rate": 0.0,
                "average_reliability_top_n": 0.0,
            }

        subset = ranked_candidates[:top_n]
        top_n_actual = len(subset)

        # 1. Calculate average experience
        avg_exp = sum(c.reasoning_trace.raw_signals_captured.get("candidate_experience_years", 0.0) for c in subset if c.reasoning_trace) / top_n_actual

        # 2. Calculate average reliability score
        avg_reliability = sum(c.score_details.reliability_score for c in subset) / top_n_actual

        # 3. Calculate recommendation rate (Strong or Good Match in top N)
        recommended_count = sum(
            1 for c in subset if c.explanation and c.explanation.fit_verdict in ("Strong Match", "Good Match")
        )
        rec_rate = recommended_count / top_n_actual

        # 4. Must-have skill coverage top N
        jd_skills = parsed_jd.get_required_skills()
        avg_skill_coverage = 0.0
        if jd_skills:
            total_coverage = 0.0
            for c in subset:
                matching = c.reasoning_trace.raw_signals_captured.get("matching_skills_count", 0) if c.reasoning_trace else 0
                total_coverage += (matching / len(jd_skills))
            avg_skill_coverage = total_coverage / top_n_actual

        # Bottom-line verdict
        if rec_rate >= 0.8 and avg_reliability >= 0.8:
            verdict = "Excellent Candidate Pool"
        elif rec_rate >= 0.5:
            verdict = "Satisfactory Candidate Pool"
        else:
            verdict = "Needs Attention / Low Match Rate"

        evaluation_results = {
            "evaluation_verdict": verdict,
            "must_have_coverage_top_n": round(avg_skill_coverage, 4),
            "average_experience_top_n": round(avg_exp, 2),
            "recommendation_rate": round(rec_rate, 4),
            "average_reliability_top_n": round(avg_reliability, 4),
            "top_n_evaluated": top_n_actual,
        }

        logger.info(f"Shortlist evaluation results: {evaluation_results}")
        return evaluation_results
