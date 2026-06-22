"""Behavioral Feature Service — Phase 11: Behavioral Intelligence.

Recruiter Problem Solved:
    Converts rich behavioral intelligence objects into flat, ML-ready
    feature vectors that the Phase 13 Final Ranking Engine can consume
    directly.  Bridges the gap between behavioral analysis and ranking.

Signal Modeled:
    All behavioral sub-scores, sub-profile features, and derived indexes
    are serialized into a flat dictionary with namespaced keys, enabling
    the ranker to treat behavioral signals as first-class ranking features
    alongside technical and career features.

Phase 13 Ranking Usage:
    ``generate_features()`` returns a ``behavioral_feature_vector`` dict
    that is merged directly into the FeatureVector.to_flat_dict() output.
    The ranker sees keys like ``behavioral_score``, ``behavioral_trust``,
    ``avail_overall``, ``resp_rate``, etc.
"""

import logging
from typing import Dict, Iterator, List, Optional

from models.behavioral_intelligence import BehavioralIntelligence
from models.candidate import Candidate

logger = logging.getLogger(__name__)


class BehavioralFeatureService:
    """Converts BehavioralIntelligence profiles into ranking-ready feature vectors.

    All output keys follow the convention established in FeatureVector:
      - Top-level behavioral keys: ``behavioral_*``
      - Sub-profile keys: ``avail_*``, ``engage_*``, ``resp_*``, ``trust_*``

    Usage:
        service = BehavioralFeatureService()
        feature_vector = service.generate_features(bi_profile)
    """

    # ── Feature names for documentation and schema enforcement ─────────────────
    TOP_LEVEL_FEATURES = [
        "behavioral_score",
        "behavioral_trust",
        "behavioral_availability",
        "behavioral_engagement",
        "behavioral_responsiveness",
        "behavioral_join_probability",
        "behavioral_friendliness",
        "behavioral_confidence",
    ]

    def generate_features(
        self,
        bi: BehavioralIntelligence,
    ) -> Dict[str, float]:
        """Converts a single BehavioralIntelligence profile into a flat feature vector.

        This is the primary interface consumed by the Phase 13 Ranking Engine.

        Feature coverage:
          - 8 top-level behavioral aggregates
          - 6 availability sub-features (when profile available)
          - 7 engagement sub-features (when profile available)
          - 6 responsiveness sub-features (when profile available)
          - 8 trust sub-features (when profile available)

        Total: up to 35 behavioral ranking features.

        Args:
            bi: Fully scored BehavioralIntelligence object.

        Returns:
            Dict[str, float]: Flat behavioral feature vector (all values in [0, 1]).
        """
        features = bi.to_feature_dict()

        # Validate all values are numeric and in [0, 1]
        validated: Dict[str, float] = {}
        for key, value in features.items():
            try:
                float_val = float(value)
                validated[key] = round(min(1.0, max(0.0, float_val)), 6)
            except (TypeError, ValueError):
                logger.warning(
                    "Feature '%s' has non-numeric value '%s' for candidate %s — defaulting to 0.0.",
                    key,
                    value,
                    bi.candidate_id,
                )
                validated[key] = 0.0

        logger.debug(
            "Generated %d behavioral features for candidate %s",
            len(validated),
            bi.candidate_id,
        )

        return validated

    def generate_batch_features(
        self,
        profiles: List[BehavioralIntelligence],
    ) -> Dict[str, Dict[str, float]]:
        """Converts a list of BehavioralIntelligence profiles into feature vectors.

        Processes profiles sequentially.  For parallel processing, see
        RecruiterTrustService.build_batch_profiles() which uses
        multiprocessing-ready chunked design.

        Args:
            profiles: List of fully scored BehavioralIntelligence objects.

        Returns:
            Dict mapping candidate_id → feature_vector dict.
        """
        logger.info("Generating behavioral features for %d candidates...", len(profiles))

        result: Dict[str, Dict[str, float]] = {}
        errors = 0

        for bi in profiles:
            try:
                result[bi.candidate_id] = self.generate_features(bi)
            except Exception as exc:  # pylint: disable=broad-except
                logger.error(
                    "Failed to generate features for candidate %s: %s",
                    bi.candidate_id,
                    exc,
                )
                result[bi.candidate_id] = self._empty_feature_vector()
                errors += 1

        logger.info(
            "Batch feature generation complete | %d candidates | %d errors",
            len(profiles),
            errors,
        )

        return result

    def stream_features(
        self,
        profiles: List[BehavioralIntelligence],
    ) -> Iterator[tuple]:
        """Lazily generates (candidate_id, feature_vector) pairs from a profile list.

        Memory-efficient for large pools.  Use with:
            for cid, features in service.stream_features(profiles):
                ...

        Args:
            profiles: List of BehavioralIntelligence objects.

        Yields:
            Tuple[str, Dict[str, float]]: (candidate_id, feature_vector).
        """
        for bi in profiles:
            try:
                yield bi.candidate_id, self.generate_features(bi)
            except Exception as exc:  # pylint: disable=broad-except
                logger.error(
                    "Stream feature error for candidate %s: %s",
                    bi.candidate_id,
                    exc,
                )
                yield bi.candidate_id, self._empty_feature_vector()

    def get_feature_schema(self) -> List[str]:
        """Returns the expected feature key schema for schema-validation purposes.

        Returns:
            List[str]: Ordered list of feature names.
        """
        schema = list(self.TOP_LEVEL_FEATURES)

        # Sub-profile keys (from to_feature_dict() on each sub-profile)
        schema += [
            # Availability
            "avail_open_to_work", "avail_notice_period",
            "avail_job_search", "avail_recency", "avail_overall", "avail_confidence",
            # Engagement
            "engage_profile_views", "engage_recruiter_saves", "engage_applications",
            "engage_search_appear", "engage_market", "engage_overall", "engage_confidence",
            # Responsiveness
            "resp_rate", "resp_avg_time", "resp_consistency",
            "resp_reliability", "resp_overall", "resp_confidence",
            # Trust
            "trust_completeness", "trust_verification", "trust_consistency",
            "trust_career", "trust_identity", "trust_quality",
            "trust_overall", "trust_confidence",
        ]

        return schema

    def _empty_feature_vector(self) -> Dict[str, float]:
        """Returns a zero-valued feature vector for error fallback.

        Returns:
            Dict[str, float]: All behavioral features set to 0.0.
        """
        return {key: 0.0 for key in self.get_feature_schema()}

    def merge_with_ranking_features(
        self,
        behavioral_features: Dict[str, float],
        ranking_features: Dict[str, float],
    ) -> Dict[str, float]:
        """Merges behavioral features into an existing ranking feature dict.

        Behavioral keys are added without overwriting existing keys.
        If a collision occurs (same key), the existing ranking value
        takes precedence and a warning is logged.

        Args:
            behavioral_features: Output of generate_features().
            ranking_features: Existing FeatureVector.to_flat_dict() output.

        Returns:
            Dict[str, float]: Merged feature dictionary.
        """
        merged = dict(ranking_features)
        collisions = 0

        for key, value in behavioral_features.items():
            if key in merged:
                logger.warning(
                    "Feature key collision: '%s' already exists in ranking features. "
                    "Keeping ranking value (%.4f), discarding behavioral value (%.4f).",
                    key,
                    merged[key],
                    value,
                )
                collisions += 1
            else:
                merged[key] = value

        if collisions:
            logger.warning(
                "%d feature key collisions detected during merge.", collisions
            )

        return merged
