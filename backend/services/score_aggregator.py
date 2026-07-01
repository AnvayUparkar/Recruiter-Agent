"""Score Aggregator service — Phase 13: Final Recruiter Ranking Engine.

Performs weighted aggregation, applies bonuses and penalties, and builds the composite RankingScore.
"""

from typing import Dict, List, Tuple
from models.candidate import Candidate
from models.feature_vector import FeatureVector
from models.behavioral_intelligence import BehavioralIntelligence
from models.reliability_profile import ReliabilityProfile
from models.ranking_score import RankingScore
from utils.logger import get_logger

logger = get_logger(__name__)


class ScoreAggregator:
    """Aggregates multi-dimensional signals into a final score with audit details."""

    @staticmethod
    def aggregate(
        candidate: Candidate,
        feature_vector: FeatureVector,
        behavioral_intel: BehavioralIntelligence,
        reliability_profile: ReliabilityProfile,
        weights: Dict[str, float],
    ) -> RankingScore:
        """Runs the recruiter aggregation logic for one candidate.

        Args:
            candidate: Aggregated candidate object.
            feature_vector: Profile feature representation.
            behavioral_intel: Behavioral intelligence profile.
            reliability_profile: Profile quality and fraud profile.
            weights: Normalized weights dictionary.

        Returns:
            RankingScore: Full structured scoring details.
        """
        candidate_id = candidate.candidate_id

        # 1. Map individual dimension scores (0.0 to 1.0)
        technical_score = feature_vector.technical_features.overall_technical_score()
        career_score = feature_vector.career_features.overall_career_score()
        behavioral_score = behavioral_intel.behavioral_score
        trust_score = behavioral_intel.trust_score
        matching_score = feature_vector.matching_features.overall_matching_score()
        retrieval_score = feature_vector.matching_features.semantic_alignment_score  # use semantic/lexical mix
        leadership_score = feature_vector.leadership_features.overall_leadership_score()
        market_score = feature_vector.market_features.overall_market_score()

        # 2. Compute weighted composite score
        weighted_score = (
            weights.get("technical", 0.0) * technical_score
            + weights.get("career", 0.0) * career_score
            + weights.get("behavioral", 0.0) * behavioral_score
            + weights.get("trust", 0.0) * trust_score
            + weights.get("matching", 0.0) * matching_score
            + weights.get("retrieval", 0.0) * retrieval_score
            + weights.get("leadership", 0.0) * leadership_score
            + weights.get("market", 0.0) * market_score
        )

        # 3. Calculate bonuses
        total_bonus = 0.0
        bonuses_applied: List[str] = []

        # Bonus: Tier-1 education
        if any(getattr(edu.tier, "value", edu.tier) == "tier_1" for edu in candidate.education if edu.tier):
            total_bonus += 0.05
            bonuses_applied.append("Tier-1 Education (+0.05)")

        # Bonus: Quick notice period (<= 15 days)
        if candidate.redrob_signals.notice_period_days <= 15:
            total_bonus += 0.05
            bonuses_applied.append("Immediate Availability (+0.05)")

        # Bonus: Startup / high-tenure mix
        if candidate.average_tenure >= 2.0:
            total_bonus += 0.05
            bonuses_applied.append("Stable Tenure (>2 years avg) (+0.05)")

        # Bonus: Active GitHub contribution
        if candidate.has_github_activity:
            total_bonus += 0.05
            bonuses_applied.append("Active GitHub Contributions (+0.05)")

        # Bonus: Leadership score strength
        if leadership_score > 0.7:
            total_bonus += 0.05
            bonuses_applied.append("Strong Leadership Signal (+0.05)")

        # 4. Calculate penalties
        total_penalty = 0.0
        penalties_applied: List[str] = []

        # Penalty: Short average tenure (Job hopping)
        if candidate.average_tenure < 1.0 and candidate.average_tenure > 0:
            total_penalty += 0.10
            penalties_applied.append("Job Hopping / Short Average Tenure (-0.10)")

        # Penalty: High fraud risk penalty (derived from reliability_profile)
        fraud_risk = reliability_profile.fraud_profile.overall_fraud_risk
        if fraud_risk > 0.5:
            total_penalty += 0.15
            penalties_applied.append(f"High Profile Fraud/Consistency Risk ({fraud_risk:.2f}) (-0.15)")
        elif fraud_risk > 0.25:
            total_penalty += 0.08
            penalties_applied.append(f"Moderate Profile Fraud Risk ({fraud_risk:.2f}) (-0.08)")

        # Penalty: Large career timeline gaps
        if reliability_profile.consistency_profile.timeline_consistency < 0.6:
            total_penalty += 0.10
            penalties_applied.append("Significant Employment Timeline Gaps/Inconsistencies (-0.10)")

        # Penalty: Notice period too long
        if candidate.redrob_signals.notice_period_days >= 90:
            total_penalty += 0.05
            penalties_applied.append("Long Notice Period (90+ days) (-0.05)")

        # Cap bonuses and penalties
        total_bonus = min(0.30, total_bonus)
        total_penalty = min(0.50, total_penalty)

        # 5. Extract reliability multiplier (Phase 12 reliability score)
        reliability_mult = reliability_profile.reliability_score

        # 6. Calculate final score
        # Formula: (Weighted * Reliability) + Bonus - Penalty
        final_score = (weighted_score * reliability_mult) + total_bonus - total_penalty
        final_score = max(0.0, min(1.0, final_score))
        final_score = round(final_score, 4)

        # 7. Compute Confidence score
        # Confidence reflects how clean, complete, and consistent the signals are.
        data_completeness = candidate.redrob_signals.profile_completeness_score / 100.0
        trustworthiness_factor = reliability_profile.reliability_score
        confidence = (data_completeness + trustworthiness_factor + (1.0 - fraud_risk)) / 3.0

        return RankingScore(
            candidate_id=candidate_id,
            technical_score=technical_score,
            career_score=career_score,
            behavioral_score=behavioral_score,
            trust_score=trust_score,
            matching_score=matching_score,
            retrieval_score=retrieval_score,
            leadership_score=leadership_score,
            market_score=market_score,
            total_bonus=total_bonus,
            total_penalty=total_penalty,
            reliability_score=reliability_mult,
            weighted_score=weighted_score,
            final_score=final_score,
            confidence=confidence,
            applied_weights=weights.copy(),
            bonuses_applied=bonuses_applied,
            penalties_applied=penalties_applied,
        )
