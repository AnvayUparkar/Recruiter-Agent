"""Recruiter Trust Service — Phase 11: Behavioral Intelligence.

The main orchestration layer for the Behavioral Intelligence pipeline.

Pipeline:
    Candidate
      ↓ AvailabilityAnalyzer    → AvailabilityProfile
      ↓ EngagementAnalyzer      → EngagementProfile
      ↓ ResponsivenessAnalyzer  → ResponsivenessProfile
      ↓ TrustEngine             → TrustProfile
      ↓ JoinProbabilityEstimator→ join_probability + confidence
      ↓ BehavioralScoring       → behavioral_score
      ↓ BehavioralIntelligence  (output)

Recruiter Problem Solved:
    Provides a single entry point that ingests a Candidate object and
    returns a production-grade BehavioralIntelligence profile — ready
    for the Phase 13 Final Ranking Engine.

Performance Target:
    5,000 candidates in < 2 minutes on a single CPU core.
    Streaming support for memory-constrained environments.
    Batch processing with configurable chunk sizes.
"""

import logging
import time
from typing import Dict, Iterator, List, Optional

from models.behavioral_intelligence import BehavioralIntelligence
from models.candidate import Candidate
from services.availability_analyzer import AvailabilityAnalyzer
from services.engagement_analyzer import EngagementAnalyzer
from services.responsiveness_analyzer import ResponsivenessAnalyzer
from services.trust_engine import TrustEngine
from services.join_probability_estimator import JoinProbabilityEstimator
from services.behavioral_scoring import BehavioralScoring, ScoringConfig

logger = logging.getLogger(__name__)

# ── Default batch-processing chunk size ────────────────────────────────────────
DEFAULT_CHUNK_SIZE: int = 250


