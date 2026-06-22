"""Final Ranking Service — Phase 13: Final Recruiter Ranking Engine.

Orchestrates the complete final candidate evaluation, ranking, calibration, and explanation pipeline.
"""

import time
from typing import List, Dict, Optional, Any
from models.candidate import Candidate
from models.parsed_jd import ParsedJD
from models.feature_vector import FeatureVector
from models.behavioral_intelligence import BehavioralIntelligence
from models.reliability_profile import ReliabilityProfile
from models.ranked_candidate import RankedCandidate
from models.ranking_response import RankingResponse
from services.feature_weight_manager import FeatureWeightManager
from services.ranking_strategy import RankingStrategy, RankingStrategyType
from services.score_aggregator import ScoreAggregator
from services.ranking_calibrator import RankingCalibrator
from services.ranking_engine import RankingEngine
from services.recruiter_reasoning import RecruiterReasoning
from services.ranking_explainer import RankingExplainer
from services.ranking_evaluator import RankingEvaluator
from utils.logger import get_logger

logger = get_logger(__name__)


class FinalRankingService:
    """The unified orchestrator pipeline for final recruiter rankings."""

    def __init__(
        self,
        weight_manager: Optional[FeatureWeightManager] = None,
        ranking_strategy: Optional[RankingStrategy] = None,
        score_aggregator: Optional[ScoreAggregator] = None,
        calibrator: Optional[RankingCalibrator] = None,
        engine: Optional[RankingEngine] = None,
    ):
        self.weight_manager = weight_manager or FeatureWeightManager()
        self.ranking_strategy = ranking_strategy or RankingStrategy()
        self.score_aggregator = score_aggregator or ScoreAggregator()
        self.calibrator = calibrator or RankingCalibrator()
        self.engine = engine or RankingEngine()

    def rank_candidates(
        self,
        candidates: List[Candidate],
        feature_vectors: Dict[str, FeatureVector],
        behavioral_intels: Dict[str, BehavioralIntelligence],
        reliability_profiles: Dict[str, ReliabilityProfile],
        parsed_jd: ParsedJD,
        strategy: RankingStrategyType = RankingStrategyType.BALANCED,
    ) -> RankingResponse:
        """Executes the end-to-end recruiter ranking pipeline.

        Args:
            candidates: Pool of candidate agregates to evaluate.
            feature_vectors: Mapping of candidate_id to feature representation.
            behavioral_intels: Mapping of candidate_id to behavioral profile.
            reliability_profiles: Mapping of candidate_id to quality and fraud profile.
            parsed_jd: Job specification parser model.
            strategy: Ranking prioritisation strategy type.

        Returns:
            RankingResponse: Ordered, scored, calibrated, and explained shortlist.
        """
        start_time_ns = time.perf_counter_ns()
        total_candidates = len(candidates)
        logger.info(f"Starting final ranking pipeline for {total_candidates} candidates under strategy: {strategy.value}")

        # 1. Derive base weights for Job Description
        base_weights = self.weight_manager.get_weights_for_jd(parsed_jd)

        # 2. Modify weights according to strategy type
        active_weights = self.ranking_strategy.adjust_weights(base_weights, strategy)
        logger.info(f"Active weight configuration: {active_weights}")

        # 3. Score all candidates
        scoring_records = []
        candidates_by_id: Dict[str, Candidate] = {c.candidate_id: c for c in candidates}

        for candidate in candidates:
            cid = candidate.candidate_id
            fv = feature_vectors.get(cid)
            bi = behavioral_intels.get(cid)
            rp = reliability_profiles.get(cid)

            if not fv or not bi or not rp:
                logger.warning(
                    f"Candidate {cid} is missing critical feature or profile inputs. Skipping from ranking."
                )
                continue

            # Run aggregation
            score = self.score_aggregator.aggregate(
                candidate=candidate,
                feature_vector=fv,
                behavioral_intel=bi,
                reliability_profile=rp,
                weights=active_weights,
            )
            scoring_records.append(score)

        # 4. Calibrate scores to avoid compression
        self.calibrator.calibrate_pool(scoring_records)

        # 5. Deterministically sort scores
        sorted_scores = self.engine.rank_scores(scoring_records)

        # 6. Build final shortlists with explanations and reasoning traces
        ranked_candidates: List[RankedCandidate] = []
        for index, score in enumerate(sorted_scores):
            rank = index + 1
            cid = score.candidate_id
            candidate = candidates_by_id[cid]
            fv = feature_vectors[cid]
            bi = behavioral_intels[cid]
            rp = reliability_profiles[cid]

            # Recruiter reasoning
            trace = RecruiterReasoning.capture_trace(
                candidate=candidate,
                parsed_jd=parsed_jd,
                feature_vector=fv,
                behavioral_intel=bi,
                reliability_profile=rp,
                score=score,
            )

            # Recruiter explanation
            explanation = RankingExplainer.generate_explanation(
                candidate=candidate,
                parsed_jd=parsed_jd,
                score=score,
                trace=trace,
            )

            ranked_candidates.append(
                RankedCandidate(
                    candidate_id=cid,
                    rank=rank,
                    final_score=score.final_score,
                    confidence=score.confidence,
                    score_details=score,
                    explanation=explanation,
                    reasoning_trace=trace,
                )
            )

        # 7. Evaluate generated shortlist
        evaluation_summary = RankingEvaluator.evaluate_shortlist(ranked_candidates, parsed_jd)

        # Finalize processing latency
        end_time_ns = time.perf_counter_ns()
        latency_ms = (end_time_ns - start_time_ns) / 1_000_000.0

        logger.info(f"Ranking pipeline finished in {latency_ms:.2f}ms with {len(ranked_candidates)} candidates output.")

        metadata: Dict[str, Any] = {
            "strategy": strategy.value,
            "evaluation_verdict": evaluation_summary.get("evaluation_verdict"),
            "must_have_coverage_top_n": evaluation_summary.get("must_have_coverage_top_n"),
            "average_reliability_top_n": evaluation_summary.get("average_reliability_top_n"),
        }

        return RankingResponse(
            job_title=parsed_jd.job_title,
            total_candidates_evaluated=total_candidates,
            ranked_candidates=ranked_candidates,
            applied_weights=active_weights,
            processing_time_ms=round(latency_ms, 2),
            ranking_metadata=metadata,
        )
