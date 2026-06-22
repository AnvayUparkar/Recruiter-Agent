"""Feature Normalizer service.

Provides batch normalization utilities for feature vectors.

Why it exists:
  Each feature extractor produces scores that are already nominally in
  [0, 1], but due to different extraction heuristics their actual
  distributions can vary significantly across a 5,000-candidate pool.
  The Feature Normalizer re-calibrates features within the context of
  the current candidate pool so comparisons are fair.

Future usage:
  - The Ranking Engine calls normalize_batch() before fitting the scoring
    function to ensure all features are on the same scale.
  - validate_feature_ranges() catches extractor bugs before they corrupt
    ranking scores.
"""

import statistics
from typing import Dict, List, Optional, Tuple
from utils.logger import get_logger

logger = get_logger(__name__)

_EPS = 1e-9


class FeatureNormalizer:
    """Normalizes feature dictionaries across a batch of candidates."""

    # ── Single-Vector Normalization ───────────────────────────────────────────

    @staticmethod
    def normalize(
        feature_dict: Dict[str, float],
        strategy: str = "min_max",
        feature_min_max: Optional[Dict[str, Tuple[float, float]]] = None,
    ) -> Dict[str, float]:
        """Normalizes a single feature dict using the given strategy.

        When normalizing a single dict in isolation (no batch context),
        min_max will return unchanged values since min==max.
        Prefer normalize_batch() for pool-level normalization.

        Args:
            feature_dict:    {feature_name: score} mapping.
            strategy:        'min_max' | 'z_score' | 'robust'.
            feature_min_max: Pre-computed {feature_name: (min, max)} from batch.

        Returns:
            Dict[str, float]: Normalized feature dict.
        """
        if strategy == "min_max" and feature_min_max:
            result = {}
            for name, val in feature_dict.items():
                lo, hi = feature_min_max.get(name, (0.0, 1.0))
                spread = hi - lo
                result[name] = round(
                    val if spread < _EPS else min(1.0, max(0.0, (val - lo) / spread)),
                    4,
                )
            return result
        # Default: return as-is (already [0,1] by design)
        return {k: round(min(1.0, max(0.0, v)), 4) for k, v in feature_dict.items()}

    # ── Batch Normalization ───────────────────────────────────────────────────

    def normalize_batch(
        self,
        feature_dicts: List[Dict[str, float]],
        strategy: str = "min_max",
        features_to_normalize: Optional[List[str]] = None,
    ) -> List[Dict[str, float]]:
        """Normalizes a list of feature dicts within the pool context.

        All features are normalized using the min/max/mean/std computed
        across the entire batch, ensuring fair cross-candidate comparison.

        Args:
            feature_dicts:          List of {feature_name: score} dicts.
            strategy:               'min_max' | 'z_score' | 'robust'.
            features_to_normalize:  Subset of feature names to normalize.
                                    If None, all features are normalized.

        Returns:
            List[Dict[str, float]]: Normalized feature dicts.
        """
        if not feature_dicts:
            return []

        all_keys = set()
        for fd in feature_dicts:
            all_keys.update(fd.keys())

        target_keys = set(features_to_normalize) if features_to_normalize else all_keys
        target_keys = target_keys & all_keys

        # Build per-feature value lists
        key_values: Dict[str, List[float]] = {k: [] for k in target_keys}
        for fd in feature_dicts:
            for k in target_keys:
                key_values[k].append(fd.get(k, 0.0))

        # Compute normalization stats
        stats: Dict[str, Tuple] = {}
        for k, vals in key_values.items():
            lo, hi = min(vals), max(vals)
            if strategy == "z_score":
                mu = statistics.mean(vals)
                sigma = statistics.stdev(vals) if len(vals) > 1 else _EPS
                stats[k] = (mu, sigma)
            elif strategy == "robust":
                sorted_vals = sorted(vals)
                q1 = self._percentile(sorted_vals, 25)
                q3 = self._percentile(sorted_vals, 75)
                median = self._percentile(sorted_vals, 50)
                iqr = q3 - q1
                stats[k] = (median, iqr, min(vals), max(vals))
            else:
                stats[k] = (lo, hi)

        # Apply normalization
        result = []
        for fd in feature_dicts:
            normalized = dict(fd)  # copy
            for k in target_keys:
                val = fd.get(k, 0.0)
                if strategy == "min_max":
                    lo, hi = stats[k]
                    spread = hi - lo
                    normalized[k] = round(
                        val if spread < _EPS else min(1.0, max(0.0, (val - lo) / spread)),
                        4,
                    )
                elif strategy == "z_score":
                    mu, sigma = stats[k]
                    z = (val - mu) / max(sigma, _EPS)
                    normalized[k] = round(min(1.0, max(0.0, (z + 3.0) / 6.0)), 4)
                elif strategy == "robust":
                    median, iqr, lo, hi = stats[k]
                    if iqr < _EPS:
                        normalized[k] = round(min(1.0, max(0.0, val)), 4)
                    else:
                        r = (val - median) / iqr
                        spread = (hi - median) / iqr - (lo - median) / iqr or _EPS
                        normalized[k] = round(
                            min(1.0, max(0.0, (r - (lo - median) / iqr) / spread)),
                            4,
                        )
            result.append(normalized)

        logger.debug(
            f"FeatureNormalizer: normalized {len(result)} candidates, "
            f"{len(target_keys)} features, strategy={strategy}."
        )
        return result

    # ── Validation ────────────────────────────────────────────────────────────

    @staticmethod
    def validate_feature_ranges(
        feature_dict: Dict[str, float],
        expected_min: float = 0.0,
        expected_max: float = 1.0,
    ) -> Tuple[bool, List[str]]:
        """Validates that all features fall within [expected_min, expected_max].

        Args:
            feature_dict:  Feature dict to validate.
            expected_min:  Minimum allowed value.
            expected_max:  Maximum allowed value.

        Returns:
            Tuple[bool, List[str]]: (is_valid, list of violation messages).
        """
        violations = []
        for name, val in feature_dict.items():
            if not (expected_min - _EPS <= val <= expected_max + _EPS):
                violations.append(
                    f"Feature '{name}' = {val:.4f} out of range "
                    f"[{expected_min}, {expected_max}]."
                )
        return len(violations) == 0, violations

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _percentile(sorted_list: List[float], pct: float) -> float:
        """Computes the p-th percentile of a sorted list."""
        if not sorted_list:
            return 0.0
        idx = (len(sorted_list) - 1) * pct / 100.0
        lo_idx = int(idx)
        hi_idx = min(lo_idx + 1, len(sorted_list) - 1)
        frac = idx - lo_idx
        return sorted_list[lo_idx] + frac * (sorted_list[hi_idx] - sorted_list[lo_idx])
