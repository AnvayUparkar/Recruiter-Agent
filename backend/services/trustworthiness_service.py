"""Trustworthiness Service — Phase 12: Profile Quality & Fraud Detection.

The main orchestration layer for the Phase 12 Reliability pipeline.

Pipeline:
    Candidate + Optional(BehavioralIntelligence)
      ↓ ProfileCompletenessAnalyzer  → (internal, used by quality analyzer)
      ↓ ProfileQualityAnalyzer       → ProfileQuality
      ↓ ConsistencyChecker           → ConsistencyProfile
      ↓ AnomalyDetector              → AnomalyProfile
      ↓ FraudDetector                → FraudProfile
      ↓ ReliabilityScoring           → ReliabilityProfile (output)

Recruiter Problem Solved:
    Single entry point that ingests a Candidate (+ optional Phase 11
    BehavioralIntelligence) and returns a production-grade
    ReliabilityProfile — ready for the Phase 13 Final Ranking Engine.

Performance Target:
    5,000 candidates in < 2 minutes on a single CPU core.
    Streaming support for memory-constrained environments.
    Batch processing with configurable chunk sizes.
"""

import logging
import time
from typing import Dict, Iterator, List, Optional

from models.reliability_profile import ReliabilityProfile
from models.candidate import Candidate
from models.behavioral_intelligence import BehavioralIntelligence

from services.profile_quality_analyzer import ProfileQualityAnalyzer
from services.consistency_checker import ConsistencyChecker
from services.anomaly_detector import AnomalyDetector
from services.fraud_detector import FraudDetector
from services.reliability_scoring import ReliabilityScoring, ReliabilityConfig

logger = logging.getLogger(__name__)

# ── Default batch chunk size ─────────────────────────────────────────────────
DEFAULT_CHUNK_SIZE: int = 250


