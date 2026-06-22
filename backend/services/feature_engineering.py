"""Feature Engineering pipeline service.

Orchestrates all six feature extractors into a single per-candidate
feature generation pipeline.

Why it exists:
  The FeatureService (feature_service.py) handles batch-level concerns
  (pool iteration, parallelism, streaming). This class handles the
  single-candidate pipeline: running all extractors in sequence and
  assembling a FeatureVector.

Ranking dependency:
  generate_features() returns the FeatureVector consumed by Phase 11.
  generate_batch_features() supports the 5,000-candidate pool pipeline.
"""

import time
from typing import Dict, List, Optional
from models.candidate import Candidate
from models.candidate_profile import CandidateProfile
from models.feature_vector import FeatureVector
from models.hybrid_candidate import HybridCandidate
from models.parsed_jd import ParsedJD
from services.technical_feature_extractor import TechnicalFeatureExtractor
from services.career_feature_extractor import CareerFeatureExtractor
from services.leadership_feature_extractor import LeadershipFeatureExtractor
from services.execution_feature_extractor import ExecutionFeatureExtractor
from services.market_feature_extractor import MarketFeatureExtractor
from services.matching_feature_extractor import MatchingFeatureExtractor
from services.feature_normalizer import FeatureNormalizer
from utils.logger import get_logger

logger = get_logger(__name__)


