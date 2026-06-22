"""Score Normalizer service.

Normalizes raw retrieval scores (semantic cosine similarity, BM25 relevance)
into a common [0, 1] range so they can be safely combined by any fusion
strategy.

Four strategies are supported:
  - min_max   : rescales scores to [0, 1] using observed min/max
  - z_score   : standardizes to (score - μ) / σ then clips to [0, 1]
  - rank      : converts ordinal rank to a linear [0, 1] score
  - robust    : median / IQR normalization, resistant to outliers

Default: min_max (fastest, deterministic, no distributional assumptions).

Used by:
  - retrieval_fusion.py  (weighted fusion requires normalized scores)
  - candidate_pool_generator.py (stores normalized_semantic_score &
                                 normalized_bm25_score on RetrievalScore)
"""

from typing import List, Tuple
import statistics
from utils.logger import get_logger

logger = get_logger(__name__)

_EPSILON = 1e-9  # guards against divide-by-zero


class ScoreNormalizer:
    """Converts raw retrieval scores into a unified [0, 1] scale."""

    # ── Min-Max ───────────────────────────────────────────────────────────────

    @staticmethod
    def min_max_normalization(scores: List[float]) -> List[float]:
        """Rescales scores to [0, 1] using the observed min and max.

        Formula:  (score - min) / (max - min)

        Args:
            scores: List of raw retrieval scores.

        Returns:
            List[float]: Normalized scores in [0, 1].
        """
        if not scores:
            return []
        lo, hi = min(scores), max(scores)
        spread = hi - lo
        if spread < _EPSILON:
            # All scores identical — return uniform 1.0
            return [1.0] * len(scores)
        return [(s - lo) / spread for s in scores]

    # ── Z-Score ───────────────────────────────────────────────────────────────

    @staticmethod
    def z_score_normalization(scores: List[float]) -> List[float]:
        """Standardizes scores using (score - μ) / σ then clips to [0, 1].

        Handles the degenerate case where σ = 0 (all scores identical).

        Args:
            scores: List of raw retrieval scores.

        Returns:
            List[float]: Clipped standardized scores.
        """
        if not scores:
            return []
        if len(scores) == 1:
            return [1.0]
        mu = statistics.mean(scores)
        try:
            sigma = statistics.stdev(scores)
        except statistics.StatisticsError:
            sigma = _EPSILON

        if sigma < _EPSILON:
            return [1.0] * len(scores)

        z_scores = [(s - mu) / sigma for s in scores]
        # Shift to non-negative and clip
        z_min = min(z_scores)
        shifted = [z - z_min for z in z_scores]
        z_max = max(shifted) or _EPSILON
        return [min(1.0, max(0.0, z / z_max)) for z in shifted]

    # ── Rank-Based ────────────────────────────────────────────────────────────

    @staticmethod
    def rank_normalization(ranks: List[int]) -> List[float]:
        """Converts ordinal ranks to [0, 1] scores where rank=1 → 1.0.

        Formula: (N - rank) / (N - 1)   where N = len(ranks)

        Args:
            ranks: List of integer rank positions (1-indexed).

        Returns:
            List[float]: Normalized scores in [0, 1].
        """
        if not ranks:
            return []
        n = len(ranks)
        if n == 1:
            return [1.0]
        return [max(0.0, (n - r) / (n - 1)) for r in ranks]

    # ── Robust (Median / IQR) ─────────────────────────────────────────────────

    @staticmethod
    def robust_normalization(scores: List[float]) -> List[float]:
        """Normalizes using median and interquartile range.

        Formula: (score - Q2) / (Q3 - Q1), then mapped to [0, 1].

        Resistant to extreme outliers. Falls back to min-max if IQR = 0.

        Args:
            scores: List of raw retrieval scores.

        Returns:
            List[float]: Robustly normalized scores in [0, 1].
        """
        if not scores:
            return []
        sorted_s = sorted(scores)
        n = len(sorted_s)

        def percentile(lst: List[float], pct: float) -> float:
            idx = (len(lst) - 1) * pct / 100.0
            lo_idx, hi_idx = int(idx), min(int(idx) + 1, len(lst) - 1)
            frac = idx - lo_idx
            return lst[lo_idx] + frac * (lst[hi_idx] - lst[lo_idx])

        q1 = percentile(sorted_s, 25)
        q2 = percentile(sorted_s, 50)  # median
        q3 = percentile(sorted_s, 75)
        iqr = q3 - q1

        if iqr < _EPSILON:
            logger.debug("IQR near zero; falling back to min-max normalization.")
            return ScoreNormalizer.min_max_normalization(scores)

        robust = [(s - q2) / iqr for s in scores]
        # Shift to non-negative, then scale to [0, 1]
        r_min = min(robust)
        shifted = [r - r_min for r in robust]
        r_max = max(shifted) or _EPSILON
        return [min(1.0, s / r_max) for s in shifted]

    # ── Convenience: Normalize a (score, id) pair list ────────────────────────

    @staticmethod
    def normalize_scored_list(
        items: List[Tuple[str, float]],
        strategy: str = "min_max",
    ) -> List[Tuple[str, float]]:
        """Normalizes a list of (candidate_id, score) tuples.

        Args:
            items: List of (candidate_id, raw_score) tuples.
            strategy: One of 'min_max', 'z_score', 'rank', 'robust'.

        Returns:
            List[Tuple[str, float]]: Same order with normalized scores.
        """
        if not items:
            return []
        ids, raw_scores = zip(*items)

        normalizer_map = {
            "min_max": ScoreNormalizer.min_max_normalization,
            "z_score": ScoreNormalizer.z_score_normalization,
            "robust": ScoreNormalizer.robust_normalization,
        }

        if strategy == "rank":
            ranks = list(range(1, len(raw_scores) + 1))
            normalized = ScoreNormalizer.rank_normalization(ranks)
        elif strategy in normalizer_map:
            normalized = normalizer_map[strategy](list(raw_scores))
        else:
            logger.warning(
                f"Unknown normalization strategy '{strategy}'. Defaulting to min_max."
            )
            normalized = ScoreNormalizer.min_max_normalization(list(raw_scores))

        return list(zip(ids, normalized))