class TrustworthinessService:
    """Main orchestration layer for the Phase 12 Reliability pipeline.

    Injects all sub-service dependencies via constructor (dependency
    injection) to enable clean testing and alternative implementations.

    Usage:
        service = TrustworthinessService()
        reliability = service.build_reliability_profile(candidate)

    With Phase 11 integration:
        service = TrustworthinessService()
        reliability = service.build_reliability_profile(candidate, behavioral_intel)
    """

    def __init__(
        self,
        quality_analyzer: Optional[ProfileQualityAnalyzer] = None,
        consistency_checker: Optional[ConsistencyChecker] = None,
        anomaly_detector: Optional[AnomalyDetector] = None,
        fraud_detector: Optional[FraudDetector] = None,
        reliability_config: Optional[ReliabilityConfig] = None,
    ) -> None:
        """Initialises the orchestration service with injectable sub-services.

        Args:
            quality_analyzer: ProfileQualityAnalyzer instance (or default).
            consistency_checker: ConsistencyChecker instance (or default).
            anomaly_detector: AnomalyDetector instance (or default).
            fraud_detector: FraudDetector instance (or default).
            reliability_config: ReliabilityConfig for score weighting (or default).
        """
        self._quality = quality_analyzer or ProfileQualityAnalyzer()
        self._consistency = consistency_checker or ConsistencyChecker()
        self._anomaly = anomaly_detector or AnomalyDetector()
        self._fraud = fraud_detector or FraudDetector()
        self._scorer = ReliabilityScoring(config=reliability_config)

        logger.info(
            "TrustworthinessService initialized | weights=%s",
            self._scorer.config.to_dict(),
        )

    def build_reliability_profile(
        self,
        candidate: Candidate,
        behavioral_intel: Optional[BehavioralIntelligence] = None,
    ) -> ReliabilityProfile:
        """Runs the complete Phase 12 Reliability pipeline for one candidate.

        Steps:
            1. Profile quality analysis → ProfileQuality
            2. Consistency checking     → ConsistencyProfile
            3. Anomaly detection        → AnomalyProfile
            4. Fraud detection          → FraudProfile (uses AnomalyProfile)
            5. Reliability scoring      → ReliabilityProfile

        Phase 11 Integration:
            If ``behavioral_intel`` is provided, its ``behavioral_score``
            and ``trust_score`` are passed directly into reliability scoring,
            producing a richer reliability signal.

        Args:
            candidate: Fully validated Candidate aggregate.
            behavioral_intel: Optional Phase 11 BehavioralIntelligence output.

        Returns:
            ReliabilityProfile: Complete, scored reliability profile.
        """
        t_start = time.perf_counter()
        cid = candidate.candidate_id
        logger.debug("Building reliability profile for %s", cid)

        # ── Step 1: Profile Quality ────────────────────────────────────────────
        quality_profile = self._quality.analyze_quality(candidate)

        # ── Step 2: Consistency ───────────────────────────────────────────────
        consistency_profile = self._consistency.generate_profile(candidate)

        # ── Step 3: Anomaly Detection ─────────────────────────────────────────
        anomaly_profile = self._anomaly.detect(candidate)

        # ── Step 4: Fraud Detection ───────────────────────────────────────────
        # Pass anomaly_profile to avoid re-running anomaly detection
        fraud_profile = self._fraud.detect_fraud(
            candidate,
            behavioral_intel=behavioral_intel,
            anomaly_profile=anomaly_profile,
        )

        # ── Step 5: Extract Phase 11 scores if available ──────────────────────
        behavioral_score = (
            behavioral_intel.behavioral_score
            if behavioral_intel
            else 0.0
        )
        trust_score = (
            behavioral_intel.trust_score
            if behavioral_intel
            else 0.0
        )

        # ── Step 6: Reliability Scoring ───────────────────────────────────────
        reliability_profile = self._scorer.compute_reliability_score(
            candidate_id=cid,
            quality_profile=quality_profile,
            fraud_profile=fraud_profile,
            consistency_profile=consistency_profile,
            behavioral_score=behavioral_score,
            trust_score=trust_score,
            anomaly_profile=anomaly_profile,
        )

        elapsed = time.perf_counter() - t_start
        logger.info(
            "Reliability profile complete for %s | score=%.3f | tier=%s | elapsed=%.3fms",
            cid,
            reliability_profile.reliability_score,
            reliability_profile.reliability_tier(),
            elapsed * 1000,
        )

        return reliability_profile

    def build_batch_profiles(
        self,
        candidates: List[Candidate],
        behavioral_intels: Optional[Dict[str, BehavioralIntelligence]] = None,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
    ) -> List[ReliabilityProfile]:
        """Processes a list of candidates in memory-efficient chunks.

        Designed for 5,000-candidate pools.  Each chunk is processed
        sequentially.  For multiprocessing in Phase 13+, this method
        is the natural split point.

        Args:
            candidates: List of Candidate aggregates to profile.
            behavioral_intels: Optional {candidate_id → BehavioralIntelligence} map.
            chunk_size: Number of candidates per processing chunk.

        Returns:
            List[ReliabilityProfile]: Profiles in the same order as input.
        """
        t_start = time.perf_counter()
        bi_map = behavioral_intels or {}
        logger.info(
            "Starting batch reliability profiling | candidates=%d | "
            "with_behavioral_intel=%s | chunk_size=%d",
            len(candidates),
            bool(bi_map),
            chunk_size,
        )

        results: List[ReliabilityProfile] = []
        errors = 0

        for chunk_start in range(0, len(candidates), chunk_size):
            chunk = candidates[chunk_start: chunk_start + chunk_size]
            chunk_results: List[ReliabilityProfile] = []

            for candidate in chunk:
                try:
                    bi = bi_map.get(candidate.candidate_id)
                    profile = self.build_reliability_profile(candidate, bi)
                    chunk_results.append(profile)
                except Exception as exc:  # pylint: disable=broad-except
                    logger.error(
                        "Failed to build reliability profile for %s: %s",
                        candidate.candidate_id,
                        exc,
                    )
                    chunk_results.append(self._empty_profile(candidate.candidate_id))
                    errors += 1

            results.extend(chunk_results)
            logger.info(
                "Chunk processed | %d/%d | errors=%d",
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
        behavioral_intels: Optional[Dict[str, BehavioralIntelligence]] = None,
    ) -> Iterator[ReliabilityProfile]:
        """Lazily yields ReliabilityProfile objects one at a time.

        Memory-optimal for very large pools.

        Usage:
            for profile in service.stream_profiles(candidates):
                ranking_engine.ingest(profile)

        Args:
            candidates: List of Candidate aggregates.
            behavioral_intels: Optional {candidate_id → BehavioralIntelligence} map.

        Yields:
            ReliabilityProfile: One profile per candidate, in input order.
        """
        bi_map = behavioral_intels or {}
        logger.info("Streaming reliability profiles for %d candidates...", len(candidates))

        for candidate in candidates:
            try:
                bi = bi_map.get(candidate.candidate_id)
                yield self.build_reliability_profile(candidate, bi)
            except Exception as exc:  # pylint: disable=broad-except
                logger.error(
                    "Stream error for candidate %s: %s",
                    candidate.candidate_id,
                    exc,
                )
                yield self._empty_profile(candidate.candidate_id)

    def build_feature_map(
        self,
        candidates: List[Candidate],
        behavioral_intels: Optional[Dict[str, BehavioralIntelligence]] = None,
    ) -> Dict[str, Dict[str, float]]:
        """Builds a {candidate_id → reliability_feature_vector} map.

        Convenience method combining build_batch_profiles() with
        ReliabilityProfile.to_feature_dict() for Phase 13 integration.

        Args:
            candidates: List of Candidate aggregates.
            behavioral_intels: Optional Phase 11 intelligence map.

        Returns:
            Dict mapping candidate_id → flat reliability feature dict.
        """
        profiles = self.build_batch_profiles(candidates, behavioral_intels)
        return {p.candidate_id: p.to_feature_dict() for p in profiles}

    @staticmethod
    def _empty_profile(candidate_id: str) -> ReliabilityProfile:
        """Returns a zero-scored fallback profile for error recovery.

        Args:
            candidate_id: Candidate identifier.

        Returns:
            ReliabilityProfile: All scores set to 0.0 with error evidence.
        """
        from models.profile_quality import ProfileQuality  # noqa: PLC0415
        from models.fraud_profile import FraudProfile       # noqa: PLC0415
        from models.consistency_profile import ConsistencyProfile  # noqa: PLC0415

        return ReliabilityProfile(
            candidate_id=candidate_id,
            quality_profile=ProfileQuality(
                candidate_id=candidate_id,
                evidence=["❌ Quality analysis failed."],
            ),
            fraud_profile=FraudProfile(
                candidate_id=candidate_id,
                evidence=["❌ Fraud detection failed."],
            ),
            consistency_profile=ConsistencyProfile(
                candidate_id=candidate_id,
                evidence=["❌ Consistency check failed."],
            ),
            evidence=["❌ Reliability profile generation failed — all scores set to 0.0."],
        )