class RecruiterTrustService:
    """Main orchestration layer for the Behavioral Intelligence pipeline.

    Injects all analyzer dependencies via constructor (dependency injection),
    enabling easy testing and alternative implementations.

    Usage:
        service = RecruiterTrustService()
        bi_profile = service.build_behavioral_profile(candidate)

    Or with custom weight config:
        config = ScoringConfig(trust=0.35, availability=0.25, ...)
        service = RecruiterTrustService(scoring_config=config)
    """

    def __init__(
        self,
        availability_analyzer: Optional[AvailabilityAnalyzer] = None,
        engagement_analyzer: Optional[EngagementAnalyzer] = None,
        responsiveness_analyzer: Optional[ResponsivenessAnalyzer] = None,
        trust_engine: Optional[TrustEngine] = None,
        join_probability_estimator: Optional[JoinProbabilityEstimator] = None,
        scoring_config: Optional[ScoringConfig] = None,
        offer_budget_lpa: float = JoinProbabilityEstimator.JD_OFFER_BUDGET_LPA,
    ) -> None:
        """Initialises the orchestration service with injectable analyzers.

        Args:
            availability_analyzer: AvailabilityAnalyzer instance (or default).
            engagement_analyzer: EngagementAnalyzer instance (or default).
            responsiveness_analyzer: ResponsivenessAnalyzer instance (or default).
            trust_engine: TrustEngine instance (or default).
            join_probability_estimator: JoinProbabilityEstimator (or default).
            scoring_config: ScoringConfig for behavioral weighting (or default).
            offer_budget_lpa: Role salary budget in INR LPA for salary alignment.
        """
        self.availability_analyzer = availability_analyzer or AvailabilityAnalyzer()
        self.engagement_analyzer = engagement_analyzer or EngagementAnalyzer()
        self.responsiveness_analyzer = responsiveness_analyzer or ResponsivenessAnalyzer()
        self.trust_engine = trust_engine or TrustEngine()
        self.join_estimator = join_probability_estimator or JoinProbabilityEstimator()
        self.scorer = BehavioralScoring(config=scoring_config)
        self.offer_budget_lpa = offer_budget_lpa

        logger.info(
            "RecruiterTrustService initialized | offer_budget=₹%.1fL | weights=%s",
            self.offer_budget_lpa,
            self.scorer.config.to_dict(),
        )

    def build_behavioral_profile(
        self,
        candidate: Candidate,
    ) -> BehavioralIntelligence:
        """Runs the complete Behavioral Intelligence pipeline for one candidate.

        Steps:
            1. Availability analysis → AvailabilityProfile
            2. Engagement analysis  → EngagementProfile
            3. Responsiveness analysis → ResponsivenessProfile
            4. Trust analysis → TrustProfile
            5. Join probability estimation
            6. BehavioralIntelligence assembly
            7. Behavioral scoring (injects composite behavioral_score)

        Args:
            candidate: Fully validated Candidate aggregate.

        Returns:
            BehavioralIntelligence: Complete, scored behavioral profile.
        """
        t_start = time.perf_counter()
        cid = candidate.candidate_id
        logger.debug("Building behavioral profile for %s", cid)

        # ── Step 1: Availability ───────────────────────────────────────────────
        availability_profile = self.availability_analyzer.generate_profile(candidate)

        # ── Step 2: Engagement ────────────────────────────────────────────────
        engagement_profile = self.engagement_analyzer.generate_profile(candidate)

        # ── Step 3: Responsiveness ────────────────────────────────────────────
        responsiveness_profile = self.responsiveness_analyzer.generate_profile(candidate)

        # ── Step 4: Trust ─────────────────────────────────────────────────────
        trust_profile = self.trust_engine.generate_profile(candidate)

        # ── Step 5: Join Probability ──────────────────────────────────────────
        join_result = self.join_estimator.estimate(
            candidate=candidate,
            offer_budget_lpa=self.offer_budget_lpa,
            availability_profile=availability_profile,
            responsiveness_profile=responsiveness_profile,
        )

        # ── Step 6: Assemble BehavioralIntelligence ───────────────────────────
        # Aggregate all sub-profile evidence into a unified trail
        all_evidence = (
            availability_profile.evidence
            + engagement_profile.evidence
            + responsiveness_profile.evidence
            + trust_profile.evidence
            + join_result.evidence
        )

        bi = BehavioralIntelligence(
            candidate_id=cid,
            availability_profile=availability_profile,
            engagement_profile=engagement_profile,
            responsiveness_profile=responsiveness_profile,
            trust_profile=trust_profile,
            # Scalar shortcuts for ranking engine access without sub-profile traversal
            trust_score=trust_profile.trust_score,
            availability_score=availability_profile.availability_score,
            engagement_score=engagement_profile.engagement_score,
            responsiveness_score=responsiveness_profile.responsiveness_score,
            join_probability=join_result.join_probability,
            evidence=all_evidence,
        )

        # ── Step 7: Behavioral Scoring ─────────────────────────────────────────
        bi = self.scorer.compute_behavioral_score(bi)

        elapsed = time.perf_counter() - t_start
        logger.info(
            "Behavioral profile complete for %s | score=%.3f | elapsed=%.3fms",
            cid,
            bi.behavioral_score,
            elapsed * 1000,
        )

        return bi

    def build_batch_profiles(
        self,
        candidates: List[Candidate],
        chunk_size: int = DEFAULT_CHUNK_SIZE,
    ) -> List[BehavioralIntelligence]:
        """Processes a list of candidates in memory-efficient chunks.

        Designed for 5,000-candidate pools.  Each chunk is processed
        sequentially.  For multiprocessing in Phase 12+, this method
        is the natural split point — each chunk can be distributed to a
        worker process.

        Args:
            candidates: List of Candidate aggregates to profile.
            chunk_size: Number of candidates per processing chunk.

        Returns:
            List[BehavioralIntelligence]: Profiles in the same order as input.
        """
        t_start = time.perf_counter()
        logger.info(
            "Starting batch behavioral profiling | candidates=%d | chunk_size=%d",
            len(candidates),
            chunk_size,
        )

        results: List[BehavioralIntelligence] = []
        errors = 0

        # Process in chunks to bound memory usage
        for chunk_start in range(0, len(candidates), chunk_size):
            chunk = candidates[chunk_start: chunk_start + chunk_size]
            chunk_results: List[BehavioralIntelligence] = []

            for candidate in chunk:
                try:
                    profile = self.build_behavioral_profile(candidate)
                    chunk_results.append(profile)
                except Exception as exc:  # pylint: disable=broad-except
                    logger.error(
                        "Failed to build profile for candidate %s: %s",
                        candidate.candidate_id,
                        exc,
                    )
                    # Emit a zero-score fallback to preserve positional integrity
                    chunk_results.append(
                        self._empty_profile(candidate.candidate_id)
                    )
                    errors += 1

            results.extend(chunk_results)
            logger.info(
                "Chunk processed | %d/%d | errors_so_far=%d",
                min(chunk_start + chunk_size, len(candidates)),
                len(candidates),
                errors,
            )

        elapsed = time.perf_counter() - t_start
        logger.info(
            "Batch profiling complete | %d candidates | %d errors | elapsed=%.2fs",
            len(candidates),
            errors,
            elapsed,
        )

        return results

    def stream_profiles(
        self,
        candidates: List[Candidate],
    ) -> Iterator[BehavioralIntelligence]:
        """Lazily yields BehavioralIntelligence profiles one at a time.

        Memory-optimal for very large pools where the full output list
        cannot be held in memory simultaneously.

        Usage:
            for profile in service.stream_profiles(candidates):
                ranking_engine.ingest(profile)

        Args:
            candidates: List of Candidate aggregates.

        Yields:
            BehavioralIntelligence: One profile per candidate, in input order.
        """
        logger.info("Streaming behavioral profiles for %d candidates...", len(candidates))

        for candidate in candidates:
            try:
                yield self.build_behavioral_profile(candidate)
            except Exception as exc:  # pylint: disable=broad-except
                logger.error(
                    "Stream error for candidate %s: %s",
                    candidate.candidate_id,
                    exc,
                )
                yield self._empty_profile(candidate.candidate_id)

    def build_batch_feature_map(
        self,
        candidates: List[Candidate],
    ) -> Dict[str, Dict[str, float]]:
        """Builds a complete {candidate_id → feature_vector} map for the ranking engine.

        Convenience method that combines build_batch_profiles() with
        BehavioralFeatureService.generate_batch_features().

        Args:
            candidates: List of Candidate aggregates.

        Returns:
            Dict mapping candidate_id → flat behavioral feature dict.
        """
        from services.behavioral_feature_service import BehavioralFeatureService  # noqa: PLC0415
        profiles = self.build_batch_profiles(candidates)
        feature_service = BehavioralFeatureService()
        return feature_service.generate_batch_features(profiles)

    @staticmethod
    def _empty_profile(candidate_id: str) -> BehavioralIntelligence:
        """Returns a zero-scored fallback profile for error recovery.

        Args:
            candidate_id: Candidate identifier for the fallback profile.

        Returns:
            BehavioralIntelligence: All scores set to 0.0 with an error evidence tag.
        """
        return BehavioralIntelligence(
            candidate_id=candidate_id,
            evidence=["❌ Profile generation failed — all behavioral scores set to 0.0."],
        )