class FeatureEngineering:
    """Single-candidate and batch feature engineering pipeline."""

    def __init__(
        self,
        technical_extractor: Optional[TechnicalFeatureExtractor] = None,
        career_extractor: Optional[CareerFeatureExtractor] = None,
        leadership_extractor: Optional[LeadershipFeatureExtractor] = None,
        execution_extractor: Optional[ExecutionFeatureExtractor] = None,
        market_extractor: Optional[MarketFeatureExtractor] = None,
        matching_extractor: Optional[MatchingFeatureExtractor] = None,
        normalizer: Optional[FeatureNormalizer] = None,
        feature_weights: Optional[Dict[str, float]] = None,
    ) -> None:
        """Initializes the pipeline with all extractors.

        Args:
            technical_extractor:  TechnicalFeatureExtractor instance.
            career_extractor:     CareerFeatureExtractor instance.
            leadership_extractor: LeadershipFeatureExtractor instance.
            execution_extractor:  ExecutionFeatureExtractor instance.
            market_extractor:     MarketFeatureExtractor instance.
            matching_extractor:   MatchingFeatureExtractor instance.
            normalizer:           FeatureNormalizer instance.
            feature_weights:      Override default group importance weights.
        """
        self.technical  = technical_extractor  or TechnicalFeatureExtractor()
        self.career     = career_extractor     or CareerFeatureExtractor()
        self.leadership = leadership_extractor or LeadershipFeatureExtractor()
        self.execution  = execution_extractor  or ExecutionFeatureExtractor()
        self.market     = market_extractor     or MarketFeatureExtractor()
        self.matching   = matching_extractor   or MatchingFeatureExtractor()
        self.normalizer = normalizer           or FeatureNormalizer()
        self.feature_weights = feature_weights or {}

    # ── Single Candidate ──────────────────────────────────────────────────────

    def generate_features(
        self,
        candidate: Candidate,
        profile: CandidateProfile,
        parsed_jd: ParsedJD,
        hybrid_candidate: Optional[HybridCandidate] = None,
        query_id: Optional[str] = None,
        target_min_years: float = 0.0,
        target_max_years: float = 20.0,
    ) -> FeatureVector:
        """Runs the complete feature engineering pipeline for one candidate.

        Pipeline:
          Candidate + CandidateProfile + ParsedJD + HybridCandidate
            ↓ TechnicalFeatureExtractor
            ↓ CareerFeatureExtractor
            ↓ LeadershipFeatureExtractor
            ↓ ExecutionFeatureExtractor
            ↓ MarketFeatureExtractor
            ↓ MatchingFeatureExtractor
            → FeatureVector

        Args:
            candidate:        Raw Candidate record.
            profile:          CandidateProfile (Phase 5 intelligence).
            parsed_jd:        Parsed job description.
            hybrid_candidate: Phase 9 retrieval record (for retrieval scores).
            query_id:         Query identifier for traceability.
            target_min_years: JD minimum years required.
            target_max_years: JD maximum comfort zone years.

        Returns:
            FeatureVector: Complete, validated feature vector.
        """
        technical  = self.technical.extract_features(profile)
        career     = self.career.extract_features(candidate, profile)
        leadership = self.leadership.extract_features(candidate, profile)
        execution  = self.execution.extract_features(candidate)
        market     = self.market.extract_features(candidate)
        matching   = self.matching.extract_features(
            candidate, parsed_jd, hybrid_candidate,
            target_min_years=target_min_years,
            target_max_years=target_max_years,
        )

        vector = FeatureVector(
            candidate_id=candidate.candidate_id,
            query_id=query_id,
            technical_features=technical,
            career_features=career,
            leadership_features=leadership,
            execution_features=execution,
            market_features=market,
            matching_features=matching,
            feature_weights=self.feature_weights or {},
        )
        return vector

    # ── Batch Processing ──────────────────────────────────────────────────────

    def generate_batch_features(
        self,
        candidates: List[Candidate],
        profiles: List[CandidateProfile],
        parsed_jd: ParsedJD,
        hybrid_candidates: Optional[List[HybridCandidate]] = None,
        query_id: Optional[str] = None,
        normalize: bool = True,
        normalization_strategy: str = "min_max",
        target_min_years: float = 0.0,
        target_max_years: float = 20.0,
    ) -> List[FeatureVector]:
        """Generates FeatureVectors for a batch of candidates.

        Args:
            candidates:             List of Candidate records.
            profiles:               Corresponding CandidateProfile list.
            parsed_jd:              Parsed job description.
            hybrid_candidates:      Optional Phase 9 hybrid candidates.
            query_id:               Query identifier.
            normalize:              Apply batch normalization after extraction.
            normalization_strategy: 'min_max' | 'z_score' | 'robust'.
            target_min_years:       JD minimum years.
            target_max_years:       JD maximum years.

        Returns:
            List[FeatureVector]: One feature vector per candidate.
        """
        if not candidates:
            return []

        start = time.time()
        hc_map = {}
        if hybrid_candidates:
            hc_map = {hc.candidate_id: hc for hc in hybrid_candidates}

        profile_map = {p.candidate_id: p for p in profiles}

        vectors: List[FeatureVector] = []
        failed = 0
        for candidate in candidates:
            cand_profile = profile_map.get(candidate.candidate_id)
            if cand_profile is None:
                logger.warning(
                    f"No profile found for {candidate.candidate_id}. Skipping."
                )
                failed += 1
                continue
            try:
                vector = self.generate_features(
                    candidate=candidate,
                    profile=cand_profile,
                    parsed_jd=parsed_jd,
                    hybrid_candidate=hc_map.get(candidate.candidate_id),
                    query_id=query_id,
                    target_min_years=target_min_years,
                    target_max_years=target_max_years,
                )
                vectors.append(vector)
            except Exception as exc:
                logger.error(
                    f"Feature extraction failed for {candidate.candidate_id}: {exc}"
                )
                failed += 1

        # Optional pool-level normalization
        if normalize and len(vectors) > 1:
            flat_dicts = [v.to_flat_dict() for v in vectors]
            normalized_dicts = self.normalizer.normalize_batch(
                flat_dicts, strategy=normalization_strategy
            )
            # Normalized flat dicts do not reconstruct FeatureVector objects
            # (the un-normalized group-level scores remain on the vector for
            # explainability; the flat_dict is what the ranker uses)
            for vector, norm_dict in zip(vectors, normalized_dicts):
                vector._normalized_flat = norm_dict  # type: ignore[attr-defined]

        elapsed = round((time.time() - start) * 1000.0, 2)
        logger.info(
            f"FeatureEngineering.generate_batch_features: "
            f"{len(vectors)} vectors generated, {failed} failed, "
            f"{elapsed}ms."
        )
        return vectors

    # ── Statistics ────────────────────────────────────────────────────────────

    def feature_statistics(
        self, vectors: List[FeatureVector]
    ) -> Dict[str, Dict[str, float]]:
        """Computes per-feature statistics across a batch.

        Args:
            vectors: List of FeatureVector objects.

        Returns:
            Dict[str, Dict[str, float]]: {feature_name: {mean, min, max, std}}.
        """
        if not vectors:
            return {}

        flat_dicts = [v.to_flat_dict() for v in vectors]
        all_keys = flat_dicts[0].keys()
        stats = {}
        for key in all_keys:
            values = [fd.get(key, 0.0) for fd in flat_dicts]
            n = len(values)
            mean = sum(values) / n
            variance = sum((v - mean) ** 2 for v in values) / max(1, n - 1)
            stats[key] = {
                "mean": round(mean, 4),
                "min": round(min(values), 4),
                "max": round(max(values), 4),
                "std": round(variance ** 0.5, 4),
            }
        return stats
