"""Feature Service — main Phase 10 orchestration layer.

The high-level API consumed by the Ranking Engine (Phase 11).

Why it exists:
  FeatureEngineering handles single-candidate and batch pipelines.
  FeatureService adds the pool-level concerns:
    - Resolving CandidateProfiles from a CandidatePool
    - Streaming feature generation for memory efficiency
    - Building the final feature vector collection
    - Providing pool-level statistics

Input:
  CandidatePool (Phase 9 output)
  ParsedJD

Output:
  List[FeatureVector]  (Phase 11 input)
"""

import time
from typing import Dict, Generator, Iterator, List, Optional
from models.candidate import Candidate
from models.candidate_pool import CandidatePool
from models.candidate_profile import CandidateProfile
from models.feature_vector import FeatureVector
from models.parsed_jd import ParsedJD
from services.feature_engineering import FeatureEngineering
from services.feature_registry import get_feature_registry
from utils.logger import get_logger

logger = get_logger(__name__)


class FeatureService:
    """Main orchestration layer for Phase 10: Feature Engineering.

    Accepts a CandidatePool and a ParsedJD and produces a List[FeatureVector].
    Supports batch processing, streaming, and feature statistics.
    """

    def __init__(
        self,
        feature_engineering: Optional[FeatureEngineering] = None,
        batch_size: int = 500,
        normalize: bool = True,
        normalization_strategy: str = "min_max",
    ) -> None:
        """Initializes the FeatureService.

        Args:
            feature_engineering:    FeatureEngineering pipeline instance.
            batch_size:             Candidates processed per batch in streaming.
            normalize:              Apply batch normalization after extraction.
            normalization_strategy: 'min_max' | 'z_score' | 'robust'.
        """
        self.engine = feature_engineering or FeatureEngineering()
        self.batch_size = batch_size
        self.normalize = normalize
        self.normalization_strategy = normalization_strategy
        self.registry = get_feature_registry()

    # ── Core Methods ──────────────────────────────────────────────────────────

    def build_candidate_features(
        self,
        candidate: Candidate,
        profile: CandidateProfile,
        parsed_jd: ParsedJD,
        pool: Optional[CandidatePool] = None,
        query_id: Optional[str] = None,
        target_min_years: float = 0.0,
        target_max_years: float = 20.0,
    ) -> FeatureVector:
        """Generates a FeatureVector for a single candidate.

        Args:
            candidate:        Raw Candidate record.
            profile:          CandidateProfile (Phase 5).
            parsed_jd:        Parsed job description.
            pool:             CandidatePool for HybridCandidate lookup.
            query_id:         Query ID for traceability.
            target_min_years: JD minimum years.
            target_max_years: JD maximum years.

        Returns:
            FeatureVector: Complete feature vector.
        """
        hybrid_candidate = None
        if pool:
            hc_map = {c.candidate_id: c for c in pool.candidates}
            hybrid_candidate = hc_map.get(candidate.candidate_id)

        return self.engine.generate_features(
            candidate=candidate,
            profile=profile,
            parsed_jd=parsed_jd,
            hybrid_candidate=hybrid_candidate,
            query_id=query_id,
            target_min_years=target_min_years,
            target_max_years=target_max_years,
        )

    def build_feature_vectors(
        self,
        candidates: List[Candidate],
        profiles: List[CandidateProfile],
        parsed_jd: ParsedJD,
        pool: Optional[CandidatePool] = None,
        query_id: Optional[str] = None,
        target_min_years: float = 0.0,
        target_max_years: float = 20.0,
    ) -> List[FeatureVector]:
        """Generates FeatureVectors for a complete candidate list.

        This is the primary method called by the Ranking Engine.

        Args:
            candidates:       List of Candidate records.
            profiles:         Corresponding CandidateProfile list.
            parsed_jd:        Parsed job description.
            pool:             CandidatePool (provides HybridCandidate records).
            query_id:         Query ID.
            target_min_years: JD minimum years.
            target_max_years: JD maximum years.

        Returns:
            List[FeatureVector]: Feature vectors in the same order as candidates.
        """
        start = time.time()

        hybrid_candidates = list(pool.candidates) if pool else []

        vectors = self.engine.generate_batch_features(
            candidates=candidates,
            profiles=profiles,
            parsed_jd=parsed_jd,
            hybrid_candidates=hybrid_candidates,
            query_id=query_id,
            normalize=self.normalize,
            normalization_strategy=self.normalization_strategy,
            target_min_years=target_min_years,
            target_max_years=target_max_years,
        )

        elapsed = round((time.time() - start) * 1000.0, 2)
        logger.info(
            f"FeatureService.build_feature_vectors: "
            f"{len(vectors)} vectors in {elapsed}ms "
            f"(normalize={self.normalize}, strategy={self.normalization_strategy})."
        )
        return vectors

    # ── Streaming ─────────────────────────────────────────────────────────────

    def stream_feature_generation(
        self,
        candidates: List[Candidate],
        profiles: List[CandidateProfile],
        parsed_jd: ParsedJD,
        pool: Optional[CandidatePool] = None,
        query_id: Optional[str] = None,
        target_min_years: float = 0.0,
        target_max_years: float = 20.0,
    ) -> Generator[FeatureVector, None, None]:
        """Yields FeatureVectors one at a time for memory-efficient processing.

        Processes candidates in batches of self.batch_size but yields
        individual vectors, making it suitable for streaming pipelines
        or when memory is constrained.

        Args:
            candidates:       List of Candidate records.
            profiles:         Corresponding CandidateProfile list.
            parsed_jd:        Parsed job description.
            pool:             CandidatePool for HybridCandidate lookup.
            query_id:         Query ID.
            target_min_years: JD minimum years.
            target_max_years: JD maximum years.

        Yields:
            FeatureVector: One per candidate.
        """
        profile_map = {p.candidate_id: p for p in profiles}
        hc_map = {c.candidate_id: c for c in pool.candidates} if pool else {}

        for i in range(0, len(candidates), self.batch_size):
            batch = candidates[i: i + self.batch_size]
            batch_profiles = [
                profile_map[c.candidate_id]
                for c in batch
                if c.candidate_id in profile_map
            ]
            batch_hc = [hc_map[c.candidate_id] for c in batch if c.candidate_id in hc_map]

            batch_vectors = self.engine.generate_batch_features(
                candidates=batch,
                profiles=batch_profiles,
                parsed_jd=parsed_jd,
                hybrid_candidates=batch_hc or None,
                query_id=query_id,
                normalize=self.normalize,
                normalization_strategy=self.normalization_strategy,
                target_min_years=target_min_years,
                target_max_years=target_max_years,
            )
            for vector in batch_vectors:
                yield vector

            logger.debug(
                f"FeatureService.stream: batch {i // self.batch_size + 1} → "
                f"{len(batch_vectors)} vectors generated."
            )

    # ── Statistics & Registry ─────────────────────────────────────────────────

    def pool_feature_statistics(
        self, vectors: List[FeatureVector]
    ) -> Dict:
        """Generates pool-level feature statistics and registry summary.

        Args:
            vectors: List of FeatureVector objects.

        Returns:
            Dict: Combined statistics and registry summary.
        """
        feature_stats = self.engine.feature_statistics(vectors)
        registry_summary = self.registry.summary()
        group_score_means = {}
        for v in vectors:
            for group, score in v.group_scores().items():
                group_score_means.setdefault(group, []).append(score)
        group_means = {
            g: round(sum(scores) / len(scores), 4)
            for g, scores in group_score_means.items()
        }

        return {
            "total_candidates": len(vectors),
            "feature_count": vectors[0].feature_count if vectors else 0,
            "group_mean_scores": group_means,
            "per_feature_stats": feature_stats,
            "registry": registry_summary,
        }
