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

    @staticmethod
    def compare_multiple_candidates(
        candidates: List[Candidate],
        feature_vectors: List[FeatureVector],
        scores: List[RankingScore],
        reliability_profiles: List[ReliabilityProfile],
    ) -> CandidateComparisonResult:
        """Determines the superior candidate among 2 to 5 finalists and generates comparison structures.

        Args:
            candidates: List of Candidate models.
            feature_vectors: List of corresponding FeatureVector models.
            scores: List of corresponding RankingScore models.
            reliability_profiles: List of corresponding ReliabilityProfile models.

        Returns:
            CandidateComparisonResult: Detailed multi-candidate comparison result.
        """
        if not candidates or len(candidates) < 2:
            raise ValueError("Must compare at least 2 candidates.")

        # Determine winner based on highest composite score
        sorted_indices = sorted(range(len(scores)), key=lambda i: scores[i].final_score, reverse=True)
        winner_idx = sorted_indices[0]
        winner_cand = candidates[winner_idx]
        winner_score = scores[winner_idx].final_score
        winner_id = winner_cand.candidate_id
        winner_name = winner_cand.profile.anonymized_name or winner_id

        # Calculate score difference of the top two for decision confidence
        if len(scores) >= 2:
            second_idx = sorted_indices[1]
            score_diff = abs(winner_score - scores[second_idx].final_score)
        else:
            score_diff = 0.0

        # Decision confidence based on score margin of top 2
        if score_diff >= 0.15:
            confidence = 0.95
        elif score_diff >= 0.08:
            confidence = 0.85
        elif score_diff >= 0.03:
            confidence = 0.70
        else:
            confidence = 0.55

        # winner reason text
        winner_reason = f"{winner_name} represents the most aligned candidate match based on aggregate evaluation "
        if len(scores) >= 2:
            second_cand = candidates[sorted_indices[1]]
            second_name = second_cand.profile.anonymized_name or second_cand.candidate_id
            winner_reason += f"with a final composite score of {winner_score*100:.1f}% vs {second_name} at {scores[second_idx].final_score*100:.1f}%. "
        else:
            winner_reason += f"with a composite score of {winner_score*100:.1f}%. "

        # Enrich winner description
        tech_winner = scores[winner_idx].technical_score if hasattr(scores[winner_idx], "technical_score") else 0.5
        rp_winner = reliability_profiles[winner_idx].reliability_score if hasattr(reliability_profiles[winner_idx], "reliability_score") else 0.5
        winner_reason += f"{winner_name} exhibits strong competencies across core parameters"
        if tech_winner >= 0.8:
            winner_reason += " with outstanding technical scores"
        if rp_winner >= 0.8:
            winner_reason += " and profile authenticity confirmation."
        else:
            winner_reason += "."

        strength_comparison = {}
        weakness_comparison = {}
        risk_differences = {}

        for idx, cand in enumerate(candidates):
            cid = cand.candidate_id
            rp = reliability_profiles[idx]
            strength_comparison[cid] = f"Years of exp: {cand.total_years_experience:.1f}. Skills: {len(cand.skills)}."
            weakness_comparison[cid] = f"Notice period: {cand.redrob_signals.notice_period_days} days. Reliability tier: {rp.reliability_tier()}."
            risk_differences[cid] = f"Overall fraud risk: {rp.fraud_profile.overall_fraud_risk if rp.fraud_profile else 0.0:.2f}"

        # Populate pairwise fields for schema compliance (using first two candidates)
        cand_a_id = candidates[0].candidate_id
        cand_b_id = candidates[1].candidate_id

        tech_a = feature_vectors[0].technical_features.technical_score if hasattr(feature_vectors[0], "technical_features") else 0.5
        tech_b = feature_vectors[1].technical_features.technical_score if hasattr(feature_vectors[1], "technical_features") else 0.5
        match_a = feature_vectors[0].matching_features.matching_score if hasattr(feature_vectors[0], "matching_features") else 0.5
        match_b = feature_vectors[1].matching_features.matching_score if hasattr(feature_vectors[1], "matching_features") else 0.5

        feature_differences = {
            "technical_score_diff": round(tech_a - tech_b, 4),
            "matching_score_diff": round(match_a - match_b, 4),
            "experience_years_diff": round(candidates[0].total_years_experience - candidates[1].total_years_experience, 2),
            "reliability_score_diff": round(reliability_profiles[0].reliability_score - reliability_profiles[1].reliability_score, 4),
        }

        return CandidateComparisonResult(
            candidate_a=cand_a_id,
            candidate_b=cand_b_id,
            winner=winner_id,
            winner_reason=winner_reason.strip(),
            strength_comparison=strength_comparison,
            weakness_comparison=weakness_comparison,
            feature_differences=feature_differences,
            risk_differences=risk_differences,
            decision_confidence=confidence
        )

