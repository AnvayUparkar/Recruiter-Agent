"""Candidate Comparison Service — Phase 15: AI Recruiter Copilot.

Compares two candidates side-by-side on technical capability and risk features.
"""

from typing import Dict, Any, List
from models.candidate import Candidate
from models.feature_vector import FeatureVector
from models.reliability_profile import ReliabilityProfile
from models.ranking_score import RankingScore
from models.candidate_comparison_result import CandidateComparisonResult
from utils.logger import get_logger

logger = get_logger(__name__)


class CandidateComparison:
    """Provides head-to-head analysis comparing two candidates."""

    @staticmethod
    def compare_candidates(
        candidate_a: Candidate,
        fv_a: FeatureVector,
        score_a: RankingScore,
        rp_a: ReliabilityProfile,
        candidate_b: Candidate,
        fv_b: FeatureVector,
        score_b: RankingScore,
        rp_b: ReliabilityProfile,
    ) -> CandidateComparisonResult:
        """Determines the superior candidate and maps specific feature score deltas.

        Args:
            candidate_a: First candidate.
            fv_a: First candidate's feature vector.
            score_a: First candidate's ranking score.
            rp_a: First candidate's reliability profile.
            candidate_b: Second candidate.
            fv_b: Second candidate's feature vector.
            score_b: Second candidate's ranking score.
            rp_b: Second candidate's reliability profile.

        Returns:
            CandidateComparisonResult: Detailed comparison result.
        """
        cid_a = candidate_a.candidate_id
        cid_b = candidate_b.candidate_id

        # Determine winner based on final score
        if score_a.final_score >= score_b.final_score:
            winner = cid_a
            winner_name = candidate_a.profile.anonymized_name or cid_a
            loser_name = candidate_b.profile.anonymized_name or cid_b
            winner_score = score_a.final_score
            loser_score = score_b.final_score
        else:
            winner = cid_b
            winner_name = candidate_b.profile.anonymized_name or cid_b
            loser_name = candidate_a.profile.anonymized_name or cid_a
            winner_score = score_b.final_score
            loser_score = score_a.final_score

        # Calculate score difference
        score_diff = abs(winner_score - winner_score) # wait, it should be winner_score - loser_score
        score_diff = abs(score_a.final_score - score_b.final_score)

        # Decision confidence based on score margin
        if score_diff >= 0.15:
            confidence = 0.95
        elif score_diff >= 0.08:
            confidence = 0.85
        elif score_diff >= 0.03:
            confidence = 0.70
        else:
            confidence = 0.55

        # winner reason text
        winner_reason = (
            f"{winner_name} ranked higher than {loser_name} with a final score of "
            f"{winner_score:.2f} vs {loser_score:.2f} (a margin of {score_diff:.2f}). "
        )

        # Compare technical and matching features
        tech_a = fv_a.technical_features.technical_score if hasattr(fv_a, "technical_features") else 0.5
        tech_b = fv_b.technical_features.technical_score if hasattr(fv_b, "technical_features") else 0.5
        match_a = fv_a.matching_features.matching_score if hasattr(fv_a, "matching_features") else 0.5
        match_b = fv_b.matching_features.matching_score if hasattr(fv_b, "matching_features") else 0.5

        feature_differences = {
            "technical_score_diff": round(tech_a - tech_b, 4),
            "matching_score_diff": round(match_a - match_b, 4),
            "experience_years_diff": round(candidate_a.total_years_experience - candidate_b.total_years_experience, 2),
            "reliability_score_diff": round(rp_a.reliability_score - rp_b.reliability_score, 4),
        }

        # Winner specific details for reasoning
        if winner == cid_a:
            if tech_a > tech_b:
                winner_reason += f"{winner_name} exhibits stronger technical capabilities. "
            if rp_a.reliability_score > rp_b.reliability_score:
                winner_reason += f"{winner_name} holds a higher reliability rating. "
        else:
            if tech_b > tech_a:
                winner_reason += f"{winner_name} exhibits stronger technical capabilities. "
            if rp_b.reliability_score > rp_a.reliability_score:
                winner_reason += f"{winner_name} holds a higher reliability rating. "

        # Assemble summaries
        strength_comparison = {
            cid_a: f"Years of exp: {candidate_a.total_years_experience:.1f}. Skills: {len(candidate_a.skills)}.",
            cid_b: f"Years of exp: {candidate_b.total_years_experience:.1f}. Skills: {len(candidate_b.skills)}.",
        }

        weakness_comparison = {
            cid_a: f"Notice period: {candidate_a.redrob_signals.notice_period_days} days. Reliability tier: {rp_a.reliability_tier()}.",
            cid_b: f"Notice period: {candidate_b.redrob_signals.notice_period_days} days. Reliability tier: {rp_b.reliability_tier()}.",
        }

        risk_differences = {
            cid_a: f"Overall fraud risk: {rp_a.fraud_profile.overall_fraud_risk if rp_a.fraud_profile else 0.0:.2f}",
            cid_b: f"Overall fraud risk: {rp_b.fraud_profile.overall_fraud_risk if rp_b.fraud_profile else 0.0:.2f}",
        }

        return CandidateComparisonResult(
            candidate_a=cid_a,
            candidate_b=cid_b,
            winner=winner,
            winner_reason=winner_reason.strip(),
            strength_comparison=strength_comparison,
            weakness_comparison=weakness_comparison,
            feature_differences=feature_differences,
            risk_differences=risk_differences,
            decision_confidence=confidence
        )

    @staticmethod
    def generate_comparison_report(
        candidate_a: Candidate,
        fv_a: FeatureVector,
        score_a: RankingScore,
        rp_a: ReliabilityProfile,
        candidate_b: Candidate,
        fv_b: FeatureVector,
        score_b: RankingScore,
        rp_b: ReliabilityProfile,
    ) -> CandidateComparisonResult:
        """Alias to match planner design."""
        return CandidateComparison.compare_candidates(candidate_a, fv_a, score_a, rp_a, candidate_b, fv_b, score_b, rp_b)
